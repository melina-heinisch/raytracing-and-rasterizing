import Shader from "../shading/shader";

export class RasterObj{
    /**
     * The buffer containing the box's vertices
     */
    vertexBuffer: WebGLBuffer;

    texCoords: WebGLBuffer;
    /**
     * The buffer containing the box's texture normals
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

    //TODO: Obj Source beim erstellen mitgeben und sowas
    //https://www.toptal.com/javascript/3d-graphics-a-webgl-tutorial
    constructor(private gl: WebGL2RenderingContext, src: String) {
        this.gl = gl;
        let POS = /^v\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
        let NORM = /^vn\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
        let FACE = /^f\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+)\/(-?\d+))?/

        let lines = src.split('\n');


        let initialVertices: Array<number> = [];
        let initialNormals: Array<number> = [];

        let vertices: Array<number> = [];
        let normals: Array<number> = [];
        let indices: Array<number> = [];
        lines.forEach(function (line) {
            // Match each line of the file against various RegEx-es
            var result;
            if ((result = POS.exec(line)) != null) {
                // Add new vertex position
                initialVertices.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            } else if ((result = NORM.exec(line)) != null) {
                // Add new vertex normal
                initialNormals.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            }
             else if ((result = FACE.exec(line)) != null) {

                // Create three vertices from the passed one-indexed indices
                for (var i = 1; i < 10; i += 3) {
                    var part = result.slice(i, i + 3)
                    vertices.push(initialVertices[parseInt(part[0])-1]);
                    normals.push(initialNormals[parseInt(part[2])-1]);
                    indices.push(parseInt(part[0]));
                }
            }

        });
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
        let colorArray = [];
        for (let i = 0; i < indices.length/3; i++) {
            colorArray.push(Math.random(), Math.random(), Math.random());
        }
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