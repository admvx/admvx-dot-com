import { RangeMapper } from './range-mapper';

export type EaseFunction = (p: number) => number;

// Unused ease functions deleted to reduce bundle size
export const Ease = {
  linear: function(p: number) { return p; },
  
  quadIn: function(p: number) { return p*p; },
  quadOut: function(p: number) { return -p*(p-2); },
  quadInOut: function(p: number) { p *= 2; if (p < 1) return 0.5*p*p; p--; return -0.5 * (p*(p-2) - 1); },
  
  cubicIn: function(p: number) { return p*p*p; },
  cubicOut: function(p: number) { p--; return p*p*p + 1; },
  cubicInOut: function(p: number) { p *= 2; if (p < 1) return 0.5*p*p*p; p -= 2; return 0.5*(p*p*p + 2); },
  
  quartOut: function(p: number) { p--; return -(p*p*p*p - 1); },
  
  quintOut: function(p: number) { p--; return (p*p*p*p*p + 1); },
  
  sineInOut: function(p: number) { return -0.5 * (Math.cos(Math.PI * p) - 1); },
  
  expoIn: function(p: number) { return Math.pow(2, 10 * (p - 1)); }
};

export class BaseTween extends RangeMapper {
  
  public target: any;
  public property: string;
  public ease: (p: number) => number;
  
  public startTime: number;
  public endTime: number;
  public startValue: number;
  public endValue: number;
  
  private nonUnitaryValues: boolean;
  private allowOvershoot: boolean;
  private allowUndershoot: boolean;
  private timeMapper: RangeMapper;
  
  constructor(target: any, property: string, startTime: number, endTime: number, startValue: number, endValue: number, ease: EaseFunction = Ease.linear, nonUnitaryValues = false, allowOvershoot = false, allowUndershoot = false) {
    if (nonUnitaryValues) {
      super(startValue, endValue);
      this.timeMapper = new RangeMapper(startTime, endTime);
    } else {
      let rangeAdjust = (endValue - startValue) / (endTime - startTime);
      let offset = rangeAdjust * -startTime + startValue;
      super(offset, rangeAdjust + offset);
      
      if (startTime > endTime) {
        [endTime, startTime] = [startTime, endTime];
        [endValue, startValue] = [startValue, endValue];
      }
    }
    
    this.target = target;
    this.property = property;
    this.startTime = startTime;
    this.endTime = endTime;
    this.startValue = startValue;
    this.endValue = endValue;
    this.ease = ease;
    this.nonUnitaryValues = nonUnitaryValues;
    this.allowOvershoot = allowOvershoot;
    this.allowUndershoot = allowUndershoot;
  }
  
  public updateTarget(time: number): void {
    this.target[this.property] = this.getMappedValue(time);
  }
  
  private getMappedValue(time: number): number {
    if (!this.allowUndershoot && time < this.startTime) return this.startValue;
    if (!this.allowOvershoot && time > this.endTime) return this.endValue;
    if (this.nonUnitaryValues) {
      return super.interpolate(this.ease(this.timeMapper.interpolateInverse(time)));
    } else {
      return this.ease(super.interpolate(time));
    }
  }

}

export class Timeline {
  
  private tweens: BaseTween[] = [];
  private _time: number = 1;
  
  public registerTween(target: any, property: string, startTime: number = 0, endTime: number = 1, startValue: number = 0, endValue: number, ease: EaseFunction = Ease.linear, nonUnitaryValues = false, allowOvershoot = false, allowUndershoot = false): void {
    this.tweens.push(new BaseTween(target, property, startTime, endTime, startValue, endValue, ease, nonUnitaryValues, allowOvershoot, allowUndershoot));
  }
  
  public get time(): number { return this._time; }
  public set time(value: number) {
    this._time = value;
    for (let tween of this.tweens) {
      tween.updateTarget(value);
    }
  }
  
}
