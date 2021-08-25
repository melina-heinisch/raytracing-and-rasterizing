import RasterSphere from '../raster_geometry/raster-sphere';
import RasterBox from '../raster_geometry/raster-box';
import RasterTextureBox from '../raster_geometry/raster-texture-box';
import Vector from '../math_library/vector';
import Matrix from '../math_library/matrix';
import Visitor from './visitor';
import {
  Node,
  GroupNode,
  SphereNode,
  AABoxNode,
  TextureBoxNode,
  PyramidNode,
  LightNode,
  CameraNode
} from '../nodes/nodes';
import Shader from '../shading/shader';
import RasterPyramid from "../raster_geometry/raster-pyramid";

interface Camera {
  eye: Vector,
  center: Vector,
  up: Vector,
  fovy: number,
  aspect: number,
  near: number,
  far: number
}

interface Renderable {
  render(shader: Shader): void;
}

/**
 * Class representing a Visitor that uses Rasterisation
 * to render a Scenegraph
 */
export class RasterVisitor implements Visitor {

  matrixStack : Array<Matrix> = [];
  inverseMatrixStack : Array<Matrix> = [];
  /**
   * Creates a new RasterVisitor
   * @param gl The 3D context to render to
   * @param shader The default shader to use
   * @param textureshader The texture shader to use
   * @param renderables The objects to render
   */
  constructor(private gl: WebGL2RenderingContext, private shader: Shader, private textureshader: Shader, private renderables: WeakMap<Node, Renderable>) {
    this.matrixStack.push(Matrix.identity());
    this.inverseMatrixStack.push(Matrix.identity());
  }

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The light light positions
   */
  render(rootNode: Node, camera: Camera | null, lightPositions: Array<Vector>) {
    // clear
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if (camera) {
      this.setupCamera(camera);
    }

    let shaders = [this.shader,this.textureshader];

    //Sets the same variables for both phong and texture shader
    shaders.forEach(shader => {
      shader.use();

      for (let i = 0; i < lightPositions.length; i++){
        shader.getUniformVec3("lightSources[" + i + "]").set(lightPositions[i]);
      }
      //Set Parameters for Phong shading
      shader.getUniformFloat("kA").set(0.3);
      shader.getUniformFloat("kD").set(0.6);
      shader.getUniformFloat("kS").set(0.7);
      shader.getUniformFloat("shininess").set(16);
      shader.getUniformVec3('cameraPosition').set(camera.eye);

      shader.getUniformInt('numberOfLightSourcesV').set(lightPositions.length);
      shader.getUniformInt('numberOfLightSourcesF').set(lightPositions.length);
    });

    // traverse and render
    rootNode.accept(this);
  }

  /**
   * The view matrix to transform vertices from
   * the world coordinate system to the
   * view coordinate system
   */
  private lookat: Matrix;

  /**
   * The perspective matrix to transform vertices from
   * the view coordinate system to the
   * normalized device coordinate system
   */
  private perspective: Matrix;

