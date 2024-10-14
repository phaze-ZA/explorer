import { Container, Graphics } from "pixi.js";

export class Planet extends Container {
  constructor(
    public readonly radius: number,
  ) {
    super();
    this.addChild(new Graphics().circle(0, 0, radius).fill({ color: 0xffffff }));
  }
}
