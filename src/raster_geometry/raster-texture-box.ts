import Vector from '../math_library/vector';
import Shader from '../shading/shader';
import Ray from "../math_library/ray";
import Matrix from "../math_library/matrix";
import Intersection from "../math_library/intersection";

/**
 * A class creating buffers for a textured box to render it with WebGL
 */
export default class RasterTextureBox {
    /**
     * The buffer containing the box's vertices
     */
    vertexBuffer: WebGLBuffer;
    /**
     * The buffer containing the box's texture
     */
    texBuffer: WebGLBuffer;
    /**
     * The buffer containing the box's texture coordinates
     */
    texCoords: WebGLBuffer;
    /**
     * The buffer containing the box's texture normals
     */
    normalBuffer: WebGLBuffer;
    /**
     * The buffer containing the box's texture tangents
     */
    tangentBuffer: WebGLBuffer;
    /**
     * The buffer containing the box's texture bitangents
     */
    bitangentBuffer: WebGLBuffer;
    /**
     * The buffer containing the box's texture normals for creating tangent space
     */
    normalTBNBuffer: WebGLBuffer;
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
     * The vertices of the box
     */
    vertices: number[];


    /**
     * Creates all WebGL buffers for the textured box
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
     * @param texture The URL to the image to be used as texture
     * @param normal The URL to the image to be used as normal map
     */
    constructor(private gl: WebGL2RenderingContext, minPoint: Vector, maxPoint: Vector, texture: string, normal: string) {
        const mi = minPoint;
        const ma = maxPoint;
        let vertices = [
            // front
            mi.x, mi.y, ma.z, ma.x, mi.y, ma.z, ma.x, ma.y, ma.z,
            ma.x, ma.y, ma.z, mi.x, ma.y, ma.z, mi.x, mi.y, ma.z,
            // back
            ma.x, mi.y, mi.z, mi.x, mi.y, mi.z, mi.x, ma.y, mi.z,
            mi.x, ma.y, mi.z, ma.x, ma.y, mi.z, ma.x, mi.y, mi.z,
            // right
            ma.x, mi.y, ma.z, ma.x, mi.y, mi.z, ma.x, ma.y, mi.z,
            ma.x, ma.y, mi.z, ma.x, ma.y, ma.z, ma.x, mi.y, ma.z,
            // top
            mi.x, ma.y, ma.z, ma.x, ma.y, ma.z, ma.x, ma.y, mi.z,
            ma.x, ma.y, mi.z, mi.x, ma.y, mi.z, mi.x, ma.y, ma.z,
            // left
            mi.x, mi.y, mi.z, mi.x, mi.y, ma.z, mi.x, ma.y, ma.z,
            mi.x, ma.y, ma.z, mi.x, ma.y, mi.z, mi.x, mi.y, mi.z,
            // bottom
            mi.x, mi.y, mi.z, ma.x, mi.y, mi.z, ma.x, mi.y, ma.z,
            ma.x, mi.y, ma.z, mi.x, mi.y, ma.z, mi.x, mi.y, mi.z
        ];

        this.vertices  = vertices;
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vertexBuffer = vertexBuffer;
        this.elements = vertices.length / 3;

        let cubeTexture = gl.createTexture();
        let cubeImage = new Image();
        cubeImage.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        cubeImage.src = texture;
        this.texBuffer = cubeTexture;

        let cubeNormalTexture = gl.createTexture();
        let cubeNormalImage = new Image();
        cubeNormalImage.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, cubeNormalTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeNormalImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        cubeNormalImage.src = normal;
        this.normalBuffer = cubeNormalTexture;

        let uv = [ //texture coordinates
            // front
            0, 0, 1, 0, 1, 1,
            1, 1, 0, 1, 0, 0,
            // back
            0, 0, 1, 0, 1, 1,
            1, 1, 0, 1, 0, 0,
            // right
            0, 0, 1, 0, 1, 1,
            1, 1, 0, 1, 0, 0,
            // top
            0, 0, 1, 0, 1, 1,
            1, 1, 0, 1, 0, 0,
            // left
            0, 0, 1, 0, 1, 1,
            1, 1, 0, 1, 0, 0,
            // bottom
            0, 0, 1, 0, 1, 1,
            1, 1, 0, 1, 0, 0,
        ];
        let uvBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
        this.texCoords = uvBuffer;

        let vectors : Array<Vector> = []
        for (let i = 0; i < vertices.length; i +=3) {
            vectors.push(new Vector(vertices[i],vertices[i+1], vertices[i+2],1));
        }

        let texCoords : Array<Vector> = [];
        for (let i = 0; i < uv.length; i +=2) {
            texCoords.push(new Vector(uv[i],uv[i+1], 0,0));
        }

        let tangentsBitangentsNormals : Array<Array<number>> = this.calcTangentsBitangentsNormals(vectors, texCoords);
        let tangents = tangentsBitangentsNormals[0];
        let bitangents = tangentsBitangentsNormals[1];
        let tbnNormals = tangentsBitangentsNormals[2];

        let tangentBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);
        this.tangentBuffer = tangentBuffer;

