import Vector from '../math_library/vector';
import Shader from '../shading/shader';
import Ray from "../math_library/ray";
import Matrix from "../math_library/matrix";
import Intersection from "../math_library/intersection";

/**
 * A class creating buffers for a pyramid to render it with WebGL
 */
export default class RasterPyramid {
    /**
     * The buffer containing the pyramid's vertices
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
     * The amount of indices
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
     * The pyramids vertices
     */
    vertices: Array<number>;
    /**
     * Creates all WebGL buffers for the pyramid
     *          top
     *        /  \ \
     *      / /   \  \
     *    / b4 ----\---b3
     *  / /         \ /
     * b1 ----------- b2
     *
     * looking in negative z axis direction
     * @param gl The canvas' context
     * @param topPoint The top, highest point of the box
     * @param baseColor The base color of the pyramid
     * @param extraColors If given, colors for the other 4 sides of the pyramid
     */
    constructor(private gl: WebGL2RenderingContext, topPoint: Vector, baseColor : Vector, extraColors : Array<Vector> = undefined) {
        this.gl = gl;
        const top = topPoint;
        const b1 = new Vector(top.x-0.5,top.y-1,top.z+0.5, 1);
        const b2 = new Vector(top.x+0.5,top.y-1,top.z+0.5, 1);
        const b3 = new Vector(top.x+0.5,top.y-1,top.z-0.5, 1);
        const b4 = new Vector(top.x-0.5,top.y-1,top.z-0.5, 1);

        var vertices = [
            //Front
            top.x,top.y,top.z,
            b1.x, b1.y, b1.z,
            b2.x, b2.y, b2.z,
            //Right
            top.x,top.y,top.z,
            b2.x, b2.y, b2.z,
            b3.x, b3.y, b3.z,
            //Back
            top.x,top.y,top.z,
            b3.x, b3.y, b3.z,
            b4.x, b4.y, b4.z,
            //Left
            top.x,top.y,top.z,
            b4.x, b4.y, b4.z,
            b1.x, b1.y, b1.z,
            //Bottom right
            b2.x, b2.y, b2.z,
            b1.x, b1.y, b1.z,
            b3.x, b3.y, b3.z,
            //Bottom left
            b4.x, b4.y, b4.z,
            b3.x, b3.y, b3.z,
            b1.x, b1.y, b1.z,
        ]

        this.vertices = vertices;
        let normals =  this.calcNormal([top,b1,b2,b3,b4]);

        let indices = [
            // Front
            0, 1, 2,
            // Right
            3, 4, 5,
            // Back
            6, 7, 8,
            // Left
            9, 10, 11,
            // Bottom right
            12, 13, 14,
            // Bottom left
            15, 16, 17
        ];

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
        let colorArray = this.setColors(baseColor || undefined, extraColors[0] ||undefined, extraColors[1] || undefined, extraColors[2] || undefined, extraColors[3] || undefined);

        // Creates a new buffer, binds it so we reference the right buffer and then saves the color array to the buffer
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colorArray),gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;

        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        this.normalBuffer = normalBuffer;

        this.createBoundingSphere(vertices);
    }

    /**
     * Calculates the normals for each vertex in the vertex buffer
     * @param vertices Vertices of the pyramid
     * @return Array<number> Coordinates of the normals
     */
    //Based on https://stackoverflow.com/questions/13205226/most-efficient-algorithm-to-calculate-vertex-normals-from-set-of-triangles-for-g
    calcNormal(vertices : Array<Vector>) : Array<number>{
        let top = vertices[0];
        let b1 = vertices[1];
        let b2 = vertices[2];
        let b3 = vertices[3];
        let b4 = vertices[4];

        //Normals for faces
        let frontNormal = b1.sub(top).cross(b2.sub(top));
        let rightNormal = b2.sub(top).cross(b3.sub(top));
        let backNormal = b3.sub(top).cross(b4.sub(top));
        let  leftNormal = b4.sub(top).cross(b1.sub(top));
        let bottomLeftNormal = b3.sub(b4).cross(b1.sub(b4));
        let bottomRightNormal = b1.sub(b2).cross(b3.sub(b2));

        let normalVectors = [frontNormal,rightNormal, backNormal, leftNormal, bottomRightNormal, bottomLeftNormal];
        let normals : Array<number> = [];

        normalVectors.forEach(normal =>{ //brauchen gleiche Normalen für jeden Vertex eines Dreiecks (deswegen dreimal die gleichen Werte pushen)
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

    /**
     * Random color, in case no color is given
     */
    randomColor = new Vector(Math.random(),Math.random(),Math.random(),1);
    /**
     * Sets the colors for each side of the pyramid, if no additional color are given it is colored in color1 or random color
     * @param color1 Base color of the pyramid, used for all 6 faces if there are no or incomplete additional colors
     * @param color2 Second color
     * @param color3 Third color
     * @param color4 Fourth color
     * @param color5 Fifth color
     * @return Array<number> Color Values for the buffer
     */
    setColors(color1 : Vector = this.randomColor, color2 : Vector, color3 : Vector, color4 : Vector, color5: Vector) : Array<number> {
        let colors : Array<number> = [];
        if(color2 && color3 && color4 && color5){
            for (let i = 0; i < 18; i++) {
                if(i === 0 || i === 3 || i === 6 || i === 9){ //verschiedene Indizes bilden den selben "Eck-Punkt" in der Pyramide ab
                    colors.push(color1.x);
                    colors.push(color1.y);
                    colors.push(color1.z);
                } else if(i === 1 || i === 11 || i === 13 || i === 17){
                    colors.push(color2.x);
                    colors.push(color2.y);
                    colors.push(color2.z);
                } else if(i === 2 || i === 4 || i === 12){
                    colors.push(color3.x);
                    colors.push(color3.y);
                    colors.push(color3.z);
                } else if(i === 5 || i === 7 || i === 14 || i === 16){
                    colors.push(color4.x);
                    colors.push(color4.y);
                    colors.push(color4.z);
                } else if(i === 8 || i === 10 || i === 15){
                    colors.push(color5.x);
                    colors.push(color5.y);
                    colors.push(color5.z);
                }
            }
        } else {
            for (let i = 0; i < 18; i++) {
                colors.push(color1.x);
                colors.push(color1.y);
                colors.push(color1.z);
            }
        }

        return colors;
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

    /**
     * Renders the pyramid
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

    updateColor(color: Vector, extraColors:Array<Vector> = undefined ){
        let colorArray = this.setColors(color || undefined, extraColors[0] ||undefined, extraColors[1] || undefined, extraColors[2] || undefined, extraColors[3] || undefined);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(colorArray),this.gl.STATIC_DRAW);
        this.colorBuffer = colorBuffer;
    }
}