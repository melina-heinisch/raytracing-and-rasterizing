import Visitor from "src/visitors/visitor";
import {
    GroupNode,
    SphereNode,
    PyramidNode,
    AABoxNode,
    TextureBoxNode,
    LightNode,
    CameraNode,
    Node
} from "../nodes/nodes";
import {Rotation, Scaling, Translation} from "../math_library/transformation";
import Vector from "../math_library/vector";
import {DriverNode, JumperNode, MoveCameraNode, RotateCameraNode, RotationNode} from "../nodes/animation-nodes";

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
                animationNodesString += "<RotationNode id=\"a" + i + "\" axis=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\"></RotationNode>\n";
            } else if(node instanceof JumperNode){
                let axis = node.axis;
                let magnitude = node.magnitude;
                animationNodesString += "<JumperNode id=\"a" + i + "\" axis=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" magnitude=\"" + magnitude +"\"></JumperNode>\n";
            } else if(node instanceof DriverNode){
                animationNodesString += "<DriverNode id=\"a" + i + "\"></DriverNode>\n";
            } else if(node instanceof MoveCameraNode){
                animationNodesString += "<MoveCameraNode id=\"a" + i + "\"></MoveCameraNode>\n";
            } else if(node instanceof RotateCameraNode){
                animationNodesString += "<RotateCameraNode id=\"a" + i + "\"></RotateCameraNode>\n";
            }
        }
        rootNode.accept(this);
        this._xmlString = this._xmlString.substring(0,this._xmlString.length-13);
        this._xmlString += animationNodesString;
        this._xmlString += "</GroupNode>\n";

    }

    visitGroupNode(node: GroupNode): void {
        if(node.transform instanceof Translation){
            let pos : Vector = new Vector(node.transform.getMatrix().getVal(0,3), node.transform.getMatrix().getVal(1,3), node.transform.getMatrix().getVal(2,3),node.transform.getMatrix().getVal(3,3));
            let gn : string = "<GroupNode translation=\"" +pos.x+ "," + pos.y + "," + pos.z + "," + pos.w + "\"";
            if(this.animatedGroupNodes.get(node)){
                gn +=" id=\"" + this.animatedGroupNodes.get(node) + "\"";
            }
            gn += ">\n";
            this._xmlString += gn;
        } else if(node.transform instanceof Rotation){
            let axis = node.transform.axis;
            let angleX = node.transform.angleX;
            let angleY = node.transform.angleY;
            let angleZ = node.transform.angleZ;
            let gn="<GroupNode rotation=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" angleX=\"" + angleX + "\" " + "angleY=\"" + angleY + "\" angleZ=\"" + angleZ + "\""

            if(this.animatedGroupNodes.get(node)){
                gn +=" id=\"" + this.animatedGroupNodes.get(node) + "\"";
            }
            gn += ">\n";
            this._xmlString += gn;
        } else if(node.transform instanceof Scaling){
            let scale : Vector = new Vector(node.transform.getMatrix().getVal(0,0), node.transform.getMatrix().getVal(1,1), node.transform.getMatrix().getVal(2,2),node.transform.getMatrix().getVal(3,3));
            let gn : string = "<GroupNode scaling=\"" +scale.x+ "," + scale.y + "," + scale.z + "," + scale.w + "\""
            if(this.animatedGroupNodes.get(node)){
                gn +=" id=\"" + this.animatedGroupNodes.get(node) + "\"";
            }
            gn += ">\n";
            this._xmlString += gn;
        }

        node.childNodes.forEach(childNode => {
            childNode.accept(this);
        });

        this._xmlString += "</GroupNode>\n";
    }

    visitSphereNode(node: SphereNode): void {
        let baseColor = node.color1;
        let extraColor = node.color2;
        if(extraColor){
            let sphereNode = "<SphereNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"" + extraColor.x+ "," + extraColor.y + "," + extraColor.z + "," + extraColor.w + "\"></SphereNode>\n"
            this._xmlString += sphereNode;
        }else{
            let sphereNode = "<SphereNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"\"></SphereNode>\n"
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
            pyramidNode += "\"></PyramidNode>\n"
            this._xmlString += pyramidNode;
        }else{
            let pyramidNode = "<PyramidNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"\"></PyramidNode>\n"
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
            aaboxNode += "\"></AABoxNode>\n"
            this._xmlString += aaboxNode;
        }else{
            let aaboxNode = "<AABoxNode baseColor=\"" + baseColor.x+ "," + baseColor.y + "," + baseColor.z + "," + baseColor.w + "\" extraColors=\"\"></AABoxNode>\n"
            this._xmlString += aaboxNode;
        }
    }

    visitTextureBoxNode(node: TextureBoxNode): void {
        let textureBoxNode = "<TextureBoxNode path=\"" + node.texture + "\"></TextureBoxNode>\n"
        this._xmlString += textureBoxNode;
    }

    visitLightNode(node: LightNode): void {
       this._xmlString += "<LightNode></LightNode>\n";
    }

    visitCameraNode(node: CameraNode): void {
        this._xmlString += "<CameraNode></CameraNode>\n";
    }


    get xmlString(): string {
        return this._xmlString;
    }
}