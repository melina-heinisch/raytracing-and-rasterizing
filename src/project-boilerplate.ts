import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from './math_library/vector';
import {
    AABoxNode,
    GroupNode, LightNode, PyramidNode,
    SphereNode,
    TextureBoxNode
} from './nodes/nodes';
import {
    RasterVisitor,
    RasterSetupVisitor, RasterLightVisitor
} from './visitors/rastervisitor';
import Shader from './shading/shader';
import {
    DriverNode,
    JumperNode,
    RotationNode
} from './nodes/animation-nodes';
import phongVertexShader from './shading/phong-vertex-perspective-shader.glsl';
import phongFragmentShader from './shading/phong-fragment-shader.glsl';
import textureVertexShader from './shading/texture-vertex-perspective-shader.glsl';
import textureFragmentShader from './shading/texture-fragment-shader.glsl';
import {Rotation, Scaling, Translation} from './math_library/transformation';
import RasterBox from "./raster_geometry/raster-box";
import RayVisitor, {RayLightVisitor} from "./visitors/rayvisitor";
import {XMLParser} from "./xmlParser";

window.addEventListener('load', () => {

    let scenegraph : GroupNode;
    let isRasterizer = true;
    let animationHandle: number;
    let parser : XMLParser= new XMLParser();
    let animationNodes : (DriverNode | JumperNode | RotationNode)[] = [];
   // document.getElementById("yDirection").style.color = "limegreen";

    function simulate(deltaT: number) {
        for (let animationNode of animationNodes) {
            animationNode.simulate(deltaT);
        }
    }

    loadXMLScenegraph();

    //https://www.w3schools.com/xml/met_element_getattribute.asp
    //Only works when rendering is started in this function
    // as otherwise the scenegraph is not loaded yet


    document.getElementById('upload').addEventListener('click',function (){
        let event = new MouseEvent('click', {bubbles: false});
        document.getElementById('uploadInput').dispatchEvent(event);
    });

    // Picked together from https://stackoverflow.com/questions/3103962/converting-html-string-into-dom-elements and https://stackoverflow.com/questions/14155310/upload-file-as-string-to-javascript-variable
    document.getElementById('uploadInput').addEventListener('change',function (){
        //@ts-ignore
        let files = this.files;
        if (files.length === 0) {
            alert('Es wurde keine Datei ausgewählt.');
        }

        let reader = new FileReader();
        reader.onload = function(event) {
            let result = event.target.result.toString();
            let doc = new DOMParser().parseFromString(result, "text/xml");
            let children = doc.childNodes;
            parser = new XMLParser();
            parser.createAndVisitChildren(children);
            animationNodes = parser.animationNodes;
            scenegraph = parser.head;
            render()
        };
        reader.readAsText(files[0]);
    })

    function loadXMLScenegraph(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var xmlDoc = this.responseXML;
                let children = xmlDoc.childNodes;
                parser.createAndVisitChildren(children);
                animationNodes = parser.animationNodes;
                scenegraph = parser.head;
                render()
            }
        };
        xhttp.open("GET", 'scenegraph.xml', true);
        xhttp.send();
    }

    function render(){
        if(isRasterizer){
            renderRasterizer(scenegraph);
        } else{
            renderRaytracer(scenegraph);
        }
    }

    window.addEventListener('keydown', function (event) {
        switch (event.key) {
            case "4":
                animationNodes.forEach(node =>{
                    if(node instanceof JumperNode) {
                        node.toggleActive();
                        if (node.active) {
                            document.getElementById("toggleJumper").style.color = "limegreen";
                            document.getElementById("toggleJumper").innerText = "Jumper ausschalten = 4";
                        } else {
                            document.getElementById("toggleJumper").style.color = "black";
                            document.getElementById("toggleJumper").innerText = "Jumper einschalten = 4";
                        }
                    }
                })
                break;
            case "5":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.toggleActive();
                        if(node.active){
                            document.getElementById("toggleDriver").style.color = "limegreen";
                            document.getElementById("toggleDriver").innerText = "Driver ausschalten = 5";
                        }else{
                            document.getElementById("toggleDriver").style.color = "black";
                            document.getElementById("toggleDriver").innerText = "Driver einschalten = 5";
                        }
                    }

                })
                break;
            case "6":
                animationNodes.forEach(node =>{
                    if(node instanceof RotationNode){
                        node.toggleActive();
                        if(node.active){
                            document.getElementById("toggleRotor").style.color = "limegreen";
                            document.getElementById("toggleRotor").innerText = "Rotor ausschalten = 6";
                        }else{
                            document.getElementById("toggleRotor").style.color = "black";
                            document.getElementById("toggleRotor").innerText = "Rotor einschalten = 6";
                        }
                    }
                })
                break;
            case "r":
                isRasterizer = true;
                window.cancelAnimationFrame(animationHandle);
                renderRasterizer(scenegraph);
                document.getElementById("rasterCaption").style.color = "limegreen";
                document.getElementById("rayCaption").style.color = "black";
                break;

            case "t":
                isRasterizer = false;
                window.cancelAnimationFrame(animationHandle);
                renderRaytracer(scenegraph)
                document.getElementById("rayCaption").style.color = "limegreen";
                document.getElementById("rasterCaption").style.color = "black";
                break;

            case "1":
                for (let i = 0; i < animationNodes.length; i++) {
                    if(animationNodes[i] instanceof JumperNode){
                        animationNodes[i].axis = new Vector(1,0,0,1);
                    }
                }
                document.getElementById("xDirection").style.color = "limegreen";
                document.getElementById("yDirection").style.color = "black";
                document.getElementById("zDirection").style.color = "black";
                break;

            case "2":
                for (let i = 0; i < animationNodes.length; i++) {
                    if(animationNodes[i] instanceof JumperNode){
                        animationNodes[i].axis = new Vector(0,1,0,1);
                    }
                }
                document.getElementById("xDirection").style.color = "black";
                document.getElementById("yDirection").style.color = "limegreen";
                document.getElementById("zDirection").style.color = "black";
                break;

            case "3":
                for (let i = 0; i < animationNodes.length; i++) {
                    if(animationNodes[i] instanceof JumperNode){
                        animationNodes[i].axis = new Vector(0,0,1,1);
                    }
                }
                document.getElementById("xDirection").style.color = "black";
                document.getElementById("yDirection").style.color = "black";
                document.getElementById("zDirection").style.color = "limegreen";
                break;

            case "w":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode) {
                        node.yPosActive = true;
                    }
                })
                break;

            case "s":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.yNegActive = true;
                    }
                })
                break;

            case "d":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xPosActive = true;
                    }
                })
                break;

            case "a":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xNegActive = true;
                    }
                })

        }
    });

    window.addEventListener('keyup', function (event) {
        switch (event.key) {
            case "w":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.yPosActive = false;
                    }
                })
                break;
            case "s":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.yNegActive = false;
                    }
                })
                break;
            case "d":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xPosActive = false;
                    }
                })
                break;
            case  "a":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xNegActive = false;
                    }
                })
                break;
        }
    });

    function renderRasterizer(scenegraph : GroupNode){
        const rayCanvas = document.getElementById("rayCanvas") || null;
        if(rayCanvas){
            rayCanvas.remove();
        }
        const frame = document.getElementById("canvasFrame");
        const canvasElement = document.createElement("canvas");
        canvasElement.classList.add("figure-img", "mx-auto", "d-block", "rounded");
        canvasElement.width = 600;
        canvasElement.height = 600;
        canvasElement.id = "rasterCanvas";
        frame.appendChild(canvasElement);

        const canvas = document.getElementById("rasterCanvas") as HTMLCanvasElement;
        const gl = canvas.getContext("webgl2");
        const setupVisitor = new RasterSetupVisitor(gl);
        setupVisitor.setup(scenegraph);

        let camera = {
            eye: new Vector(0, 0, 1, 1),
            center: new Vector(0, 0, 0, 1),
            up: new Vector(0, 1, 0, 0),
            fovy: 60,
            aspect: canvas.width / canvas.height,
            near: 0.1,
            far: 100
        };

        const phongShader = new Shader(gl,
            phongVertexShader,
            phongFragmentShader
        );
        const textureShader = new Shader(gl,
            textureVertexShader,
            textureFragmentShader
        );
        const visitor = new RasterVisitor(gl, phongShader, textureShader, setupVisitor.objects);

        let lastTimestamp = performance.now();

        function animate(timestamp: number) {
            if(isRasterizer){
                simulate(timestamp - lastTimestamp);
                const lighVisitor = new RasterLightVisitor();
                lighVisitor.setup(scenegraph);
                visitor.render(scenegraph, camera, lighVisitor.lightPositions);
                lastTimestamp = timestamp;
                animationHandle = window.requestAnimationFrame(animate);
            }
        }
        Promise.all(
            [phongShader.load(), textureShader.load()]
        ).then(x =>
            animationHandle = window.requestAnimationFrame(animate)
        );

    }

    function renderRaytracer(scenegraph : GroupNode){
        const rasterCanvas = document.getElementById("rasterCanvas") || null;

        if(rasterCanvas){
            rasterCanvas.remove();
        }

        const frame = document.getElementById("canvasFrame");
        const canvasElement = document.createElement("canvas");
        canvasElement.classList.add("figure-img", "mx-auto", "d-block", "rounded");
        canvasElement.width = 600;
        canvasElement.height = 600;
        canvasElement.id = "rayCanvas";
        frame.appendChild(canvasElement);
        const canvas = document.getElementById("rayCanvas") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d");

        const camera = {
            origin: new Vector(0, 0, 1, 1),
            width: canvas.width,
            height: canvas.height,
            alpha: Math.PI / 3
        }

        const visitor = new RayVisitor(ctx, canvas.width, canvas.height);


        let lastTimestamp = 0;
        let animationTime = 0;
        let animationHasStarted = true;

        function animate(timestamp: number) {
            if(!isRasterizer){
                let deltaT = timestamp - lastTimestamp;
                if (animationHasStarted) {
                    deltaT = 0;
                    animationHasStarted = false;
                }
                animationTime += deltaT;
                lastTimestamp = timestamp;
                simulate(deltaT);
                const lighVisitor = new RayLightVisitor();
                lighVisitor.setup(scenegraph);

                visitor.render(scenegraph, camera, lighVisitor.lightPositions);
                animationHandle = window.requestAnimationFrame(animate);
            }
        }
        animate(0);
    }

});
