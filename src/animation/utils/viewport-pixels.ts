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
