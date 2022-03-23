// Safari doesn't yet support the focus-visible pseudo class, and the mouse focus outline degrades animation performance, so we leave the effects off unless the user presses the tab key

export const enableFocusEffectsOnTab = () => {
  const eventName = 'keydown';
  let onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      document.body.classList.remove('focus-effects-off');
      window.removeEventListener(eventName, onKeyDown);
    }
  }
  window.addEventListener(eventName, onKeyDown);
};
