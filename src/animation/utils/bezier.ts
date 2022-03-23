import { RangeMapper } from './range-mapper';

export interface BezierConfig {
  controlPoint1x: number;
  controlPoint1y: number;
  controlPoint2x: number;
  controlPoint2y: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number
}

const interpolate = function(proportion: number, start: number, end: number): number {
  return start + proportion * (end - start);
};

export class Bezier implements BezierConfig {
  
  private line1X: RangeMapper;
  private line1Y: RangeMapper;
  private line2X: RangeMapper;
  private line2Y: RangeMapper;
  private line3X: RangeMapper;
  private line3Y: RangeMapper;
  
  /**
   * You can omit the last four arguments if defining a bezier from (0, 0) to (1, 1)
   */
  constructor(public controlPoint1x: number, public controlPoint1y: number, public controlPoint2x: number, public controlPoint2y: number, public startX: number = 0, public startY: number = 0, public endX: number = 1, public endY: number = 1) {
    this.initRanges();
  }
  
  public updateControlPoints(controlPoint1x: number, controlPoint1y: number, controlPoint2x: number, controlPoint2y: number) {
    this.controlPoint1x = controlPoint1x;
    this.controlPoint1y = controlPoint1y;
    this.controlPoint2x = controlPoint2x;
    this.controlPoint2y = controlPoint2y;
    this.initRanges();
  }
  
  private initRanges() {
    this.line1X = new RangeMapper(this.startX, this.controlPoint1x);
    this.line1Y = new RangeMapper(this.startY, this.controlPoint1y);
    this.line2X = new RangeMapper(this.controlPoint1x, this.controlPoint2x);
    this.line2Y = new RangeMapper(this.controlPoint1y, this.controlPoint2y);
    this.line3X = new RangeMapper(this.controlPoint2x, this.endX);
    this.line3Y = new RangeMapper(this.controlPoint2y, this.endY);
  }
  
  public getX(t: number): number {
    let v1 = this.line1X.interpolate(t);
    let v2 = this.line2X.interpolate(t);
    let v3 = this.line3X.interpolate(t);
    let v1to2 = interpolate(t, v1, v2);
    let v2to3 = interpolate(t, v2, v3);
    return interpolate(t, v1to2, v2to3);
  }
  
  public getY(t: number): number {
    let v1 = this.line1Y.interpolate(t);
    let v2 = this.line2Y.interpolate(t);
    let v3 = this.line3Y.interpolate(t);
    let v1to2 = interpolate(t, v1, v2);
    let v2to3 = interpolate(t, v2, v3);
    return interpolate(t, v1to2, v2to3);
  }

  public getGenerator(): (t: number) => [number, number] {
    return (t: number) => [this.getX(t), this.getY(t)];
  }
  
  /**
   * Creates a bezier of the same dimensions, mirrored along the x/t axis
   */
  public get mirroredBezier(): Bezier {
    return new Bezier(this.endX - this.controlPoint2x, this.controlPoint2y, this.endX - this.controlPoint1x, this.controlPoint1y, this.startX, this.endY, this.endX, this.startY);
  }
  
  /**
   * The param tuple should follow the same index order as the Bezier constructor's arguments, with the last four all optional (assuming control points in the 0 - 1 range)
   */
  public static fromArray(parameters: [number, number, number, number, number?, number?, number?, number?]): Bezier {
    return new Bezier(...parameters);
  }
  
  public static fromConfig(config: BezierConfig): Bezier {
    return new Bezier(config.controlPoint1x, config.controlPoint1y, config.controlPoint2x, config.controlPoint2y, config.startX, config.startY, config.endX, config.endY);
  }
  
}
