import Shader from "../shading/shader";
import Vector from "../math_library/vector";
import Ray from "../math_library/ray";
import Matrix from "../math_library/matrix";
import Intersection from "../math_library/intersection";

export class RasterObj {
    /**
     * The buffer containing the objects vertices
     */
    vertexBuffer: WebGLBuffer;

    /**
     * The buffer containing the objects normals
     */
    normalBuffer: WebGLBuffer;

    /**
     * The buffer containing the objects indices
     */
    indexBuffer: WebGLBuffer;

    /**
     * The buffer containing the objects colors
     */
    colorBuffer: WebGLBuffer;

    /**
     * The amount of faces
     */
    elements: number;

    /**
     * The center of the bounding sphere
     */
    center: Vector;

    /**
     * The radius of the bounding sphere
     */
    radius: number;

    /**
     * The objects vertices
     */
    vertices: Array<number>;

    //https://www.toptal.com/javascript/3d-graphics-a-webgl-tutorial
    constructor(private gl: WebGL2RenderingContext, objLines: string[]) {
        this.gl = gl;
        let POS = /^v\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
        let NORM = /^vn\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
        let FACE = /^f\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+)\/(-?\d+))?/

        let initialVertices: Array<number> = [];
        let initialNormals: Array<number> = [];

        let verticesIndices: Array<number> = [];
        let normalIndices: Array<number> = [];
        let vertices: Array<number> = [];
        let normals: Array<number> = [];
        let indices: Array<number> = [];

        objLines.forEach(function (line) {
            // Match each line of the file against various RegEx-es
            var result;
            if ((result = POS.exec(line)) != null) {
                // Add new vertex position
                initialVertices.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            } else if ((result = NORM.exec(line)) != null) {
                // Add new vertex normal
                initialNormals.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            } else if ((result = FACE.exec(line)) != null) {

                // Save the indices for the initial vertices and normals
                for (var i = 1; i < 10; i += 3) {
                    var part = result.slice(i, i + 3)
                    verticesIndices.push(parseInt(part[0]) - 1);
                    normalIndices.push(parseInt(part[2]) - 1);
                }
            }
        });

        verticesIndices.forEach(function (num) {
            vertices.push(initialVertices[num * 3], initialVertices[num * 3 + 1], initialVertices[num * 3 + 2]);
            let length = indices.length;
            indices.push(length);
        });
        normalIndices.forEach(num => {
            normals.push(initialNormals[num * 3], initialNormals[num * 3 + 1], initialNormals[num * 3 + 2]);
        });

        this.vertices = vertices;

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexBuffer = vertexBuffer;

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.indexBuffer = indexBuffer;
        this.elements = indices.length;

        let colorArray = [];
        let c1 = 0.4;
        let c2 = 0.4;
        let c3 = 0.4;
        for (let i = 0; i < indices.length; i++) {
            colorArray.push(c1, c2, c3);
        }

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray), gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;

        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        this.normalBuffer = normalBuffer;

        this.createBoundingSphere(vertices);
    }

    /**
     * Calculates center and radius of the bounding sphere of the object
     * @param vertices The vertices of the object
     */
    // With Ritter Algorithm: https://www.researchgate.net/publication/242453691_An_Efficient_Bounding_Sphere
    createBoundingSphere(vertices : Array<number>){
        let xmin = new Vector(1000,1000,1000,1);
        let xmax = new Vector(-1000,-1000,-1000,1);
        let ymin = new Vector(1000,1000,1000,1);
        let ymax = new Vector(-1000,-1000,-1000,1);
        let zmin = new Vector(1000,1000,1000,1);
        let zmax = new Vector(-1000,-1000,-1000,1);

        for (let i = 0; i < vertices.length; i+=3) {
            let x = vertices[i];
            let y = vertices[i+1];
            let z = vertices[i+2];

            if(x < xmin.x){
                xmin = new Vector(x,y,z,1);
            }
            if (x > xmax.x){
                xmax = new Vector(x,y,z,1);
            }
            if(y < ymin.y){
                ymin = new Vector(x,y,z,1);
            }
            if (y > ymax.y){
                ymax = new Vector(x,y,z,1);
            }
            if(z < zmin.z){
                zmin = new Vector(x,y,z,1);
            }
            if (z > zmax.z){
                zmax = new Vector(x,y,z,1);
            }

        }

        let dx;
        let dy;
        let dz;

        /* Set xspan = distance between the 2 points xmin & xmax (squared) */
        dx = xmax.x - xmin.x;
        dy = xmax.y - xmin.y;
        dz = xmax.z - xmin.z;
        let xspan = dx*dx + dy*dy + dz*dz;

        /* Same for y & z spans */
        dx = ymax.x - ymin.x;
        dy = ymax.y - ymin.y;
        dz = ymax.z - ymin.z;
        let yspan = dx*dx + dy*dy + dz*dz;

        dx = zmax.x - zmin.x;
        dy = zmax.y - zmin.y;
        dz = zmax.z - zmin.z;
        let zspan = dx*dx + dy*dy + dz*dz;

        /* Set points diameter1 & diameter2 to the maximally separated pair */
        let diameter1 = xmin;
        let diameter2 = xmax; /* assume xspan biggest */
        let maxspan = xspan;
        if (yspan>maxspan){
            maxspan = yspan;
            diameter1 = ymin;
            diameter2 = ymax;
        }
        if (zspan>maxspan) {
            diameter1 = zmin;
            diameter2 = zmax;
        }

        let center = new Vector(0,0,0,1);
        /* diameter1,diameter2 is a diameter of initial sphere */
        /* calc initial center */
        center.x = (diameter1.x+diameter2.x)/2.0;
        center.y = (diameter1.y+diameter2.y)/2.0;
        center.z = (diameter1.z+diameter2.z)/2.0;

        /* calculate initial radius**2 and radius */
        dx = diameter2.x-center.x; /* x component of radius vector */
        dy = diameter2.y-center.y; /* y component of radius vector */
        dz = diameter2.z-center.z; /* z component of radius vector */
        let radius_sq = dx*dx + dy*dy + dz*dz;
        let radius = Math.sqrt(radius_sq);

        this.center = center;
        this.radius = radius;

        for (let i=0; i<vertices.length;i+=3) {
            let x = vertices[i];
            let y = vertices[i+1];
            let z = vertices[i+2];
            dx = x-center.x;
            dy = y-center.y;
            dz = z-center.z;
            let old_to_p_sq = dx*dx + dy*dy + dz*dz;
            if (old_to_p_sq > radius_sq){ /* do r**2 test first */
                /* this point is outside of current sphere */
                let old_to_p = Math.sqrt(old_to_p_sq);
                /* calc radius of new sphere */
                radius = (radius + old_to_p) / 2.0;
                radius_sq = radius*radius; 	/* for next r**2 compare */
                let old_to_new = old_to_p - radius;
                /* calc center of new sphere */
                center.x = (radius*center.x + old_to_new*x) / old_to_p;
                center.y = (radius*center.y + old_to_new*y) / old_to_p;
                center.z = (radius*center.z + old_to_new*z) / old_to_p;

                this.center = center;
                this.radius = radius;
            }
        }

    }

    /**
     * Puts all Triangles in a separate array and multiplies each vertex with the model matrix to transfer it into word coordinate system
     * @param ray The mouseray
     * @param matrix The model Matrix
     */
    prepareHitTest(ray: Ray, matrix : Matrix) : Intersection{
        let triangles : Array<Array<Vector>> = [];
        for (let i = 0; i < this.vertices.length; i+=9) {
            let triangle : Array<Vector> = [];
            let v1 = matrix.mulVec(new Vector(this.vertices[i],this.vertices[i+1],this.vertices[i+2],1));
            let v2 = matrix.mulVec(new Vector(this.vertices[i+3],this.vertices[i+4],this.vertices[i+5],1));
            let v3 = matrix.mulVec(new Vector(this.vertices[i+6],this.vertices[i+7],this.vertices[i+8],1));
            triangle.push(v1, v2, v3);
            triangles.push(triangle);
        }

        let hit : Intersection = null;
        for (let i = 0; i < triangles.length; i++) {
            let closestHit : Intersection = null;
            let result : Intersection = this.isTriangleHit(ray, triangles[i]);
            if(result != null){
                if(!closestHit){
                    hit = result;
                }else {
                    if(result.closerThan(closestHit)){
                        closestHit = result;
                    }
                }
            }
        }
        return hit;
    }
    /**
     * Calculates, if the given triangle is being hit by the mouseray
     * @param ray The mouseray of the click
     * @param triangle The triangle to intersect
     */
    // With the Möller-Trumbore Algorithm: https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/moller-trumbore-ray-triangle-intersection
    isTriangleHit(ray: Ray, triangle: Array<Vector>) : Intersection{
        let v0 : Vector = triangle[0];
        let v1 : Vector = triangle[1];
        let v2 : Vector = triangle[2];

        let edge1 : Vector = v1.sub(v0);
        let edge2 : Vector = v2.sub(v0);

        let pvec : Vector= ray.direction.cross(edge2);
        let determinant : number = edge1.dot(pvec);

        // Checks if the ray is behind the triangle
        if(determinant < 0.001) {
            return null;
        }

        // Checks if the ray is parallel to the triangle
        if(Math.abs(determinant) < 0.001) {
            return null;
        }

        let inverseDeterminant : number = 1/determinant;

        let tvec : Vector = ray.origin.sub(v0);
        let u : number = tvec.dot(pvec) * inverseDeterminant;

        if(u < 0 || u > 1) {
            return null;
        }

        let qvec : Vector = tvec.cross(edge1);
        let v : number = ray.direction.dot(qvec) * inverseDeterminant;

        if(v < 0 || u + v > 1) {
            return null;
        }

        let t : number = edge2.dot(qvec) * inverseDeterminant;
        let point : Vector = ray.origin.add(ray.direction.mul(t));

        return new Intersection(t,point,undefined);
    }


    render(shader: Shader) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLocation = shader.getAttributeLocation("a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        //https://developer.mozilla.org/de/docs/Web/API/WebGL_API/Tutorial/Using_shaders_to_apply_color_in_WebGL
        //Bind buffer so it knows we are referencing the color buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);

        //Get color attribute from vertex shader
        const colorAttribute = shader.getAttributeLocation("a_color");

        //Attribute needs to be enabled in order to use it
        this.gl.enableVertexAttribArray(colorAttribute);

        //Use the bound color array buffer and save read values in color attribute
        //Reference buffer, user 3 values at a time, read as float values, do not normalize, how many to skip, where to start
        this.gl.vertexAttribPointer(colorAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        const normalAttribute = shader.getAttributeLocation("a_normal");
        this.gl.enableVertexAttribArray(normalAttribute);
        this.gl.vertexAttribPointer(normalAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.elements, this.gl.UNSIGNED_SHORT, 0);

        this.gl.disableVertexAttribArray(positionLocation);
        this.gl.disableVertexAttribArray(colorAttribute);
        this.gl.disableVertexAttribArray(normalAttribute);
    }

    updateColor(color: Vector){
        let colorArray = [];
        for (let i = 0; i < this.elements; i++) {
            colorArray.push(color.x, color.y, color.z);
        }

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(colorArray),this.gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;
    }


}