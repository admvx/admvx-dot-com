import { getNumericCssVarProxy, ProxyTargetNumeric } from './utils/css-var-animator';
import { SpringEase } from './utils/spring-ease';
import { Ease } from './utils/tween-core';
import { TweenRunner } from './utils/tween-runner';
import { timeout } from '@/core/utils/ticker';

const entrySelector = '.work-entry-link';

const cssPropertyNames = {
  opacity: 'opacity',
  offset: '--offset'
};
const cssVarList = (<Array<keyof typeof cssPropertyNames>>Object.keys(cssPropertyNames)).map((key) => cssPropertyNames[key]);

const maxItemOffset = 50;

const springOptions = {
  inOpacity: {
    baseDuration: 500,
    baseMagnitude: 1
  },
  inOffset: {
    baseDuration: 500,
    baseMagnitude: maxItemOffset
  },
  outOpacity: {
    baseDuration: 350,
    baseMagnitude: 1
  },
  outOffset: {
    baseDuration: 425,
    baseMagnitude: maxItemOffset
  },
  shift: {
    baseDuration: 1200
  }
};

type AnimationUpdates = {
  mostlyDone: Promise<void>;
  allDone: Promise<number>;
}

const expandedOffsetsFromStart = [5.5];
const expandedOffsetsFromEnd = [-40, -22, -5];
const largeTextOffsetAdjustment = 1.8;
const largeTextWidthThreshold = 640;

const unitSizePerMinWidth = [
  { width: 0, unitSize: 1.3617021277, useVw: true },
  { width: 470, unitSize: 6.4, useVw: false },
  { width: 640, unitSize: 1, useVw: true },
  { width: 1280, unitSize: 12.8, useVw: false }
];
const itemUnitHeightMultiplier = 22;
const itemUnitOffsetFromTop = 1.35;

export class WorkPageAnimation {
  
  private elementProxies: ProxyTargetNumeric[];
  private animatedIn: boolean = false;
  private itemIndexExpandedOffsetPairs: [number, number][];
  private expandedOffsetLookup: { [index: number]: number };
  private itemCount: number;
  private unitSize: number;
  private pageHeight: number;
  private headerHeight: number;
  private visibleItemCount: number;
  private proportionalScrollTop: number;
  
  constructor(outerElement: HTMLElement) {
    this.elementProxies = [];
    outerElement.querySelectorAll(entrySelector).forEach(element => {
      let proxy = getNumericCssVarProxy(element as HTMLElement, cssVarList);
      this.elementProxies.push(proxy);
      proxy[cssPropertyNames.offset] = maxItemOffset;
      proxy[cssPropertyNames.opacity] = 0;
    });
    this.itemCount = this.elementProxies.length;
    
    this.itemIndexExpandedOffsetPairs = [];
    this.expandedOffsetLookup = { };
    expandedOffsetsFromStart.forEach((offset, index) => {
      this.itemIndexExpandedOffsetPairs.push([index, offset]);
      this.expandedOffsetLookup[index] = offset;
    });
    expandedOffsetsFromEnd.forEach((offset, index) => {
      let adjustedIndex = this.itemCount - (index + 1);
      this.itemIndexExpandedOffsetPairs.push([adjustedIndex, offset]);
      this.expandedOffsetLookup[adjustedIndex] = offset;
    });
  }
  
  private recalculateVisibility(): void {
    let activeOption = unitSizePerMinWidth[0], viewWidth = window.innerWidth, viewHeight = window.innerHeight;
    for (let i = 1, l = unitSizePerMinWidth.length; i < l; i++) {
      let option = unitSizePerMinWidth[i];
      if (viewWidth < option.width) break;
      activeOption = option;
    }
    this.unitSize = activeOption.unitSize * (activeOption.useVw ? viewWidth*0.01 : 1);
    this.pageHeight = this.unitSize * (this.itemCount + 1) * itemUnitHeightMultiplier;
    this.visibleItemCount = (this.itemCount * viewHeight / this.pageHeight) + 1;
    this.proportionalScrollTop = window.scrollY / (this.unitSize * itemUnitHeightMultiplier) - itemUnitOffsetFromTop;
    this.headerHeight = Math.min(viewWidth, viewHeight) * 0.1;
  }
  
