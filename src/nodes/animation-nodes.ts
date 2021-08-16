import Vector from '../math_library/vector';
import { GroupNode } from './nodes';
import {Rotation, SQT, Translation} from '../math_library/transformation';
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
  angle: number;
  /**
   * The vector to rotate around
   */
  axis: Vector;

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode, axis: Vector) {
    super(groupNode);
    this.angle = 0;
    this.axis = axis;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    // change the matrix of the attached
    // group node to reflect a rotation

    if(this.active){
      this.angle = this.angle+deltaT/1000;

      if(this.axis.x === 1 ){
        this.groupNode.transform = new Rotation(this.axis,this.angle,0,0);
      } else if(this.axis.y === 1){
        this.groupNode.transform = new Rotation(this.axis,0,this.angle,0);
      } else if(this.axis.z === 1){
        this.groupNode.transform = new Rotation(this.axis,0,0,this.angle);
      }


    }
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
   * translation parameter
   */
  translation: number;

  /**
   * The Magnitude (Height) of the Jump
   */
  private _magnitude : number;

  /**
   * The GroupNode that is changes when animating
   */
  private _groupNode : GroupNode;

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode, axis: Vector, magnitude: number) {
    super(groupNode);
    this.translation = 0;
    this._axis = axis;
    this.direction = 1;
    this._magnitude = Math.abs(magnitude);
    this._groupNode = groupNode;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    // change the matrix of the attached
    // group node to reflect a rotation

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
}

/**
 * Class representing a Driver Animation
 * @extends AnimationNode
 */
export class DriverNode extends AnimationNode {
  /**
   * The vector to rotate around
   */
  axis: Vector;

  xOffset: number;

  yOffset: number;

  groupNode: GroupNode;

  private _xNegActive : boolean;
  private _xPosActive : boolean;
  private _yNegActive : boolean;
  private _yPosActive : boolean;

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode) {
    super(groupNode);
    this.xOffset = 0;
    this.yOffset = 0
    this.groupNode = groupNode;
    this._xNegActive = false;
    this._xPosActive = false;
    this._yNegActive = false;
    this._yPosActive = false;
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

/**
 * Class responsible for the Camera Free flight mode
 * @extends AnimationNode
 */
export class MoveCameraNode extends AnimationNode {
  /**
   * The vector to rotate around
   */
  axis: Vector;

  xOffset: number;

  yOffset: number;

  zOffset: number;

  groupNode: GroupNode;

  private _xNegActive : boolean;
  private _xPosActive : boolean;
  private _yNegActive : boolean;
  private _yPosActive : boolean;
  private _zNegActive : boolean;
  private _zPosActive : boolean;

  /**
   * Creates a new MoveCameraNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode) {
    super(groupNode);
    this.xOffset = 0;
    this.yOffset = 0
    this.zOffset = 0;
    this.groupNode = groupNode;
    this._xNegActive = false;
    this._xPosActive = false;
    this._yNegActive = false;
    this._yPosActive = false;
    this._zNegActive = false;
    this._zPosActive = false;
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
      this.groupNode.transform = new Translation(new Vector(this.xOffset,this.yOffset,this.zOffset,1));
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

  set zNegActive(value: boolean) {
    this._zNegActive = value;
  }

  set zPosActive(value: boolean) {
    this._zPosActive = value;
  }
}

/**
 * Class representing the rotation operation for the camera
 * @extends AnimationNode
 */
export class RotateCameraNode extends AnimationNode {
  /**
   * The absolute angle of the rotation
   */
  angleX: number;
  /**
   * The absolute angle of the rotation
   */
  angleY: number;
  /**
   * The vector to rotate around
   */
   _axis: Vector;

  /**
   * Direction of rotation
   */
  _directionX: number;

  /**
   * Direction of rotation
   */
  _directionY: number;

  /**
   * The indicator if key is pressed
   */
  private _yActive: boolean;

  /**
   * The indicator if key is pressed
   */
  private _xActive: boolean;

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode) {
    super(groupNode);
    this.angleX = 0;
    this.angleY = 0;
    this._axis = new Vector(1,1,0,1);
    this._yActive = false;
    this._xActive = false;
    this._directionX = 1;
    this._directionY = 1;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    // change the matrix of the attached
    // group node to reflect a rotation

    if(this.active){
      if(this._xActive) {
        if (this._directionX < 0) {
          this.angleX += deltaT / 1000;
        } else {
          this.angleX -= deltaT / 1000;
        }
      }
      if(this._yActive) {
        if (this._directionY < 0) {
          this.angleY += deltaT / 1000;
        } else {
          this.angleY -= deltaT / 1000;
        }
      }


        this.groupNode.transform = new Rotation(this._axis,this.angleX,this.angleY,0);
      }

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


/**
 * Class representing a Rotation Animation
 * @extends AnimationNode
 */
export class SlerpNode extends AnimationNode {
  /**
   * The time
   */
  t: number;

  /**
   * The rotations to interpolate between
   */
  rotations: [Quaternion, Quaternion];

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode, rotation1: Quaternion, rotation2: Quaternion) {
    super(groupNode);
    this.rotations = [rotation1, rotation2];
    this.t = 0;
  }

  /**
   * Advances the animation by deltaT
   * @param deltaT The time difference, the animation is advanced by
   */
  simulate(deltaT: number) {
    if (this.active) {
      this.t += 0.001 * deltaT;
      const rot = this.rotations[0].slerp(this.rotations[1], (Math.sin(this.t) + 1) / 2);
      (this.groupNode.transform as SQT).rotation = rot;
    }
  }

}