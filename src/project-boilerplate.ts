import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from './math_library/vector';
import {AABoxNode, CameraNode, GroupNode, LightNode, ObjNode} from './nodes/nodes';
import {
    RasterVisitor,
    RasterSetupVisitor
} from './visitors/rastervisitor';
import Shader from './shading/shader';
import {
    DriverNode, FreeFlightNode,
    JumperNode, MoveCameraNode, RotateCameraNode,
    RotationNode
} from './nodes/animation-nodes';
import phongVertexShader from './shading/phong-vertex-perspective-shader.glsl';
import phongFragmentShader from './shading/phong-fragment-shader.glsl';
import textureVertexShader from './shading/texture-vertex-perspective-shader.glsl';
import texturePhongShader from './shading/texture-phong-fragment-shader.glsl';
import RayVisitor from "./visitors/rayvisitor";
import {XmlToScenegraph} from "./xmlParser/xmlToScenegraph";
import {LightAndCameraVisitor} from "./visitors/lightAndCameraVisitor";
import {ScenegraphToXmlVisitor} from "./xmlParser/scenegraphToXmlVisitor";
import {Translation} from "./math_library/transformation";

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
    let cameraNode = lightAndCameraVisitor.cameraNode;
    let scenegraph: GroupNode;
    let isRasterizer = true;
    let animationHandle: number;
    let parser: XmlToScenegraph = new XmlToScenegraph();
    let scenegraphString = "";
    let animationNodes: (DriverNode | JumperNode | RotationNode | FreeFlightNode)[] = [];

    //Phong sliders
    const shininessElement = document.getElementById("shininess") as HTMLInputElement;
    const specularElement = document.getElementById("specular") as HTMLInputElement;
    const diffuseElement = document.getElementById("diffuse") as HTMLInputElement;
    const ambientElement = document.getElementById("ambient") as HTMLInputElement;

    loadXMLScenegraph();

    //Downloads the current Scene sas XML, download via https://gist.github.com/liabru/11263260
    document.getElementById('download').addEventListener('click', function () {
        let toXMLParser = new ScenegraphToXmlVisitor();
        toXMLParser.setup(scenegraph, animationNodes);
        let blob = new Blob([toXMLParser.xmlString], {type: 'text/plain'});
        let anchor = document.createElement('a');

        anchor.download = "scenegraph.xml";
        anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
        anchor.dataset.downloadurl = ['text/xml', anchor.download, anchor.href].join(':');
        anchor.click();
    })

    document.getElementById('upload').addEventListener('click', function () {
        let event = new MouseEvent('click', {bubbles: false});
        document.getElementById('uploadInput').dispatchEvent(event);
    });

    // Loads a custom XML Scenegraph
    // Picked together from https://stackoverflow.com/questions/3103962/converting-html-string-into-dom-elements and https://stackoverflow.com/questions/14155310/upload-file-as-string-to-javascript-variable
    document.getElementById('uploadInput').addEventListener('change', function () {
        //@ts-ignore
        let files = this.files;
        if (files.length === 0) {
            alert('Es wurde keine Datei ausgewählt.');
        }

        let reader = new FileReader();
        reader.onload = function (event) {
            let result = event.target.result.toString();
            scenegraphString = result;
            let doc = new DOMParser().parseFromString(result, "text/xml");
            let children = doc.childNodes;

            let cam = doc.getElementById("cam");

            setCameraPhongAndUpdateSliders(parseFloat(cam.getAttribute("shininess")),
                parseFloat(cam.getAttribute("specular")),
                parseFloat(cam.getAttribute("diffuse"))
                ,parseFloat(cam.getAttribute("ambient")));

            parser = new XmlToScenegraph();
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
    function loadXMLScenegraph() {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var xmlDoc = this.responseXML;
                scenegraphString = new XMLSerializer().serializeToString(xmlDoc.documentElement);
                let children = xmlDoc.childNodes;

                // lädt die Werte aus xml datei richtig aus, slider sind aber noch falsch
                let cam = xmlDoc.getElementById("cam");

                setCameraPhongAndUpdateSliders(parseFloat(cam.getAttribute("shininess")),
                    parseFloat(cam.getAttribute("specular")),
                    parseFloat(cam.getAttribute("diffuse"))
                    ,parseFloat(cam.getAttribute("ambient")));


                parser.createAndVisitChildren(children);
                animationNodes = parser.animationNodes;
                scenegraph = parser.head;
                render()
            }
        };
        xhttp.open("GET", 'abgabe.xml', true);
        xhttp.send();
    }

    document.getElementById('uploadObj').addEventListener('click',function (){
        let event = new MouseEvent('click', {bubbles: false});
        document.getElementById('uploadObjInput').dispatchEvent(event);
    });

    // Loads an object from an .obj File into a simple, pre-constructed scene
    document.getElementById('uploadObjInput').addEventListener('change',function (){
        //@ts-ignore
        let files = this.files;
        if (files.length === 0) {
            alert('Es wurde keine Datei ausgewählt.');
        }

        let reader = new FileReader();
        reader.onload = function(event) {
            let result = event.target.result.toString();
            let lines = result.split('\n');
            let obj = new ObjNode(lines);
            let gn = new GroupNode(new Translation(new Vector(6,0,0,1)));
            gn.add(obj);
            scenegraph.add(gn);
            render()
        };
        reader.readAsText(files[0]);
    })

    //Sets the values of the siders to the current value of the phong parameters in the scene
    shininessElement.value = ""+cameraNode.shininess;
    specularElement.value = ""+(convertPhongToSilder(cameraNode.specular));
    diffuseElement.value = ""+(convertPhongToSilder(cameraNode.diffuse));
    ambientElement.value = ""+(convertPhongToSilder(cameraNode.ambient));

    //Handles changes in phong parameters
    shininessElement.onchange = function () {
        cameraNode.shininess = Number(shininessElement.value);
        render()
    }

    specularElement.onchange = function () {
        cameraNode.specular = convertSliderToPhong(Number(specularElement.value));
        render()
    }

    diffuseElement.onchange = function () {
        cameraNode.diffuse = convertSliderToPhong(Number(diffuseElement.value));
        render()
    }

    ambientElement.onchange = function () {
        cameraNode.ambient = convertSliderToPhong(Number(ambientElement.value));
        render()
    }

    //Sets new phong values for the camera node and updates the sliders accordingly
    function setCameraPhongAndUpdateSliders(shininess : number, specular : number, diffuse : number, ambient : number){
        cameraNode.shininess = shininess;
        cameraNode.specular = specular;
        cameraNode.diffuse = diffuse;
        cameraNode.ambient = ambient;

        shininessElement.value = "" + shininess;
        specularElement.value = ""+(convertPhongToSilder(specular));
        diffuseElement.value = ""+(convertPhongToSilder(diffuse));
        ambientElement.value = ""+(convertPhongToSilder(ambient));
    }

    // Converts the slider values that range from 1 to 50 into the phong range from 0 to 1
    function convertSliderToPhong(num: number){
        let oldMin = 1;
        let oldMax = 50;
        let newMin = 0;
        let range = 1;
        let oldRange = Math.abs(oldMax-oldMin);
        return (((num - oldMin) * range) / oldRange) + newMin;
    }

    // Converts the phong values that range from 0 to 1 into the slider range thats 1 to 50
    function convertPhongToSilder(num: number){
        let oldMin = 0;
        let oldMax = 1;
        let newMin = 1;
        let range = 50;
        let oldRange = Math.abs(oldMax-oldMin);
        return (((num - oldMin) * range) / oldRange) + newMin;
    }

    function render(){
        if(isRasterizer){
            renderRasterizer(scenegraph);
        } else {
            renderRaytracer(scenegraph);
        }
    }

    function simulate(deltaT: number) {
        for (let animationNode of animationNodes) {
            animationNode.simulate(deltaT);
        }
    }

    function renderRasterizer(scenegraph: GroupNode) {
        if (animationHandle) {
            window.cancelAnimationFrame(animationHandle);
        }
        rayCanvas.classList.add("hidden");
        rasterCanvas.classList.remove("hidden");
        setupVisitor.setup(scenegraph);

        let lastTimestamp = performance.now();

        function animate(timestamp: number) {
            if (isRasterizer) {
                simulate(timestamp - lastTimestamp);
                lightAndCameraVisitor.clear();
                lightAndCameraVisitor.setup(scenegraph);
                cameraNode = lightAndCameraVisitor.cameraNode;
                rasterVisitor.render(scenegraph, lightAndCameraVisitor.rasterCamera, lightAndCameraVisitor.lightPositions, cameraNode.shininess, cameraNode.specular, cameraNode.ambient, cameraNode.diffuse);
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

    function renderRaytracer(scenegraph: GroupNode) {
        if (animationHandle) {
            window.cancelAnimationFrame(animationHandle);
        }
        rasterCanvas.classList.add("hidden");
        rayCanvas.classList.remove("hidden");

        let lastTimestamp = 0;
        let animationTime = 0;
        let animationHasStarted = true;

        function animate(timestamp: number) {
            if (!isRasterizer) {
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
                cameraNode = lightAndCameraVisitor.cameraNode;
                rayVisitor.render(scenegraph, lightAndCameraVisitor.rayCamera, lightAndCameraVisitor.lightPositions, cameraNode.shininess, cameraNode.specular, cameraNode.ambient, cameraNode.diffuse);
                animationHandle = window.requestAnimationFrame(animate);
            }
        }

        animate(0);
    }

    //Following are all the key event listeners for various functionalities
    window.addEventListener('keydown', function (event) {
        switch (event.key) {
            case "1":
                animationNodes.forEach(node => {
                    if (node instanceof JumperNode) {
                        node.toggleActive();
                        if (node.active) {
                            document.getElementById("toggleJumper").style.color = "limegreen";
                            document.getElementById("toggleJumper").innerText = "Jumper ausschalten ";
                        } else {
                            document.getElementById("toggleJumper").style.color = "black";
                            document.getElementById("toggleJumper").innerText = "Jumper einschalten ";
                        }
                    }
                })
                break;
            case "2":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.toggleActive();
                        if (node.active) {
                            document.getElementById("toggleDriver").style.color = "limegreen";
                            document.getElementById("toggleDriver").innerText = "Driver ausschalten ";
                        } else {
                            document.getElementById("toggleDriver").style.color = "black";
                            document.getElementById("toggleDriver").innerText = "Driver einschalten ";
                        }
                    }

                })
                break;
            case "3":
                animationNodes.forEach(node => {
                    if (node instanceof RotationNode) {
                        node.toggleActive();
                        if (node.active) {
                            document.getElementById("toggleRotor").style.color = "limegreen";
                            document.getElementById("toggleRotor").innerText = "Rotor ausschalten ";
                        } else {
                            document.getElementById("toggleRotor").style.color = "black";
                            document.getElementById("toggleRotor").innerText = "Rotor einschalten ";
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

            case "4":
                for (let i = 0; i < animationNodes.length; i++) {
                    let node = animationNodes[i];
                    if (node instanceof JumperNode) {
                        node.axis = new Vector(1, 0, 0, 1);
                    }
                }
                document.getElementById("xDirection").style.color = "limegreen";
                document.getElementById("yDirection").style.color = "black";
                document.getElementById("zDirection").style.color = "black";
                break;

            case "5":
                for (let i = 0; i < animationNodes.length; i++) {
                    let node = animationNodes[i];
                    if (node instanceof JumperNode) {
                        node.axis = new Vector(0, 1, 0, 1);
                    }
                }
                document.getElementById("xDirection").style.color = "black";
                document.getElementById("yDirection").style.color = "limegreen";
                document.getElementById("zDirection").style.color = "black";
                break;

            case "6":
                for (let i = 0; i < animationNodes.length; i++) {
                    let node = animationNodes[i];
                    if (node instanceof JumperNode) {
                        node.axis = new Vector(0, 0, 1, 1);
                    }
                }
                document.getElementById("xDirection").style.color = "black";
                document.getElementById("yDirection").style.color = "black";
                document.getElementById("zDirection").style.color = "limegreen";
                break;

            case "ArrowUp":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.yPosActive = true;
                    }
                })
                break;

            case "ArrowDown":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.yNegActive = true;
                    }
                })
                break;

            case "ArrowRight":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.xPosActive = true;
                    }
                })
                break;

            case "ArrowLeft":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.xNegActive = true;
                    }
                })
                break;
            case "w":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.zNegActive = true;
                    }
                })
                break;
            case "s":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.zPosActive = true;
                    }
                })
                break;

            case "d":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.xPosActive = true;
                    }
                })
                break;
            case "a":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.xNegActive = true;
                    }
                })
                break;
            case "e":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yPosActive = true;
                    }
                })
                break;
            case "q":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yNegActive = true;
                    }
                })
                break;
            case "y": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yActive = true;
                        node.directionY = -1;
                    }
                })
                break;
            }
            case "x": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yActive = true;
                        node.directionY = 1;
                    }
                })
                break;
            }
            case "c": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.xActive = true;
                        node.directionX = 1;
                    }
                })
                break;
            }
            case "f": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
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
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.yPosActive = false;
                    }
                })
                break;
            case "ArrowDown":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.yNegActive = false;
                    }
                })
                break;
            case "ArrowRight":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.xPosActive = false;
                    }
                })
                break;
            case  "ArrowLeft":
                animationNodes.forEach(node => {
                    if (node instanceof DriverNode) {
                        node.xNegActive = false;
                    }
                })
                break;
            case "w":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.zNegActive = false;
                    }
                })
                break;
            case "s":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.zPosActive = false;
                    }
                })
                break;

            case "d":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.xPosActive = false;
                    }
                })
                break;
            case "a":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.xNegActive = false;
                    }
                })
                break;
            case "e":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yPosActive = false;
                    }
                })
                break;
            case "q":
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yNegActive = false;
                    }
                })
                break;
            case "y": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yActive = false;
                    }
                })
                break;
            }
            case "x": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.yActive = false;
                    }
                })
                break;
            }
            case "c": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.xActive = false;
                    }
                })
                break;
            }
            case "f": {
                animationNodes.forEach(node => {
                    if (node instanceof FreeFlightNode) {
                        node.xActive = false;
                    }
                })
                break;
            }
        }
    });

});
