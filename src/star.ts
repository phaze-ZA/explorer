import { Container, Sprite } from "pixi.js";
import { randomNumber } from "./utils";

export class Star extends Container {
  constructor(
    public readonly radius: number
  ) {
    super();
    const isStar = randomNumber(5) < 4;
    if (isStar) {
      const starId = randomNumber(3);
      this.addChild(Sprite.from(`star-${starId}`)).scale.set(radius);
    }
    else {
      const meteorId = randomNumber(20);
      this.addChild(Sprite.from(`meteor-${meteorId}`)).scale.set(radius);
    }
  }
}
