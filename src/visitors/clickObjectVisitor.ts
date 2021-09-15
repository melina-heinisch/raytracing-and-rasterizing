import Visitor from "./visitor";
import {
    AABoxNode,
    CameraNode,
    GroupNode,
    LightNode, Node,
    ObjNode,
    PyramidNode,
    SphereNode,
    TextureBoxNode
} from "../nodes/nodes";
import Ray from "../math_library/ray";
import Vector from "../math_library/vector";
import Matrix from "../math_library/matrix";
import Sphere from "../ray_geometry/sphere";
import {Scaling} from "../math_library/transformation";
import RasterPyramid from "../raster_geometry/raster-pyramid";
import {RasterObj} from "../raster_geometry/raster-obj";
import RasterBox from "../raster_geometry/raster-box";
import RasterTextureBox from "../raster_geometry/raster-texture-box";
import Shader from "../shading/shader";
import Intersection from "../math_library/intersection";

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
 * Checks if the mouseclick intersects with any of the scenes objects
 */
export class clickObjectVisitor implements Visitor{

    /**
     * The transformation matrix stack
     */
    matrixStack : Array<Matrix> = [];

    /**
     * The transformation matrix stack
     */
    inverseMatrixStack : Array<Matrix> = [];



    /**
     * The outgoing ray of the click
     */
    ray : Ray;

    /**
     * If there is scaling, it is applied to the radius
     */
    scaling: number;

    /**
     * The View Matrix
     */
    lookat: Matrix;

    /**
     * Perspective Matrix
     */

    perspective : Matrix;

    /**
     * The all nodes that are hit by the ray
     */
    hitNodes : Map<(AABoxNode | ObjNode | PyramidNode | TextureBoxNode | SphereNode),Intersection>;

    /**
     *
     */

    /**
     * Creates an click object visitor
     * @param x x coordinate of the click
     * @param y y coordinate of the click
     * @param rayCamera
     */
    constructor(public x : number, public y : number, rasterCamera : Camera, public rayCamera :  {origin: Vector; width: number; height: number; alpha: number; toWorld: Matrix }, public renderables: WeakMap<Node, Renderable>) {
    this.ray = Ray.makeRay(this.x,this.y,this.rayCamera);
    this.scaling = 1;
    this.lookat = Matrix.lookat(rasterCamera.eye, rasterCamera.center,rasterCamera.up);
    this.perspective = Matrix.perspective(
            rasterCamera.fovy,
            rasterCamera.aspect,
            rasterCamera.near,
            rasterCamera.far
        );

    this.hitNodes = new Map<AABoxNode | ObjNode | PyramidNode | TextureBoxNode | SphereNode, Intersection>();
    }

    /**
     * Prepares the variables, traverses the scenegraph and checks which hit is the closest
     * @param rootNode The root node of the Scenegraph
     */
    setup(rootNode: Node) {
        this.inverseMatrixStack.push(Matrix.identity());
        this.matrixStack.push(Matrix.identity());
        rootNode.accept(this);

        let closestHit : Intersection= null;
        let closestNode : (AABoxNode | ObjNode | PyramidNode | TextureBoxNode | SphereNode) = null;

        this.hitNodes.forEach((value, key) => {
            if(!closestHit && !closestNode){
                closestHit = value;
                closestNode = key;
            }else {
                if (value.closerThan(closestHit)) {
                    closestHit = value;
                    closestNode = key;
                }
            }
        });
        closestNode.selected = true;

        this.hitNodes.delete(closestNode);

        this.hitNodes.forEach((value,key) => {
            if (key.selected === true) {
                key.selected = undefined;
            } else {
                key.selected = false;
            }
        });
        this.hitNodes = new Map<AABoxNode | ObjNode | PyramidNode | TextureBoxNode | SphereNode, Intersection>();

    }

