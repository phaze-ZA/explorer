import { Application, Graphics, Point } from "pixi.js";
import { Ship } from "./ship";
import { Planet } from "./planet";
import { Star } from "./star";

const MAX_POS = 10000;

async function bootstrap() {
  const app = new Application();
  // @ts-ignore
  globalThis.__PIXI_APP__ = app;

  await app.init({
    backgroundColor: '#000000',
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);
  app.canvas.setAttribute('style', 'display: block');
  initialiseGame(app);
}

function drawLine(destX: number, destY: number): Graphics {
  return new Graphics().lineTo(destX, destY).stroke({ color: '#ff0000' });
}

function addObject(object: Planet | Star): Planet | Star {
  const maxMinusRadius = MAX_POS - object.radius;
  const x = Math.floor(Math.random() * (maxMinusRadius * 2)) - maxMinusRadius;
  const y = Math.floor(Math.random() * (maxMinusRadius * 2)) - maxMinusRadius;
  object.position.set(x, y);
  return object;
}

function initialiseGame(app: Application) {
  const ship = app.stage.addChild(new Ship(10, 20));
  ship.x = window.innerWidth / 2;
  ship.y = window.innerHeight * 0.75;
  let shipVelocity = new Point(0, 0);
  const objects: Array<Planet | Star> = [];
  const topLine = app.stage.addChild(drawLine(MAX_POS * 2, 0));
  const bottomLine = app.stage.addChild(drawLine(MAX_POS * 2, 0));
  const leftLine = app.stage.addChild(drawLine(0, MAX_POS * 2));
  const rightLine = app.stage.addChild(drawLine(0, MAX_POS * 2));
  topLine.position.set(-MAX_POS, -MAX_POS);
  bottomLine.position.set(-MAX_POS, MAX_POS);
  leftLine.position.set(-MAX_POS, -MAX_POS);
  rightLine.position.set(MAX_POS, -MAX_POS);

  let isPointerDown = false;
  let isTouch = false;
  let eventX = 0;
  let eventY = 0;

  for (let i = 0; i < 1000; i++) {
    const planetRadius = Math.ceil(Math.random() * 100);
    const starRadius = Math.ceil(Math.random() * 30);
    const starPoints = Math.ceil(Math.random() * 5) + 4;
    const planet = new Planet(planetRadius);
    const star = new Star(starRadius, starPoints);
    app.stage.addChild(addObject(planet)).alpha = 0.5;
    app.stage.addChild(addObject(star));
    objects.push(...[planet, star]);
  }

  window.onresize = () => {
    const shiftX = ship.x - window.innerWidth / 2;
    const shiftY = ship.y - window.innerHeight * 0.75;
    ship.x = window.innerWidth / 2;
    ship.y = window.innerHeight * 0.75;

    [...objects, topLine, bottomLine, leftLine, rightLine].forEach(object => {
      object.x -= shiftX;
      object.y -= shiftY;
    });
  };

  window.ontouchstart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.touches[0].clientX;
    eventY = event.touches[0].clientY;
    isTouch = true;

  };

  window.ontouchmove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.touches[0].clientX;
    eventY = event.touches[0].clientY;
  };

  window.ontouchend = () => {
    isTouch = false;
  };

  window.ontouchcancel = () => {
    isTouch = false;
  };

  window.onpointerup = () => {
    isPointerDown = false;
  };

  window.onpointerout = () => {
    isPointerDown = false;
  };

  window.onpointerleave = () => {
    isPointerDown = false;
  };

  window.onpointercancel = () => {
    isPointerDown = false;
  };

  window.onpointerdown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.clientX;
    eventY = event.clientY;
    isPointerDown = true;
  };

  window.onpointermove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    eventX = event.clientX;
    eventY = event.clientY;
  };

  window.onkeydown = (event) => {
    switch (event.key) {
      case 'w':
        if (topLine.y + shipVelocity.y < ship.y)
          shipVelocity.y += 1;
        break;
      case 's':
        if (bottomLine.y + shipVelocity.y > ship.y)
          shipVelocity.y -= 1;
        break;
      case 'a':
        if (leftLine.x + shipVelocity.x < ship.x)
          shipVelocity.x += 1;
        break;
      case 'd':
        if (rightLine.x + shipVelocity.x > ship.x)
          shipVelocity.x -= 1;
        break;
      case ' ':
        shipVelocity.set(0);
        break;
    }
  }

  app.ticker.add(() => {
    if (isPointerDown || isTouch) {
      if (eventY < ship.y - ship.height / 2) {
        if (topLine.y + shipVelocity.y < ship.y)
          shipVelocity.y += 0.25;
      }
      else if (eventY > ship.y + ship.height / 2) {
        if (bottomLine.y + shipVelocity.y > ship.y)
          shipVelocity.y -= 0.25;
      }

      if (eventX < ship.x - ship.width / 2) {
        if (leftLine.x + shipVelocity.x < ship.x)
          shipVelocity.x += 0.25;
      } else if (eventX > ship.x + ship.width / 2) {
        if (rightLine.x + shipVelocity.x > ship.x)
          shipVelocity.x -= 0.25;
      }
    }

    if (leftLine.x + shipVelocity.x >= ship.x - ship.width / 2) {
      const distanceToEdge = (ship.x - ship.width / 2) - leftLine.x;
      shipVelocity.x = distanceToEdge;
    }

    if (rightLine.x + shipVelocity.x <= ship.x + ship.width / 2) {
      const distanceToEdge = (ship.x + ship.width / 2) - rightLine.x;
      shipVelocity.x = distanceToEdge;
    }

    if (topLine.y + shipVelocity.y >= ship.y - ship.height / 2) {
      const distanceToEdge = (ship.y - ship.height / 2) - topLine.y;
      shipVelocity.y = distanceToEdge;
    }

    if (bottomLine.y + shipVelocity.y <= ship.y + ship.height / 2) {
      const distanceToEdge = (ship.y + ship.height / 2) - bottomLine.y;
      shipVelocity.y = distanceToEdge;
    }

    [...objects, topLine, bottomLine, leftLine, rightLine].forEach(planet => {
      planet.x += shipVelocity.x;
      planet.y += shipVelocity.y;
    });
  });
}

bootstrap();
