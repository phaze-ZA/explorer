import { Container, Sprite } from "pixi.js";
import { ShipStates } from "./types";
import { Boost } from "./effects/boost";

export class Ship extends Container {
  private readonly _boost: Boost;

  constructor() {
    super();
    this._boost = this.addChild(new Boost('blue'));
    this._boost.y = 36;
    // this._boost.visible = false;
    const sprite = this.addChild(Sprite.from('ship'));
    sprite.anchor.set(0.5);
    sprite.scale.set(0.3, -0.3);
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
