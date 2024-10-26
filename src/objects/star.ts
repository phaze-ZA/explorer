import { Sprite } from "pixi.js";
import { randomNumber } from "../utils";
import { GameObject } from "../types";

export class Star extends GameObject {
  constructor(
    public readonly distance: number
  ) {
    super();
    this.cullable = true;
    const starId = randomNumber(3);
    const starSprite = Sprite.from(`star-${starId}`);
    starSprite.anchor.set(0.5);
    this.addChild(starSprite);
  }
}
