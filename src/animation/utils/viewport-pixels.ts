// Support types for viewport centric data
type ViewportUnit = 'vw' | 'vh' | 'vmin' | 'vmax';

export type ViewportVar = {
  value: number;
  unit: ViewportUnit;
  varName: string;
};

export type RawViewportVar = [number, ViewportUnit];
export type RawViewportPosition = {
  x: RawViewportVar[];
  y: RawViewportVar[];
};


// Create div with viewport offsets to determine true pixel location (innerWidth / innerHeight can't be trusted on mobile Safari)
const measurementProxy = document.createElement('div');
measurementProxy.setAttribute('style', 'bottom: calc(100vh + 0px); right: calc(100vw + 0px)');
document.body.appendChild(measurementProxy);

const computedStyle = getComputedStyle(measurementProxy);

// Update cached values when viewport is resized
let width: number, height: number;
let measurementDirty = true;

const cacheDimensions = () => {
  width = parseFloat(computedStyle.right);
  height = parseFloat(computedStyle.bottom);
  measurementDirty = false;
};

window.addEventListener('resize', () => measurementDirty = true);

// Export getters for cached sizes
export const getViewportWidth: () => number = () => {
  if (measurementDirty) {
    cacheDimensions();
  }
  return width;
};
export const getViewportHeight: () => number = () => {
  if (measurementDirty) {
    cacheDimensions();
  }
  return height;
};


// Export convenience methods for converting between viewport and pixel dimensions
export const viewportUnitToPx = (value: number, unit: ViewportUnit): number => {
  if (value === 0) return 0;
  let scale = 0;
  switch (unit) {
    case 'vw':
      scale = getViewportWidth();
      break;
    case 'vh':
      scale = getViewportHeight();
      break;
    case 'vmin':
      scale = Math.min(getViewportWidth(), getViewportHeight());
      break;
    case 'vmax':
      scale = Math.max(getViewportWidth(), getViewportHeight());
      break;
  }
  return value * scale * 0.01;
};

export const viewportVarChainToPx = (viewportVars: ViewportVar[]): number => {
  let tally = 0;
  for (let viewVar of viewportVars) {
    tally += viewportUnitToPx(viewVar.value, viewVar.unit);
  }
  return tally;
};
