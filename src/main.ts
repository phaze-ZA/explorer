import { Assets, autoDetectRenderer, Container, Point, Renderer, Ticker } from "pixi.js";
import { Ship } from "./objects/ship";
import { GUI } from "dat.gui";
import { getXVector, getYVector } from "./utils";
import { ShipStates } from "./types";
import Stats from 'stats.js';
import { Environment } from "./layer";
import { UI } from "./ui";

const VANISHING_POINT = 200000;
const MAX_SPEED = 0.05;

async function bootstrap() {
  const renderer = await autoDetectRenderer({
    resolution: window.devicePixelRatio,
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    autoDensity: true,
    // @ts-ignore
    canvas: document.getElementById('game'),
    backgroundColor: '#000000',
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
    renderer.render(stage);
    requestAnimationFrame(animate);
  }

  animate();
  initialiseGame(app);
}

function initialiseGame(app: { stage: Container; renderer: Renderer; ticker: Ticker }) {
  const { stage, renderer, ticker } = app;
  const shipVelocity = new Point(0);
  const numObjects = {
    stars: 10000,
    planets: 1000
  };

  const universeConstants = {
    vanishingPoint: VANISHING_POINT,
    maxSpeed: MAX_SPEED
  };

  const environmentLayer = stage
    .addChild(
      new Environment(
        renderer.width,
        renderer.height,
        universeConstants.vanishingPoint
      ));
  environmentLayer.label = 'environment-layer';

  const playerLayer = stage.addChild(new Container());
  playerLayer.label = 'player-layer';
  playerLayer.enableRenderGroup();

  const ui = playerLayer.addChild(new UI());
  ui.position.set(5, renderer.height - ui.height - 5);

  const ship = playerLayer.addChild(new Ship());
  ship.position.set(renderer.width / 2, renderer.height * 0.75);

  environmentLayer.position.set(renderer.width / 2, renderer.height / 2);

  const resetLayers = () => {
    environmentLayer.removeObjects();
    environmentLayer.vanishingPoint = universeConstants.vanishingPoint;
    environmentLayer.populateStarPool(numObjects.stars);
    environmentLayer.populatePlanetPool(numObjects.planets);
    environmentLayer.initialiseLayer();
  };

  resetLayers();

  // debug stuff
  const gui = new GUI();
  const universeFolder = gui.addFolder('Universe');
  universeFolder
    .add(numObjects, 'stars', 1000, 30000)
    .onFinishChange(() => resetLayers())
    .name('Num Stars');

  universeFolder
    .add(numObjects, 'planets', 100, 10000)
    .onFinishChange(() => resetLayers())
    .name('Num Planets');

  universeFolder
    .add(universeConstants, 'vanishingPoint', 1000, 100000)
    .onFinishChange(() => resetLayers());

  universeFolder
    .add(universeConstants, 'maxSpeed', 0.01, 1)
    .onFinishChange(() => resetLayers());

  // performance
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  // resize
  window.onresize = () => {
    renderer.resize(window.innerWidth, window.innerHeight);
    ship.x = renderer.width / 2;
    ship.y = renderer.height * 0.75;
    environmentLayer.position = ship.position;
    environmentLayer.screenHeight = renderer.height;
    environmentLayer.screenWidth = renderer.width;
  };

  // input
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
  };

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
  };

  ticker.maxFPS = 60;
  ticker.add(({ deltaTime }) => {
    stats.begin();
    if (isPointerDown || isTouch) {
      const newRotation = Math.atan2(eventX - ship.x, -(eventY - ship.y));
      ship.turn(newRotation === ship.rotation ? 0 : newRotation > ship.rotation ? -1 : 1);
      ship.rotation = newRotation;
      shipVelocity.y += getYVector(ship.rotation, universeConstants.maxSpeed);
      shipVelocity.x += -getXVector(ship.rotation, universeConstants.maxSpeed);
      ship.setState(ShipStates.ACCELERATING);
    } else {
      if (isAcceleratorPressed) {
        const speedFactor = isBoostPressed ? 5 : 1;
        const shipState = isBoostPressed ? ShipStates.BOOSTING : ShipStates.ACCELERATING;

        ship.setState(shipState);

        shipVelocity.y += getYVector(ship.rotation, universeConstants.maxSpeed) * speedFactor;
        shipVelocity.x += -getXVector(ship.rotation, universeConstants.maxSpeed) * speedFactor;
      }
      else {
        ship.setState(ShipStates.IDLE);
      }
      if (isDeceleratorPressed) {
        const speedFactor = isBoostPressed ? 5 : 1;
        ship.setState(ShipStates.DECELERATING);

        shipVelocity.y -= getYVector(ship.rotation, universeConstants.maxSpeed) * speedFactor;
        shipVelocity.x -= -getXVector(ship.rotation, universeConstants.maxSpeed) * speedFactor;
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
        const xVelocity = -getXVector(velocityAngle, universeConstants.maxSpeed);
        const yVelocity = getYVector(velocityAngle, universeConstants.maxSpeed);
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

    environmentLayer.velocity.set(shipVelocity.x, shipVelocity.y);
    environmentLayer.update(deltaTime);
    ui.setVelocity(shipVelocity.x, shipVelocity.y);

    stats.end();
  });
}

bootstrap();
