import { Application, Assets, Container, Graphics, Point } from "pixi.js";
import { Ship } from "./ship";
import { Planet } from "./planet";
import { Star } from "./star";
import { GUI } from "dat.gui";

const MAX_POS = 80000;
const MAX_SPEED = 0.25;
const VANISHING_POINT = 10;
const BG_LAYER_DISTANCE = 9;
const MID_LAYER_DISTANCE = 6;

function calculateParallax(x: number, distance: number, vanishingPoint: number): number {
  const angle = Math.atan2(x, vanishingPoint);
  return (vanishingPoint - distance) * Math.tan(angle);
}

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
  await Assets.load('spaceShips_001.png');
  initialiseGame(app);
}

function addObject(object: Planet | Star, maxDistance: number = MAX_POS): Planet | Star {
  const maxMinusRadius = maxDistance - object.radius;
  const x = object.radius + Math.floor(Math.random() * (maxMinusRadius * 2));
  const y = object.radius + Math.floor(Math.random() * (maxMinusRadius * 2));
  object.position.set(x, y);
  return object;
}

function getXVelocity(currentAngle: number): number {
  const cosVal = Math.sin(currentAngle);
  const magnitude = MAX_SPEED * cosVal;

  if (Math.abs(magnitude) > MAX_SPEED) {
    throw new Error(`What the fuck happened here?
Magnitude:    ${magnitude}
currentAngle: ${currentAngle}
cosVal:       ${cosVal}
yComp:        ${MAX_SPEED}`);
  }
  return -magnitude;
}

function getYVelocity(currentAngle: number): number {
  const sinVal = Math.cos(currentAngle);
  const magnitude = MAX_SPEED * sinVal;

  if (Math.abs(magnitude) > MAX_SPEED) {
    throw new Error(`What the fuck happened here?
Magnitude:    ${magnitude}
currentAngle: ${currentAngle}
sinVal:       ${sinVal}
xComp:        ${MAX_SPEED}`);
  }

  return magnitude;
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
  universeFolder.add({ numObjects: 1000 }, 'numObjects', 100, 50000).onFinishChange((value) => {
    setObjects(value);
  }).name('No. Objects');

  let isPointerDown = false;
  let isTouch = false;
  let isWKeyDown = false;
  let isSKeyDown = false;
  let isAKeyDown = false;
  let isDKeyDown = false;
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
      const planetRadius = Math.ceil(Math.random() * 100) + 10;
      const starRadius = Math.ceil(Math.random() * 10);
      const starPoints = Math.ceil(Math.random() * 5) + 4;
      const nearStarRadius = Math.ceil(Math.random() * 20) + 10;

      const planet = new Planet(planetRadius);
      const star = new Star(starRadius, starPoints);
      const nearStar = new Star(nearStarRadius, starPoints);

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
        isWKeyDown = true;
        break;
      case 'S':
      case 's':
        isSKeyDown = true;
        break;
      case 'A':
      case 'a':
        isAKeyDown = true;
        break;
      case 'D':
      case 'd':
        isDKeyDown = true;
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
        isWKeyDown = false;
        break;
      case 'A':
      case 'a':
        isAKeyDown = false;
        break;
      case 'S':
      case 's':
        isSKeyDown = false;
        break;
      case 'D':
      case 'd':
        isDKeyDown = false;
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
      shipVelocity.y += getYVelocity(ship.rotation);
      shipVelocity.x += getXVelocity(ship.rotation);
    } else {
      if (isWKeyDown) {
        const speedFactor = isBoostPressed ? 5 : 1;

        shipVelocity.y += getYVelocity(ship.rotation) * speedFactor;
        shipVelocity.x += getXVelocity(ship.rotation) * speedFactor;
      }
      if (isSKeyDown) {
        const speedFactor = isBoostPressed ? 5 : 1;

        shipVelocity.y -= getYVelocity(ship.rotation) * speedFactor;
        shipVelocity.x -= getXVelocity(ship.rotation) * speedFactor;
      }

      if (isAKeyDown) {
        ship.rotation -= 0.1;
      }
      if (isDKeyDown) {
        ship.rotation += 0.1;
      }

      if (isBrakePressed) {
        const velocityAngle = Math.atan2(shipVelocity.x, shipVelocity.y);
        const xVelocity = getXVelocity(velocityAngle);
        const yVelocity = getYVelocity(velocityAngle);
        if (Math.abs(shipVelocity.x) - Math.abs(xVelocity) < 0) {
          shipVelocity.x = 0;
        }
        if (Math.abs(shipVelocity.y) - Math.abs(yVelocity) < 0) {
          shipVelocity.y = 0;
        }
        if (shipVelocity.x != 0) {
          shipVelocity.x += xVelocity;
        }
        if (shipVelocity.y != 0) {
          shipVelocity.y -= yVelocity;
        }
      }
    }

    if (leftEdge + shipVelocity.x >= ship.x - ship.width / 2) {
      const distanceToEdge = (ship.x - ship.width / 2) - leftEdge;
      shipVelocity.x = distanceToEdge;
    }

    if (rightEdge + shipVelocity.x <= ship.x + ship.width / 2) {
      const distanceToEdge = (ship.x + ship.width / 2) - rightEdge;
      shipVelocity.x = distanceToEdge;
    }

    if (topEdge + shipVelocity.y >= ship.y - ship.height / 2) {
      const distanceToEdge = (ship.y - ship.height / 2) - topEdge;
      shipVelocity.y = distanceToEdge;
    }

    if (bottomEdge + shipVelocity.y <= ship.y + ship.height / 2) {
      const distanceToEdge = (ship.y + ship.height / 2) - bottomEdge;
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
