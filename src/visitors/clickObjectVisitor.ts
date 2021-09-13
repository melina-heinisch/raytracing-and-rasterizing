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

interface Renderable {
    render(shader: Shader): void;
}

export class clickObjectVisitor implements Visitor{

    /**
     * The transformation matrix stack
     */
    matrixStack : Array<Matrix> = [];

    /**
     * The outgoing ray of the click
     */
    ray : Ray;

    /**
     * If there is scaling, it is applied to the radius
     */
    scaling: number;

    /**
     * Creates an click object visitor
     * @param x x coordinate of the click
     * @param y y coordinate of the click
     * @param rayCamera
     */
    constructor(public x : number, public y : number, public rayCamera :  {origin: Vector; width: number; height: number; alpha: number; toWorld: Matrix }, public renderables: WeakMap<Node, Renderable>) {
    this.ray = Ray.makeRay(this.x,this.y,this.rayCamera);
    this.scaling = 1;
    }

    /**
     * Sets up all the needed light and camera positions
     * @param rootNode The root node of the Scenegraph
     */
    setup(rootNode: Node) {
        this.matrixStack.push(Matrix.identity());
        rootNode.accept(this);
    }



    visitGroupNode(node: GroupNode): void {
        let newMatrix: Matrix = this.matrixStack[this.matrixStack.length - 1].mul(node.transform.getMatrix());
        this.matrixStack.push(newMatrix);
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

    visitObjNode(node: ObjNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterObj) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                node.selected = true;
            } else {
                if (node.selected === true) {
                    node.selected = undefined;
                } else {
                    node.selected = false;
                }
            }
        }
    }

    visitPyramidNode(node: PyramidNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterPyramid) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                node.selected = true;
            } else {
                if (node.selected === true) {
                    node.selected = undefined;
                } else {
                    node.selected = false;
                }
            }
        }
    }

    visitSphereNode(node: SphereNode): void {
        let matrix = this.matrixStack[this.matrixStack.length - 1];
        let sphere = new Sphere(matrix.mulVec(new Vector(0,0,0,1)), 1* this.scaling,new Vector(0,0,0,1));

        let intersection = sphere.intersect(this.ray);

        if(intersection != null){
            node.selected = true;
        }else{
            if(node.selected === true){
                node.selected = undefined;
            }else {
                node.selected = false;
            }
        }
    }

    visitAABoxNode(node: AABoxNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterBox) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                node.selected = true;
            } else {
                if (node.selected === true) {
                    node.selected = undefined;
                } else {
                    node.selected = false;
                }
            }
        }
    }

    visitTextureBoxNode(node: TextureBoxNode): void {
        let currentObject= this.renderables.get(node);
        if(currentObject instanceof RasterTextureBox) {
            let matrix = this.matrixStack[this.matrixStack.length - 1];
            let sphere = new Sphere(matrix.mulVec(currentObject.center), currentObject.radius * this.scaling, new Vector(0, 0, 0, 1));

            let intersection = sphere.intersect(this.ray);

            if (intersection != null) {
                node.selected = true;
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
