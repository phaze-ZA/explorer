import { Container, Point } from "pixi.js";
import { calculateParallax, randomNumberBetween } from "./utils";
import { ObjectPool } from "./object-pool";
import { Planet } from "./objects/planet";
import { Star } from "./objects/star";
import { GameObject } from "./types";

export class Environment extends Container {
  velocity: Point = new Point(0);
  planets: Array<Planet> = [];
  stars: Array<Star> = [];
  private readonly _starPool = new ObjectPool<Star>();
  private readonly _planetPool = new ObjectPool<Planet>();
  private _starInterval: number = 100;
  private _planetInterval: number = 1000;
  private _renderHeight: number = 0;
  private _renderWidth: number = 0;

  constructor(
    screenWidth: number,
    screenHeight: number,
    public vanishingPoint: number) {
    super({ isRenderGroup: true, sortableChildren: true });
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  set screenWidth(value: number) {
    this._renderWidth = value + 2000;
  }

  set screenHeight(value: number) {
    this._renderHeight = value + 2000;
  }

  initialiseLayer(): void {
    for (let i = 0; i < randomNumberBetween(200, 800); i++) {
      this.addStar().position.set(
        randomNumberBetween(-this._renderWidth/ 2, this._renderWidth / 2),
        randomNumberBetween(-this._renderHeight / 2, this._renderHeight / 2)
      );
    }

    for (let i = 0; i < randomNumberBetween(0, 5); i++) {
      this.addPlanet().position.set(
        randomNumberBetween(-this._renderWidth/ 2, this._renderWidth / 2),
        randomNumberBetween(-this._renderHeight / 2, this._renderHeight / 2)
      );
    }
  }

  populateStarPool(initialSize: number): void {
    for (let i = 0; i < initialSize; i++) {
      const star = new Star();
      this._starPool.add(star);
    }
  }

  populatePlanetPool(initialSize: number): void {
    for (let i = 0; i < initialSize; i++) {
      const planet = new Planet();
      this._planetPool.add(planet);
    }
  }

  addPlanet(): Container {
    const planet = this._planetPool.get();
    planet.distance = randomNumberBetween(1, this.vanishingPoint * 0.75);
    const planetRadius = calculateParallax(0.5, planet.distance, this.vanishingPoint * 0.75);
    planet.scale.set(planetRadius);

    const minSize = 20;
    if (planet.width < minSize) {
      const ratio = minSize / planet.width;
      planet.width *= ratio;
      planet.height *= ratio;
    }

    if (planet.height < minSize) {
      const ratio = minSize / planet.width;
      planet.width *= ratio;
      planet.height *= ratio;
    }

    planet.zIndex = this.vanishingPoint - planet.distance;
    this.planets.push(planet);
    return this.addChild(planet);
  }

  addStar(): Container {
    const star = this._starPool.get();
    star.distance = randomNumberBetween(this.vanishingPoint * 0.9, this.vanishingPoint - 1);
    const starRadius = calculateParallax(5, star.distance, this.vanishingPoint);
    star.scale.set(starRadius);

    const minSize = 1.5;
    if (star.width < minSize) {
      const ratio = minSize / star.width;
      star.width *= ratio;
      star.height *= ratio;
    }
    if (star.height < minSize) {
      const ratio = minSize / star.width;
      star.width *= ratio;
      star.height *= ratio;
    }

    star.zIndex = this.vanishingPoint - star.distance;
    this.stars.push(star);
    return this.addChild(star);
  }

  removeObjects(): void {
    this.removeChild(...this.planets, ...this.stars);
    this.planets = [];
    this.stars = [];
  }

  getSpawnPosition(deltaX: number, deltaY: number): Point {
    let xPos: number;
    let yPos: number;
    let spawnSide: 'x' | 'y';
    if (deltaX === 0) {
      spawnSide = 'x';
    } else if (deltaY === 0) {
      spawnSide = 'y';
    } else {
      spawnSide = Math.random() < 0.5 ? 'x' : 'y';
    }

    if (spawnSide === 'x') {
      if (deltaY < 0) {
        yPos = this._renderHeight / 2;
      } else {
        yPos = -this._renderHeight / 2;
      }
      xPos = randomNumberBetween(-this._renderWidth / 2, this._renderWidth / 2);
    } else {
      if (deltaX < 0) {
        xPos = this._renderWidth / 2;
      } else {
        xPos = -this._renderWidth / 2;
      }
      yPos = randomNumberBetween(-this._renderHeight / 2, this._renderHeight / 2);
    }

    return new Point(xPos, yPos);
  }

  private canRender(object: GameObject): boolean {
    return (object.x >= -this._renderWidth / 2
      && object.x <= this._renderWidth / 2
      && object.y >= -this._renderHeight / 2
      && object.y <= this._renderHeight / 2);
  }

  update(deltaTime: number): void {
    const deltaX = this.velocity.x * deltaTime;
    const deltaY = this.velocity.y * deltaTime;

    if (deltaX !== 0 || deltaY !== 0) {
      this._starInterval -= Math.hypot(deltaX, deltaY);
      this._planetInterval -= Math.hypot(deltaX, deltaY);

      if (this._planetInterval <= 0) {
        this.addPlanet().position = this.getSpawnPosition(deltaX, deltaY);
        this._planetInterval = randomNumberBetween(100, 5000);
      }

      if (this._starInterval <= 0) {
        this.addStar().position = this.getSpawnPosition(deltaX, deltaY);
        this._starInterval = randomNumberBetween(2, 100);
      }
    }

    this.stars.forEach((star, index) => {
      star.x += calculateParallax(deltaX, star.distance, this.vanishingPoint);
      star.y += calculateParallax(deltaY, star.distance, this.vanishingPoint);

      if (!this.canRender(star)) {
        this._starPool.add(star);
        this.removeChild(star);
        this.stars.splice(index, 1);
      }
    });

    this.planets.forEach((planet, index) => {
      planet.x += calculateParallax(deltaX, planet.distance, this.vanishingPoint);
      planet.y += calculateParallax(deltaY, planet.distance, this.vanishingPoint);

      if (!this.canRender(planet)) {
        this._planetPool.add(planet);
        this.removeChild(planet);
        this.planets.splice(index, 1);
      }
    });
  }
}
