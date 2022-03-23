import { Ticker } from '@/core/utils/ticker';

export enum TweenUpdateMode {
  clearSubsequent = 1,           // [Default] If a newly added tween is scheduled to start sooner than any queued, the latter tweens are cancelled
  queueFully,                    // Delay schedule is preserved regardless of receipt order 
  clearAllExceptActive,          // A newly added *delayed* tween replaces any that are scheduled whether sooner or later, but currently active tweens are unaffected
  clearAllAndIgnoreDelayIfActive // As above but even a new *delayed* tween will immediately start if another tween is active
}

interface SprungTween {
  target: any;
  property: string;
  targetValue: number;
  
  updateMode: TweenUpdateMode;
  velocity: number;
  
  deltaMultiplier: number;
  baseMagnitude: number;
  requestedMagnitude: number;
  stopThreshold: number;
  friction: number;
  baseStrength: number;
  minStrengthMultiplier: number;
  maxStrengthMultiplier: number;
  inverseDeltaMultiplier: number;
  restitutionAdjustmentThreshold: number;
  
  finished: Promise<number>;
  onComplete: (lastValue: number) => any;
}

const defaultParams = {
  delay: 0,
  baseDuration: 1000,
  baseMagnitude: 1,
  stopThresholdMultiplier: 0.002,
  
  updateMode: TweenUpdateMode.clearSubsequent,
  
  friction: 5.4,
  baseStrength: 10.9,
  minStrengthMultiplier: 0.013,
  maxStrengthMultiplier: 1,
  inverseDeltaMultiplier: 3.6
};

const restitutionAdjustmentThresholdMultiplier = 0.1;
const frictionRestitutionAdjustment = 0.7;
const strengthRestitutionAdjustment = 0.1;
const deltaTimeConstant = 0.0027;
const maxDeltaTime = 50;
const typicalFrameTime = 16.666666667;

export type SpringParameters = typeof defaultParams;

type PendingTween = {
  target: any,
  property: string,
  targetValue: number,
  options: Partial<SpringParameters>,
  delayUntil: number,
  finished: Promise<number>,
  onComplete: (lastValue: number) => any
};

export class SpringEase {

  private static _running: boolean = false;
  private static ticker = new Ticker(SpringEase.update.bind(SpringEase), true);
  private static lastTime: number;
  private static activeTweens: SprungTween[] = [];
  private static pendingTweens: PendingTween[] = [];
  
  /**
   * Notes:
   * - If a new tween updates one that is already running on the given target & property, the original `options` settings will be preserved; only `targetValue` and `baseDuration` can be updated (delayed tweens excluded, iff the original tween completes before the delay expires).
   * - Spring strength increases inversely with distance to the target value.
   * - `baseDuration` determines approximate transition length based on the `parameters.baseMagnitude` value.
   * - `stopThresholdMultiplier` is also scaled relative to `parameters.baseMagnitude`.
   * - `baseMagnitude` itself can be no smaller than the starting delta value, but if it is less than the distance between current value and `targetValue`, the effective duration will be reduced.
   * @return promise containing the final property value, whether rejected or resolved
   */
  public static to(target: any, property: string, targetValue: number, options?: Partial<SpringParameters>): Promise<number> {
    SpringEase.running = true;
    
    // If this tween has a delay, handle according to the update mode
    if (options?.delay) {
      return SpringEase.schedulePendingTween(target, property, targetValue, options);
    } else {
      // Cancel any pending tweens unless the update mode is `queueFully` 
      if (! (options?.updateMode === TweenUpdateMode.queueFully)) SpringEase.cancelPendingTweens(target, property, 0);
      return SpringEase.startImmediateTween(target, property, targetValue, options);
    }
  }
  
