import { Container, Sprite } from "pixi.js";

export class Speed extends Container {
  constructor() {
    super();
    this.addChild(Sprite.from('speed'));
  }
}
