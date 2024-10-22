import { Application, Assets, Container, Graphics, Point } from "pixi.js";
import { Ship } from "./ship";
import { Planet } from "./planet";
import { Star } from "./star";
import { GUI } from "dat.gui";
import { calculateParallax, getXVector, getYVector, randomNumber } from "./utils";
import { ShipStates } from "./types";

const MAX_POS = 50000;
const MAX_SPEED = 0.25;
const VANISHING_POINT = 10;
const BG_LAYER_DISTANCE = 9;
const MID_LAYER_DISTANCE = 8.7;

async function bootstrap() {
  const app = new Application();
  // @ts-ignore
  globalThis.__PIXI_APP__ = app;

  await app.init({
    backgroundColor: '#000000',
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);
  app.canvas.setAttribute('style', 'display: block;');
  const bundle = [];
  const planetBundle = [];
  const effectsBundle = [
    { alias: 'speed', src: 'effects/speed.png' },
    { alias: 'blue_low', src: 'effects/blue_low.png' },
    { alias: 'blue_med', src: 'effects/blue_med.png' },
    { alias: 'blue_high', src: 'effects/blue_high.png' },
    { alias: 'orange_low', src: 'effects/orange_low.png' },
    { alias: 'orange_med', src: 'effects/orange_med.png' },
    { alias: 'orange_high', src: 'effects/orange_high.png' },
    { alias: 'green', src: 'effects/green.png' }
  ];

  for (let i = 0; i < 10; i++) {
    planetBundle.push({ alias: `planetLight-${i}`, src: `planets/light${i}.png` });
  }

  for (let i = 0; i < 28; i++) {
    const noisePrefix = i < 10 ? '0' : '';
    planetBundle.push({ alias: `planetNoise-${i}`, src: `planets/noise${noisePrefix}${i}.png` });
  }

  for (let i = 0; i < 3; i++) {
    planetBundle.push({ alias: `sphere-${i}`, src: `planets/sphere${i}.png` });
    bundle.push({ alias: `star-${i}`, src: `stars/star${i + 1}.png` });
  }

  bundle.push({ alias: 'ship', src: 'spaceShips_001.png' });
  bundle.push({ alias: 'booster', src: 'fire11.png' });
  Assets.addBundle('planetAssets', planetBundle);
  Assets.addBundle('effects', effectsBundle);
  Assets.addBundle('assets', bundle);
  await Assets.loadBundle('assets');
  await Assets.loadBundle('planetAssets');
  await Assets.loadBundle('effects');
  initialiseGame(app);
}

function addObject(object: Planet | Star, maxDistance: number): Planet | Star {
  const maxMinusWidth = maxDistance - object.width / 2;
  const maxMinusHeight = maxDistance - object.height / 2;
  const x = randomNumber(maxMinusWidth * 2, object.width / 2);
  const y = randomNumber(maxMinusHeight * 2, object.height / 2);
  object.position.set(x, y);
  return object;
}

function initialiseGame(app: Application) {
  const mapSize = MAX_POS * 2;
  const bgLayerSize = calculateParallax(mapSize, BG_LAYER_DISTANCE, VANISHING_POINT);
  const midLayerSize = calculateParallax(mapSize, MID_LAYER_DISTANCE, VANISHING_POINT);

  const bgLayer = app.stage.addChild(new Container());
  const midLayer = app.stage.addChild(new Container());
  const cameraLayer = app.stage.addChild(new Container());

  const ship = app.stage.addChild(new Ship());
  ship.x = window.innerWidth / 2;
  ship.y = window.innerHeight * 0.75;

  bgLayer.position.set(ship.x - bgLayerSize / 2, ship.y - bgLayerSize / 2);
  bgLayer.enableRenderGroup();

  midLayer.enableRenderGroup();
  midLayer.position.set(ship.x - midLayerSize / 2, ship.y - midLayerSize / 2);

  cameraLayer.enableRenderGroup();
  cameraLayer.position.set(ship.x - mapSize / 2, ship.y - mapSize / 2);

  let shipVelocity = new Point(0, 0);

  const gui = new GUI();
  const universeFolder = gui.addFolder('Universe');
  universeFolder.add({ numObjects: 1000 }, 'numObjects', 100, 10000).onFinishChange((value) => {
    setObjects(value);
  }).name('No. Objects');

  let isPointerDown = false;
  let isTouch = false;
  let isAcceleratorPressed = false;
  let isDeceleratorPressed = false;
  let isYawLeftPressed = false;
  let isYawRightPressed = false;
  let isBrakePressed = false;
  let isBoostPressed = false;
  let eventX = 0;
  let eventY = 0;

  const setObjects = function(numObjects: number) {
    bgLayer.removeChildren();
    bgLayer.addChild(new Graphics().rect(0, 0, bgLayerSize, bgLayerSize).stroke({ color: 0x660000 }));

    midLayer.removeChildren();
    midLayer.addChild(new Graphics().rect(0, 0, midLayerSize, midLayerSize).stroke({ color: 0x006600 }));

    cameraLayer.removeChildren();
    cameraLayer.addChild(new Graphics().rect(0, 0, mapSize, mapSize).stroke({ color: 0x000066 }));

    for (let i = 0; i < numObjects; i++) {
      const planetRadius = randomNumber(50, 10);
      const starRadius = randomNumber(1.1, 0.2);
      const nearStarRadius = randomNumber(1.7, 0.8);

      const planet = new Planet(planetRadius);
      const star = new Star(starRadius);
      const nearStar = new Star(nearStarRadius);

      bgLayer.addChild(addObject(star, bgLayerSize / 2));
      midLayer.addChild(addObject(nearStar, midLayerSize / 2));
      cameraLayer.addChild(addObject(planet, mapSize / 2));
    }
  }

  setObjects(1000);

  window.onresize = () => {
    const shiftX = ship.x - window.innerWidth / 2;
    const shiftY = ship.y - window.innerHeight * 0.75;
    ship.x = window.innerWidth / 2;
    ship.y = window.innerHeight * 0.75;
    cameraLayer.x -= shiftX;
    cameraLayer.y -= shiftY;
    midLayer.x -= shiftX;
    midLayer.y -= shiftY;
    bgLayer.x -= shiftX;
    bgLayer.y -= shiftY;
  };

  app.canvas.ontouchstart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.touches[0].clientX;
    eventY = event.touches[0].clientY;
    isTouch = true;
  };

  app.canvas.ontouchmove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.touches[0].clientX;
    eventY = event.touches[0].clientY;
  };

  app.canvas.ontouchend = () => {
    isTouch = false;
  };

  app.canvas.ontouchcancel = () => {
    isTouch = false;
  };

  app.canvas.onpointerup = () => {
    isPointerDown = false;
  };

  app.canvas.onpointerdown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.clientX;
    eventY = event.clientY;
    isPointerDown = true;
  };

  app.canvas.onpointermove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.clientX;
    eventY = event.clientY;
  };

  window.onkeydown = (event) => {
    switch (event.key) {
      case 'W':
      case 'w':
        isAcceleratorPressed = true;
        break;
      case 'S':
      case 's':
        isDeceleratorPressed = true;
        break;
      case 'A':
      case 'a':
        isYawLeftPressed = true;
        break;
      case 'D':
      case 'd':
        isYawRightPressed = true;
        break;
      case 'Shift':
        isBoostPressed = true;
        break;
      case ' ':
        isBrakePressed = true;
        break;
    }
  }

  window.onkeyup = (event) => {
    switch (event.key) {
      case 'W':
      case 'w':
        isAcceleratorPressed = false;
        break;
      case 'A':
      case 'a':
        isYawLeftPressed = false;
        break;
      case 'S':
      case 's':
        isDeceleratorPressed = false;
        break;
      case 'D':
      case 'd':
        isYawRightPressed = false;
        break;
      case 'Shift':
        isBoostPressed = false;
        break;
      case ' ':
        isBrakePressed = false;
        break;
    }
  }

  app.ticker.maxFPS = 60;
  app.ticker.add(() => {
    const topEdge = cameraLayer.y;
    const bottomEdge = cameraLayer.y + cameraLayer.height;
    const leftEdge = cameraLayer.x;
    const rightEdge = cameraLayer.x + cameraLayer.width;

    if (isPointerDown || isTouch) {
      ship.rotation = Math.atan2(eventX - ship.x, -(eventY - ship.y));
      shipVelocity.y += getYVector(ship.rotation, MAX_SPEED);
      shipVelocity.x += -getXVector(ship.rotation, MAX_SPEED);
      ship.setState(ShipStates.ACCELERATING);
    } else {
      if (isAcceleratorPressed) {
        const speedFactor = isBoostPressed ? 5 : 1;
        const shipState = isBoostPressed ? ShipStates.BOOSTING : ShipStates.ACCELERATING;

        ship.setState(shipState);

        shipVelocity.y += getYVector(ship.rotation, MAX_SPEED) * speedFactor;
        shipVelocity.x += -getXVector(ship.rotation, MAX_SPEED) * speedFactor;
      }
      else {
        ship.setState(ShipStates.IDLE);
      }
      if (isDeceleratorPressed) {
        const speedFactor = isBoostPressed ? 5 : 1;
        ship.setState(ShipStates.DECELERATING);

        shipVelocity.y -= getYVector(ship.rotation, MAX_SPEED) * speedFactor;
        shipVelocity.x -= -getXVector(ship.rotation, MAX_SPEED) * speedFactor;
      }

      if (isYawLeftPressed) {
        ship.rotation -= 0.1;
      }
      if (isYawRightPressed) {
        ship.rotation += 0.1;
      }

      if (isBrakePressed) {
        const velocityAngle = Math.atan2(shipVelocity.x, shipVelocity.y);
        const xVelocity = -getXVector(velocityAngle, MAX_SPEED);
        const yVelocity = getYVector(velocityAngle, MAX_SPEED);
        if (Math.abs(shipVelocity.x) - Math.abs(xVelocity) < 0) {
          shipVelocity.x = 0;
        }
        if (Math.abs(shipVelocity.y) - Math.abs(yVelocity) < 0) {
          shipVelocity.y = 0;
        }
        if (shipVelocity.x !== 0) {
          shipVelocity.x += xVelocity;
        }
        if (shipVelocity.y !== 0) {
          shipVelocity.y -= yVelocity;
        }
      }
    }

    if (leftEdge + shipVelocity.x >= ship.x) {
      const distanceToEdge = ship.x - leftEdge;
      shipVelocity.x = distanceToEdge;
    }

    if (rightEdge + shipVelocity.x <= ship.x) {
      const distanceToEdge = ship.x - rightEdge;
      shipVelocity.x = distanceToEdge;
    }

    if (topEdge + shipVelocity.y >= ship.y) {
      const distanceToEdge = ship.y - topEdge;
      shipVelocity.y = distanceToEdge;
    }

    if (bottomEdge + shipVelocity.y <= ship.y) {
      const distanceToEdge = ship.y - bottomEdge;
      shipVelocity.y = distanceToEdge;
    }

    bgLayer.x += calculateParallax(shipVelocity.x, BG_LAYER_DISTANCE, VANISHING_POINT);
    bgLayer.y += calculateParallax(shipVelocity.y, BG_LAYER_DISTANCE, VANISHING_POINT);
    midLayer.x += calculateParallax(shipVelocity.x, MID_LAYER_DISTANCE, VANISHING_POINT);
    midLayer.y += calculateParallax(shipVelocity.y, MID_LAYER_DISTANCE, VANISHING_POINT);
    cameraLayer.x += shipVelocity.x;
    cameraLayer.y += shipVelocity.y;
  });
}

bootstrap();
