import { BaseTween, EaseFunction, Ease } from './tween-core';
import { Ticker } from '@/core/utils/ticker';

class RunningTween extends BaseTween {
  public finished: Promise<number>;
  public onComplete: (lastValue: number) => any;
}

export class TweenRunner {
  
  private static ticker = new Ticker(TweenRunner.update.bind(TweenRunner), true);
  private static lastTime: number;
  private static tweens: RunningTween[] = [];
  
  public static to(target: any, property: string, targetValue: number, duration: number = 200, delay: number = 0, ease: EaseFunction = Ease.linear): Promise<number> {
    TweenRunner.running = true;
    
    // If an identical tween is already running, cancel it and hold onto the promise for completion later
    let maybeTween = this.cancelTweens(target, property, false);
    
    // Add new tween
    let tween: RunningTween;
    let startingValue = parseFloat(target[property]);
    let finished = new Promise<number>(onComplete => {
      tween = new RunningTween(target, property, this.lastTime + delay, this.lastTime + delay + duration, startingValue, targetValue, ease, true);
      tween.onComplete = onComplete;
    });
    tween!.finished = finished;
    TweenRunner.tweens.push(tween!);
    
    if (maybeTween) {
      tween!.finished.then(maybeTween.onComplete);
    }
    
    return finished;
  }
  
  public static cancelTweens(target: any, property?: string, resolvePromises = false): RunningTween | void {
    let searchAllProperties = !property;
    
    for (let i = 0, l = TweenRunner.tweens.length; i < l; i++) {
      let tween = TweenRunner.tweens[i];
      if (tween.target !== target) continue;
      if (tween.property === property || searchAllProperties) {
        TweenRunner.tweens.splice(i, 1);
        resolvePromises && tween.onComplete(target[tween.property]);
        if (searchAllProperties) {
          i--;
          l--;
        } else {
          return tween;
        }
      }
    }
  }
  
  private static update(): void {
    let currentTime = TweenRunner.lastTime = Date.now() - TweenRunner.epochStart;
    
    for (let i = 0, l = TweenRunner.tweens.length; i < l; i++) {
      let tween = TweenRunner.tweens[i];
      tween.updateTarget(currentTime);
      if (currentTime > tween.endTime) {
        tween.onComplete(tween.endValue);
        TweenRunner.tweens.splice(i, 1);
        i--;
        l--;
      }
    }
    if (! TweenRunner.tweens.length) {
      TweenRunner.running = false;
    }
  }
  
  private static _running: boolean = false;
  private static epochStart: number;
  private static set running(value: boolean) {
    if (value === TweenRunner._running) return;
    TweenRunner._running = value;
    if (TweenRunner._running) {
      TweenRunner.epochStart = Date.now();
      TweenRunner.lastTime = 0;
      TweenRunner.ticker.start();
    } else {
      TweenRunner.ticker.stop();
    }
  }
  
}
