import {GroupNode, SphereNode, AABoxNode, TextureBoxNode, PyramidNode} from '../nodes/nodes';

export default interface Visitor {
    visitGroupNode(node: GroupNode): void;
    visitSphereNode(node: SphereNode): void;
    visitPyramidNode(node: PyramidNode) : void;
    visitAABoxNode(node: AABoxNode): void;
    visitTextureBoxNode(node: TextureBoxNode): void;
}