import { Shapes, Shape, Point, P, Surface } from 'seen';

const half: number = 50;
const quarter: number = 25;
const whole: number = 100;
const mid: number = 0;

const topCenter: number[] = [mid, whole*1.18, mid];
const topRight: number[] = [half, half, half];
const topBackRight: number[] = [half, half, -half];
const topLeft: number[] = [-half, half, half];
const topBackLeft: number[] = [-half, half, -half];
const midCenter: number[] = [mid, mid, quarter*0.5];
const bottomRight: number[] = [half, -half, half];
const bottomLeft: number[] = [-half, -half, half];
const bottomBackRight: number[] = [half, -half, -half];
const bottomBackLeft: number[] = [-half, -half, -half];
const bottomCenter: number[] = [mid, -whole*1.18, mid];

const colorTop: string = '#FAD6BB';
const colorTopShadow: string = '#D09A80';
const colorTopLit: string = '#FDE0CB';
const colorMidTop: string = '#F8BC9F';
const colorLeft: string = '#E33E59';
const colorLeftShadow: string = '#C12D45';
const colorRight: string = '#75BDA8';
const colorRightLit: string = '#7CCAB2';
const colorMidBottom: string = '#916063';
const colorBottom: string = '#744851';
const colorBottomShadow: string = '#613A42';
const colorBottomLit: string = '#84545E';

interface RawFace {
  fill: string;
  points: number[][];
}

const faceTop: RawFace = { fill: colorTop, points: [topCenter, topRight, topLeft] };
const faceMidTop: RawFace = { fill: colorMidTop, points: [topLeft, topRight, midCenter] };
const faceLeft: RawFace = { fill: colorLeft, points: [topLeft, midCenter, bottomLeft] };
const faceRight: RawFace = { fill: colorRight, points: [topRight, bottomRight, midCenter] };
const faceMidBottom: RawFace = { fill: colorMidBottom, points: [midCenter, bottomRight, bottomLeft] };
const faceBottom: RawFace = { fill: colorBottom, points: [bottomLeft, bottomRight, bottomCenter] };
const faceUnderBottom: RawFace = { fill: colorBottom, points: [bottomBackLeft, bottomBackRight, bottomCenter] };

const faceTopLeft: RawFace = { fill: colorTopShadow, points: [topCenter, topLeft, topBackLeft] };
const faceTopRight: RawFace = { fill: colorTopLit, points: [topCenter, topBackRight, topRight] };
const faceBackLeft: RawFace = { fill: colorLeftShadow, points: [topLeft, bottomLeft, bottomBackLeft, topBackLeft] };
const faceBackRight: RawFace = { fill: colorRightLit, points: [topRight, topBackRight, bottomBackRight, bottomRight] };
const faceBottomLeft: RawFace = { fill: colorBottomShadow, points: [bottomLeft, bottomCenter, bottomBackLeft] };
const faceBottomRight: RawFace = { fill: colorBottomLit, points: [bottomRight, bottomBackRight, bottomCenter] };

export class PolyhedronModel {
  
  private readonly rawPoints: number[][] = [topCenter, topRight, topBackRight, topLeft, topBackLeft, midCenter, bottomRight, bottomLeft, bottomBackRight, bottomBackLeft, bottomCenter];
  private readonly rawFaces: RawFace[] = [faceTop, faceMidTop, faceLeft, faceRight, faceMidBottom, faceBottom, faceUnderBottom, faceTopLeft, faceTopRight, faceBackLeft, faceBackRight, faceBottomLeft, faceBottomRight];
  public points: Point[];
  public faces: number[][];
  public surfaces: Surface[];
  
  public buildShape(): Shape {
    this.points = [];
    this.rawPoints.forEach(rp => this.points.push(P(rp[0], rp[1], rp[2])));
    
    this.faces = [];
    this.rawFaces.forEach(rf => {
      let indices: number[] = [];
      rf.points.forEach(rp => {
        indices.push(this.rawPoints.indexOf(rp));
      });
      this.faces.push(indices);
    });
    
    this.surfaces = Shapes.mapPointsToSurfaces(this.points, this.faces);
    for (let i = 0, l = this.surfaces.length; i < l; i++) {
      this.surfaces[i].fill(this.rawFaces[i].fill);
    }
    
    return new Shape('admvx', this.surfaces);
  }
  
}
