import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from './math_library/vector';
import {GroupNode,} from './nodes/nodes';
import {
    RasterVisitor,
    RasterSetupVisitor
} from './visitors/rastervisitor';
import Shader from './shading/shader';
import {
    DriverNode,
    JumperNode, MoveCameraNode, RotateCameraNode,
    RotationNode
} from './nodes/animation-nodes';
import phongVertexShader from './shading/phong-vertex-perspective-shader.glsl';
import phongFragmentShader from './shading/phong-fragment-shader.glsl';
import textureVertexShader from './shading/texture-vertex-perspective-shader.glsl';
import texturePhongShader from './shading/texture-phong-fragment-shader.glsl';
import RayVisitor from "./visitors/rayvisitor";
import {XmlToScrenegraph} from "./xmlParser/xmlToScrenegraph";
import {LightAndCameraVisitor} from "./visitors/lightAndCameraVisitor";
import {ScenegraphToXMLVisitor} from "./xmlParser/scenegraphToXMLVisitor";

window.addEventListener('load', () => {

    //Setup constants for Raytracer
    const rayCanvas = document.getElementById("rayCanvas") as HTMLCanvasElement;
    const ctx = rayCanvas.getContext("2d");
    const rayVisitor = new RayVisitor(ctx, rayCanvas.width, rayCanvas.height);

    //Setup constants for Rasterizer
    const rasterCanvas = document.getElementById("rasterCanvas") as HTMLCanvasElement;
    const gl = rasterCanvas.getContext("webgl2");
    const setupVisitor = new RasterSetupVisitor(gl);
    const phongShader = new Shader(gl, phongVertexShader, phongFragmentShader);
    const textureShader = new Shader(gl, textureVertexShader, texturePhongShader);
    const rasterVisitor = new RasterVisitor(gl, phongShader, textureShader, setupVisitor.objects);

    //Variables that are used by both render engines
    const lightAndCameraVisitor = new LightAndCameraVisitor();
    let scenegraph : GroupNode;
    let isRasterizer = true;
    let animationHandle: number;
    let parser : XmlToScrenegraph= new XmlToScrenegraph();
    let scenegraphString = "";
    let animationNodes : (DriverNode | JumperNode | RotationNode | MoveCameraNode | RotateCameraNode)[] = [];

    function simulate(deltaT: number) {
        for (let animationNode of animationNodes) {
            animationNode.simulate(deltaT);
        }
    }

    loadXMLScenegraph();

    //Download via https://gist.github.com/liabru/11263260
    document.getElementById('download').addEventListener('click',function (){
        let toXMLParser = new ScenegraphToXMLVisitor();
        toXMLParser.setup(scenegraph,animationNodes);
        let  blob = new Blob([toXMLParser.xmlString], { type: 'text/plain' });
        let  anchor = document.createElement('a');

        anchor.download = "scenegraph.xml";
        anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
        anchor.dataset.downloadurl = ['text/xml', anchor.download, anchor.href].join(':');
        anchor.click();
    })

    document.getElementById('upload').addEventListener('click',function (){
        let event = new MouseEvent('click', {bubbles: false});
        document.getElementById('uploadInput').dispatchEvent(event);
    });

    // Loads a custom XML Scenegraph
    // Picked together from https://stackoverflow.com/questions/3103962/converting-html-string-into-dom-elements and https://stackoverflow.com/questions/14155310/upload-file-as-string-to-javascript-variable
    document.getElementById('uploadInput').addEventListener('change',function (){
        //@ts-ignore
        let files = this.files;
        //@ts-ignore
        this.files = [];
        if (files.length === 0) {
            alert('Es wurde keine Datei ausgewählt.');
        }

        let reader = new FileReader();
        reader.onload = function(event) {
            let result = event.target.result.toString();
            scenegraphString = result;
            let doc = new DOMParser().parseFromString(result, "text/xml");
            let children = doc.childNodes;
            parser = new XmlToScrenegraph();
            parser.createAndVisitChildren(children);
            animationNodes = parser.animationNodes;
            scenegraph = parser.head;
            render()
        };
        reader.readAsText(files[0]);

    })

    //https://www.w3schools.com/xml/met_element_getattribute.asp
    // Only works when rendering is started in the onreadystatechange function
    // as otherwise the scenegraph is not loaded yet
    function loadXMLScenegraph(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var xmlDoc = this.responseXML;
                scenegraphString = new XMLSerializer().serializeToString(xmlDoc.documentElement);
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

    function renderRasterizer(scenegraph : GroupNode){
        if(animationHandle){
            window.cancelAnimationFrame(animationHandle);
        }
        rayCanvas.classList.add("hidden");
        rasterCanvas.classList.remove("hidden");
        setupVisitor.setup(scenegraph);

        let lastTimestamp = performance.now();

        function animate(timestamp: number) {
            if(isRasterizer){
                simulate(timestamp - lastTimestamp);
                lightAndCameraVisitor.clear();
                lightAndCameraVisitor.setup(scenegraph);
                rasterVisitor.render(scenegraph, lightAndCameraVisitor.rasterCamera, lightAndCameraVisitor.lightPositions);
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
        if(animationHandle){
            window.cancelAnimationFrame(animationHandle);
        }
        rasterCanvas.classList.add("hidden");
        rayCanvas.classList.remove("hidden");

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
                lightAndCameraVisitor.clear();
                lightAndCameraVisitor.setup(scenegraph);
                rayVisitor.render(scenegraph, lightAndCameraVisitor.rayCamera, lightAndCameraVisitor.lightPositions);
                animationHandle = window.requestAnimationFrame(animate);
            }
        }
        animate(0);
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
                    let node = animationNodes[i];
                    if(node instanceof JumperNode){
                        node.axis = new Vector(1,0,0,1);
                    }
                }
                document.getElementById("xDirection").style.color = "limegreen";
                document.getElementById("yDirection").style.color = "black";
                document.getElementById("zDirection").style.color = "black";
                break;

            case "2":
                for (let i = 0; i < animationNodes.length; i++) {
                    let node = animationNodes[i];
                    if(node instanceof JumperNode){
                        node.axis = new Vector(0,1,0,1);
                    }
                }
                document.getElementById("xDirection").style.color = "black";
                document.getElementById("yDirection").style.color = "limegreen";
                document.getElementById("zDirection").style.color = "black";
                break;

            case "3":
                for (let i = 0; i < animationNodes.length; i++) {
                    let node = animationNodes[i];
                    if(node instanceof JumperNode){
                        node.axis = new Vector(0,0,1,1);
                    }
                }
                document.getElementById("xDirection").style.color = "black";
                document.getElementById("yDirection").style.color = "black";
                document.getElementById("zDirection").style.color = "limegreen";
                break;

            case "ArrowUp":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode) {
                        node.yPosActive = true;
                    }
                })
                break;

            case "ArrowDown":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.yNegActive = true;
                    }
                })
                break;

            case "ArrowRight":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xPosActive = true;
                    }
                })
                break;

            case "ArrowLeft":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xNegActive = true;
                    }
                })
                break;
            case "w":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.zNegActive = true;
                    }
                })
                break;
            case "s":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.zPosActive = true;
                    }
                })
                break;

            case "d":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.xPosActive = true;
                    }
                })
                break;
            case "a":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.xNegActive = true;
                    }
                })
                break;
            case "e":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.yPosActive = true;
                    }
                })
                break;
            case "q":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.yNegActive = true;
                    }
                })
                break;
            case "y":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.yActive = true;
                        node.directionY = -1;
                    }
                })
                break;
            }
            case "x":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.yActive = true;
                        node.directionY = 1;
                    }
                })
                break;
            }
            case "c":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.xActive = true;
                        node.directionX = 1;
                    }
                })
                break;
            }
            case "f":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.xActive = true;
                        node.directionX = -1;
                    }
                })
                break;
            }
        }
    });

    window.addEventListener('keyup', function (event) {
        switch (event.key) {
            case "ArrowUp":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.yPosActive = false;
                    }
                })
                break;
            case "ArrowDown":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.yNegActive = false;
                    }
                })
                break;
            case "ArrowRight":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xPosActive = false;
                    }
                })
                break;
            case  "ArrowLeft":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.xNegActive = false;
                    }
                })
                break;
            case "w":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.zNegActive = false;
                    }
                })
                break;
            case "s":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.zPosActive = false;
                    }
                })
                break;

            case "d":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.xPosActive = false;
                    }
                })
                break;
            case "a":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.xNegActive = false;
                    }
                })
                break;
            case "e":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.yPosActive = false;
                    }
                })
                break;
            case "q":
                animationNodes.forEach(node=>{
                    if(node instanceof MoveCameraNode){
                        node.yNegActive = false;
                    }
                })
                break;
            case "y":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.yActive = false;
                    }
                })
                break;
            }
            case "x":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.yActive = false;
                    }
                })
                break;
            }
            case "c":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.xActive = false;
                    }
                })
                break;
            }
            case "f":{
                animationNodes.forEach(node => {
                    if(node instanceof RotateCameraNode){
                        node.xActive = false;
                    }
                })
                break;
            }
        }
    });

});
