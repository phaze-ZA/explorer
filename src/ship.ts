import { Container, Graphics } from "pixi.js";

export class Ship extends Container {

  constructor(
    width: number,
    height: number
  ) {
    super();
    this.addChild(new Graphics().rect(0, 0, width, height).fill({ color: 0xffffff })).pivot.set(width / 2, height / 2);
  }
}
