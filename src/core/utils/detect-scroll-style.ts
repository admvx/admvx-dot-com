// Detect whether the browser supports overlay scrollbars; if not load in a CSS file to polyfill it

export const loadOverlayScrollStyleIfRequired = () => {
  let outer = document.createElement('div'), inner = document.createElement('div');
  outer.style.overflow = 'scroll';
  outer.style.width = '100px';
  inner.style.width = '200px';
  
  outer.appendChild(inner);
  document.body.appendChild(outer);
  
  let cw = outer.clientWidth, ow = outer.offsetWidth;
  inner.remove();
  outer.remove();
  
  if (cw !== ow) { require('@/assets/overlay-scrollbar.css'); }
  
  return cw === ow;
};
