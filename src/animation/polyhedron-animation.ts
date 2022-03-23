import { Scene, Viewports, Model, SvgContext as makeSvgContext, SvgRenderContext, Camera, Projections, Shape } from 'seen';
import { PolyhedronModel } from '@/animation/polyhedron-model';
import { AnimationPropertySet, CssVarAnimator, RawViewportPosition, RawViewportVar } from './utils/css-var-animator';
import { LetterAnimator } from './letter-animation';
import { Ticker, timeout } from '@/core/utils/ticker';
import { Ease, EaseFunction } from './utils/tween-core';
import { TweenRunner } from './utils/tween-runner';
import { siteState } from '@/core/site-state';
import { SpringEase } from './utils/spring-ease';

// Supporting data structures
enum State {
  initial = 1,
  transitioning,
  main,
  header_idle,
  header_animating
}

type ShapeTransformProperty = 'x' | 'y' | 'z' | 'rotX' | 'rotY' | 'rotZ';
type ShapeTransformPropertySet = {
  [paramName in ShapeTransformProperty]: number;
};

// Helper functions
const randomSign = function() { return  Math.random() > 0.5 ? 1 : -1; };

// Constants
const letterCount = 5;
const viewSize = 200;
const durationMultiplier = 1;
const baseDuration = 1000 * durationMultiplier;
const switchDuration = 0.9 * baseDuration;
const polySwitchDuration = 0.8 * switchDuration;
const idleDuration = 1.8 * baseDuration;
const idleDurationY = idleDuration;
const idleDurationRotX = idleDuration * 4;
const idleDurationRotY = idleDuration * 1.8;
const idleY = 10;
const idleRotX = 0.1;
const idleRotY = 0.28;
const polyReversalThreshold = 0.35;

const svgWidthVmin = 35;
const svgOffsetVmin = svgWidthVmin * -0.5;
const mainSvgPosition: RawViewportPosition = { x: [[50, 'vw'], [0 + svgOffsetVmin, 'vmin']], y: [[40 + svgOffsetVmin, 'vmin']] };
const headerSvgPosition: RawViewportPosition = { x: [[0, 'vw'], [5 + svgOffsetVmin, 'vmin']], y: [[5 + svgOffsetVmin, 'vmin']] };

const mainLetterStartOffset: RawViewportVar = [25, 'vmin'];
const headerLetterStartOffset: RawViewportVar = [12, 'vmin'];
const mainLetterPositions: RawViewportPosition[] = [-16.55, -9.4, -2, 6.9, 14.15].map(xVmin => {
  return { x: [[50, 'vw'], [xVmin, 'vmin']], y: [[60.5, 'vmin']] };
});
const headerLetterPositions: RawViewportPosition[] = [9.5, 12.9, 16.4, 20.6, 24.1].map(xVmin => {
  return { x: [[0, 'vw'], [xVmin, 'vmin']], y: [[3.3, 'vmin']] };
});

const mainTransformInitial: AnimationPropertySet = { y: 300, z: -1500, rotX: -1.1 };
const headerTransformInitial: AnimationPropertySet = { y: 200, z: -2500, rotX: -1.1 };
const mainRestZ: number = 0;
const headerRestZ: number = -870;
const transitionRot: number = 0.3;
const transitionRotX: number = 0.4;


export class PolyhedronAnimation {
  
