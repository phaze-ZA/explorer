import { Container, Sprite } from "pixi.js";
import { ShipStates } from "./types";
import { Boost } from "./effects/boost";

export class Ship extends Container {
  private readonly _boost: Boost;

  constructor() {
    super();
    this._boost = this.addChild(new Boost('blue'));
    this._boost.y = 30;
    const sprite = this.addChild(Sprite.from('ship'));
    sprite.anchor.set(0.5);
    sprite.scale.set(0.25, -0.25);
  }

  turn(direction: 1 | -1 | 0): void {
    this._boost.rotation = direction * Math.PI / 9;
  }

  setState(state: ShipStates): void {
    switch (state) {
      case ShipStates.IDLE:
        this._boost.setState('off');
        break;
      case ShipStates.ACCELERATING:
        this._boost.setState('low');
        break;
      case ShipStates.DECELERATING:
        break;
      case ShipStates.BOOSTING:
        this._boost.setState('high');
        break;
    }
  }
}
