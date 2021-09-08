import Matrix from "./matrix";
import Vector from "./vector";
import Quaternion from './quaternion';

export interface Transformation {
    getMatrix(): Matrix;
    getInverseMatrix(): Matrix;
}

class MatrixTransformation implements Transformation {
    matrix: Matrix;
    inverse: Matrix;

    constructor(matrix: Matrix, inverse: Matrix) {
        this.matrix = matrix;
        this.inverse = inverse;
    }

    getMatrix(): Matrix {
        return this.matrix;
    }

    getInverseMatrix(): Matrix {
        return this.inverse;
    }
}

export class Translation extends MatrixTransformation {
    constructor(translation: Vector) {
        super(Matrix.translation(translation), Matrix.translation(translation.mul(-1)));
    }
}

export class Rotation extends MatrixTransformation {
    private _axis: Vector;
    private _angleX: number;
    private _angleY: number;
    private _angleZ: number;

    constructor(axis: Vector, angleX: number, angleY : number, angleZ : number) {
        super(Matrix.rotation(axis, angleX,angleY,angleZ), Matrix.rotation(axis, -angleX,-angleY,-angleZ));
        this._axis = axis;
        this._angleX = angleX;
        this._angleY = angleY;
        this._angleZ = angleZ
    }

    set axis(axis: Vector) {
        this._axis = axis;
        this.recalculate();
    }

    set angleX(value: number) {
        this._angleX = value;
    }

    set angleY(value: number) {
        this._angleY = value;
    }

    set angleZ(value: number) {
        this._angleZ = value;
    }

    get axis(): Vector {
        return this._axis;
    }

    get angleX(): number {
        return this._angleX;
    }

    get angleY(): number {
        return this._angleY;
    }

    get angleZ(): number {
        return this._angleZ;
    }

    private recalculate() {
        this.matrix = Matrix.rotation(this._axis, this._angleX, this._angleY, this._angleZ);
        this.inverse = Matrix.rotation(this._axis, -this._angleX, -this._angleY, -this._angleZ);
    }
}

export class Scaling extends MatrixTransformation {
    constructor(scale: Vector) {
        super(Matrix.scaling(scale), Matrix.scaling(new Vector(1 / scale.x, 1 / scale.y, 1 / scale.z, 0)));
    }
}

export class FreeFlight extends MatrixTransformation {
    private _freeFlightMatrix : Matrix;
    private _inverseFreeFlightMatrix : Matrix;

    constructor(freeFlightMatrix : Matrix, inverseFreeFlightMatrix : Matrix){
        super(freeFlightMatrix,inverseFreeFlightMatrix);

        this._freeFlightMatrix = freeFlightMatrix;
        this._inverseFreeFlightMatrix = inverseFreeFlightMatrix;
    }

    get freeFlightMatrix(): Matrix {
        return this._freeFlightMatrix;
    }

    set freeFlightMatrix(value: Matrix) {
        this._freeFlightMatrix = value;
    }

    get inverseFreeFlightMatrix(): Matrix {
        return this._inverseFreeFlightMatrix;
    }

    set inverseFreeFlightMatrix(value: Matrix) {
        this._inverseFreeFlightMatrix = value;
    }

    private  recalculate() {
        this.matrix =  this._freeFlightMatrix;
        this.inverse = this._inverseFreeFlightMatrix;
    }
}

export class SQT extends MatrixTransformation {
    scale: Vector;
    quaternion: Quaternion;
    translation: Vector;

    constructor(scale: Vector, rotation: { angle: number, axis: Vector }, translation: Vector) {
        super(Matrix.identity(), Matrix.identity());
        this.scale = scale;
        this.translation = translation;
        this.quaternion = Quaternion.fromAxisAngle(rotation.axis, rotation.angle);
        this.recalculate();
    }

    set rotation(q: Quaternion) {
        this.quaternion = q;
        this.recalculate();
    }

    private recalculate() {
        this.matrix = Matrix.translation(this.translation).mul(this.quaternion.toMatrix()).mul(Matrix.scaling(this.scale));
        this.inverse = Matrix.scaling(new Vector(1 / this.scale.x, 1 / this.scale.y, 1 / this.scale.z, 0)).mul(this.quaternion.inverse.toMatrix()).mul(Matrix.translation(this.translation.mul(-1)));
    }
}