        let bitangentBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bitangentBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(bitangents), gl.STATIC_DRAW);
        this.bitangentBuffer = bitangentBuffer;

        let tbnNormalBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tbnNormalBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(tbnNormals),gl.STATIC_DRAW);
        this.normalTBNBuffer = tbnNormalBuffer;

        this.createBoundingSphere(vertices);
    }


    /**
     * Function calculating everything needed to make the transformation Matrix for Tangent Space.
     * This is used in order to convert the normals of the normal map image from its own, Tangent, space into world space,
     * this way we can make the lighting calculation as used for other geometries.
     * Thus we calculate the Tangent, Bitangent and Normal of each Triangle
     * @param vertices The vertices of the cube
     * @param texCoords The texture coordinates for both texture images
     * @return Array<Array<number>> Returns an Array, filled with array of the tangent, bitangent and normals
     */
    //Calculations taken from https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    calcTangentsBitangentsNormals(vertices : Array<Vector>, texCoords : Array<Vector>) : Array<Array<number>>{
        let tangentsVectors : Array<Vector> = [];
        let bitangetsVectors : Array<Vector> = [];
        let normalVectors : Array<Vector> = [];

        for (let i = 0; i < vertices.length; i+=3) {
            let pos1 = vertices[i];
            let pos2 = vertices[i+1];
            let pos3 = vertices[i+2];

            let uv1 = texCoords[i];
            let uv2 = texCoords[i+1];
            let uv3 = texCoords[i+2];

            let edge1 = pos2.sub(pos1);
            let edge2 = pos3.sub(pos1);
            let deltaUV1 = uv2.sub(uv1);
            let deltaUV2 = uv3.sub(uv1);

            let fraction = 1.0/(deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);
            let tangent = new Vector(0,0,0,1);
            let bitangent = new Vector(0,0,0,1);

            tangent.x = fraction * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x);
            tangent.y = fraction * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y);
            tangent.z = fraction * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z);

            bitangent.x = fraction * (deltaUV1.x * edge2.x - deltaUV2.x * edge1.x);
            bitangent.y = fraction * (deltaUV1.x * edge2.y - deltaUV2.x * edge1.y);
            bitangent.z = fraction * (deltaUV1.x * edge2.z - deltaUV2.x * edge1.z);

            tangentsVectors.push(tangent);
            bitangetsVectors.push(bitangent);
            normalVectors.push(edge1.cross(edge2));
        }

        let normalIndices : Array<number> = [];
        normalVectors.forEach(normal => {
            normalIndices.push(normal.x);
            normalIndices.push(normal.y);
            normalIndices.push(normal.z);

            normalIndices.push(normal.x);
            normalIndices.push(normal.y);
            normalIndices.push(normal.z);

            normalIndices.push(normal.x);
            normalIndices.push(normal.y);
            normalIndices.push(normal.z);
        })

        let tangentIndices : Array<number> = [];
        tangentsVectors.forEach(vector =>{
            tangentIndices.push(vector.x);
            tangentIndices.push(vector.y);
            tangentIndices.push(vector.z);

            tangentIndices.push(vector.x);
            tangentIndices.push(vector.y);
            tangentIndices.push(vector.z);

            tangentIndices.push(vector.x);
            tangentIndices.push(vector.y);
            tangentIndices.push(vector.z);
        });

        let bitangentIndices : Array<number> = [];
        bitangetsVectors.forEach(vector =>{
            bitangentIndices.push(vector.x);
            bitangentIndices.push(vector.y);
            bitangentIndices.push(vector.z);

            bitangentIndices.push(vector.x);
            bitangentIndices.push(vector.y);
            bitangentIndices.push(vector.z);

            bitangentIndices.push(vector.x);
            bitangentIndices.push(vector.y);
            bitangentIndices.push(vector.z);
        });

        return [tangentIndices,bitangentIndices, normalIndices];
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
     * Renders the textured box
     * @param {Shader} shader - The shader used to render
     */
    render(shader: Shader) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLocation = shader.getAttributeLocation("a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        // Bind the texture coordinates in this.texCoords
        // to their attribute in the shader
        //https://developer.mozilla.org/de/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.texCoords);
        const textureAttribute = shader.getAttributeLocation("a_texCoord");
        this.gl.enableVertexAttribArray(textureAttribute);
        this.gl.vertexAttribPointer(textureAttribute,2,this.gl.FLOAT,false,0,0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.tangentBuffer);
        const tangentAttribute = shader.getAttributeLocation("a_tangent");
        this.gl.enableVertexAttribArray(tangentAttribute);
        this.gl.vertexAttribPointer(tangentAttribute,3,this.gl.FLOAT,false,0,0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.bitangentBuffer);
        const bitangentAttribute = shader.getAttributeLocation("a_bitangent");
        this.gl.enableVertexAttribArray(bitangentAttribute);
        this.gl.vertexAttribPointer(bitangentAttribute,3,this.gl.FLOAT,false,0,0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalTBNBuffer);
        const tbnNormalAttribute = shader.getAttributeLocation("a_tbnNormal");
        this.gl.enableVertexAttribArray(tbnNormalAttribute);
        this.gl.vertexAttribPointer(tbnNormalAttribute,3,this.gl.FLOAT,false,0,0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texBuffer);
        shader.getUniformInt("colorSampler").set(0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.normalBuffer);
        shader.getUniformInt("normalSampler").set(1);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

        this.gl.disableVertexAttribArray(positionLocation);
        this.gl.disableVertexAttribArray(textureAttribute);
        this.gl.disableVertexAttribArray(tangentAttribute);
        this.gl.disableVertexAttribArray(bitangentAttribute);
        this.gl.disableVertexAttribArray(tbnNormalAttribute);

    }

    updateColor(texture: string){
        let gl = this.gl;

        let cubeTexture = gl.createTexture();
        let cubeImage = new Image();
        cubeImage.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        cubeImage.src = texture;
        this.texBuffer = cubeTexture;
    }
}