    /**
     * Visits a group node
     * @param node The node to visit
     */
    visitGroupNode(node: GroupNode): void {
        this.matrixStack.push(this.matrixStack[this.matrixStack.length - 1].mul(node.transform.getMatrix()));
        this.inverseMatrixStack.push(node.transform.getInverseMatrix().mul(this.inverseMatrixStack[this.inverseMatrixStack.length-1]));
        let transformation = node.transform
        if(transformation instanceof Scaling){
            this.scaling = transformation.scale.x;
        }

        node.childNodes.forEach(childNode => {
            childNode.accept(this);
        });

        this.matrixStack.pop();
        this.scaling = 1;
    }

    /**
     * Visits an ObjNode and first intersects with a bounding sphere. If it hits the sphere, it is being tested with the triangles of the object.
     * If it is not hit, the selected variable is being set accordingly.
     * @param node The node to visit
     */
    visitObjNode(node: ObjNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterObj) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                let result = currentObject.prepareHitTest(this.ray,matrix);
                if(result){
                    this.hitNodes.set(node,result);
                } else {
                    if (node.selected === true) {
                        node.selected = undefined;
                    } else {
                        node.selected = false;
                    }
                }
            } else {
                if (node.selected === true) {
                    node.selected = undefined;
                } else {
                    node.selected = false;
                }
            }
        }
    }

    /**
     * Visits a PyramidNode and first intersects with a bounding sphere. If it hits the sphere, it is being tested with the triangles of the object.
     * If it is not hit, the selected variable is being set accordingly.
     * @param node The node to visit
     */
    visitPyramidNode(node: PyramidNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterPyramid) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                let result = currentObject.prepareHitTest(this.ray,matrix);
                if(result){
                    this.hitNodes.set(node,result);
                } else {
                    if (node.selected === true) {
                        node.selected = undefined;
                    } else {
                        node.selected = false;
                    }
                }
            } else {
                if (node.selected === true) {
                    node.selected = undefined;
                } else {
                    node.selected = false;
                }
            }
        }
    }

    /**
     * Visits a sphere node and intersects it
     * @param node
     */
    visitSphereNode(node: SphereNode): void {
        let matrix = this.matrixStack[this.matrixStack.length - 1];
        let sphere = new Sphere(matrix.mulVec(new Vector(0,0,0,1)), 1* this.scaling,new Vector(0,0,0,1));

        let intersection : Intersection = sphere.intersect(this.ray);

        if(intersection != null){
            this.hitNodes.set(node,intersection);
        }else{
            if(node.selected === true){
                node.selected = undefined;
            }else {
                node.selected = false;
            }
        }
    }
    /**
     * Visits an AABoxNode and first intersects with a bounding sphere. If it hits the sphere, it is being tested with the triangles of the object.
     * If it is not hit, the selected variable is being set accordingly.
     * @param node The node to visit
     */

    visitAABoxNode(node: AABoxNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterBox) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                let result = currentObject.prepareHitTest(this.ray,matrix);
                if(result){
                    this.hitNodes.set(node,result);
                } else {
                    if (node.selected === true) {
                        node.selected = undefined;
                    } else {
                        node.selected = false;
                    }
                }
            } else {
                if (node.selected === true) {
                    node.selected = undefined;
                } else {
                    node.selected = false;
                }
            }
        }
    }

    /**
     * Visits a TextureBoxNode and first intersects with a bounding sphere. If it hits the sphere, it is being tested with the triangles of the object.
     * If it is not hit, the selected variable is being set accordingly.
     * @param node The node to visit
     */
    visitTextureBoxNode(node: TextureBoxNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterTextureBox) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                let result = currentObject.prepareHitTest(this.ray,matrix);
                if(result){
                    this.hitNodes.set(node,result);
                } else {
                    if (node.selected === true) {
                        node.selected = undefined;
                    } else {
                        node.selected = false;
                    }
                }
            } else {
                if (node.selected === true) {
                    node.selected = undefined;
                } else {
                    node.selected = false;
                }
            }
        }
    }


    visitLightNode(node: LightNode): void {
    }

    visitCameraNode(node: CameraNode): void {
    }
}
