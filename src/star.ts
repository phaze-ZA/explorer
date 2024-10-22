import { Container, Sprite } from "pixi.js";
import { randomNumber } from "./utils";

export class Star extends Container {
  constructor(
    public readonly radius: number
  ) {
    super();
    const starId = randomNumber(3);
    const starSprite = Sprite.from(`star-${starId}`);
    starSprite.scale.set(radius);
    starSprite.anchor.set(0.5);
    this.addChild(starSprite);
  }
}
