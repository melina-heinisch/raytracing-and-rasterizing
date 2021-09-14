import Vector from '../math_library/vector';
import { GroupNode } from './nodes';
import {FreeFlight, Rotation, SQT, Translation} from '../math_library/transformation';
import Quaternion from '../math_library/quaternion';

/**
 * Class representing an Animation
 */
export class AnimationNode {
  /**
   * Describes if the animation is running
   */
  active: boolean;

  /**
   * Creates a new AnimationNode
   * @param groupNode The GroupNode to attach to
   */
  constructor(public groupNode: GroupNode) {
    this.active = true;
  }

  /**
   * Toggles the active state of the animation node
   */
  toggleActive() {
    this.active = !this.active;
  }

}

/**
 * Class representing a Rotation Animation
 * @extends AnimationNode
 */
export class RotationNode extends AnimationNode {
  /**
   * The absolute angle of the rotation
   */
  _angle: number;
  /**
   * The vector to rotate around
   */
  _axis: Vector;

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode, axis: Vector) {
    super(groupNode);
    let transformation = groupNode.transform;
    if(transformation instanceof Rotation){
      this._axis = transformation.axis;
      if(axis.x === 1){
        this._angle = transformation.angleX;
      } else if(axis.y === 1){
        this._angle = transformation.angleY;
      } else if(axis.z === 1){
        this._angle = transformation.angleZ;
      }else {
        this.axis = new Vector(0,0,0,1);
        this._angle = 0;
      }
    }

  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    // change the matrix of the attached
    // group node to reflect a rotation

    if(this.active){
      this._angle = this._angle+deltaT/1000;

      if(this._axis.x === 1 ){
        this.groupNode.transform = new Rotation(this._axis,this._angle,0,0);
      } else if(this._axis.y === 1){
        this.groupNode.transform = new Rotation(this._axis,0,this._angle,0);
      } else if(this._axis.z === 1){
        this.groupNode.transform = new Rotation(this._axis,0,0,this._angle);
      }
    }
  }


  get angle(): number {
    return this._angle;
  }

  get axis(): Vector {
    return this._axis;
  }


  set angle(value: number) {
    this._angle = value;
  }

  set axis(value: Vector) {
    this._axis = value;
  }
}

/**
* Class representing a Jumper Animation
* @extends AnimationNode
*/
export class JumperNode extends AnimationNode {
  /**
   * The axis of the jumper
   */
  _axis: Vector;
  /**
   * The direction (plus/minus) to move to
   */
  direction: number;
  /**
   * The number that keeps track of how far the object has moved and is moving
   */
  translation: number;
  /**
   * The height of the Jump
   */
   _magnitude : number;
  /**
   * The GroupNode that is changed when animating
   */
   _groupNode : GroupNode;

  /**
   * Creates a new JumperNode
   * @param groupNode The group node to attach to
   * @param axis The axis to jump on
   * @param magnitude How far it should jump
   */
  constructor(groupNode: GroupNode, axis: Vector, magnitude: number) {
    super(groupNode);
    this._axis = axis;
    this.direction = 1;
    this._magnitude = Math.abs(magnitude);
    this._groupNode = groupNode;
    let translationVector =  new Vector(groupNode.transform.getMatrix().getVal(0,3), groupNode.transform.getMatrix().getVal(1,3), groupNode.transform.getMatrix().getVal(2,3),groupNode.transform.getMatrix().getVal(3,3));
    if(axis.x === 1){
      this.translation = translationVector.x;
    }else if (axis.y === 1){
      this.translation = translationVector.y;
    }else if (axis.z === 1){
      this.translation = translationVector.z;
    }else{
      this.translation = 0;
    }
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    if(this.active){
      if(this.translation >= this._magnitude){
        this.direction *= -1;
        this.translation = this._magnitude;
      } else if (this.translation <= -this._magnitude){
        this.direction *= -1;
        this.translation = -this._magnitude
      } else if ( this.translation === 0){
        this.direction *= -1;
      }

      if(this.direction >0){
        this.translation += (deltaT/250) % this._magnitude;
      }else{
        this.translation -= (deltaT/250) % this._magnitude;
      }


      let transformVector = new Vector(this.translation,this.translation,this.translation,1);
      transformVector.x *= this._axis.x;
      transformVector.y *= this._axis.y;
      transformVector.z *= this._axis.z;
      this._groupNode.transform = new Translation(transformVector);
    }
  }


