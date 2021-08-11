import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from './math_library/vector';
import {
    AABoxNode,
    GroupNode, LightNode, Node, PyramidNode,
    SphereNode,
    TextureBoxNode
} from './nodes/nodes';

import {Rotation, Scaling, Translation} from './math_library/transformation';

export class XMLParser {

    private _head : GroupNode;
    currentGroupNode : GroupNode;
    oldGroupNodes : Array<GroupNode>;

    constructor() {
        this._head = new GroupNode(new Translation(new Vector(0,0,0,1)));
        this.currentGroupNode = this._head;
        this.oldGroupNodes= [];
    }
    traverse(xml : XMLHttpRequest) {
        var xmlDoc = xml.responseXML;
        let children = xmlDoc.childNodes;
        this.createAndVisitChildren(children);

    }


    createAndVisitChildren(children : NodeListOf<ChildNode>){
        for (let i = 0; i < children.length; i++) {
            if(children[i].nodeName === "#text")
                continue;
            if (children[i].nodeName === "GroupNode") {
                this.createGroupNode(children[i]);
            } else if(children[i].nodeName === "SphereNode"){
                this.createSphereNode(children[i]);
            } else if(children[i].nodeName === "PyramidNode"){
                this.createPyramidNode(children[i]);
            } else if(children[i].nodeName === "AABoxNode"){
                this.createAABoxNode(children[i]);
            } else if(children[i].nodeName === "TextureBoxNode"){
                this.createTextureBoxNode(children[i]);
            } else if(children[i].nodeName === "LightNode"){
                this.currentGroupNode.add(new LightNode());
            }

        }
    }

    createGroupNode(childNode : ChildNode){
        // @ts-ignore
        if (childNode.attributes.translation) {
            // @ts-ignore
            let values = this.getOneValue(childNode.attributes.translation.value);
            let node = new GroupNode(new Translation(new Vector(values[0], values[1], values[2], values[3])));
            this.currentGroupNode.add(node);
            this.oldGroupNodes.push(this.currentGroupNode);
            this.currentGroupNode=node;
            // @ts-ignore
        } else if (childNode.attributes.rotation) {
            // @ts-ignore
            let values = this.getOneValue(childNode.attributes.rotation.value);
            // @ts-ignore
            let node = new GroupNode(new Rotation(new Vector(values[0], values[1], values[2], values[3]), parseFloat(childNode.attributes.rotation.value) || 0));
            this.currentGroupNode.add(node);
            this.oldGroupNodes.push(this.currentGroupNode);
            this.currentGroupNode=node;
            // @ts-ignore
        } else if (childNode.attributes.scaling) {
            // @ts-ignore
            let values = this.getOneValue(childNode.attributes.scaling.value);
            let node = new GroupNode(new Scaling(new Vector(values[0], values[1], values[2], values[3])));
            this.currentGroupNode.add(node);
            this.oldGroupNodes.push(this.currentGroupNode);
            this.currentGroupNode=node;
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

    // @ts-ignore
    createSphereNode(childNode){
        let baseColor = this.getOneValue(childNode.attributes.baseColor.value) || [Math.random(),Math.random(),Math.random(),1];
        let extraColor = this.getOneValue(childNode.attributes.extraColors.value);

        let node;
        if(extraColor === undefined){
            node = new SphereNode(new Vector(baseColor[0],baseColor[1],baseColor[2],baseColor[3]),undefined);
        } else{
            node = new SphereNode(new Vector(baseColor[0],baseColor[1],baseColor[2],baseColor[3]),new Vector(extraColor[0],extraColor[1],extraColor[2],extraColor[3]));
        }
        this.currentGroupNode.add(node);
    }

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

    // @ts-ignore
    createTextureBoxNode(childNode){
        let texturePath = childNode.attributes.path.value || 'img.png';
        let node = new TextureBoxNode(texturePath);
        this.currentGroupNode.add(node);
    }


    get head(): GroupNode {
        return this._head;
    }

    getOneValue(string :String) : Array<number>{
        if(string === null ||string === undefined || string === ""){
            return undefined;
        }
        let result : Array<number> = [];
        let split = string.split(",");
        result.push(parseFloat(split[0]));
        result.push(parseFloat(split[1]));
        result.push(parseFloat(split[2]));
        result.push(parseFloat(split[3]));

        return result;
    }

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