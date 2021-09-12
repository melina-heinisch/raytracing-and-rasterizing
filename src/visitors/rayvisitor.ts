import Matrix from '../math_library/matrix';
import Vector from '../math_library/vector';
import Sphere from '../ray_geometry/sphere';
import Intersection from '../math_library/intersection';
import Ray from '../math_library/ray';
import Visitor from './visitor';
import phong from '../shading/phong';
import {
  Node,
  GroupNode,
  SphereNode,
  AABoxNode,
  TextureBoxNode,
  PyramidNode,
  LightNode,
  CameraNode, ObjNode
} from '../nodes/nodes';

const UNIT_SPHERE = new Sphere(new Vector(0, 0, 0, 1), 1, new Vector(0, 0, 0, 1));

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
  intersectionColor: Vector;
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
   * @param lightPositions The light positions
   */
  render(rootNode: Node, camera: {origin: Vector, width: number, height: number, alpha: number, toWorld: Matrix }, lightPositions: Array<Vector>, shininess: number, specular: number, ambient: number, diffuse: number) {
    // clear
    let data = this.imageData.data;
    data.fill(0);

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
          let color = phong(this.intersectionColor, this.intersection, lightPositions, shininess, ambient, diffuse, specular, camera.origin);
          data[4 * (width * y + x)] = color.r * 255;
          data[4 * (width * y + x) + 1] = color.g * 255;
          data[4 * (width * y + x) + 2] = color.b * 255;
          data[4 * (width * y + x) + 3] = 255;

        } else {
          data[4 * (width * y + x)] = 255;
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
        this.intersectionColor = node.color;
      }
    }
  }


  /**
   * Visits an axis aligned box node
   * @param node The node to visit
   */
  visitAABoxNode(node: AABoxNode) {}

  /**
   * Visits a textured box node
   * @param node The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) { }

  /**
   * Visits a pyramid node
   * @param node The node to visit
   */
  visitPyramidNode(node: PyramidNode) {}

  /**
   * Visits a light node
   * @param node The node to visit
   */
  visitLightNode(node: LightNode) {}

  /**
   * Visits a camera node
   * @param node The node to visit
   */
  visitCameraNode(node: CameraNode) {}
  visitObjNode(node: ObjNode) {}
}