  get axis(): Vector {
    return this._axis;
  }

  set axis(value: Vector) {
    this._axis = value;
  }

  get groupNode(): GroupNode {
    return this._groupNode;
  }

  set groupNode(value: GroupNode) {
    this._groupNode = value;
  }

  get magnitude(): number {
    return this._magnitude;
  }

  set magnitude(value: number) {
    this._magnitude = value;
  }
}

/**
 * Class representing a Driver Animation
 * @extends AnimationNode
 */
export class DriverNode extends AnimationNode {
  /**
   * How far the object has moved and is moving in x direction
   */
  xOffset: number;
  /**
   * How far the object has moved and is moving in y direction
   */
  yOffset: number;
  /**
   * The group node to attach to
   */
  groupNode: GroupNode;

  /**
   * Either of the indicate, if the corresponding button is being pressed or not
   */
  private _xNegActive : boolean;
  private _xPosActive : boolean;
  private _yNegActive : boolean;
  private _yPosActive : boolean;

  /**
   * Creates a new JumperNode
   * @param groupNode The group node to attach to
   */
  constructor(groupNode: GroupNode) {
    super(groupNode);
    this.groupNode = groupNode;
    this._xNegActive = false;
    this._xPosActive = false;
    this._yNegActive = false;
    this._yPosActive = false;
    let translationVector = new Vector(groupNode.transform.getMatrix().getVal(0,3), groupNode.transform.getMatrix().getVal(1,3), groupNode.transform.getMatrix().getVal(2,3),groupNode.transform.getMatrix().getVal(3,3));
    this.xOffset = translationVector.x;
    this.yOffset = translationVector.y;
  }

  simulate(deltaT : number){
    if(this.active){
      if (this._xPosActive){
        this.xOffset += deltaT/500;
      } else if (this._xNegActive){
        this.xOffset -= deltaT/500;
      }
      if (this._yPosActive){
        this.yOffset += deltaT/500;
      }  else if (this._yNegActive){
        this.yOffset -= deltaT/500;
      }
      this.groupNode.transform = new Translation(new Vector(this.xOffset,this.yOffset,0,1));
    }
  }

  set xNegActive(value: boolean) {
    this._xNegActive = value;
  }

  set xPosActive(value: boolean) {
    this._xPosActive = value;
  }

  set yNegActive(value: boolean) {
    this._yNegActive = value;
  }

  set yPosActive(value: boolean) {
    this._yPosActive = value;
  }

}

export class FreeFlightNode extends AnimationNode{
  /**
   * How far the object has moved and is moving in x direction
   */
  xOffset: number;
  /**
   * How far the object has moved and is moving in y direction
   */
  yOffset: number;
  /**
   * How far the object has moved and is moving in z direction
   */
  zOffset: number;
  /**
   * The group node to attach to
   */
  groupNode: GroupNode;
  /**
   * Either of the indicate, if the corresponding button is being pressed or not
   */
  private _xNegActive : boolean;
  private _xPosActive : boolean;
  private _yNegActive : boolean;
  private _yPosActive : boolean;
  private _zNegActive : boolean;
  private _zPosActive : boolean;

  /**
   * The absolute angle in x direction of the rotation
   */
  private _angleX: number;
  /**
   * The absolute angle in y direction of the rotation
   */
  private _angleY: number;
  /**
   * The vector to rotate around
   */
  private _axis: Vector;

  /**
   * Direction (pos/neg) of rotation in x direction
   */
  private _directionX: number;

