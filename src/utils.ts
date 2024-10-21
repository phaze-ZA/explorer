export function randomNumber(maxExclusive: number, minInclusive: number = 0): number {
  return Math.floor(Math.random() * maxExclusive) + minInclusive;
}

export function getRandomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);

  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}

export function calculateParallax(x: number, distance: number, vanishingPoint: number): number {
  const angle = Math.atan2(x, vanishingPoint);
  return (vanishingPoint - distance) * Math.tan(angle);
}

export function getYVector(currentAngle: number, maxValue: number): number {
  const cosVal = Math.cos(currentAngle);
  const magnitude = maxValue * cosVal;

  if (Math.abs(magnitude) > maxValue) {
    throw new Error(`What the fuck happened here?
Magnitude:    ${magnitude}
currentAngle: ${currentAngle}
cosVal:       ${cosVal}
xComp:        ${maxValue}`);
  }

  return magnitude;
}

export function getXVector(currentAngle: number, maxValue: number): number {
  const sinVal = Math.sin(currentAngle);
  const magnitude = maxValue * sinVal;

  if (Math.abs(magnitude) > maxValue) {
    throw new Error(`What the fuck happened here?
Magnitude:    ${magnitude}
currentAngle: ${currentAngle}
sinVal:       ${sinVal}
yComp:        ${maxValue}`);
  }
  return magnitude;
}
