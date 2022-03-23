export class RangeMapper {

  public range: number;

  constructor(public start: number, end: number) {
    this.range = end - start;
  }
  
  /**
   * Convert proportional value to absolute
   */
  public interpolate(proportion: number): number {
    return this.start + this.range * proportion;
  }

  /**
   * Convert absolute value to proportional
   */
  public interpolateInverse(absolute: number): number {
    return (absolute - this.start) / this.range;
  }

}