  /**
   * Direction (pos/neg) of rotation in y direction
   */
  private _directionY: number;

  /**
   * The indicator if key is pressed
   */
  private _yActive: boolean;

  /**
   * The indicator if key is pressed
   */
  private _xActive: boolean;

  /**
   * Creates a new FreeFlightNode
   * @param groupNode The group node to attach to
   */
  constructor(groupNode: GroupNode) {
    super(groupNode);
    this.groupNode = groupNode;

    this._xNegActive = false;
    this._xPosActive = false;
    this._yNegActive = false;
    this._yPosActive = false;
    this._zNegActive = false;
    this._zPosActive = false;

    this.xOffset = 0;
    this.yOffset = 0;
    this.zOffset = 0;

    this._axis = new Vector(1,1,0,1);
    this._yActive = false;
    this._xActive = false;
    this._directionX = 1;
    this._directionY = 1;
    this._angleX = 0;
    this._angleY = 0;
  }

  simulate(deltaT : number){
    if(this.active){
      if (this._xPosActive){
        this.xOffset += deltaT/500;
      } else if (this._xNegActive){
        this.xOffset -= deltaT/500;
      }
      if (this._yPosActive){
        this.yOffset += deltaT/500;
      }  else if (this._yNegActive){
        this.yOffset -= deltaT/500;
      }
      if (this._zPosActive){
        this.zOffset += deltaT/500;
      } else if (this._zNegActive){
        this.zOffset -= deltaT/500;
      }

      if(this._xActive) {
        if (this._directionX < 0) {
          this._angleX += deltaT / 1000;
        } else {
          this._angleX -= deltaT / 1000;
        }
      }
      if(this._yActive) {
        if (this._directionY < 0) {
          this._angleY += deltaT / 1000;
        } else {
          this._angleY -= deltaT / 1000;
        }
      }

      let transformation = this.groupNode.transform as FreeFlight;
      let matrix = transformation.freeFlightMatrix;
      let inverse = transformation.inverseFreeFlightMatrix;

      if(this.xOffset != 0 || this.yOffset != 0 || this.zOffset != 0){

        let newTranslation = new Translation(new Vector(this.xOffset, this.yOffset, this.zOffset, 0));
        matrix = matrix.mul(newTranslation.getMatrix());
        inverse = newTranslation.getInverseMatrix().mul(inverse);
        this.xOffset = 0;
        this.yOffset = 0;
        this.zOffset = 0;
      }

      if(this.angleX != 0 || this.angleY != 0) {

        let newRotation = new Rotation(this._axis, this._angleX, this._angleY, 0);
        matrix = matrix.mul(newRotation.getMatrix());
        inverse = newRotation.getInverseMatrix().mul(inverse);
        this._angleX = 0;
        this._angleY = 0;
      }

      if(transformation.freeFlightMatrix.data != matrix.data && transformation.inverseFreeFlightMatrix.data != inverse.data){
        this.groupNode.transform = new FreeFlight(matrix,inverse);
      }


    }
  }


  get angleX(): number {
    return this._angleX;
  }

  get angleY(): number {
    return this._angleY;
  }

  set xNegActive(value: boolean) {
    this._xNegActive = value;
  }

  set xPosActive(value: boolean) {
    this._xPosActive = value;
  }

  set yNegActive(value: boolean) {
    this._yNegActive = value;
  }

  set yPosActive(value: boolean) {
    this._yPosActive = value;
  }

  set zNegActive(value: boolean) {
    this._zNegActive = value;
  }

  set zPosActive(value: boolean) {
    this._zPosActive = value;
  }

  set axis(value: Vector) {
    this._axis = value;
  }

  set yActive(value: boolean) {
    this._yActive = value;
  }

  set xActive(value: boolean) {
    this._xActive = value;
  }

  set directionX(value: number) {
    this._directionX = value;
  }
  set directionY(value: number) {
    this._directionY = value;
  }
}