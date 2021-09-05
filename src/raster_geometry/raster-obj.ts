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
     * The amount of faces
     */
    elements: number;

    //TODO: Obj Source beim erstellen mitgeben und sowas
    //https://www.toptal.com/javascript/3d-graphics-a-webgl-tutorial
    constructor(private gl: WebGL2RenderingContext, src: String) {
        this.gl = gl;
        let POS = /^v\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
        let NORM = /^vn\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
        let UV = /^vt\s+([\d\.\+\-eE]+)\s+([\d\.\+\-eE]+)/
        // let FACE = /^f\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+)\/(-?\d+))?/

        let lines = src.split('\n');
        let positions: Array<number> = [];
        let uvs: Array<number> = [];
        let normals: Array<number> = [];
        // let faces:Array<number> = [];
        lines.forEach(function (line) {
            // Match each line of the file against various RegEx-es
            var result;
            if ((result = POS.exec(line)) != null) {
                // Add new vertex position
                positions.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            } else if ((result = NORM.exec(line)) != null) {
                // Add new vertex normal
                normals.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            } else if ((result = UV.exec(line)) != null) {
                // Add new texture mapping point
                uvs.push(parseFloat(result[1]), 1 - parseFloat(result[2]));
            }
            /* else if ((result = FACE.exec(line)) != null) {
                // Add new face
                var vert = []
                // Create three vertices from the passed one-indexed indices
                for (var i = 1; i < 10; i += 3) {
                    var part = result.slice(i, i + 3)
                    var position = vertices[parseInt(part[0]) - 1]
                    var uv = uvs[parseInt(part[1]) - 1]
                    var normal = normals[parseInt(part[2]) - 1]
                    vert.push(new Vertex(position, normal, uv))
                }
                faces.push(new Face(vert))
            }

             */
        });
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        this.vertexBuffer = vertexBuffer;
        this.elements = positions.length / 3;

        const normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        this.normalBuffer = normalBuffer;

        let uvBuffer = this.gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        this.texCoords = uvBuffer;
    }

    render(shader: Shader) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLocation = shader.getAttributeLocation("a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normalBuffer);
        const normalAttribute = shader.getAttributeLocation("a_normal");
        this.gl.enableVertexAttribArray(normalAttribute);
        this.gl.vertexAttribPointer(normalAttribute,3,this.gl.FLOAT,false,0,0);

        //weiß nicht genau, ob man hier die Texturen auch an Buffer binden muss wie in raster-texture-box
        //mit dem bitangent zeug aber texturen müssen ja bei objs nicht unterstützt werden

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

        this.gl.disableVertexAttribArray(positionLocation);
        this.gl.disableVertexAttribArray(normalAttribute);
    }
}