import Matrix from '../math_library/matrix';
import Vector from '../math_library/vector';
import Sphere from '../ray_geometry/sphere';
import Intersection from '../math_library/intersection';
import Ray from '../math_library/ray';
import Visitor from './visitor';
import phong from '../shading/phong';
import {Node, GroupNode, SphereNode, AABoxNode, TextureBoxNode, PyramidNode, LightNode} from '../nodes/nodes';
import AABox from '../ray_geometry/aabox';

const UNIT_SPHERE = new Sphere(new Vector(0, 0, 0, 1), 1, new Vector(0, 0, 0, 1));
const UNIT_AABOX = new AABox(new Vector(-0.5, -0.5, -0.5, 1), new Vector(0.5, 0.5, 0.5, 1), new Vector(0, 0, 0, 1));

/**
 * Class representing a Visitor that uses
 * Raytracing to render a Scenegraph
 */
export default class RayVisitor implements Visitor {
  /**
   * The image data of the context to
   * set individual pixels
   */
  imageData: ImageData;

  matrixStack : Array<Matrix> = [];
  inverseMatrixStack : Array<Matrix> = [];
  intersection: Intersection | null;
  intersectionColor1: Vector;
  intersectionColor2: Vector;
  ray: Ray;

  /**
   * Creates a new RayVisitor
   * @param context The 2D context to render to
   * @param width The width of the canvas
   * @param height The height of the canvas
   */
  constructor(private context: CanvasRenderingContext2D, width: number, height: number){
    this.imageData = context.getImageData(0, 0, width, height);
  }

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The light light positions
   */
  render(rootNode: Node, camera: { origin: Vector, width: number, height: number, alpha: number }, lightPositions: Array<Vector>) {
    // clear
    let data = this.imageData.data;
    data.fill(0);

    // raytrace
    const width = this.imageData.width;
    const height = this.imageData.height;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {

        this.ray = Ray.makeRay(x, y, camera);

        this.matrixStack.push(Matrix.identity());
        this.inverseMatrixStack.push(Matrix.identity());

        this.intersection = null;
        rootNode.accept(this);

        if (this.intersection) {
          if(this.intersectionColor2){
            if(y % 20 >= 10){
              let color = phong(this.intersectionColor1, this.intersection, lightPositions, 10, camera.origin);
              data[4 * (width * y + x) + 0] = color.r * 255;
              data[4 * (width * y + x) + 1] = color.g * 255;
              data[4 * (width * y + x) + 2] = color.b * 255;
              data[4 * (width * y + x) + 3] = 255;
            } else {
              let color = phong(this.intersectionColor2, this.intersection, lightPositions, 10, camera.origin);
              data[4 * (width * y + x) + 0] = color.r * 255;
              data[4 * (width * y + x) + 1] = color.g * 255;
              data[4 * (width * y + x) + 2] = color.b * 255;
              data[4 * (width * y + x) + 3] = 255;
            }
          }else {
            let color = phong(this.intersectionColor1, this.intersection, lightPositions, 10, camera.origin);
            data[4 * (width * y + x) + 0] = color.r * 255;
            data[4 * (width * y + x) + 1] = color.g * 255;
            data[4 * (width * y + x) + 2] = color.b * 255;
            data[4 * (width * y + x) + 3] = 255;
          }

        } else {
          data[4 * (width * y + x) + 0] = 255;
          data[4 * (width * y + x) + 1] = 255;
          data[4 * (width * y + x) + 2] = 255;
          data[4 * (width * y + x) + 3] = 255;
        }
      }
    }
    this.context.putImageData(this.imageData, 0, 0);
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    let newMatrix : Matrix = this.matrixStack[this.matrixStack.length-1].mul(node.transform.getMatrix());
    let newInverseMatrix : Matrix = node.transform.getInverseMatrix().mul(this.inverseMatrixStack[this.inverseMatrixStack.length-1]);

    this.matrixStack.push(newMatrix);
    this.inverseMatrixStack.push(newInverseMatrix);

    node.childNodes.forEach(childNode =>{
      childNode.accept(this);
    });

    this.matrixStack.pop();
    this.inverseMatrixStack.pop();
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {
    let toWorld = this.matrixStack[this.matrixStack.length-1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length-1];

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = UNIT_SPHERE.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.point);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionColor1 = node.color1;
        this.intersectionColor2 = node.color2 || undefined;
      }
    }
  }

  /**
   * Visits an axis aligned box node
   * @param node The node to visit
   */
  visitAABoxNode(node: AABoxNode) {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = UNIT_AABOX.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.point);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionColor1 = node.baseColor;
      }
    }
  }

  /**
   * Visits a textured box node
   * @param node The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) { }

  /**
   * Visits a pyramid node
   * @param node The node to visit
   */
  visitPyramidNode(node: PyramidNode) {
  }

  visitLightNode(node: LightNode) {}

}

export class RayLightVisitor {
  /**
   * The transformation matrix stack
   */
  matrixStack : Array<Matrix> = [];
  /**
   * The inverse transformation matrix stack
   */
  inverseMatrixStack : Array<Matrix> = [];
  /**
   * The vector positions of the light
   */
  lightPositions : Array<Vector> = [];

  /**
   * Creates a new RayLightVisitor
   */
  constructor() {
    this.matrixStack.push(Matrix.identity());
    this.inverseMatrixStack.push(Matrix.identity());
  }

  /**
   * Sets up all the needed light positions
   * @param rootNode The root node of the Scenegraph
   */
  setup(rootNode: Node) {
    rootNode.accept(this);
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    let newMatrix: Matrix = this.matrixStack[this.matrixStack.length - 1].mul(node.transform.getMatrix());
    let newInverseMatrix: Matrix = node.transform.getInverseMatrix().mul(this.inverseMatrixStack[this.inverseMatrixStack.length - 1]);

    this.matrixStack.push(newMatrix);
    this.inverseMatrixStack.push(newInverseMatrix);

    node.childNodes.forEach(childNode => {
      childNode.accept(this);
    });

    this.matrixStack.pop();
    this.inverseMatrixStack.pop();
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {

  }

  /**
   * Visits an axis aligned box node
   * @param  {AABoxNode} node - The node to visit
   */
  visitAABoxNode(node: AABoxNode) {

  }

  /**
   * Visits an pyramid node
   * @param  {PyramidNode} node - The node to visit
   */
  visitPyramidNode(node: PyramidNode) {

  }


  /**
   * Visits a textured box node. Loads the texture
   * and creates a uv coordinate buffer
   * @param  {TextureBoxNode} node - The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {

  }

  /**
   * Visits a Light node and applies the transformation on it,
   * so that we have it in the world coordinates
   * Adds the lightposition to the array
   * @param node The node to visit
   */
  visitLightNode(node: LightNode) {
    this.lightPositions.push(this.matrixStack[this.matrixStack.length - 1].mulVec(new Vector(1, 1, 1, 1)));
  }
}
