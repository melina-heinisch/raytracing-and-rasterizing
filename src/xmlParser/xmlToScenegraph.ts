import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from '../math_library/vector';
import {
    AABoxNode, CameraNode,
    GroupNode, LightNode, ObjNode, PyramidNode,
    SphereNode,
    TextureBoxNode
} from '../nodes/nodes';

import {FreeFlight, Rotation, Scaling, Translation} from '../math_library/transformation';
import {
    DriverNode,
    FreeFlightNode,
    JumperNode,
    RotationNode
} from '../nodes/animation-nodes';
import Matrix from "../math_library/matrix";

/**
 * Converts an xml file (stored in a NodeList of ChildNodes) into a scenegraph to use for the render engines
 */
export class XmlToScenegraph {

    /**
     * The first node (Head) of the scenegraph
     */
    private _head : GroupNode;
    /**
     * The currently used group node that all child nodes are being added to
     */
    currentGroupNode : GroupNode;
    /**
     * The last group nodes that have been used, stored so they can be retrieved
     * once all children of the current group node have been visited
     */
    oldGroupNodes : Array<GroupNode>;
    /**
     * The animation Nodes to be used with the scenegraph
     */
    animationNodes: (DriverNode | JumperNode | RotationNode | FreeFlightNode)[];
    /**
     * Stores the group nodes that have animation nodes attatched to them,
     * with an unique id as key/identifiyer. The corresponding animation node
     * has the same id in order to match them to the group node.
     */
    animatedGroupNodes: Map<String,GroupNode>;

    /**
     * Creates a xml to scenegraph parser and sets the default values
     */
    constructor() {
        this._head = null;
        this.currentGroupNode = null;
        this.oldGroupNodes= [];
        this.animationNodes = [];
        this.animatedGroupNodes = new Map<String, GroupNode>();
    }

    /**
     * Checks which type of XML node is currently being read and calls the
     * corresponding method to create the node
     * @param children The child nodes to visit
     */
    createAndVisitChildren(children : NodeListOf<ChildNode>) {
        for (let i = 0; i < children.length; i++) {
            if (children[i].nodeName === "#text") {
                continue;
            }

            if (children[i].nodeName === "GroupNode") {
                this.createGroupNode(children[i]);
            } else if (children[i].nodeName === "SphereNode") {
                this.createSphereNode(children[i]);
            } else if (children[i].nodeName === "PyramidNode") {
                this.createPyramidNode(children[i]);
            } else if (children[i].nodeName === "AABoxNode") {
                this.createAABoxNode(children[i]);
            } else if (children[i].nodeName === "TextureBoxNode") {
                this.createTextureBoxNode(children[i]);
            } else if (children[i].nodeName === "LightNode") {
                this.currentGroupNode.add(new LightNode());
            } else if (children[i].nodeName === "CameraNode") {
                this.createCameraNode(children[i]);
            } else if (children[i].nodeName === "JumperNode") {
                this.createJumperNode(children[i]);
            } else if (children[i].nodeName === "RotationNode") {
                this.createRotationNode(children[i]);
            } else if (children[i].nodeName === "DriverNode") {
                this.createDriverNode(children[i]);
            } else if (children[i].nodeName === "FreeFlightNode") {
                this.createFreeFlightNode(children[i]);
            } else if (children[i].nodeName === "ObjNode") {
                this.createObjNode(children[i]);
            }
        }
    }

