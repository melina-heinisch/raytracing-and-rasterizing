import Matrix from "./matrix";
import Vector from "./vector";

export default class Quaternion {

    data: Vector;

    constructor(x: number, y: number, z: number, w: number) {
        this.data = new Vector(x, y, z, w);
    }

    static fromAxisAngle(axis: Vector, angle: number) {
        //Geteilt durch 2 oder nicht?
        let qv = axis.mul(Math.sin(angle));
        let q = new Quaternion(qv.x, qv.y, qv.z, Math.cos(angle));
        return q;
    }

    get conjugate(): Quaternion {
        let q = new Quaternion(-this.data.x, -this.data.y, -this.data.z, this.data.w);
        return q;
    }

    get inverse(): Quaternion {
        let scalar : number = (1/Math.pow(this.norm(),2))
        let conjugate : Quaternion = this.conjugate;
        return conjugate.scalarMul(scalar);
    }

    slerp(other: Quaternion, t: number): Quaternion {
        let angle = Math.acos(this.data.dot(other.data));

        let firstSummand = this.scalarMul((Math.sin(angle*(1-t))/Math.sin(angle)));
        let secondSummand = other.scalarMul((Math.sin(angle)*t)/Math.sin(angle));
        let resultVec :Vector = firstSummand.data.add(secondSummand.data);
        return new Quaternion(resultVec.x,resultVec.y,resultVec.z,resultVec.w);
    }

    toMatrix(): Matrix {
        let s : number = 2/Math.pow(this.norm(),2);
        let q : Vector = this.data;

        let mat : Matrix = new Matrix([
            1-s*(q.y*q.y+q.z*q.z), s*(q.x*q.y-q.w*q.z), s*(q.x*q.z+q.w*q.y), 0,
            s*(q.x*q.y+q.w*q.z), 1-s*(q.x*q.x+q.z*q.z), s*(q.y*q.z-q.w*q.x), 0,
            s*(q.x*q.z-q.w*q.y), s*(q.y*q.z+q.w*q.x), 1-s*(q.x*q.x+q.y*q.y), 0,
            0,0,0,1
        ])
        return mat;
    }

    /*
    mul(other: Quaternion):Quaternion{
        let qv : Vector = this.data.cross(other.data).add(this.data.mul(other.data.w)).add(other.data.mul(this.data.w));
        let qw : number = this.data.w*other.data.w - ((this.data.x * other.data.x) + (this.data.y * other.data.y)+(this.data.z * other.data.z));
        return new Quaternion(qv.x,qv.y,qv.z,qw);
    }

     */
    scalarMul(scalar : number):Quaternion{
        let qv : Vector = this.data.mul(scalar);
       return new Quaternion(qv.x,qv.y,qv.z,qv.w);
    }

    norm():number{
        return Math.sqrt(Math.pow(this.data.x,2)+Math.pow(this.data.y,2)+Math.pow(this.data.z,2)+Math.pow(this.data.w,2))
    }
}