  public static cancelTween(target: any, property?: string, completeActive: boolean = false): void {
    let allProperties = !property;
    for (let i = 0, l = SpringEase.activeTweens.length; i < l; i++) {
      let tween = SpringEase.activeTweens[i];
      if ((tween.target === target) && (allProperties || (tween.property === property))) {
        if (completeActive) {
          tween.target[tween.property] = tween.targetValue;
          tween.onComplete(tween.targetValue);
        } else {
          tween.onComplete(tween.target[tween.property]);
        }
        SpringEase.activeTweens.splice(i, 1);
        if (allProperties) {
          i--;
          l--;
        } else {
          break;
        }
      }
    }
    SpringEase.cancelPendingTweens(target, property, 0);
  }
  
  private static schedulePendingTween(target: any, property: string, targetValue: number, options: Partial<SpringParameters>): Promise<number> {
    let updateMode = options.updateMode || TweenUpdateMode.clearSubsequent;
    let delayUntil = SpringEase.lastTime + options.delay!;
    
    switch (updateMode) {
      case TweenUpdateMode.clearAllExceptActive:
        this.cancelPendingTweens(target, property, 0);
        break;
      
      case TweenUpdateMode.clearAllAndIgnoreDelayIfActive:
        this.cancelPendingTweens(target, property, 0);
        let maybeTween = this.updateTweenIfActive(target, property, targetValue, options);
        if (maybeTween) return maybeTween.finished;
        break;
        
      case TweenUpdateMode.clearSubsequent:
        this.cancelPendingTweens(target, property, delayUntil);
        break;
        
      case TweenUpdateMode.queueFully:
        // No additional action required
        break;
    }
    
    let preTween: Partial<PendingTween>;
    let finished = new Promise<number>(onComplete => {
      preTween = { target, property, targetValue, delayUntil, options, onComplete };
    });
    preTween!.finished = finished;
    SpringEase.pendingTweens.push(preTween! as PendingTween);
    
    return finished;
  }
  
  private static startImmediateTween(target: any, property: string, targetValue: number, options?: Partial<SpringParameters>): Promise<number> {
    // Check whether an identical tween is already running
    let maybeTween = this.updateTweenIfActive(target, property, targetValue, options);
    if (maybeTween) return maybeTween.finished;
    
    // Check whether the target value has already been reached, and shortcut if so
    if (target[property] === targetValue) return Promise.resolve(targetValue);
    
    // Process options
    let fullOptions: SpringParameters = options ? Object.assign(Object.assign({}, defaultParams), options) : defaultParams;
    let deltaMultiplier = deltaTimeConstant * defaultParams.baseDuration / (fullOptions.baseDuration || defaultParams.baseDuration);
    let baseMagnitude = Math.max(Math.abs(target[property] - targetValue), fullOptions.baseMagnitude, 0.1);
    let requestedMagnitude = baseMagnitude;
    let stopThreshold = fullOptions.stopThresholdMultiplier * baseMagnitude;
    let restitutionAdjustmentThreshold = baseMagnitude * restitutionAdjustmentThresholdMultiplier;
    let { friction, baseStrength, minStrengthMultiplier, maxStrengthMultiplier, inverseDeltaMultiplier, updateMode } = fullOptions;
    let velocity = 0;
    
    // Add new tween
    let tween: Partial<SprungTween>;
    let finished = new Promise<number>(onComplete => {
      tween = { target, property, targetValue, deltaMultiplier, velocity, stopThreshold, onComplete, baseMagnitude, requestedMagnitude, friction, baseStrength, minStrengthMultiplier, maxStrengthMultiplier, inverseDeltaMultiplier, restitutionAdjustmentThreshold, updateMode };
    });
    tween!.finished = finished;
    SpringEase.activeTweens.push(tween! as SprungTween);
    
    return finished;
  }
  
