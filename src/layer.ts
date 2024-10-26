import { Container, Graphics, Point } from "pixi.js";

export class Layer extends Container {
  velocity: Point = new Point(0);
  objects: Array<Container> = [];
  border: Graphics;

  constructor(width: number, height: number, scale: number) {
    super({ isRenderGroup: true });
    this.border = this.addChild(new Graphics()
      .rect(0, 0, width, height)
      .stroke({ color: 0x222222, width: (1 / scale) }));
    this.border.label = 'border';
    this.border.position.set(-this.border.width / 2, -this.border.height / 2);
    this.scale.set(scale);
  }

  addObject(object: Container): Container {
    this.objects.push(object);
    return this.addChild(object);
  }

  removeObjects(): void {
    this.removeChild(...this.objects);
    this.objects = [];
  }

  reset(): void {
    this.border.position.set(-this.border.width / 2, -this.border.height / 2);
  }

  update(deltaTime: number): void {
    const deltaX = this.velocity.x * deltaTime;
    const deltaY = this.velocity.y * deltaTime;

    this.border.x += deltaX;
    this.border.y += deltaY;
    this.objects.forEach(object => {
      object.x += deltaX;
      object.y += deltaY;
    });
  }
}
