import { Application, Assets, Container, Graphics, Point } from "pixi.js";
import { Ship } from "./ship";
import { Planet } from "./planet";
import { Star } from "./star";
import { GUI } from "dat.gui";

const MAX_POS = 10000;
const MAX_SPEED = 0.25;

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

// basically we know if ship is facing up (i.e angle < Math.PI / 2 || angle > 1.5 * Math.PI) then y=1
// otherwise y=-1
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
  const bg = app.stage.addChild(new Container());
  bg.position.set(-MAX_POS, -MAX_POS);
  bg.width = MAX_POS * 2;
  bg.height = MAX_POS * 2;
  bg.enableRenderGroup();

  const nearStarsBg = app.stage.addChild(new Container());
  nearStarsBg.position.set(-MAX_POS * 1.5, -MAX_POS * 1.5);
  nearStarsBg.width = MAX_POS * 2.5;
  nearStarsBg.height = MAX_POS * 2.5;
  nearStarsBg.enableRenderGroup();

  const planetBg = app.stage.addChild(new Container());
  planetBg.position.set(-MAX_POS * 2, -MAX_POS * 2);
  planetBg.width = MAX_POS * 3;
  planetBg.height = MAX_POS * 3;
  planetBg.enableRenderGroup();

  const ship = app.stage.addChild(new Ship());
  ship.x = window.innerWidth / 2;
  ship.y = window.innerHeight * 0.75;
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
  let eventX = 0;
  let eventY = 0;

  const setObjects = function(numObjects: number) {
    bg.removeChildren();
    bg.addChild(new Graphics().rect(0, 0, MAX_POS * 2, MAX_POS * 2).stroke({ color: 0x660000 }));
    for (let i = 0; i < numObjects; i++) {
      const planetRadius = Math.ceil(Math.random() * 100) + 10;
      const starRadius = Math.ceil(Math.random() * 10);
      const starPoints = Math.ceil(Math.random() * 5) + 4;
      const nearStarRadius = Math.ceil(Math.random() * 20) + 10;
      const planet = new Planet(planetRadius);
      const star = new Star(starRadius, starPoints);
      const nearStar = new Star(nearStarRadius, starPoints);
      planetBg.addChild(addObject(planet, MAX_POS * 1.5));
      nearStarsBg.addChild(addObject(nearStar, MAX_POS * 1.25));
      bg.addChild(addObject(star));
    }
  }

  setObjects(1000);

  window.onresize = () => {
    const shiftX = ship.x - window.innerWidth / 2;
    const shiftY = ship.y - window.innerHeight * 0.75;
    ship.x = window.innerWidth / 2;
    ship.y = window.innerHeight * 0.75;
    bg.x -= shiftX;
    bg.y -= shiftY;
    planetBg.x -= shiftX;
    planetBg.y -= shiftY;
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
      case 'w':
        isWKeyDown = true;
        break;
      case 's':
        isSKeyDown = true;
        break;
      case 'a':
        isAKeyDown = true;
        break;
      case 'd':
        isDKeyDown = true;
        break;
      case ' ':
        isBrakePressed = true;
        break;
    }
  }

  window.onkeyup = (event) => {
    switch (event.key) {
      case 'w':
        isWKeyDown = false;
        break;
      case 'a':
        isAKeyDown = false;
        break;
      case 's':
        isSKeyDown = false;
        break;
      case 'd':
        isDKeyDown = false;
        break;
      case ' ':
        isBrakePressed = false;
        break;
    }
  }

  app.ticker.maxFPS = 60;
  app.ticker.add(() => {
    const topEdge = bg.y;
    const bottomEdge = bg.y + bg.height;
    const leftEdge = bg.x;
    const rightEdge = bg.x + bg.width;

    if (isPointerDown || isTouch) {
      ship.rotation = Math.atan2(eventX - ship.x, -(eventY - ship.y));
      shipVelocity.y += getYVelocity(ship.rotation);
      shipVelocity.x += getXVelocity(ship.rotation);
    } else {
      if (isWKeyDown) {
        shipVelocity.y += getYVelocity(ship.rotation);
        shipVelocity.x += getXVelocity(ship.rotation);
      }
      if (isSKeyDown) {
        shipVelocity.y -= getYVelocity(ship.rotation);
        shipVelocity.x -= getXVelocity(ship.rotation);
      }

      if (isAKeyDown) {
        ship.rotation -= 0.1;
      }
      if (isDKeyDown) {
        ship.rotation += 0.1;
      }

      if (isBrakePressed) {
        if (shipVelocity.x > 0) {
          if (shipVelocity.x - 0.25 < 0) {
            shipVelocity.x -= shipVelocity.x;
          }
          else {
            shipVelocity.x -= 0.25;
          }
        }
        if (shipVelocity.x < 0) {
          if (shipVelocity.x + 0.25 > 0) {
            shipVelocity.x += shipVelocity.x;
          }
          else {
            shipVelocity.x += 0.25;
          }
        }
        if (shipVelocity.y > 0) {
          if (shipVelocity.y - 0.25 < 0) {
            shipVelocity.y -= shipVelocity.y;
          }
          else {
            shipVelocity.y -= 0.25;
          }
        }
        if (shipVelocity.y < 0) {
          if (shipVelocity.y + 0.25 > 0) {
            shipVelocity.y += shipVelocity.y;
          }
          else {
            shipVelocity.y += 0.25;
          }
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

    bg.x += shipVelocity.x * 0.5;
    bg.y += shipVelocity.y * 0.5;
    nearStarsBg.x += shipVelocity.x * 0.75;
    nearStarsBg.y += shipVelocity.y * 0.75;
    planetBg.x += shipVelocity.x;
    planetBg.y += shipVelocity.y;
  });
}

bootstrap();
