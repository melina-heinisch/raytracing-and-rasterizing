import Visitor from "src/visitors/visitor";
import {
    GroupNode,
    SphereNode,
    PyramidNode,
    AABoxNode,
    TextureBoxNode,
    LightNode,
    CameraNode,
    Node, ObjNode
} from "../nodes/nodes";
import {FreeFlight, Rotation, Scaling, Translation} from "../math_library/transformation";
import Vector from "../math_library/vector";
import {
    DriverNode,
    FreeFlightNode,
    JumperNode,
    MoveCameraNode,
    RotateCameraNode,
    RotationNode
} from "../nodes/animation-nodes";

/**
 * Converts the Scenegraph into a String that will later be saved to a file
 */
export class ScenegraphToXmlVisitor implements Visitor {

    /**
     * The String that contains all xml nodes
     */
    private _xmlString = "";

    /**
     * Group Nodes that have animation nodes attached, with the corresponding id as value
     */
    animatedGroupNodes :Map<GroupNode, String>;

    /**
     * This method reads all animation nodes, saves the group node with the id to a map
     * and creates the xml tag with the same id for each animation node.
     * The string for the animation nodes is attached after all other nodes have been added to the sting
     * @param rootNode The root node of the scenegraph
     * @param animationNodes The animation nodes used with the scenegraoh
     */
    setup(rootNode: Node, animationNodes : (DriverNode | JumperNode | RotationNode | FreeFlightNode)[] ) {
        this.animatedGroupNodes = new Map<GroupNode, String>();
        let animationNodesString ="";
        for (let i = 0; i < animationNodes.length; i++) {
            let node = animationNodes[i];
            this.animatedGroupNodes.set(node.groupNode, "a"+i);
            if(node instanceof RotationNode){
                let axis = node.axis;
                animationNodesString += "<RotationNode active=\"" +node.active +"\" id=\"a" + i + "\" axis=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\"></RotationNode>\n";
            } else if(node instanceof JumperNode){
                let axis = node.axis;
                let magnitude = node.magnitude;
                animationNodesString += "<JumperNode active=\"" +node.active +"\" id=\"a" + i + "\" axis=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" magnitude=\"" + magnitude +"\"></JumperNode>\n";
            } else if(node instanceof DriverNode){
                animationNodesString += "<DriverNode active=\"" +node.active +"\" id=\"a" + i + "\"></DriverNode>\n";
            } else if(node instanceof FreeFlightNode){
                animationNodesString += "<FreeFlightNode id=\"a" + i + "\"></FreeFlightNode>\n";
            }
        }
        rootNode.accept(this);
        this._xmlString = this._xmlString.substring(0,this._xmlString.length-13);
        this._xmlString += animationNodesString;
        this._xmlString += "</GroupNode>\n";
    }

    /**
     * Visits a groupnode and creates either a translation, rotation or scale xml tag
     * Each tag is added to the xmlString
     * @param node The node to parse
     */
    visitGroupNode(node: GroupNode): void {
        let transformation = node.transform;
        if(transformation instanceof Translation){
            let pos : Vector = new Vector(transformation.getMatrix().getVal(0,3), transformation.getMatrix().getVal(1,3), transformation.getMatrix().getVal(2,3),transformation.getMatrix().getVal(3,3));
            let gn : string = "<GroupNode translation=\"" +pos.x+ "," + pos.y + "," + pos.z + "," + pos.w + "\"";

            if(this.animatedGroupNodes.get(node)){
                gn +=" id=\"" + this.animatedGroupNodes.get(node) + "\"";
            }
            gn += ">\n";
            this._xmlString += gn;
        } else if(transformation instanceof Rotation){
            let axis = transformation.axis;
            let angleX = transformation.angleX;
            let angleY = transformation.angleY;
            let angleZ = transformation.angleZ;
            let gn="<GroupNode rotation=\"" +axis.x+ "," + axis.y + "," + axis.z + "," + axis.w + "\" angleX=\"" + angleX + "\" " + "angleY=\"" + angleY + "\" angleZ=\"" + angleZ + "\""

            if(this.animatedGroupNodes.get(node)){
                gn +=" id=\"" + this.animatedGroupNodes.get(node) + "\"";
            }
            gn += ">\n";
            this._xmlString += gn;
        } else if(transformation instanceof Scaling){
            let scale : Vector = new Vector(transformation.getMatrix().getVal(0,0), transformation.getMatrix().getVal(1,1), transformation.getMatrix().getVal(2,2),transformation.getMatrix().getVal(3,3));
            let gn : string = "<GroupNode scaling=\"" +scale.x+ "," + scale.y + "," + scale.z + "," + scale.w + "\""
            if(this.animatedGroupNodes.get(node)){
                gn +=" id=\"" + this.animatedGroupNodes.get(node) + "\"";
            }
            gn += ">\n";
            this._xmlString += gn;
        }else if(transformation instanceof FreeFlight){
            let matrix = transformation.freeFlightMatrix.toString();
            let inverseMatrix = transformation.inverseFreeFlightMatrix.toString();
            let gn="<GroupNode matrix=\"" + matrix + "\" inverse=\"" + inverseMatrix + "\" "

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

    /**
     * Creates am xml sphere node tag and adds it to the string
     * If extra colors are given, they are assigned
     * @param node The node to parse
     */
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

    /**
     * Creates am xml pyramid node tag and adds it to the string
     * *If extra colors are given, they are assigned
     * @param node The node to parse
     */
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

    /**
     * Creates am xml aabox node tag and adds it to the string
     * If extra colors are given, they are assigned
     * @param node The node to parse
     */
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

    /**
     * Creates am xml texture node tag and adds it to the string
     * @param node The node to parse
     */
    visitTextureBoxNode(node: TextureBoxNode): void {
        let textureBoxNode = "<TextureBoxNode texPath=\"" + node.texture + "\" normalPath=\""+ node.normal + "\"></TextureBoxNode>\n"
        this._xmlString += textureBoxNode;
    }

    /**
     * Creates am xml light node tag and adds it to the string
     * @param node The node to parse
     */
    visitLightNode(node: LightNode): void {
       this._xmlString += "<LightNode></LightNode>\n";
    }

    /**
     * Creates am xml camera node tag and adds it to the string
     * @param node The node to parse
     */
    visitCameraNode(node: CameraNode): void {
        let cameraNode = "<CameraNode id=\"cam\" shininess=\"" + node.shininess + "\" specular=\""+ node.specular + "\" diffuse=\"" + node.diffuse + "\" ambient=\"" + node.ambient + "\"></CameraNode>\n"
        this._xmlString += cameraNode;
    }

    visitObjNode(node: ObjNode): void {
        let objNode = "<ObjNode src=\""+ node.objLines + "\"></ObjNode>\n";
        this._xmlString += objNode;
    }

    /**
     * Returns the whole scenegraph as xml string
     */
    get xmlString(): string {
        return this._xmlString;
    }
}