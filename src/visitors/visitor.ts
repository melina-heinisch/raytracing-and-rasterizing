import {GroupNode, SphereNode, AABoxNode, TextureBoxNode, PyramidNode, LightNode, CameraNode} from '../nodes/nodes';

export default interface Visitor {
    visitGroupNode(node: GroupNode): void;
    visitSphereNode(node: SphereNode): void;
    visitPyramidNode(node: PyramidNode) : void;
    visitAABoxNode(node: AABoxNode): void;
    visitTextureBoxNode(node: TextureBoxNode): void;
    visitLightNode(node: LightNode): void;
    visitCameraNode(node: CameraNode): void;
    visitObjNode(node: CameraNode): void;
}