import { Container, Graphics, Text } from "pixi.js";
import { roundNumber } from "./utils";

export class UI extends Container {
  private readonly _xVelocity: Text;
  private readonly _yVelocity: Text;
  private readonly _magnitude: Text;
  private readonly _xTitle: string = 'X Velocity: ';
  private readonly _yTitle: string = 'Y Velocity: ';
  private readonly _magnitudeTitle: string = 'Magnitude Velocity: ';
  constructor() {
    super();
    this.addChild(
      new Graphics().roundRect(0, 0, 200, 70, 7).fill({ color: '#000000AA'})
    );
    this._xVelocity = this.addChild(
      new Text({
        text: this._xTitle,
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#ffffff'
        }
      }));

    this._yVelocity = this.addChild(
      new Text({
        text: this._yTitle,
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#ffffff'
        }
      }));

    this._magnitude = this.addChild(
      new Text({
        text: this._magnitudeTitle,
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#ffffff',
        },
      }));

    this._xVelocity.position.y = 7;
    this._yVelocity.position.y = this._xVelocity.position.y + this._xVelocity.height;
    this._magnitude.position.y = this._yVelocity.position.y + this._yVelocity.height;
    this._xVelocity.position.x = 7;
    this._yVelocity.position.x = 7;
    this._magnitude.position.x = 7;
  }

  setVelocity(x: number, y: number): void {
    const xVel = -roundNumber(x, 2);
    const yVel = -roundNumber(y, 2);
    this._xVelocity.text = this._xTitle + xVel.toString();
    this._yVelocity.text = this._yTitle + yVel.toString();
    this._magnitude.text = this._magnitudeTitle + roundNumber(Math.hypot(x, y), 2).toString();
  }
}