    /**
     * Creates either a group node with translation, rotation or scaling.
     * Knows which to create by checking for the corresponding attribute.
     * Reads the needed values (e.g. axis or angle) from the attributes of the xml node.
     * If this is the first group node, the head is being set.
     * If there are any childnodes, those are visited too.
     * Once all child nodes are visited, we continue to visit the group node before that one.
     * @param childNode The node to create
     */
    // @ts-ignore
    createGroupNode(childNode){
        if(childNode.attributes.matrix){
            let matrix = new Matrix(this.getOneValue(childNode.attributes.matrix.value));
            let inverseMatrix = new Matrix(this.getOneValue(childNode.attributes.inverse.value))

            let node = new GroupNode(new FreeFlight(matrix,inverseMatrix));

            if(this._head === null){
                this._head = node;
                this.currentGroupNode = this._head;
            }else {
                this.currentGroupNode.add(node);
                this.oldGroupNodes.push(this.currentGroupNode);
                this.currentGroupNode = node;
                if (childNode.attributes.id) {
                    this.animatedGroupNodes.set(childNode.attributes.id.value, node);
                }
            }

        } else if (childNode.attributes.translation) {
            let values = this.getOneValue(childNode.attributes.translation.value);
            let node = new GroupNode(new Translation(new Vector(values[0], values[1], values[2], values[3])));
            if(this._head === null){
                this._head = node;
                this.currentGroupNode = this._head;
            }else {
                this.currentGroupNode.add(node);
                this.oldGroupNodes.push(this.currentGroupNode);
                this.currentGroupNode = node;
                if (childNode.attributes.id) {
                    this.animatedGroupNodes.set(childNode.attributes.id.value, node);
                }
            }
        } else if (childNode.attributes.rotation) {
            let values = this.getOneValue(childNode.attributes.rotation.value);
            let angleX = parseFloat(childNode.attributes.angleX.value);
            let angleY = parseFloat(childNode.attributes.angleY.value);
            let angleZ = parseFloat(childNode.attributes.angleZ.value);
            let node = new GroupNode(new Rotation(new Vector(values[0], values[1], values[2], values[3]), angleX,angleY,angleZ));

            if(this._head === null){
                this._head = node;
                this.currentGroupNode = this._head;
            }else {
                this.currentGroupNode.add(node);
                this.oldGroupNodes.push(this.currentGroupNode);
                this.currentGroupNode = node;
                if (childNode.attributes.id) {
                    this.animatedGroupNodes.set(childNode.attributes.id.value, node);
                }
            }

        } else if (childNode.attributes.scaling) {
            let values = this.getOneValue(childNode.attributes.scaling.value);
            let node = new GroupNode(new Scaling(new Vector(values[0], values[1], values[2], values[3])));
            if(this._head === null){
                this._head = node;
                this.currentGroupNode = this._head;
            } else {
                this.currentGroupNode.add(node);
                this.oldGroupNodes.push(this.currentGroupNode);
                this.currentGroupNode = node;
                if (childNode.attributes.id) {
                    this.animatedGroupNodes.set(childNode.attributes.id.value, node);
                }
            }
        }
        if(childNode.childNodes){
            this.createAndVisitChildren(childNode.childNodes);

        }

        if(this.oldGroupNodes.length === 0){
            this.currentGroupNode = this._head;
        }else{
            this.currentGroupNode = this.oldGroupNodes.pop();
        }
    }

    /**
     * Creates a sphere node with the values retrieved from the xml attributes
     * @param childNode The xml node to use
     */
    // @ts-ignore
    createSphereNode(childNode){
        let baseColor = this.getOneValue(childNode.attributes.baseColor.value) || [Math.random(),Math.random(),Math.random(),1];
        let node = new SphereNode(new Vector(baseColor[0],baseColor[1],baseColor[2],baseColor[3]));
        this.currentGroupNode.add(node);
    }

    /**
     * Creates a pyramid node with the values retrieved from the xml attributes
     * @param childNode The xml node to use
     */
    // @ts-ignore
    createPyramidNode(childNode){
        let baseColor = this.getOneValue(childNode.attributes.baseColor.value) || [Math.random(),Math.random(),Math.random(),1];
        let extraColors = this.getSeveralValues(childNode.attributes.extraColors.value);
        let node;
        if(extraColors === undefined ||extraColors.length<4){
            node = new PyramidNode(new Vector(baseColor[0],baseColor[1],baseColor[2],baseColor[3]),[]);
        } else{
            let extraColorsVectors = [new Vector(extraColors[0][0],extraColors[0][1],extraColors[0][2],extraColors[0][3]),
                new Vector(extraColors[1][0],extraColors[1][1],extraColors[1][2],extraColors[1][3]),
                new Vector(extraColors[2][0],extraColors[2][1],extraColors[2][2],extraColors[2][3]),
                new Vector(extraColors[3][0],extraColors[3][1],extraColors[3][2],extraColors[3][3])]
            node = new PyramidNode(new Vector(baseColor[0],baseColor[1],baseColor[2],baseColor[3]),extraColorsVectors);
        }
        this.currentGroupNode.add(node);
    }

    /**
     * Creates an aa-box node with the values retrieved from the xml attributes
     * @param childNode The xml node to use
     */
    // @ts-ignore
    createAABoxNode(childNode){
        let baseColor = this.getOneValue(childNode.attributes.baseColor.value) || [Math.random(),Math.random(),Math.random(),1];
        let extraColors = this.getSeveralValues(childNode.attributes.extraColors.value);
        let node;
        if(extraColors === undefined || extraColors.length<5){
            node = new AABoxNode(new Vector(baseColor[0],baseColor[1],baseColor[2],baseColor[3]),[]);
        } else{
            let extraColorsVectors = [new Vector(extraColors[0][0],extraColors[0][1],extraColors[0][2],extraColors[0][3]),
                new Vector(extraColors[1][0],extraColors[1][1],extraColors[1][2],extraColors[1][3]),
                new Vector(extraColors[2][0],extraColors[2][1],extraColors[2][2],extraColors[2][3]),
                new Vector(extraColors[3][0],extraColors[3][1],extraColors[3][2],extraColors[3][3]),
                new Vector(extraColors[4][0],extraColors[4][1],extraColors[4][2],extraColors[4][3])]
            node = new AABoxNode(new Vector(baseColor[0],baseColor[1],baseColor[2],baseColor[3]),extraColorsVectors);
        }
        this.currentGroupNode.add(node);
    }