  public animateIn(): void {
    this.animatedIn = true;
    this.recalculateVisibility();
    
    let toAnimate: [ProxyTargetNumeric, number, number][] = [];
    for (let i = 0; i < this.itemCount; i++) {
      let proxy = this.elementProxies[i];
      let proportion = (i - this.proportionalScrollTop) / this.visibleItemCount;
      let offset = i === this._expandedIndex ? (this.expandedOffsetLookup[i] || 0) : 0;
      
      if (proportion >= 0 && proportion <= 1.1 || (i === this._lastExpandedIndex && proportion >= -0.25 && proportion <= 1.25)) {
        toAnimate.push([proxy, proportion, offset]);
      } else {
        SpringEase.cancelTween(proxy);
        proxy[cssPropertyNames.offset] = offset;
        proxy[cssPropertyNames.opacity] = 1;
      }
    }
    
    for (let i = 0, l = toAnimate.length; i < l; i++) {
      let [proxy, proportion, offset] = toAnimate[i];
      let delay = proportion * 400;
      SpringEase.to(proxy, cssPropertyNames.opacity, 1, { delay, ... springOptions.inOpacity });
      SpringEase.to(proxy, cssPropertyNames.offset, offset, { delay, ... springOptions.inOffset });
    }
  }
  
  public animateOut(delay: number = 0): AnimationUpdates {
    this.animatedIn = false;
    this.recalculateVisibility();
    
    let toAnimate: [ProxyTargetNumeric, number][] = [];
    for (let i = 0; i < this.itemCount; i++) {
      let proxy = this.elementProxies[i];
      let proportion = (i - this.proportionalScrollTop) / this.visibleItemCount;
      
      if (proportion >= 0 && proportion <= 1 || i === this._lastExpandedIndex) {
        toAnimate.push([proxy, proportion]);
      } else {
        SpringEase.cancelTween(proxy);
        proxy[cssPropertyNames.offset] = maxItemOffset;
        proxy[cssPropertyNames.opacity] = 0;
      }
    }
    
    if (! toAnimate.length) {
      toAnimate.push([this.elementProxies[0], 0.5]);
    }
    let proportionalDistance = toAnimate[toAnimate.length-1][0][cssPropertyNames.opacity];
    
    let lastTween: Promise<number>;
    for (let i = 0, l = toAnimate.length; i < l; i++) {
      let [proxy, proportion] = toAnimate[i];
      let itemDelay = delay + (1 - proportion) * 200;
      SpringEase.to(proxy, cssPropertyNames.offset, maxItemOffset, { delay: itemDelay, ... springOptions.outOffset });
      let opacityTween = SpringEase.to(proxy, cssPropertyNames.opacity, 0, { delay: itemDelay, ... springOptions.outOpacity });
      if (i === 0) lastTween = opacityTween;
    }
    
    return {
      mostlyDone: timeout(delay + springOptions.outOpacity.baseDuration * 0.5 * proportionalDistance),
      allDone: lastTween!
    };
  }
  
  public scrollToItem(index: number, tallTitle = false, instantaneous = false): void {
    this.recalculateVisibility();
    let scrollDestination = 0;
    if (index !== 0) {
      let indexOffset = (tallTitle ? 12.75 : 7.75) - (this.expandedOffsetLookup[index] || 0);
      scrollDestination = Math.min(Math.max(0, (index * itemUnitHeightMultiplier - indexOffset) * this.unitSize) + this.headerHeight, this.pageHeight - window.innerHeight);
    }
    
    if (instantaneous) {
      document.documentElement.scrollTop = scrollDestination;
      return;
    }
    if (Math.abs(document.documentElement.scrollTop - scrollDestination) < 10) return;
    TweenRunner.to(document.documentElement, 'scrollTop', scrollDestination, 500, 0, Ease.cubicInOut);
  }
  
  private _expandedIndex: number = -1;
  private _lastExpandedIndex: number = -1;
  public setExpandedIndex(value: number, tallTitle = false): void {
    if (value === this._expandedIndex) return;
    
    if (value !== -1) {
      this._lastExpandedIndex = value;
      this.scrollToItem(value, tallTitle, false);
    }
    
    this._expandedIndex = value;
    if (! this.animatedIn) return;
    
    let offsetMultiplier = innerWidth < largeTextWidthThreshold ? largeTextOffsetAdjustment : 1;
    
    this.itemIndexExpandedOffsetPairs.forEach(pair => {
      let [index, offset] = pair;
      let effectiveOffset: number = this._expandedIndex === index ? offset : 0;
      if (effectiveOffset < 0) {
        effectiveOffset *= offsetMultiplier;
      }
      SpringEase.to(this.elementProxies[index], cssPropertyNames.offset, effectiveOffset, { baseMagnitude: Math.abs(offset), ...springOptions.shift});
    });
  }
  
}
