import { Container, Point } from "pixi.js";
import { GameObject } from "./types";
import { calculateParallax } from "./utils";

export class Layer extends Container {
  velocity: Point = new Point(0);
  objects: Array<GameObject> = [];

  constructor(
    private readonly _renderZone: {
      start: Point;
      end: Point
    },
    public vanishingPoint: number) {
    super({ isRenderGroup: true, sortableChildren: true });
  }

  addObject(object: GameObject): Container {
    this.objects.push(object);
    return this.addChild(object);
  }

  removeObjects(): void {
    this.removeChild(...this.objects);
    this.objects = [];
  }

  update(deltaTime: number): void {
    const deltaX = this.velocity.x * deltaTime;
    const deltaY = this.velocity.y * deltaTime;

    this.objects.forEach(object => {
      object.x += calculateParallax(deltaX, object.distance, this.vanishingPoint);
      object.y += calculateParallax(deltaY, object.distance, this.vanishingPoint);

      if (
        object.x >= this._renderZone.start.x
        && object.x <= this._renderZone.end.x
        && object.y >= this._renderZone.start.y
        && object.y <= this._renderZone.end.y
      ) {
        object.renderable = true;
      }
      else {
        object.renderable = false;
      }
    });
  }
}
