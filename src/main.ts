import { Assets, autoDetectRenderer, Container, Point, Renderer, Ticker } from "pixi.js";
import { Ship } from "./ship";
import { Planet } from "./planet";
import { Star } from "./star";
import { GUI } from "dat.gui";
import { getXVector, getYVector, randomNumber } from "./utils";
import { ShipStates } from "./types";
import Stats from 'stats.js';
import { Layer } from "./layer";

const MAX_POS = 50000;
const MAX_SPEED = 0.2;

async function bootstrap() {
  const renderer = await autoDetectRenderer({
    resolution: window.devicePixelRatio,
    width: window.innerWidth,
    height: window.innerHeight,
    // @ts-ignore
    canvas: document.getElementById('game'),
    backgroundColor: '#000000',
    antialias: true
  });

  const stage = new Container();

  // @ts-ignore
  globalThis.__PIXI_STAGE__ = stage;
  // @ts-ignore
  globalThis.__PIXI_RENDERER__ = renderer;

  const app = {
    renderer,
    stage,
    ticker: Ticker.shared
  };

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
  Assets.addBundle('planetAssets', planetBundle);
  Assets.addBundle('effects', effectsBundle);
  Assets.addBundle('assets', bundle);
  await Assets.loadBundle('assets');
  await Assets.loadBundle('planetAssets');
  await Assets.loadBundle('effects');

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(stage);
  }

  animate();
  initialiseGame(app);
}

function initialiseGame(app: { stage: Container; renderer: Renderer; ticker: Ticker }) {
  const { stage, renderer, ticker } = app;
  const mapSize = MAX_POS * 2;

  const environmentLayer = stage.addChild(new Container());
  environmentLayer.label = 'environment-layer';
  environmentLayer.enableRenderGroup();
  const playerLayer = stage.addChild(new Container());
  playerLayer.label = 'player-layer';
  playerLayer.enableRenderGroup();

  const bgLayer = environmentLayer.addChild(new Layer(mapSize, mapSize, 0.1));
  bgLayer.label = 'bg-layer';
  const midLayer = environmentLayer.addChild(new Layer(mapSize, mapSize, 0.3));
  midLayer.label = 'mid-layer';
  const cameraLayer = environmentLayer.addChild(new Layer(mapSize, mapSize, 1));
  cameraLayer.label = 'camera-layer';

  const ship = playerLayer.addChild(new Ship());
  ship.position.set(renderer.canvas.width / 2, renderer.canvas.height * 0.75);
  bgLayer.position = ship.position;
  midLayer.position = ship.position;
  cameraLayer.position = ship.position;

  let shipVelocity = new Point(0);

  const gui = new GUI();
  const universeFolder = gui.addFolder('Universe');
  universeFolder.add({ numObjects: 1000 }, 'numObjects', 100, 10000).onFinishChange((value) => {
    setObjects(value);
  }).name('No. Objects');

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

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
    bgLayer.reset();
    midLayer.reset();
    cameraLayer.reset();
    for (let i = 0; i < numObjects; i++) {
      const planetRadius = randomNumber(50, 10);
      const starRadius = randomNumber(2, 1);
      const nearStarRadius = randomNumber(2, 1);

      const planet = new Planet(planetRadius);
      const star = new Star(starRadius);
      const nearStar = new Star(nearStarRadius);

      bgLayer.addObject(star).position.set(
        randomNumber(mapSize, -mapSize / 2),
        randomNumber(mapSize, -mapSize / 2)
      );
      midLayer.addObject(nearStar).position.set(
        randomNumber(mapSize, -mapSize / 2),
        randomNumber(mapSize, -mapSize / 2));
      cameraLayer.addObject(planet).position.set(
        randomNumber(mapSize, -mapSize / 2),
        randomNumber(mapSize, -mapSize / 2),
      )
    }
  }

  setObjects(1000);

  window.onresize = () => {
    ship.x = window.innerWidth / 2;
    ship.y = window.innerHeight * 0.75;
    bgLayer.position = ship.position;
    midLayer.position = ship.position;
    cameraLayer.position = ship.position;
  };

  renderer.canvas.ontouchstart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.touches[0].clientX;
    eventY = event.touches[0].clientY;
    isTouch = true;
  };

  renderer.canvas.ontouchmove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.touches[0].clientX;
    eventY = event.touches[0].clientY;
  };

  renderer.canvas.ontouchend = () => {
    isTouch = false;
  };

  renderer.canvas.ontouchcancel = () => {
    isTouch = false;
  };

  renderer.canvas.onpointerup = () => {
    isPointerDown = false;
  };

  renderer.canvas.onpointerdown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.clientX;
    eventY = event.clientY;
    isPointerDown = true;
  };

  renderer.canvas.onpointermove = (event) => {
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

  ticker.maxFPS = 60;
  ticker.add(({ deltaTime }) => {
    stats.begin();
    const topEdge = cameraLayer.border.y;
    const bottomEdge = cameraLayer.border.y + cameraLayer.border.height;
    const leftEdge = cameraLayer.border.x;
    const rightEdge = cameraLayer.border.x + cameraLayer.border.width;

    if (isPointerDown || isTouch) {
      const newRotation = Math.atan2(eventX - ship.x, -(eventY - ship.y));
      ship.turn(newRotation === ship.rotation ? 0 : newRotation > ship.rotation ? -1 : 1);
      ship.rotation = newRotation;
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

      ship.turn(0);

      if (isYawLeftPressed) {
        ship.turn(1);
        ship.rotation -= 0.1;
      }
      if (isYawRightPressed) {
        ship.turn(-1);
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

    if (leftEdge + shipVelocity.x >= 0) {
      const distanceToEdge = 0 - leftEdge;
      shipVelocity.x = distanceToEdge;
    }

    if (rightEdge + shipVelocity.x <= 0) {
      const distanceToEdge = 0 - rightEdge;
      shipVelocity.x = distanceToEdge;
    }

    if (topEdge + shipVelocity.y >= 0) {
      const distanceToEdge = 0 - topEdge;
      shipVelocity.y = distanceToEdge;
    }

    if (bottomEdge + shipVelocity.y <= 0) {
      const distanceToEdge = 0 - bottomEdge;
      shipVelocity.y = distanceToEdge;
    }

    bgLayer.velocity.set(shipVelocity.x, shipVelocity.y);
    midLayer.velocity.set(shipVelocity.x, shipVelocity.y);
    cameraLayer.velocity.set(shipVelocity.x, shipVelocity.y);

    bgLayer.update(deltaTime);
    midLayer.update(deltaTime);
    cameraLayer.update(deltaTime);

    stats.end();
  });
}

bootstrap();
