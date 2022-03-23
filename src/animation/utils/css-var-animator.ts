import { RangeMapper } from './range-mapper';
import { SpringEase } from './spring-ease';

export type AnimationPropertySet = {
  [paramName: string]: number;
};

export type ProxyTarget = {
  [varName: string]: string;
};
export type ProxyTargetNumeric = {
  [varName: string]: number;
};

export type ViewportUnit = 'vw' | 'vh' | 'vmin' | 'vmax';

type ViewportVar = {
  value: number;
  unit: ViewportUnit;
  varName: string;
};
type ViewportPosition = {
  x: ViewportVar[];
  y: ViewportVar[];
};

export type RawViewportVar = [number, ViewportUnit];
export type RawViewportPosition = {
  x: RawViewportVar[];
  y: RawViewportVar[];
};

export const getCssVarProxy = (targetElement: HTMLElement, varNames: string[]): ProxyTarget => {
  // Declare object to proxy
  let proxyTarget: ProxyTarget = {};

  // Capture initial values
  varNames.forEach(varName => proxyTarget[varName] = getComputedStyle(targetElement).getPropertyValue(varName));

  // Create proxy to update element's CSS vars
  return new Proxy(proxyTarget, {
    set: (_, property: string, value: any) => {
      proxyTarget[property] = value;
      targetElement.style.setProperty(property, value);
      return true;
    }
  });
};

export const getCssVarProxyWithAutoUnit = (targetElement: HTMLElement, varNames: string[], unit: string): ProxyTargetNumeric => {
  // Declare object to proxy
  let proxyTarget: ProxyTargetNumeric = {};

  // Capture initial values
  varNames.forEach(varName => proxyTarget[varName] = parseFloat(getComputedStyle(targetElement).getPropertyValue(varName)));

  // Create proxy to update element's CSS vars
  return new Proxy(proxyTarget, {
    set: (_, property: string, value: any) => {
      proxyTarget[property] = value;
      targetElement.style.setProperty(property, value + unit);
      return true;
    }
  });
};

export const getNumericCssVarProxy = (targetElement: HTMLElement, varNames: string[]): ProxyTargetNumeric => {
  // Declare object to proxy
  let proxyTarget: ProxyTargetNumeric = {};

  // Capture initial values
  varNames.forEach(varName => proxyTarget[varName] = parseFloat(getComputedStyle(targetElement).getPropertyValue(varName)));

  // Create proxy to update element's CSS vars
  return new Proxy(proxyTarget, {
    set: (_, property: string, value: any) => {
      if (proxyTarget[property] === value) return true;
      proxyTarget[property] = value;
      targetElement.style.setProperty(property, value);
      return true;
    }
  });
};

export const viewportUnitToPx = (value: number, unit: ViewportUnit): number => {
  if (value === 0) return 0;
  let scale = 0;
  switch (unit) {
    case 'vw':
      scale = window.innerWidth;
      break;
    case 'vh':
      scale = window.innerHeight;
      break;
    case 'vmin':
      scale = Math.min(window.innerWidth, window.innerHeight);
      break;
    case 'vmax':
      scale = Math.max(window.innerWidth, window.innerHeight);
      break;
  }
  return value * scale * 0.01;
};

export const viewportVarsToPx = (viewportVars: ViewportVar[]): number => {
  let tally = 0;
  for (let viewVar of viewportVars) {
    tally += viewportUnitToPx(viewVar.value, viewVar.unit);
  }
  return tally;
};

export const cssProperties = {
  x: '--x',
  y: '--y',
  scale: '--scale',
  opacity: 'opacity'
};

export class CssVarAnimator {
  
  public onProgressChange: (progress: number) => void;
  
  protected _progress: number = 0;
  protected varNames: string[] = [];
  protected fromPosition: ViewportPosition;
  protected toPosition: ViewportPosition;
  protected fromVars: ViewportVar[];
  protected toVars: ViewportVar[];
  
  protected elementProxyPosition: ProxyTargetNumeric;
  
  protected xRangeMapper: RangeMapper;
  protected yRangeMapper: RangeMapper;
  
  constructor(targetElement: HTMLElement, rawFrom: RawViewportPosition, rawTo: RawViewportPosition, additionalVars: string[] = []) {
    this.fromPosition = { x: this.processRawVars(rawFrom.x, 'x'), y: this.processRawVars(rawFrom.y, 'y') };
    this.toPosition = { x: this.processRawVars(rawTo.x, 'x'), y: this.processRawVars(rawTo.y, 'y') };
    
    this.fromVars = this.fromPosition.x.concat(this.fromPosition.y);
    this.toVars = this.toPosition.x.concat(this.toPosition.y);
    
    this._elementProxyMain = getCssVarProxy(targetElement, this.varNames.concat(additionalVars));
    this.elementProxyPosition = getCssVarProxyWithAutoUnit(targetElement, [cssProperties.x, cssProperties.y], 'px');
  }
  
  /**
   * @param base: determines which end of the position range will anchor the motion
   * @param actual: (0 to 1 range); the difference between actual and base defines the magnitude of the pixel offset
   */
  public setProgress(base: 0 | 1, actual: number): void {
    this.initializeRange(base);
    let varSet = base === 0 ? this.fromVars : this.toVars;
    for (let viewVar of varSet) {
      this._elementProxyMain[viewVar.varName] = viewVar.value + viewVar.unit;
    }
    this.progress = actual;
  }
  
  public animateTo(progress: 0 | 1, baseDuration: number, delay: number = 0): Promise<number> {
    this.setProgress(progress, this._progress);
    return SpringEase.to(this, 'progress', progress, { delay, baseDuration, baseMagnitude: 1, friction: 4.8, stopThresholdMultiplier: 0.0015 });
  }
  
  protected initializeRange(base: 0 | 1): void {
    let effectiveFromPos = base ? this.toPosition : this.fromPosition;
    let effectiveToPos = base ? this.fromPosition : this.toPosition;
    let deltaX = viewportVarsToPx(effectiveToPos.x) - viewportVarsToPx(effectiveFromPos.x);
    let deltaY = viewportVarsToPx(effectiveToPos.y) - viewportVarsToPx(effectiveFromPos.y);
    let rangeParamsX = [0, deltaX];
    let rangeParamsY = [0, deltaY];
    if (base) {
      rangeParamsX.reverse();
      rangeParamsY.reverse();
    }
    this.xRangeMapper = new RangeMapper(rangeParamsX[0], rangeParamsX[1]);
    this.yRangeMapper = new RangeMapper(rangeParamsY[0], rangeParamsY[1]);
  }
  
  protected processRawVars(rawVars: RawViewportVar[], dimension: 'x'|'y'): ViewportVar[] {
    return rawVars.map(rawVar => {
      let varName = '--' + dimension + '-' + rawVar[1];
      (! this.varNames.includes(varName)) && this.varNames.push(varName);
      return { value: rawVar[0], unit: rawVar[1], varName };
    });
  }
  
  public get progress(): number { return this._progress; }
  protected set progress(value: number) {
    this._progress = value;
    this.elementProxyPosition[cssProperties.x] = this.xRangeMapper.interpolate(value);
    this.elementProxyPosition[cssProperties.y] = this.yRangeMapper.interpolate(value);
    this.onProgressChange && this.onProgressChange(value);
  }
  
  protected _elementProxyMain: ProxyTarget;
  public get elementProxyMain(): ProxyTarget { return this._elementProxyMain; }
  
}
