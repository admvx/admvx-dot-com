import { Ease } from './utils/tween-core';
import { TweenRunner } from './utils/tween-runner';
import { Bezier } from './utils/bezier';
import { timeout } from '@/core/utils/ticker';
import { RawViewportPosition, RawViewportVar, viewportUnitToPx } from './utils/viewport-pixels';
import { CssVarAnimator, cssProperties } from './utils/css-var-animator';
import { RangeMapper } from './utils/range-mapper';

export class LetterAnimator extends CssVarAnimator {
  
  protected static forwardPath: Bezier = new Bezier(0.797, 0.033, 0.44, 0.995);
  protected static reversePath: Bezier = new Bezier(-0.541, 0.219, 0.799, 0.642);
  protected static scaleRangeMapper: RangeMapper = new RangeMapper(1, 0.475);
  protected activePath: Bezier;
  protected forcedPath: Bezier | null = null;
  protected animateInComplete: boolean = false;
  
  constructor(targetElement: HTMLElement, rawFrom: RawViewportPosition, rawTo: RawViewportPosition) {
    super(targetElement, rawFrom, rawTo, [cssProperties.scale, cssProperties.opacity]);
    this._elementProxyMain.opacity = '0';
  }
  
  public animateIn(duration: number, delay: number, from: RawViewportVar): void {
    this.elementProxyPosition[cssProperties.x] = viewportUnitToPx(from[0], from[1]);
    TweenRunner.to(this.elementProxyPosition, cssProperties.x, 0, duration, delay, Ease.quintOut).then(() => this.animateInComplete = true);
    TweenRunner.to(this._elementProxyMain, cssProperties.opacity, 1, duration, delay, Ease.linear);
  }
  
  public animateTo(progress: 0 | 1, baseDuration: number, delay: number = 0, keepExistingPath = false): Promise<number> {
    if (delay) return timeout(delay).then(() => this.animateTo(progress, baseDuration, 0, keepExistingPath));
    
    if (! this.animateInComplete) {
      this.animateInComplete = true;
      TweenRunner.cancelTweens(this.elementProxyPosition, cssProperties.x);
    }
    if (keepExistingPath) {
      this.forcedPath = this.activePath;
    }
    let p = super.animateTo(progress, baseDuration);
    this.forcedPath = null;
    return p;
  }
  
  protected initializeRange(base: 0 | 1): void {
    super.initializeRange(base);
    if (this.forcedPath) {
      this.activePath = this.forcedPath;
    } else {
      this.activePath = base ? LetterAnimator.forwardPath : LetterAnimator.reversePath;
    }
  }
  
  public get progress(): number { return this._progress; }
  protected set progress(value: number) {
    this._progress = value;
    this.elementProxyPosition[cssProperties.x] = this.xRangeMapper.interpolate(this.activePath.getX(value));
    this.elementProxyPosition[cssProperties.y] = this.yRangeMapper.interpolate(this.activePath.getY(value));
    this._elementProxyMain[cssProperties.scale] = LetterAnimator.scaleRangeMapper.interpolate(value).toString();
  }
  
}
