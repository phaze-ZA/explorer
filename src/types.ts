import { Container } from "pixi.js";

export const enum ShipStates {
  IDLE,
  ACCELERATING,
  DECELERATING,
  BOOSTING
};

export abstract class GameObject extends Container {
  abstract distance: number;
}
