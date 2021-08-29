import Vector from '../math_library/vector';
import Shader from '../shading/shader';

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
}