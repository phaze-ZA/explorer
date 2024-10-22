import { Container, Sprite } from "pixi.js";
type State = 'off' | 'low' | 'med' | 'high';

export class Boost extends Container {
  private _low: Sprite;
  private _med: Sprite;
  private _high: Sprite;

  constructor(color: string) {
    super();
    this._low = this.addChild(Sprite.from(`${color}_low`));
    this._low.anchor.set(0.5, 0);
    this._med = this.addChild(Sprite.from(`${color}_med`));
    this._med.anchor.set(0.5, 0);
    this._high = this.addChild(Sprite.from(`${color}_high`));
    this._high.anchor.set(0.5, 0);
    this.setState('off');
  }

  setState(state: State): void {
    switch (state) {
      case 'low':
        this._low.visible = true;
        this._med.visible = false;
        this._high.visible = false;
        break;
      case 'med':
        this._low.visible = false;
        this._med.visible = true;
        this._high.visible = false;
        break;
      case 'high':
        this._low.visible = false;
        this._med.visible = false;
        this._high.visible = true;
        break;
      case 'off':
        this._low.visible = false;
        this._med.visible = false;
        this._high.visible = false;
        break;
    }
  }
}
