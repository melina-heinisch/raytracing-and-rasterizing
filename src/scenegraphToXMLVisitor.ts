import Visitor from "visitors/visitor";
import {
    GroupNode,
    SphereNode,
    PyramidNode,
    AABoxNode,
    TextureBoxNode,
    LightNode,
    CameraNode,
    Node
} from "./nodes/nodes";
import {Rotation, Scaling, Translation} from "./math_library/transformation";
import Vector from "./math_library/vector";
import {DriverNode, JumperNode, MoveCameraNode, RotateCameraNode, RotationNode} from "./nodes/animation-nodes";

export class ScenegraphToXMLVisitor implements Visitor {

    private _xmlString = "";

    animatedGroupNodes :Map<GroupNode, String>;

    setup(rootNode: Node, animationNodes : (DriverNode | JumperNode | RotationNode | MoveCameraNode | RotateCameraNode)[] ) {
        this.animatedGroupNodes = new Map<GroupNode, String>();
        let animationNodesString ="";
        for (let i = 0; i < animationNodes.length; i++) {
            let node = animationNodes[i];
            this.animatedGroupNodes.set(node.groupNode, "a"+i);
            if(node instanceof RotationNode){
                let axis = node.axis;
                animationNodesString += "<RotationNode id=\"a" + i + "\" axis=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\"></RotationNode>";
            } else if(node instanceof JumperNode){
                let axis = node.axis;
                let magnitude = node.magnitude;
                animationNodesString += "<JumperNode id=\"a" + i + "\" axis=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" magnitude=\"" + magnitude +"\"></JumperNode>";
            } else if(node instanceof DriverNode){
                animationNodesString += "<DriverNode id=\"a" + i + "\"></DriverNode>";
            } else if(node instanceof MoveCameraNode){
                animationNodesString += "<MoveCameraNode id=\"a" + i + "\"></MoveCameraNode>";
            } else if(node instanceof RotateCameraNode){
                animationNodesString += "<RotateCameraNode id=\"a" + i + "\"></RotateCameraNode>";
            }
        }
        rootNode.accept(this);
        this._xmlString = this._xmlString.substring(0,this._xmlString.length-12);
        this._xmlString += animationNodesString;
        this._xmlString += "</GroupNode>";

    }

    visitGroupNode(node: GroupNode): void {
        if(node.transform instanceof Translation){
            let pos : Vector = node.transform.getMatrix().mulVec(new Vector(0,0,0,1));
            let gn : string = "<GroupNode translation=\"" +pos.x+ "," + pos.y + "," + pos.z + "," + pos.w + "\">"
            this._xmlString += gn;
        } else if(node.transform instanceof Rotation){
            //@ts-ignore
            let axis = node.transform._axis;
            if(axis.x === 1){
                let gn : string ="<GroupNode rotation=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" angle=\"" + node.transform.angleX + "\">"
                this._xmlString += gn;
            }else if(axis.y === 1){
                let gn : string ="<GroupNode rotation=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" angle=\"" + node.transform.angleY + "\">"
                this._xmlString += gn;
            }else if(axis.z === 1){
                let gn : string ="<GroupNode rotation=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" angle=\"" + node.transform.angleZ + "\">"
                this._xmlString += gn;
            }
        } else if(node.transform instanceof Scaling){
            let scale : Vector = node.transform.getMatrix().mulVec(new Vector(0,0,0,1));
            let gn : string = "<GroupNode scaling=\"" +scale.x+ "," + scale.y + "," + scale.z + "," + scale.w + "\">"
            this._xmlString += gn;
        }

        node.childNodes.forEach(childNode => {
            childNode.accept(this);
        });

        this._xmlString += "</GroupNode>";
    }

    visitSphereNode(node: SphereNode): void {
        let baseColor = node.color1;
        let extraColor = node.color2;
        if(extraColor){
            let sphereNode = "<SphereNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"" + extraColor.x+ "," + extraColor.y + "," + extraColor.z + "," + extraColor.w + "\"></SphereNode>"
            this._xmlString += sphereNode;
        }else{
            let sphereNode = "<SphereNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"\"></SphereNode>"
            this._xmlString += sphereNode;
        }
    }

    visitPyramidNode(node: PyramidNode): void {
        let baseColor = node.baseColor;
        let extraColors = node.extraColors;
        if(extraColors){
            let pyramidNode = "<PyramidNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"";
            extraColors.forEach(color =>{
                let colorString = color.x + "," + color.y + "," + color.z + "," + color.w + ";";
                pyramidNode += colorString;
            })
            pyramidNode += "\"></PyramidNode>"
            this._xmlString += pyramidNode;
        }else{
            let pyramidNode = "<PyramidNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"\"></PyramidNode>"
            this._xmlString += pyramidNode;
        }
    }

    visitAABoxNode(node: AABoxNode): void {
        let baseColor = node.baseColor;
        let extraColors = node.extraColors;
        if(extraColors){
            let aaboxNode = "<AABoxNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"";
            extraColors.forEach(color =>{
                let colorString = color.x + "," + color.y + "," + color.z + "," + color.w + ";";
                aaboxNode += colorString;
            })
            aaboxNode += "\"></AABoxNode>"
            this._xmlString += aaboxNode;
        }else{
            let aaboxNode = "<AABoxNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"\"></AABoxNode>"
            this._xmlString += aaboxNode;
        }
    }

    visitTextureBoxNode(node: TextureBoxNode): void {
        let texturePath = node.texture;
        let textureBoxNode = "<TextureBoxNode path=\"" + texturePath + "\"></TextureBoxNode>"
        this._xmlString += textureBoxNode;
    }

    visitLightNode(node: LightNode): void {
       this._xmlString += "<LightNode></LightNode>";
    }

    visitCameraNode(node: CameraNode): void {
        this._xmlString += "<CameraNode></CameraNode>";
    }


    get xmlString(): string {
        return this._xmlString;
    }
}