  private shapeTransform: ShapeTransformPropertySet = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 };
  private svgAnimator: CssVarAnimator;
  private letterAnimators: LetterAnimator[];
  private inHeaderAtLoad: boolean;
  private renderContext: SvgRenderContext;
  private state: State;
  private scene: Scene;
  private polyShape: Shape;
  private ticker: Ticker;
  private svgId: string;
  private svgSelector: string;
  private letterSelector: string;
  
  constructor() {
    this.state = State.initial;
    this.initScene();
  }
  
  public initialize(svgId: string, letterClass: string): void {
    this.svgSelector = '#' + svgId;
    this.letterSelector = '.' + letterClass;
    this.svgId = svgId;
    this.inHeaderAtLoad = ! siteState.atHomePage;
    this.initAnimation();
  }
  
  private initScene(): void {
    this.polyShape = new PolyhedronModel().buildShape();
    const camera = new Camera();
    camera.projection = Projections.perspectiveFov(90, 1);
    camera.translate(0, 0, -100);
    
    this.scene = new Scene({
      fractionalPoints: true,
      cullBackfaces: false,
      model: new Model().add(this.polyShape),
      viewport: Viewports.center(viewSize, viewSize),
      camera: camera
    });
    
    // Redraw seen scene on each tick (while ticker is running)
    this.ticker = new Ticker(() => {
      this.polyShape.reset();
      this.shapeTransform.rotX && this.polyShape.rotx(this.shapeTransform.rotX);
      this.shapeTransform.rotY && this.polyShape.roty(this.shapeTransform.rotY);
      this.shapeTransform.rotZ && this.polyShape.rotz(this.shapeTransform.rotZ);
      this.polyShape.translate(this.shapeTransform.x, this.shapeTransform.y, this.shapeTransform.z);
      this.renderContext.render();
    }, true);
  }
  
  private initAnimation(): void {
    this.renderContext = makeSvgContext(this.svgId, this.scene);
    
    let animProgress: 0 | 1 = this.inHeaderAtLoad ? 1 : 0;
    Object.assign(this.shapeTransform, this.inHeaderAtLoad ? headerTransformInitial : mainTransformInitial);
    
    this.svgAnimator = new CssVarAnimator(
      document.querySelector(this.svgSelector) as HTMLElement,
      mainSvgPosition,
      headerSvgPosition
    );
    this.svgAnimator.setProgress(animProgress, animProgress);
    this.svgAnimator.elementProxyMain.opacity = '0';
    
    let letterElements = document.querySelectorAll(this.letterSelector) as NodeListOf<HTMLElement>;
    this.letterAnimators = [];
    for (let i = 0; i < letterCount; i++) {
      this.letterAnimators.push(new LetterAnimator(
        letterElements[i],
        mainLetterPositions[i],
        headerLetterPositions[i]
      ));
    }
    this.letterAnimators.forEach(animator => animator.setProgress(animProgress, animProgress));
  }
  
  public animateIn(delay: number = baseDuration): Promise<void> {
    // Assign conditional params
    const z = this.inHeaderAtLoad ? headerRestZ : mainRestZ;
    const y = this.inHeaderAtLoad ? 0 : -idleY;
    const rotX = this.inHeaderAtLoad ? 0 : idleRotX;
    
    // Wake up ticker to redraw SVG scene
    this.ticker.start();
    
    // Apply animations
    TweenRunner.to(this.svgAnimator.elementProxyMain, 'opacity', 1, baseDuration * 0.1, delay);
    TweenRunner.to(this.shapeTransform, 'z', z, baseDuration, delay, Ease.quintOut);
    TweenRunner.to(this.shapeTransform, 'rotX', rotX, baseDuration * 0.85, delay + baseDuration * 0.05, Ease.quadOut);
    TweenRunner.to(this.shapeTransform, 'y', y, baseDuration * 1.1, delay + baseDuration * 0.05, Ease.quartOut)
      .then(() => {
        this.svgAnimator.onProgressChange = this.updatePolyProgress.bind(this);
        // Set conditional follow-ups (unless already changing state)
        if (this.state !== State.initial) return;
        if (this.inHeaderAtLoad) {
          this.state = State.header_idle;
          this.ticker.stop();
        } else {
          this.state = State.main;
          this.animateLoop(true);
        }
      });
    
    let letterOffset = this.inHeaderAtLoad ? headerLetterStartOffset : mainLetterStartOffset;
    this.letterAnimators.forEach((animator, i) => animator.animateIn(baseDuration * 0.45, delay + (i * 0.1 + 0.2) * baseDuration, letterOffset));
    
    // Signal animation mostly complete
    return timeout(delay + 0.75 * baseDuration);
  }
  
  public validatePageState(changedToHome: boolean): Promise<void> {
    if (changedToHome && this.state !== State.main) {
      siteState.hoveringHeaderHomeLink = false;
      return this.transitionToMain();
    } else if (!changedToHome && this.state !== State.header_idle && this.state !== State.header_animating) {
      return this.transitionToHeader();
    }
    return Promise.resolve();
  }
  
  public validateHoverState(): void {
    if (this.state === State.header_animating && !siteState.hoveringHeaderHomeLink) {
      this.state = State.header_idle;
      this.animateToRest();
    } else if (this.state === State.header_idle && siteState.hoveringHeaderHomeLink) {
      this.state = State.header_animating;
      this.animateLoop();
    }
  }
  
  private transitionToMain(): Promise<void> {
    // Update state
    this.state = State.transitioning;
    let fromRest = this.svgAnimator.progress > 1 - polyReversalThreshold;
    
    this.ticker.start();
    
    // Prevent TweenRunner from interfering with SpringEase, cancelling everything and ensuring any follow-ups to the 'y' animation (from intro) are executed
    TweenRunner.cancelTweens(this.shapeTransform, 'y', true);
    TweenRunner.cancelTweens(this.shapeTransform);
    
    // Reset y to idle max
    TweenRunner.to(this.shapeTransform, 'y', -idleY, switchDuration, 0, Ease.cubicInOut);
    
    // Animate letters
    let keepCurrentPath = this.letterAnimators[0].progress !== 1;
    this.letterAnimators.forEach((animator, i) => animator.animateTo(0, switchDuration, i * 0.1 * switchDuration, keepCurrentPath));
    
    let delay = fromRest ? 0.1 * switchDuration : 0;
    
    // Animate SVG
    let svgAnimationComplete = this.svgAnimator.animateTo(0, polySwitchDuration * 1.3, 0.1 * switchDuration)
      .then(progress => this.handleTransitionFollowups(progress));
    
    // Animate polyhedron
    if (fromRest) {
      delay += polySwitchDuration * 0.2;
      SpringEase.to(this.shapeTransform, 'rotX', transitionRotX, { baseDuration: polySwitchDuration*0.4, delay, baseMagnitude: transitionRotX });
      SpringEase.to(this.shapeTransform, 'rotZ', -transitionRot, { baseDuration: polySwitchDuration*0.5, delay, baseMagnitude: transitionRot });
      SpringEase.to(this.shapeTransform, 'rotY', transitionRot, { baseDuration: polySwitchDuration*0.3, delay, baseMagnitude: transitionRot });
      delay += polySwitchDuration * 0.4;
    }
    SpringEase.to(this.shapeTransform, 'rotX', 0, { baseDuration: polySwitchDuration, delay, baseMagnitude: transitionRotX });
    SpringEase.to(this.shapeTransform, 'rotZ', 0, { baseDuration: polySwitchDuration*0.9, delay, baseMagnitude: transitionRot });
    SpringEase.to(this.shapeTransform, 'rotY', 0, { baseDuration: polySwitchDuration*0.7, delay, baseMagnitude: transitionRot });
    
    return svgAnimationComplete;
  }
  
  private transitionToHeader(): Promise<void> {
    // Update state
    this.state = State.transitioning;
    let fromRest = this.svgAnimator.progress < polyReversalThreshold;
    
    // Prevent TweenRunner from interfering with SpringEase, cancelling everything and ensuring any follow-ups to the 'y' animation (from intro) are executed
    TweenRunner.cancelTweens(this.shapeTransform, 'y', true);
    TweenRunner.cancelTweens(this.shapeTransform);
    
    // Reset y to 0 (either from incomplete intro or idle bobbing)
    TweenRunner.to(this.shapeTransform, 'y', 0, switchDuration, 0, Ease.cubicInOut);
    
    // Animate letters
    let keepCurrentPath = this.letterAnimators[0].progress !== 0;
    this.letterAnimators.forEach((animator, i) => animator.animateTo(1, switchDuration, i * 0.1 * switchDuration, keepCurrentPath));
    
    // Animate SVG (also updates z translation)
    this.svgAnimator.animateTo(1, polySwitchDuration * 1.2)
      .then(progress => this.handleTransitionFollowups(progress));
    
    // Animate polyhedron
    let delay = 0;
    if (fromRest) {
      SpringEase.to(this.shapeTransform, 'rotX', -transitionRotX, { baseDuration: polySwitchDuration*0.6, delay, baseMagnitude: transitionRotX });
      SpringEase.to(this.shapeTransform, 'rotZ', transitionRot, { baseDuration: polySwitchDuration*0.8, delay, baseMagnitude: transitionRot });
      SpringEase.to(this.shapeTransform, 'rotY', -transitionRot, { baseDuration: polySwitchDuration*0.7, delay, baseMagnitude: transitionRot });
      delay += polySwitchDuration * 0.5;
    }
    
    SpringEase.to(this.shapeTransform, 'rotX', 0, { baseDuration: polySwitchDuration, delay, baseMagnitude: transitionRotX, stopThresholdMultiplier: 0.0015, friction: 4 });
    SpringEase.to(this.shapeTransform, 'rotZ', 0, { baseDuration: polySwitchDuration*0.8, delay, baseMagnitude: transitionRot, stopThresholdMultiplier: 0.0015, friction: 4.2 });
    SpringEase.to(this.shapeTransform, 'rotY', 0, { baseDuration: polySwitchDuration*0.9, delay, baseMagnitude: transitionRot, stopThresholdMultiplier: 0.0015, friction: 4.2 });
    
    return timeout(polySwitchDuration * 0.8);
  }
  
  private handleTransitionFollowups(progress: number): void {
    if (progress === 1) {         // Header
      if (this.state === State.header_idle || this.state === State.header_animating) return;
      this.state = State.header_idle;
      this.validateHoverState();
    } else if (progress === 0) {  // Main
      if (this.state === State.main) return;
      this.state = State.main;
      this.animateLoop(false);
    }
  }
  
  private animateLoop(fromIntro?: boolean): void {
    // Cancel any existing animations and start the ticker
    if (! fromIntro) {
      SpringEase.cancelTween(this.shapeTransform);
      this.ticker.start();
    }
    
    // Animate according to current position and property-specific parameters
    this.animateLoopPerProperty('y', idleY, idleDurationY, Ease.sineInOut);
    this.animateLoopPerProperty('rotX', idleRotX, idleDurationRotX);
    this.animateLoopPerProperty('rotY', idleRotY, idleDurationRotY);
  }
  
  private animateLoopPerProperty(propertyName: ShapeTransformProperty, maxValue: number, maxDuration: number, easing: EaseFunction = Ease.quadInOut, initialDirection?: number): void {
    let initialDuration: number;
    if (initialDirection === undefined) {
      let currentValue = this.shapeTransform[propertyName];
      let absValue = Math.abs(currentValue);
      let proportion = absValue / maxValue;
      initialDirection = proportion > 0.6 ? -(currentValue/absValue) : randomSign();
      initialDuration = maxDuration * Math.abs(initialDirection * maxValue - currentValue) / (maxValue * 2);
    } else {
      initialDuration = maxDuration;
    }

    TweenRunner.to(this.shapeTransform, propertyName, initialDirection * maxValue, initialDuration, 0, easing)
      .then(() => {
        if (! (this.state === State.main || this.state === State.header_animating)) return;
        this.animateLoopPerProperty(propertyName, maxValue, maxDuration, easing, -initialDirection!);
      });
  }
  
  private animateToRest(): void {
    this.animateToRestPerProperty('y', idleY);
    this.animateToRestPerProperty('rotX', idleRotX);
    this.animateToRestPerProperty('rotY', idleRotY)
      .then(() => {
        if (this.state === State.header_idle) {
          this.ticker.stop();
        }
      });
  }
  
  
  private animateToRestPerProperty(propertyName: ShapeTransformProperty, maxValue: number): Promise<number> {
    let duration: number = baseDuration * Math.abs(this.shapeTransform[propertyName]) / maxValue;
    return TweenRunner.to(this.shapeTransform, propertyName, 0, duration, 0, Ease.quadInOut);
  }
  
  protected updatePolyProgress(value: number): void {
    this.shapeTransform.z = value * headerRestZ;
  }
  
}
