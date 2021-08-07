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

window.addEventListener('load', () => {

    const sg = new GroupNode(new Translation(new Vector(0, 0, -5, 0)));
    const gn = new GroupNode(new Rotation(new Vector(1, 0, 0, 0), 0));
    sg.add(gn);
    const gn1 = new GroupNode(new Translation(new Vector(1.2, .5, 0, 0)));
    gn.add(gn1);
    gn1.add(new SphereNode(new Vector(0.8,0, 0.9, 1), new Vector(0.8,0.9,0,1)));
    const gn2 = new GroupNode(new Translation(new Vector(-0.8, 0.6, 0, 0)));
    gn.add(gn2);
    const gn3 = new GroupNode(new Scaling(new Vector(1, 1, 1, 0)));
    const gn4 = new GroupNode(new Translation(new Vector(1,0,3,1)));
    gn2.add(gn3);
    gn2.add(gn4);
    gn3.add(new PyramidNode(new Vector(0,0,1,1),[new Vector(0,1,1,1), new Vector(1,1,0,1), new Vector(1,0,1,1), new Vector(0.5,0.5,0.5,1)]));
    gn4.add(new AABoxNode(new Vector(1,0,0.5,1),[new Vector(1,0,0,1), new Vector(0,1,0,1), new Vector(0,0,1,1), new Vector(1,1,0,1), new Vector(0,1,1,1)]));
    const gnLight = new GroupNode(new Translation(new Vector(0,0,5,0)));
    const gnLightRotation = new GroupNode(new Rotation(new Vector(0,1,0,1),0));
    gnLight.add(gnLightRotation);
    gnLightRotation.add(new LightNode());
    sg.add(gnLight)
    let isRasterizer = true;

    let animationNodes = [
      //new RotationNode(gn1, new Vector(0,0,1,1)),
       //  new DriverNode(gn3)
        new JumperNode(gnLightRotation, new Vector(0,1,0,1),2)
    ];
   // document.getElementById("yDirection").style.color = "limegreen";

    let animationHandle: number;

    function simulate(deltaT: number) {
        for (let animationNode of animationNodes) {
            animationNode.simulate(deltaT);
        }
    }


    window.addEventListener('keydown', function (event) {
        switch (event.key) {
            case "a":
                animationNodes.forEach(node =>{
                        node.toggleActive();
                        if(node.active){
                            document.getElementById("toggleAnimation").style.color = "limegreen";
                            document.getElementById("toggleAnimation").innerText = "Animation ausschalten = a";
                        }else{
                            document.getElementById("toggleAnimation").style.color = "black";
                            document.getElementById("toggleAnimation").innerText = "Animation einschalten = a";
                        }
                })
                break;
            case "r":
                isRasterizer = true;
                window.cancelAnimationFrame(animationHandle);
                renderRasterizer(sg);
                document.getElementById("rasterCaption").style.color = "limegreen";
                document.getElementById("rayCaption").style.color = "black";
                break;

            case "t":
                isRasterizer = false;
                window.cancelAnimationFrame(animationHandle);
                renderRaytracer(sg)
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

            case "ArrowUp":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.zNegActive = true;
                    }
                })
                break;

            case "ArrowDown":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.zPosActive = true;
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

        }
    });

    window.addEventListener('keyup', function (event) {
        switch (event.key) {
            case "ArrowUp":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.zNegActive = false;
                    }
                })
                break;
            case "ArrowDown":
                animationNodes.forEach(node =>{
                    if(node instanceof DriverNode){
                        node.zPosActive = false;
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
        }
    });

    if(isRasterizer){
        renderRasterizer(sg);
    } else{
        renderRaytracer(sg);
    }

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

                visitor.render(sg, camera, lighVisitor.lightPositions);
                animationHandle = window.requestAnimationFrame(animate);
            }
        }
        animate(0);
    }

});
