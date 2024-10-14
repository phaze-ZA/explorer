import { Container, Graphics } from "pixi.js";

export class Star extends Container {
  constructor(
    public readonly radius: number,
    public readonly points: number,
  ) {
    super();
    this.addChild(new Graphics().star(0, 0, points, radius).fill({ color: 0xffffff }));
  }
}
