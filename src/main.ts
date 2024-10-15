import { Application, Container, Graphics, Point, Rectangle } from "pixi.js";
import { Ship } from "./ship";
import { Planet } from "./planet";
import { Star } from "./star";
import { GUI } from "dat.gui";

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
  app.canvas.setAttribute('style', 'display: block;');
  initialiseGame(app);
}

function addObject(object: Planet | Star): Planet | Star {
  const maxMinusRadius = MAX_POS - object.radius;
  const x = object.radius + Math.floor(Math.random() * (maxMinusRadius * 2));
  const y = object.radius + Math.floor(Math.random() * (maxMinusRadius * 2));
  object.position.set(x, y);
  return object;
}

function initialiseGame(app: Application) {
  const bg = new Container();
  bg.position.set(-MAX_POS, -MAX_POS);
  bg.width = MAX_POS * 2;
  bg.height = MAX_POS * 2;
  app.stage.addChild(bg);
  const ship = app.stage.addChild(new Ship(10, 20));
  ship.x = window.innerWidth / 2;
  ship.y = window.innerHeight * 0.75;
  let shipVelocity = new Point(0, 0);

  const gui = new GUI();
  const universeFolder = gui.addFolder('Universe');
  universeFolder.add({ numObjects: 1000 }, 'numObjects', 100, 50000).onFinishChange((value) => {
    setObjects(value);
  }).name('No. Objects');
  const renderFolder = gui.addFolder('Rendering');
  renderFolder.add({ enableRenderGroup: () => bg.enableRenderGroup() }, 'enableRenderGroup').name('Enable BG Render Group');

  renderFolder.add({ disableRenderGroup: () => bg.disableRenderGroup() }, 'disableRenderGroup').name('Disable BG Render Group');

  renderFolder.add({ enableRenderGroup: () => app.stage.enableRenderGroup() }, 'enableRenderGroup').name('Enable Window Render Group');

  renderFolder.add({ disableRenderGroup: () => app.stage.disableRenderGroup() }, 'disableRenderGroup').name('Disable Window Render Group');

  const objects: Array<Container> = [];

  let isPointerDown = false;
  let isTouch = false;
  let eventX = 0;
  let eventY = 0;

  const setObjects = function(numObjects: number) {
    bg.removeChildren();
    bg.addChild(new Graphics().rect(0, 0, MAX_POS * 2, MAX_POS * 2).stroke({ color: 0x660000 }));
    for (let i = 0; i < numObjects; i++) {
      const planetRadius = Math.ceil(Math.random() * 100);
      const starRadius = Math.ceil(Math.random() * 30);
      const starPoints = Math.ceil(Math.random() * 5) + 4;
      const planet = new Planet(planetRadius);
      const star = new Star(starRadius, starPoints);
      bg.addChild(addObject(planet)).alpha = 0.5;
      bg.addChild(addObject(star));
    }
  }

  setObjects(1000);

  const cullFolder = gui.addFolder("Culling");
  const bgCull = cullFolder.addFolder("Background");
  const windowCull = cullFolder.addFolder("Window");
  windowCull.add({ canCull: false }, "canCull").onChange((value) => app.stage.cullable = value).name('Cull Background');
  windowCull.add({ enabled: true }, "enabled").onChange((value) => app.stage.cullableChildren = value).name('Cullable Children');
  windowCull.add({ enabled: false }, 'enabled').onChange((value) => {
    if (value) {
      app.stage.cullArea = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
    }
    else {
      app.stage.cullArea = undefined;
    }
  }).name('Cull To Window');

  bgCull.add({ canCull: false }, "canCull").onChange((value) => bg.cullable = value).name('Cull Background');
  bgCull.add({ enabled: true }, "enabled").onChange((value) => bg.cullableChildren = value).name('Cullable Children');
  bgCull.add({ enabled: false }, 'enabled').onChange((value) => {
    if (value) {
      bg.cullArea = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
    }
    else {
      bg.cullArea = undefined;
    }
  }).name('Cull To Window');

  objects.push(bg);

  window.onresize = () => {
    const shiftX = ship.x - window.innerWidth / 2;
    const shiftY = ship.y - window.innerHeight * 0.75;
    ship.x = window.innerWidth / 2;
    ship.y = window.innerHeight * 0.75;
    bg.x -= shiftX;
    bg.y -= shiftY;
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

  // app.canvas.onkeydown = (event) => {
  //   switch (event.key) {
  //     case 'w':
  //       if (topLine.y + shipVelocity.y < ship.y)
  //         shipVelocity.y += 1;
  //       break;
  //     case 's':
  //       if (bottomLine.y + shipVelocity.y > ship.y)
  //         shipVelocity.y -= 1;
  //       break;
  //     case 'a':
  //       if (leftLine.x + shipVelocity.x < ship.x)
  //         shipVelocity.x += 1;
  //       break;
  //     case 'd':
  //       if (rightLine.x + shipVelocity.x > ship.x)
  //         shipVelocity.x -= 1;
  //       break;
  //     case ' ':
  //       shipVelocity.set(0);
  //       break;
  //   }
  // }

  app.ticker.maxFPS = 60;
  app.ticker.add(() => {
    const topEdge = bg.y;
    const bottomEdge = bg.y + bg.height;
    const leftEdge = bg.x;
    const rightEdge = bg.x + bg.width;

    if (isPointerDown || isTouch) {
      if (eventY < ship.y - ship.height / 2) {
        if (topEdge + shipVelocity.y < ship.y)
          shipVelocity.y += 0.25;
      }
      else if (eventY > ship.y + ship.height / 2) {
        if (bottomEdge + shipVelocity.y > ship.y)
          shipVelocity.y -= 0.25;
      }

      if (eventX < ship.x - ship.width / 2) {
        if (leftEdge + shipVelocity.x < ship.x)
          shipVelocity.x += 0.25;
      } else if (eventX > ship.x + ship.width / 2) {
        if (rightEdge + shipVelocity.x > ship.x)
          shipVelocity.x -= 0.25;
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

    bg.x += shipVelocity.x;
    bg.y += shipVelocity.y;
  });
}

bootstrap();
