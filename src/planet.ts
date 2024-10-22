import { Container, Sprite } from "pixi.js";
import { getRandomColor, randomNumber } from "./utils";

export class Planet extends Container {
  constructor(
    public readonly radius: number,
  ) {
    super();
    const sphereId = randomNumber(3);
    const lightId = randomNumber(10);
    const noiseId = randomNumber(28);
    const atmosphereNoiseId = randomNumber(28);
    const sphere = Sprite.from(`sphere-${sphereId}`);
    const noise = Sprite.from(`planetNoise-${noiseId}`);
    const atmosphere = Sprite.from(`planetNoise-${atmosphereNoiseId}`);
    const light = Sprite.from(`planetLight-${lightId}`);
    sphere.tint = getRandomColor();
    sphere.anchor.set(0.5);
    noise.tint = getRandomColor();
    noise.anchor.set(0.5);
    atmosphere.tint = getRandomColor();
    atmosphere.alpha = 0.5;
    atmosphere.anchor.set(0.5);
    light.alpha = 0.35;
    light.anchor.set(0.5);
    this.scale.set(radius / 100);
    this.addChild(sphere, noise, atmosphere, light);
    this.enableRenderGroup();
  }
}