    //@ts-ignore
    createCameraNode(childNode){
       let shininess = childNode.attributes.shininess.value;
        let specular = childNode.attributes.specular.value;
        let diffuse = childNode.attributes.diffuse.value;
        let ambient = childNode.attributes.ambient.value;
        let node = new CameraNode(shininess, specular, diffuse, ambient);
        this.currentGroupNode.add(node);
    }

    /**
     * Creates a texture box node with the values retrieved from the xml attributes
     * @param childNode The xml node to use
     */
    // @ts-ignore
    createTextureBoxNode(childNode){
        let texturePath = childNode.attributes.texPath.value || 'brickwall.jpg';
        let normalPath = childNode.attributes.normalPath.value || 'brickwall_normal.jpg'
        let node = new TextureBoxNode(texturePath, normalPath);
        this.currentGroupNode.add(node);
    }

    /**
     *
     * @param childNode
     */
    // @ts-ignore
    createObjNode(childNode){
        let objSource = childNode.attributes.src.value;
        let lines = objSource.split(",");
        let node = new ObjNode(lines);
        this.currentGroupNode.add(node);
    }


    /**
     * Creates a jumper node with the values retrieved from the xml attributes
     * @param childNode The xml node to use
     */
    // @ts-ignore
    createJumperNode(childNode){
        if(childNode.attributes.id){
            let id = childNode.attributes.id.value;
            let active = childNode.attributes.active.value === "true";
            let gn : GroupNode = this.animatedGroupNodes.get(id);
            let axisArray = this.getOneValue(childNode.attributes.axis.value);
            let axisVec : Vector = new Vector(axisArray[0],axisArray[1],axisArray[2],axisArray[3]);
            let magnitude = parseFloat(childNode.attributes.magnitude.value);
            let node = new JumperNode(gn,axisVec,magnitude);
            node.active = active;
            this.animationNodes.push(node);
        }
    }

    /**
     * Creates a rotation node with the values retrieved from the xml attributes
     * @param childNode The xml node to use
     */
    // @ts-ignore
    createRotationNode(childNode){
        if(childNode.attributes.id){
            let id = childNode.attributes.id.value;
            let active = childNode.attributes.active.value === "true";
            let gn : GroupNode = this.animatedGroupNodes.get(id);
            let axisArray = this.getOneValue(childNode.attributes.axis.value);
            let axisVec : Vector = new Vector(axisArray[0],axisArray[1],axisArray[2],axisArray[3]);
            let node = new RotationNode(gn,axisVec);
            node.active = active;
            this.animationNodes.push(node);
        }
    }

    /**
     * Creates a driver node with the values retrieved from the xml attributes
     * @param childNode The xml node to use
     */
    // @ts-ignore
    createDriverNode(childNode){
        if(childNode.attributes.id){
            let id = childNode.attributes.id.value;
            let active = childNode.attributes.active.value === "true";
            let gn : GroupNode = this.animatedGroupNodes.get(id);
            let node = new DriverNode(gn);
            node.active = active;
            this.animationNodes.push(node);
        }
    }

        /**
         * Creates a node to move and rotate the camera along all axis'
         * with the values retrieved from the xml attributes
         * @param childNode The xml node to use
         */
        // @ts-ignore
        createFreeFlightNode(childNode){
            if(childNode.attributes.id){
                let id = childNode.attributes.id.value;
                let gn : GroupNode = this.animatedGroupNodes.get(id);
                this.animationNodes.push(new FreeFlightNode(gn));
            }
        }

    /**
     * Returns the head of the scenegraph
     */
    get head(): GroupNode {
        return this._head;
    }

    /**
     * Takes a string of 4 coordinates (one vector) or a 4x4 Matrix seperated by ',' and
     * returns them as numbers in an array
     * @param string The string of coordinated to parse
     */
    getOneValue(string :String) : Array<number>{
        if(string === null ||string === undefined || string === ""){
            return undefined;
        }
        let result : Array<number> = [];
        let split = string.split(",");
        split.forEach(i =>{
            result.push(parseFloat(i));
        })

        return result;
    }

    /**
     * Takes a string of more than one vector, where the vectors are
     * seperated by ';' and the coordinates of one vector are seperated by ','.
     * Saves each vector as a separate array of numbers, and saves each vector
     * (number array) in one array, which is being returned.
     * @param string The string of coordinated to parse
     */
    getSeveralValues(string :String) : Array<Array<number>>{
        if(string === null ||string === undefined || string === ""){
            return undefined;
        }
        let result : Array<Array<number>> = [];
        let severalVectors = string.split(";");
            severalVectors.forEach(vector => {
                let vec =[];
                let split = vector.split(",");
                vec.push(parseFloat(split[0]));
                vec.push(parseFloat(split[1]));
                vec.push(parseFloat(split[2]));
                vec.push(parseFloat(split[3]));
                result.push(vec);
            });

        return result;
    }

}