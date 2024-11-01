import Visitor from '../visitors/visitor';
import Vector from '../math_library/vector';
import { Transformation } from '../math_library/transformation';

/**
 * Class representing a Node in a Scenegraph
 */
export class Node {
  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor - The visitor
   */
  accept(visitor: Visitor) { }
}

/**
 * Class representing a GroupNode in the Scenegraph.
 * A GroupNode holds a transformation and is able
 * to have child nodes attached to it.
 * @extends Node
 */
export class GroupNode extends Node {

   childNodes : Array<Node> = [];
   public transformation : Transformation;

  /**
   * Constructor
   * @param transform A matrix describing the node's transformation
   */
  constructor(public transform: Transformation) {
    super();
    this.transformation = transform;
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitGroupNode(this);
  }

  /**
   * Adds a child node
   * @param childNode The child node to add
   */
  add(childNode: Node) {
    this.childNodes.push(childNode);
  }
}

/**
 * Class representing a Sphere in the Scenegraph
 * @extends Node
 */
export class SphereNode extends Node {

  /**
   * Creates a new Sphere.
   * The sphere is defined around the origin 
   * with radius 1.
   * @param color The colour of the Sphere
   * @param selected If the sphere is selected
   */
  constructor(public color: Vector, public selected: boolean = false) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitSphereNode(this);
  }
}

/**
 * Class representing a Pyramid in the Scenegraph
 * @extends Node
 */
export class PyramidNode extends Node {

  /**
   * @param baseColor Base color of the pyramid
   * @param extraColors Extra colors, if wanted
   * @param selected If the pyramid is selected
   */
  constructor(public baseColor : Vector, public extraColors : Array<Vector>, public selected: boolean = false) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitPyramidNode(this);
  }
}

/**
 * Class representing an Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class AABoxNode extends Node {

  /**
   * Creates an axis aligned box.
   * The box's center is located at the origin
   * with all edges of length 1
   * @param baseColor The color of the cube
   * @param extraColors If wanted, additional colors
   * @param selected If the box is selected
   */
  constructor(public baseColor : Vector, public extraColors: Array<Vector>, public selected: boolean = false) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param  {Visitor} visitor - The visitor
   */
  accept(visitor: Visitor) {
   visitor.visitAABoxNode(this);
  }
}

/**
 * Class representing a Textured Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class TextureBoxNode extends Node {
  /**
   * Creates an axis aligned box textured box
   * The box's center is located at the origin
   * with all edges of length 1
   * @param texture The image filename for the texture
   * @param normal The image filename for the normal map
   * @param selected If the box is selected
   * @param updated If the box has been marked as selected yet
   */
  constructor(public texture: string, public normal: string, public selected: boolean = false, public updated: boolean = false) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitTextureBoxNode(this);
  }
}

/**
 * Class representing a light source in the scenegraph
 * @extends Node
 */
export class LightNode extends Node {
  /**
   * Creates an light source
   */
  constructor() {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitLightNode(this);
  }
}

/**
 * Class representing the camera in the Scenegraph
 * @extends Node
 */
export class CameraNode extends Node {
  /**
   * Creates a camera
   */
  constructor(public shininess: number, public specular: number, public diffuse: number, public ambient: number) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitCameraNode(this);
  }
}

export class ObjNode extends Node{
  /**
   * Creates an obj
   * @param objLines The .obj file with each line as one array entry
   * @param selected If the sphere is selected
   */
  constructor(public objLines: string[], public selected: boolean = false) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitObjNode(this);
  }
}