  private static updateTweenIfActive(target: any, property: string, targetValue: number, options?: Partial<SpringParameters>): SprungTween|void {
    for (let tween of SpringEase.activeTweens) {
      if ((tween.target === target) && (tween.property === property)) {
        tween.targetValue = targetValue;
        let delta = Math.abs(targetValue - target[property]);
        let projectedDelta = Math.abs(targetValue - (target[property] + typicalFrameTime * tween.deltaMultiplier * tween.velocity * 5));
        let newBaseMagnitude = Math.max(delta, projectedDelta, tween.requestedMagnitude, options?.baseMagnitude || 0.1);
        tween.stopThreshold *= newBaseMagnitude / tween.baseMagnitude;
        tween.restitutionAdjustmentThreshold *= newBaseMagnitude / tween.baseMagnitude;
        tween.baseMagnitude = newBaseMagnitude;
        tween.deltaMultiplier = deltaTimeConstant * defaultParams.baseDuration / (options?.baseDuration || defaultParams.baseDuration);
        return tween;
      }
    }
  }
  
  private static cancelPendingTweens(target: any, property?: string, cancelScheduledAtOrAfter: number = 0): void {
    let allProperties = !property;
    for (let i = 0, l = SpringEase.pendingTweens.length; i < l; i++) {
      let preTween = SpringEase.pendingTweens[i];
      if (
        (preTween.target === target) &&
        (allProperties || (preTween.property === property)) &&
        (preTween.delayUntil >= cancelScheduledAtOrAfter)
      ) {
        preTween.onComplete(target[preTween.property]);
        SpringEase.pendingTweens.splice(i, 1);
        i--;
        l--;
      }
    }
  }
  
  private static update(): void {
    let currentTime = Date.now();
    const lastTime = SpringEase.lastTime;
    const deltaTime = Math.min(currentTime - lastTime, maxDeltaTime);
    SpringEase.lastTime = currentTime;
    currentTime = lastTime + deltaTime;
    
    for (let i = 0, l = SpringEase.activeTweens.length; i < l; i++) {
      let tween = SpringEase.activeTweens[i];
      if (! SpringEase.updateTween(tween, deltaTime)) {
        tween.onComplete(tween.targetValue);
        SpringEase.activeTweens.splice(i, 1);
        i--;
        l--;
      }
    }
    for (let i = 0, l = SpringEase.pendingTweens.length; i < l; i++) {
      let preTween = SpringEase.pendingTweens[i];
      if (preTween.delayUntil > currentTime) continue;
      SpringEase.pendingTweens.splice(i, 1);
      i--;
      l--;
      SpringEase.startImmediateTween(preTween.target, preTween.property, preTween.targetValue, preTween.options).then(preTween.onComplete);
    }
    if (! (SpringEase.activeTweens.length + SpringEase.pendingTweens.length)) {
      SpringEase.running = false;
    }
  }
  
  private static updateTween(tween: SprungTween, deltaTime: number): boolean {
    deltaTime *= tween.deltaMultiplier;
    
    let currentValue = tween.target[tween.property];
    let targetValue = tween.targetValue;
    let friction = tween.friction;
    let deltaValue = currentValue - targetValue;
    let inverseProportionalDelta = 1 - Math.min(Math.max(Math.abs(deltaValue / tween.baseMagnitude), 0), 1);
    let strength = tween.baseStrength * Math.min(tween.minStrengthMultiplier + inverseProportionalDelta * tween.inverseDeltaMultiplier, tween.maxStrengthMultiplier);
    
    if (Math.abs(deltaValue) > tween.restitutionAdjustmentThreshold && tween.velocity * deltaValue > 0) {
      friction *= frictionRestitutionAdjustment;
      strength *= strengthRestitutionAdjustment;
    }
    
    tween.velocity -= deltaTime * (strength * deltaValue + friction * tween.velocity);
    let newValue = currentValue + deltaTime * tween.velocity;
    
    if ((Math.abs(targetValue - newValue) < tween.stopThreshold) && (Math.abs(tween.velocity) < tween.stopThreshold)) {
      tween.target[tween.property] = targetValue;
      return false;
    }

    tween.target[tween.property] = newValue;
    return true;
  }
  
  private static set running(value: boolean) {
    if (value === SpringEase._running) return;
    SpringEase._running = value;
    if (SpringEase._running) {
      SpringEase.lastTime = Date.now();
      SpringEase.ticker.start();
    } else {
      SpringEase.ticker.stop();
    }
  }
  
}
