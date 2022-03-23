import { getNumericCssVarProxy, ProxyTargetNumeric } from './utils/css-var-animator';
import { SpringEase, SpringParameters } from './utils/spring-ease';
import { Timeline, Ease } from './utils/tween-core';

const cssVarNames = {
  main: '--mainProgress',
  figure: '--figureProgress',
  header: '--headerProgress',
  close: '--closeProgress',
  infoHeight: '--infoHeightProgress',
  infoOverlay: '--infoOverlayProgress',
  link: '--linkProgress'
};
const varList = (<Array<keyof typeof cssVarNames>>Object.keys(cssVarNames)).map((key) => cssVarNames[key]);
const springOptions: Partial<SpringParameters> = {
  baseDuration: 1200,
  baseMagnitude: 1
};

export class WorkEntryAnimation {
  
  private elementProxy: ProxyTargetNumeric;
  private bodyAnchors: NodeListOf<Element>;
  private timeline: Timeline;
  private expanded = false;
  
  constructor(element: HTMLElement, expanded: boolean) {
    this.elementProxy = getNumericCssVarProxy(element, varList);
    this.gatherAnchors(element);
    this.setUpTimeline();
    if (expanded) {
      this.setExpanded(true, true);
    } else {
      this.changeAnchorTabbing(false);
    }
  }
  
  private setUpTimeline(): void {
    this.timeline = new Timeline();
    this.timeline.registerTween(this.elementProxy, cssVarNames.link, 0, 0.2, 0, 1, Ease.quartOut, false, false, true);
    this.timeline.registerTween(this.elementProxy, cssVarNames.infoOverlay, 0, 0.4, 0, 1);
    this.timeline.registerTween(this.elementProxy, cssVarNames.main, 0, 1, 0, 1, undefined, false, true, true);
    this.timeline.registerTween(this.elementProxy, cssVarNames.close, 0, 0.35, 0, 1, undefined, false, false, true);
    this.timeline.registerTween(this.elementProxy, cssVarNames.infoHeight, 0.075, 0.7, 0, 1, Ease.cubicOut);
    this.timeline.registerTween(this.elementProxy, cssVarNames.figure, 0, 0.25, 1, 0, Ease.linear);
    this.timeline.registerTween(this.elementProxy, cssVarNames.header, 0, 0.7, 0, 1, undefined, false, false, true);
  }
  
  private gatherAnchors(element: HTMLElement): void {
    this.bodyAnchors = element.querySelectorAll('.visible a');
  }
  
  private changeAnchorTabbing(allowTabbing: boolean): void {
    if (allowTabbing) {
      this.bodyAnchors.forEach(anchor => anchor.removeAttribute('tabindex'));
    } else {
      this.bodyAnchors.forEach(anchor => anchor.setAttribute('tabindex', '-1'));
    }
  }
  
  public setExpanded(isExpanded: boolean, instantaneous?: boolean): void {
    if (isExpanded === this.expanded) return;
    this.expanded = isExpanded;
    this.changeAnchorTabbing(isExpanded);
    
    let timelinePosition = isExpanded ? 0 : 1;
    if (instantaneous) {
      this.timeline.time = timelinePosition;
      return;
    }
    SpringEase.to(this.timeline, 'time', timelinePosition, springOptions);
  }
  
}
