import Vector from './vector';

/**
 * Class representing a 4x4 Matrix
 */
export default class Matrix {

  /**
   * Data representing the matrix values
   */
  data: Float32Array;

  /**
   * Constructor of the matrix. Expects an array in row-major layout. Saves the data as column major internally.
   * @param mat Matrix values row major
   */
  constructor(mat: Array<number>) {
    this.data = new Float32Array(16);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.data[row * 4 + col] = mat[col * 4 + row];
      }
    }
  }

  /**
   * Returns the value of the matrix at position row, col
   * @param row The value's row
   * @param col The value's column
   * @return The requested value
   */
  getVal(row: number, col: number): number {
    return this.data[col * 4 + row];
  }

  /**
   * Sets the value of the matrix at position row, col
   * @param row The value's row
   * @param val The value to set to
   * @param col The value's column
   */
  setVal(row: number, col: number, val: number) {
    this.data[col * 4 + row] = val;
  }

  /**
   * Returns a matrix that represents a translation
   * @param translation The translation vector that shall be expressed by the matrix
   * @return The resulting translation matrix
   */
  static translation(translation: Vector): Matrix {

      let mat = Matrix.identity();
      mat.setVal(0,3, translation.x);
      mat.setVal(1,3, translation.y);
      mat.setVal(2,3, translation.z);
      return mat;
  }

  /**
   * Returns a matrix that represents a rotation. The rotation axis is either the x, y or z axis (either x, y, z is 1).
   * @param axis The axis to rotate around
   * @param angle The angle to rotate
   * @return The resulting rotation matrix
   */
  static rotation(axis: Vector, angleX: number, angleY : number, angleZ : number): Matrix {
      let cosX = Math.cos(angleX);
      let sinX = Math.sin(angleX);
      let cosY = Math.cos(angleY);
      let sinY = Math.sin(angleY);
      let cosZ = Math.cos(angleZ);
      let sinZ = Math.sin(angleZ);
      let xMatrix : Matrix = Matrix.identity();
      let yMatrix : Matrix = Matrix.identity();
      let zMatrix : Matrix = Matrix.identity();

      if(axis.x === 1){
          let values : Array<number> = [
              1,0,0,0,
              0,cosX,-sinX,0,
              0,sinX,cosX,0,
              0,0,0,1];
          xMatrix = new Matrix(values);

      }
      if(axis.y === 1){
          let values : Array<number> = [
              cosY,0,sinY,0,
              0,1,0,0,
              -sinY,0,cosY,0,
              0,0,0,1];
          yMatrix = new Matrix(values);

      }
      if(axis.z === 1){
          let values : Array<number> = [
              cosZ,-sinZ,0,0,
              sinZ,cosZ,0,0,
              0,0,1,0,
              0,0,0,1];
          zMatrix = new Matrix(values);

    }

    return xMatrix.mul(yMatrix).mul(zMatrix);
  }

  /**
   * Returns a matrix that represents a scaling
   * @param scale The amount to scale in each direction
   * @return The resulting scaling matrix
   */
  static scaling(scale: Vector): Matrix {
    let values : Array<number> = [
        scale.x,0,0,0,
        0,scale.y,0,0,
        0,0,scale.z,0,
        0,0,0,1]
    let matrix : Matrix = new Matrix(values);
    return matrix;
  }

  /**
   * Constructs a lookat matrix
   * @param eye The position of the viewer
   * @param center The position to look at
   * @param up The up direction
   * @return The resulting lookat matrix
   */
  static lookat(eye: Vector, center: Vector, up: Vector): Matrix {
    let f : Vector = (center.sub(eye).div(center.sub(eye).length));
    let s : Vector = f.cross(up).normalize();
    let u : Vector = s.cross(f).normalize();

    let lookatOne : Matrix = new Matrix([
        s.x,s.y,s.z,0,
        u.x,u.y,u.z,0,
        -f.x,-f.y,-f.z,0,
        0,0,0,1
        ]
    );
    let lookatTwo : Matrix = new Matrix([
        1,0,0,-eye.x,
        0,1,0,-eye.y,
        0,0,1,-eye.z,
        0,0,0,1
    ])

      return lookatOne.mul(lookatTwo);
  }

  /**
   * Constructs a new matrix that represents a projection normalisation transformation
   * @param left Camera-space left value of lower near point
   * @param right Camera-space right value of upper right far point
   * @param bottom Camera-space bottom value of lower lower near point
   * @param top Camera-space top value of upper right far point
   * @param near Camera-space near value of lower lower near point
   * @param far Camera-space far value of upper right far point
   * @return The rotation matrix
   */
  static frustum(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix {
    let A = (right+left)/(right-left);
    let B = (top+bottom)/(top-bottom);
    let C = -((far+near)/(far-near));
    let D = -((2*far*near)/(far-near));

    let X = (2*near)/(right-left);
    let Y = (2*near)/(top-bottom);

    let data = [
        X  ,0.0,A   ,0.0,
        0.0,Y  ,B   ,0.0,
        0.0,0.0,C   ,D,
        0.0,0.0,-1.0,0.0
    ]

      return new Matrix(data);
  }

  /**
   * Constructs a new matrix that represents a projection normalisation transformation.
   * @param fovy Field of view in y-direction
   * @param aspect Aspect ratio between width and height
   * @param near Camera-space distance to near plane
   * @param far Camera-space distance to far plane
   * @return The resulting matrix
   */
  static perspective(fovy: number, aspect: number, near: number, far: number): Matrix {
      let top = near * Math.tan((Math.PI/180)*(fovy/2));
      let bottom = -top;
      let right = aspect *top;
      let left = -right;


    return this.frustum(left,right,bottom,top,near,far);
  }

  /**
   * Returns the identity matrix
   * @return A new identity matrix
   */
  static identity(): Matrix {
    return new Matrix([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Matrix multiplication
   * @param other The matrix to multiplicate with
   * @return The result of the multiplication this*other
   */
  mul(other: Matrix): Matrix {
    let values : Array<number> = [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0];
    let matrix = new Matrix(values);
    for (let colOther = 0; colOther < 4; colOther++) {
      for (let rowThis = 0; rowThis < 4; rowThis++) {
          let val0 = this.getVal(rowThis,0) * other.getVal(0,colOther);
          let val1 = this.getVal(rowThis,1) * other.getVal(1,colOther);
          let val2 = this.getVal(rowThis,2) * other.getVal(2,colOther);
          let val3 = this.getVal(rowThis,3) * other.getVal(3,colOther);

          matrix.setVal(rowThis,colOther,val0+val1+val2+val3);
      }
    }
    return matrix;
  }

  /**
   * Matrix-vector multiplication
   * @param other The vector to multiplicate with
   * @return The result of the multiplication this*other
   */
  mulVec(other: Vector): Vector {
    let values = [];
    for (let row = 0; row < 4; row++) {
      let val1 = this.getVal(row,0)*other.x;
      let val2 = this.getVal(row,1)*other.y;
      let val3 = this.getVal(row,2)*other.z;
      let val4 = this.getVal(row,3)*other.w;

      values.push(val1+val2+val3+val4);

    }

    return new Vector(values[0], values[1], values[2], values[3]);
  }

  /**
   * Returns the transpose of this matrix
   * @return A new matrix that is the transposed of this
   */
  transpose(): Matrix {
    let values : Array<number> = [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0];
    let matrix = new Matrix(values);
    for (let i = 0; i < 4; i++) {
      matrix.setVal(0,i,this.getVal(i,0));
      matrix.setVal(1,i,this.getVal(i,1));
      matrix.setVal(2,i,this.getVal(i,2));
      matrix.setVal(3,i,this.getVal(i,3));
    }
    return matrix;
  }

  /**
   * Debug print to console
   */
  print() {
    for (let row = 0; row < 4; row++) {
      console.log("> " + this.getVal(row, 0) +
        "\t" + this.getVal(row, 1) +
        "\t" + this.getVal(row, 2) +
        "\t" + this.getVal(row, 3)
      );
    }
  }
}