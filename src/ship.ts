import { Container, Sprite } from "pixi.js";

export class Ship extends Container {
  constructor() {
    super();
    const sprite = this.addChild(Sprite.from('spaceShips_001.png'));
    sprite.anchor.set(0.5);
    sprite.scale.set(0.2, -0.2);
  }
}
