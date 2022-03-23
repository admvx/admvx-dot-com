declare global {
  interface Window {
    webkitRequestAnimationFrame: (callback: FrameRequestCallback) => number;
    mozRequestAnimationFrame: (callback: FrameRequestCallback) => number;
  }
}
const polyRaf = function(onFrame: Function) { setTimeout(onFrame, 16); };
const raf = (requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame).bind(window) || polyRaf;
export const doubleRaf = function() {
  return new Promise(function(resolve) {
    raf(() => { raf(resolve); });
  });
};

export const timeout = function(delay: number): Promise<void> {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay);
  });
};

export class Ticker {
  
  private static newFrame_bound: FrameRequestCallback;
  private static instances: Set<Ticker> = new Set();
  private static sRunning = false;
  
  private running = false;
  
  constructor(private onFrame: Function, awaitStartCall = false) {
    if (! awaitStartCall) this.start();
  }
  
  private static registerInstance(instance: Ticker): void {
    Ticker.instances.add(instance);
    if (Ticker.sRunning) return;
    Ticker.newFrame_bound = Ticker.newFrame_bound || Ticker.newFrame.bind(this);
    Ticker.sRunning = true;
    raf(Ticker.newFrame_bound);
  }
  
  private static unregisterInstance(instance: Ticker): void {
    Ticker.instances.delete(instance);
    if (Ticker.instances.size) return;
    Ticker.sRunning = false;
  }
  
  private static newFrame(time?: number): void {
    if (! Ticker.sRunning) return;
    for (let instance of Ticker.instances) {
      instance.onFrame();
    }
    raf(Ticker.newFrame_bound);
  }
  
  public start(): void {
    if (this.running) return;
    this.running = true;
    Ticker.registerInstance(this);
  }
  
  public stop(): void {
    if (! this.running) return;
    this.running = false;
    Ticker.unregisterInstance(this);
  }
  
}
