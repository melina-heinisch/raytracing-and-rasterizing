import Matrix from "../math_library/matrix";
import Vector from "../math_library/vector";
import {
    AABoxNode,
    CameraNode,
    GroupNode,
    LightNode,
    Node,
    PyramidNode,
    SphereNode,
    TextureBoxNode
} from "../nodes/nodes";
interface Camera {
    eye: Vector,
    center: Vector,
    up: Vector,
    fovy: number,
    aspect: number,
    near: number,
    far: number
}
import Visitor from "./visitor";

export class LightAndCameraVisitor implements Visitor{
    /**
     * The transformation matrix stack
     */
    matrixStack : Array<Matrix> = [];
    /**
     * The vector positions of the light
     */
    lightPositions : Array<Vector> = [];
    /**
     * Camera for Raytracer
     */
    rayCamera :  {origin: Vector; width: number; height: number; alpha: number; };
    /**
     * Camera for Rasterizer
     */
    rasterCamera : Camera;

    /**
     * Creates a new LightAndCameraVisitor
     */
    constructor() {
        this.matrixStack.push(Matrix.identity());
    }

    /**
     * Resets all the variables to base/empty values
     */
    clear(){
        this.matrixStack = [];
        this.lightPositions = [];
        this.rayCamera = null;
        this.rasterCamera = null;
        this.matrixStack.push(Matrix.identity());
    }

    /**
     * Sets up all the needed light and camera positions
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
        this.matrixStack.push(newMatrix);

        node.childNodes.forEach(childNode => {
            childNode.accept(this);
        });

        this.matrixStack.pop();
    }

    /**
     * Visits a sphere node
     * @param node - The node to visit
     */
    visitSphereNode(node: SphereNode) {}

    /**
     * Visits an axis aligned box node
     * @param  {AABoxNode} node - The node to visit
     */
    visitAABoxNode(node: AABoxNode) {}

    /**
     * Visits an pyramid node
     * @param  {PyramidNode} node - The node to visit
     */
    visitPyramidNode(node: PyramidNode) {}


    /**
     * Visits a textured box node.
     * @param  {TextureBoxNode} node - The node to visit
     */
    visitTextureBoxNode(node: TextureBoxNode) {}

    /**
     * Visits a Light node and applies the transformation to it,
     * so that we have it in the world coordinates.
     * Then adds the light position to the array
     * @param node The node to visit
     */
    visitLightNode(node: LightNode) {
        this.lightPositions.push(this.matrixStack[this.matrixStack.length - 1].mulVec(new Vector(1, 1, 1, 1)));
    }

    /**
     * Visits a Camera node and applies the transformation to it,
     * so that we have it in the world coordinates
     * Assigns the cameras to their own variables
     * @param node The node to visit
     */
    visitCameraNode(node: CameraNode) {
        this.rayCamera = {
            origin: this.matrixStack[this.matrixStack.length - 1].mulVec( new Vector(0, 0, 1, 1)),
            width: 600,
            height: 600,
            alpha: Math.PI / 3
        }

        this.rasterCamera = {
            eye: this.matrixStack[this.matrixStack.length - 1].mulVec(new Vector(0, 0, 1, 1)),
            center: this.matrixStack[this.matrixStack.length - 1].mulVec(new Vector(0, 0, 0, 1)),
            up: this.matrixStack[this.matrixStack.length - 1].mulVec(new Vector(0, 1, 0, 0)),
            fovy: 60,
            //aspect = rasterCanvasWidth/rasterCanvasHeight
            aspect: 600 / 600,
            near: 0.1,
            far: 100
        };


    }
}