  /**
   * Helper function to setup camera matrices
   * @param camera The camera used
   */
  setupCamera(camera: Camera) {
    this.lookat = Matrix.lookat(
        camera.eye,
        camera.center,
        camera.up);

    this.perspective = Matrix.perspective(
        camera.fovy,
        camera.aspect,
        camera.near,
        camera.far
    );
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
   * @param node The node to visit
   */
  visitSphereNode(node: SphereNode) {
    const shader = this.shader;
    shader.use();
    let toWorld = this.matrixStack[this.matrixStack.length-1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length-1];

    // Set the transformation Matrix of the vertex shader to be used for every vertex of the sphere
    shader.getUniformMatrix("M").set(toWorld);

    let normalMatrix : Matrix = fromWorld.transpose();
    normalMatrix.setVal(0,3,0);
    normalMatrix.setVal(1,3,0);
    normalMatrix.setVal(2,3,0);
    normalMatrix.setVal(3,3,0);
    normalMatrix.setVal(3,0,0);
    normalMatrix.setVal(3,1,0);
    normalMatrix.setVal(3,2,0);
    normalMatrix.setVal(3,3,1);
    shader.getUniformMatrix("N").set(normalMatrix);

    const V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }
    const P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }
    this.renderables.get(node).render(shader);
  }

  /**
   * Visits a pyramid node
   * @param  {PyramidNode} node - The node to visit
   */
   visitPyramidNode(node: PyramidNode) {
    const shader = this.shader;
    shader.use();
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length-1];

    // Set the transformation Matrix of the vertex shader to be used for every vertex of the sphere
    shader.getUniformMatrix("M").set(toWorld);

    let V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }
    let normalMatrix : Matrix = fromWorld.transpose();
    normalMatrix.setVal(0,3,0);
    normalMatrix.setVal(1,3,0);
    normalMatrix.setVal(2,3,0);
    normalMatrix.setVal(3,3,0);
    normalMatrix.setVal(3,0,0);
    normalMatrix.setVal(3,1,0);
    normalMatrix.setVal(3,2,0);
    normalMatrix.setVal(3,3,1);
    shader.getUniformMatrix("N").set(normalMatrix);


    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    this.renderables.get(node).render(shader);
  }

  /**
   * Visits an axis aligned box node
   * @param  {AABoxNode} node - The node to visit
   */
  visitAABoxNode(node: AABoxNode) {
    const shader = this.shader;
    shader.use();
    let toWorld = this.matrixStack[this.matrixStack.length-1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length-1];

    // Set the transformation Matrix of the vertex shader to be used for every vertex of the sphere
    shader.getUniformMatrix("M").set(toWorld);

    let V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }

    let normalMatrix : Matrix = fromWorld.transpose();
    normalMatrix.setVal(0,3,0);
    normalMatrix.setVal(1,3,0);
    normalMatrix.setVal(2,3,0);
    normalMatrix.setVal(3,3,0);
    normalMatrix.setVal(3,0,0);
    normalMatrix.setVal(3,1,0);
    normalMatrix.setVal(3,2,0);
    normalMatrix.setVal(3,3,1);
    shader.getUniformMatrix("N").set(normalMatrix);

    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    this.renderables.get(node).render(shader);
  }

  visitLightNode(node: LightNode) {
  }

  visitCameraNode(node: CameraNode) {
  }

  /**
   * Visits a textured box node
   * @param  {TextureBoxNode} node - The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {
    const shader = this.textureshader;
    shader.use();
    let toWorld = this.matrixStack[this.matrixStack.length-1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length-1];

    // Set the transformation Matrix of the vertex shader to be used for every vertex of the sphere
    shader.getUniformMatrix("M").set(toWorld);

    let normalMatrix : Matrix = fromWorld.transpose();
    normalMatrix.setVal(0,3,0);
    normalMatrix.setVal(1,3,0);
    normalMatrix.setVal(2,3,0);
    normalMatrix.setVal(3,3,0);
    normalMatrix.setVal(3,0,0);
    normalMatrix.setVal(3,1,0);
    normalMatrix.setVal(3,2,0);
    normalMatrix.setVal(3,3,1);
    shader.getUniformMatrix("N").set(normalMatrix);

    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    shader.getUniformMatrix("V").set(this.lookat);

    this.renderables.get(node).render(shader);
  }
}

/**
 * Class representing a Visitor that sets up buffers
 * for use by the RasterVisitor
 * */
export class RasterSetupVisitor {
  /**
   * The created render objects
   */
  public objects: WeakMap<Node, Renderable>

  /**
   * Creates a new RasterSetupVisitor
   * @param gl The 3D context in which to create buffers
   */
  constructor(private gl: WebGL2RenderingContext) {
    this.objects = new WeakMap();
  }

  /**
   * Sets up all needed buffers
   * @param rootNode The root node of the Scenegraph
   */
  setup(rootNode: Node) {
    // Clear to white, fully opaque
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // Clear everything
    this.gl.clearDepth(1.0);
    // Enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    rootNode.accept(this);
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    for (let child of node.childNodes) {
      child.accept(this);
    }
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {
    this.objects.set(
        node,
        new RasterSphere(this.gl, new Vector(0, 0, 0, 1), 1, node.color1, node.color2)
    );
  }

  /**
   * Visits an axis aligned box node
   * @param  {AABoxNode} node - The node to visit
   */
  visitAABoxNode(node: AABoxNode) {
    this.objects.set(
        node,
        new RasterBox(
            this.gl,
            new Vector(-0.5, -0.5, -0.5, 1),
            new Vector(0.5, 0.5, 0.5, 1), node.baseColor, node.extraColors
        )
    );
  }

  /**
   * Visits an pyramid node
   * @param  {PyramidNode} node - The node to visit
   */
  visitPyramidNode(node: PyramidNode) {
    this.objects.set(
        node,
        new RasterPyramid(this.gl, new Vector(0,0,0,1),node.baseColor, node.extraColors)
    );
  }

  /**
   * Visits a textured box node. Loads the texture
   * and creates a uv coordinate buffer
   * @param  {TextureBoxNode} node - The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {
    this.objects.set(
        node,
        new RasterTextureBox(
            this.gl,
            new Vector(-0.5, -0.5, -0.5, 1),
            new Vector(0.5, 0.5, 0.5, 1),
            node.texture, node.normal
        )
    );
  }

  /**
   * Visits a light node
   * @param node the node to visit
   */
  visitLightNode(node: LightNode){}

  /**
   * Visits a camera node
   * @param node the node to visit
   */
  visitCameraNode(node: CameraNode){}
}