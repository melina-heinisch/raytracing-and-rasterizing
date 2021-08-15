import Vector from '../math_library/vector';
import Shader from '../shading/shader';

/**
 * A class creating buffers for an axis aligned box to render it with WebGL
 */
export default class RasterBox {
    /**
     * The buffer containing the box's vertices
     */
    vertexBuffer: WebGLBuffer;
    /**
     * The indices describing which vertices form a triangle
     */
    indexBuffer: WebGLBuffer;
    /**
     * The buffer containing colors for each vertex
     */
    colorBuffer: WebGLBuffer;
    /**
     * The normals on the surface at each vertex location
     */
    normalBuffer: WebGLBuffer;
    /**
    /**
     * The amount of indices
     */
    elements: number;

    /**
     * Creates all WebGL buffers for the box
     *     6 ------- 7
     *    / |       / |
     *   3 ------- 2  |
     *   |  |      |  |
     *   |  5 -----|- 4
     *   | /       | /
     *   0 ------- 1
     *  looking in negative z axis direction
     * @param gl The canvas' context
     * @param minPoint The minimal x,y,z of the box
     * @param maxPoint The maximal x,y,z of the box
     * @param colors Colors per side of the cube
     */
    constructor(private gl: WebGL2RenderingContext, minPoint: Vector, maxPoint: Vector, baseColor : Vector, extraColors : Array<Vector>, ) {
        this.gl = gl;
        const mi = minPoint;
        const ma = maxPoint;
        const p0 = new Vector(mi.x, mi.y, ma.z, 1);
        const p1 = new Vector(ma.x, mi.y, ma.z, 1);
        const p2 = new Vector(ma.x, ma.y, ma.z,1);
        const p3 = new Vector(mi.x, ma.y, ma.z,1);
        const p4 = new Vector(ma.x, mi.y, mi.z,1);
        const p5 = new Vector(mi.x, mi.y, mi.z,1);
        const p6 = new Vector(mi.x, ma.y, mi.z,1);
        const p7 = new Vector(ma.x, ma.y, mi.z,1)
        let vertices = [
            // front right
            p0.x, p0.y, p0.z,
            p1.x, p1.y, p1.z,
            p2.x, p2.y, p2.z,
            // front left
            p2.x, p2.y, p2.z,
            p3.x, p3.y, p3.z,
            p0.x, p0.y, p0.z,
            // back right
            p4.x, p4.y, p4.z,
            p5.x, p5.y, p5.z,
            p6.x, p6.y, p6.z,
            // back left
            p6.x, p6.y, p6.z,
            p7.x, p7.y, p7.z,
            p4.x, p4.y, p4.z,
            // right right
            p1.x, p1.y, p1.z,
            p4.x, p4.y, p4.z,
            p7.x, p7.y, p7.z,
            // right left
            p7.x, p7.y, p7.z,
            p2.x, p2.y, p2.z,
            p1.x, p1.y, p1.z,
            // top right
            p3.x, p3.y, p3.z,
            p2.x, p2.y, p2.z,
            p7.x, p7.y, p7.z,
            // top left
            p7.x, p7.y, p7.z,
            p6.x, p6.y, p6.z,
            p3.x, p3.y, p3.z,
            // left right
            p5.x, p5.y, p5.z,
            p0.x, p0.y, p0.z,
            p3.x, p3.y, p3.z,
            // left left
            p3.x, p3.y, p3.z,
            p6.x, p6.y, p6.z,
            p5.x, p5.y, p5.z,
            // bottom right
            p5.x, p5.y, p5.z,
            p4.x, p4.y, p4.z,
            p1.x, p1.y, p1.z,
            // bottom left
            p1.x, p1.y, p1.z,
            p0.x, p0.y, p0.z,
            p5.x, p5.y, p5.z
        ];

        let indices = [
            // front right
            0, 1, 2,
            // front left
            3, 4, 5,
            // back right
            6, 7, 8,
            // back left
            9, 10, 11,
            // right right
            12, 13, 14,
            // right left
            15, 16, 17,
            // top right
            18, 19, 20,
            // top left
            21, 22, 23,
            // left right
            24, 25, 26,
            // left left
            27, 28, 29,
            // bottom right
            30, 31, 32,
            // bottom left
            33, 34, 35
        ];

        let vectors : Array<Vector> = []

        for (let i = 0; i < vertices.length-1; i +=3) {
            vectors.push(new Vector(vertices[i],vertices[i+1], vertices[i+2],1));
        }
        let normals = this.calcNormal(vectors);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexBuffer = vertexBuffer;

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.indexBuffer = indexBuffer;
        this.elements = indices.length;

        // For each of the vertices, I add a RGB color
        let colorArray = this.setColors(baseColor, extraColors[0] ||undefined, extraColors[1] || undefined, extraColors[2] || undefined, extraColors[3] || undefined, extraColors[4] || undefined);

        // Creates a new buffer, binds it so we reference the right buffer and then saves the color array to the buffer
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colorArray),gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;

        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        this.normalBuffer = normalBuffer;
    }

    /**     6 ------- 7
     *    / |       / |
     *   3 ------- 2  |
     *   |  |      |  |
     *   |  5 -----|- 4
     *   | /       | /
     *   0 ------- 1
     */
    calcNormal(vertices : Array<Vector>){
       let v = vertices;
        //Normals for faces
        let frontRightNormal = v[2].sub(v[1]).cross(v[0].sub(v[1]));
        let frontLeftNormal = v[5].sub(v[4]).cross(v[3].sub(v[4]));
        let backRightNormal = v[8].sub(v[7]).cross(v[6].sub(v[7]));
        let backLeftNormal = v[11].sub(v[10]).cross(v[9].sub(v[10]));
        let rightRightNormal = v[14].sub(v[13]).cross(v[12].sub(v[13]));
        let rightLeftNormal = v[17].sub(v[16]).cross(v[15].sub(v[16]));
        let topRightNormal = v[20].sub(v[19]).cross(v[18].sub(v[19]));
        let topLeftNormal = v[23].sub(v[22]).cross(v[21].sub(v[22]));
        let leftRightNormal = v[26].sub(v[25]).cross(v[24].sub(v[25]));
        let leftLeftNormal = v[29].sub(v[28]).cross(v[27].sub(v[28]));
        let bottomRightNormal = v[32].sub(v[31]).cross(v[30].sub(v[31]));
        let bottomLeftNormal = v[35].sub(v[34]).cross(v[33].sub(v[34]));

       /* //Normals for Vertices
        let v0Normal = frontLeftNormal.add(frontRightNormal).add(bottomLeftNormal).add(leftRightNormal).normalize();
        let v1Normal = frontRightNormal.add(rightLeftNormal).add(rightRightNormal).add(bottomLeftNormal).add(bottomRightNormal).normalize();
        let v2Normal = frontRightNormal.add(frontLeftNormal).add(rightLeftNormal).add(topRightNormal).normalize();
        let v3Normal = frontLeftNormal.add(topRightNormal).add(topLeftNormal).add(leftLeftNormal).add(leftRightNormal).normalize();
        let v4Normal = backLeftNormal.add(backRightNormal).add(rightLeftNormal).add(bottomRightNormal).normalize();
        let v5Normal = backLeftNormal.add(leftRightNormal).add(leftLeftNormal).add(bottomRightNormal).add(bottomLeftNormal).normalize();
        let v6Normal = backLeftNormal.add(backRightNormal).add(leftRightNormal).add(topLeftNormal).normalize();
        let v7Normal = backRightNormal.add(topLeftNormal).add(topRightNormal).add(rightLeftNormal).add(rightRightNormal).normalize();

        */

        let normalVectors = [frontRightNormal,frontLeftNormal, backRightNormal, backLeftNormal, rightRightNormal, rightLeftNormal,
            topRightNormal, topLeftNormal, leftRightNormal, leftLeftNormal, bottomRightNormal, bottomLeftNormal];
        let normals : Array<number> = [];

        normalVectors.forEach(normal =>{
            normals.push(normal.x);
            normals.push(normal.y);
            normals.push(normal.z);

            normals.push(normal.x);
            normals.push(normal.y);
            normals.push(normal.z);

            normals.push(normal.x);
            normals.push(normal.y);
            normals.push(normal.z);
        })

        return normals;
    }

    random = new Vector(Math.random(),Math.random(),Math.random(),1);
    setColors(front : Vector = this.random, back : Vector, right : Vector, top : Vector,
              left: Vector, bottom : Vector) : Array<number> {
        let colors : Array<number> =[];
        if(back && right && top && left && bottom){
            for (let i = 0; i < 36; i++) {
                if(i >= 0 && i <=5){
                    colors.push(front.x);
                    colors.push(front.y);
                    colors.push(front.z);
                } else if(i >= 6 && i <=11){
                    colors.push(back.x);
                    colors.push(back.y);
                    colors.push(back.z);
                } else if(i >= 12 && i <= 17){
                    colors.push(right.x);
                    colors.push(right.y);
                    colors.push(right.z);
                } else if(i >= 18 && i <= 23){
                    colors.push(top.x);
                    colors.push(top.y);
                    colors.push(top.z);
                }  else if(i >=24 && i <= 29){
                    colors.push(left.x);
                    colors.push(left.y);
                    colors.push(left.z);
                } else if(i >= 30 && i <= 35){
                    colors.push(bottom.x);
                    colors.push(bottom.y);
                    colors.push(bottom.z);
                }
            }
        } else {
            for (let i = 0; i < 36; i++) {
                colors.push(front.x);
                colors.push(front.y);
                colors.push(front.z);
            }
        }

        return colors;
    }

    /**
     * Renders the box
     * @param shader The shader used to render
     */
    render(shader: Shader) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLocation = shader.getAttributeLocation("a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        //https://developer.mozilla.org/de/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL
        //Bind buffer so it knows we are referencing the color buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.colorBuffer);

        //Get color attribute from vertex shader
        const colorAttribute = shader.getAttributeLocation("a_color");

        //Attribute needs to be enabled in order to use it
        this.gl.enableVertexAttribArray(colorAttribute);

        //Use the bound color array buffer and save read values in color attribute
        //Reference buffer, user 3 values at a time, read as float values, do not normalize, how many to skip, where to start
        this.gl.vertexAttribPointer(colorAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer);
        const normalAttribute = shader.getAttributeLocation("a_normal");
        this.gl.enableVertexAttribArray(normalAttribute);
        this.gl.vertexAttribPointer(normalAttribute,3,this.gl.FLOAT,false,0,0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.elements, this.gl.UNSIGNED_SHORT, 0);

        this.gl.disableVertexAttribArray(positionLocation);
        this.gl.disableVertexAttribArray(colorAttribute);
        this.gl.disableVertexAttribArray(normalAttribute);
    }
}