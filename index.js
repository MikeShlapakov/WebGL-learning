const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');
const gl = canvas.getContext("webgl");
if (!gl) {
    console.log("no webgl for you!")
}

let lastFrameTime = performance.now(); // Time of the last frame
let frameCount = 0;
let fpsInterval = 100; // Update FPS every second
let lastFpsUpdate = performance.now();

canvas.width = window.innerWidth * window.devicePixelRatio || 1
canvas.height = window.innerHeight * window.devicePixelRatio || 1

const mousePos = {x: 0, y: 0}

let FOV = 60;

let yaw = 0;   // Horizontal angle (yaw)
let pitch = 0; // Vertical angle (pitch)
  
window.addEventListener('mousemove', e => {

    // const pos = getRelativeMousePosition(e, gl.canvas);

    // pos is in pixel coordinates for the canvas.
    // so convert to WebGL clip space coordinates
    mousePos.x = e.clientX / gl.canvas.width  *  2 - 1;
    mousePos.y = e.clientY / gl.canvas.height * -2 + 1;

    yaw = mousePos.x * Math.PI / 2
    pitch = -mousePos.y * Math.PI / 2
    // console.log(mousePos)
});

window.addEventListener('mousemove', e => {
    // pos is in pixel coordinates for the canvas.
    // so convert to WebGL clip space coordinates
    mousePos.x = e.clientX / gl.canvas.width  *  2 - 1;
    mousePos.y = e.clientY / gl.canvas.height * -2 + 1;

    // Yaw - horizontal rotation
    yaw = mousePos.x * Math.PI / 2
    // Pitch - vertical rotation
    pitch = -mousePos.y * Math.PI / 2
});

window.addEventListener("wheel", e => {
    
    // scale the FOV by 5 units
    FOV += e.deltaY * 0.05; 
    // Restrict scale
    FOV = Math.min(Math.max(10, FOV), 120);
}, { passive: false });

const cameraPos = {x: 0, y: 0, z: 100}

// Translation speed (adjust as needed)
const speed = 3;

const rotationSpeed = 0.02; // Speed of rotation

// creates buffers with position, normal, texcoord, and vertex color
// data for primitives by calling gl.createBuffer, gl.bindBuffer,
// and gl.bufferData
// const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6);
const cube = createCubeVertices(20);
// const cubeBufferInfo = webglUtils.createBufferInfoFromArrays(gl, deindexVertices(cube));
let color = [10, 255, 10, 200]
const cubeBufferInfo = createFlattenedFunc(cube, color);
// const coneBufferInfo   = primitives.createTruncatedConeWithVertexColorsBufferInfo(gl, 10, 0, 20, 12, 1, true, false);

// setup GLSL program
var programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

var FPSElement = document.querySelector("#fps");
var FPSNode = document.createTextNode("");
FPSElement.appendChild(FPSNode);

var objectsToDraw = [
// {
//     programInfo: programInfo,
//     bufferInfo: cubeBufferInfo,
//     uniforms: cubeUniforms,
// }
];

function placeObject(viewProjectionMatrix, translation) {
    var matrix = translate(viewProjectionMatrix,
                            translation[0],
                            translation[1],
                            translation[2]);
    return matrix;
}

// Draw the scene.
function drawScene(time) {
    // Calculate time elapsed since the last frame
    let now = performance.now();
    let deltaTime = now - lastFrameTime;
    lastFrameTime = now;

    time *= 0.0005;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = perspective(degToRad(FOV), aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    // cameraPos = calculateCameraPos(cameraPos, speed, yaw, pitch);
    let cameraPosition = calculateCameraPos(cameraPos, speed, yaw, pitch);
    var target = [
        cameraPosition[0] + Math.cos(pitch) * Math.sin(yaw),
        cameraPosition[1] - Math.sin(pitch),
        cameraPosition[2] - Math.cos(pitch) * Math.cos(yaw)
    ];
    // console.log(target)
    var up = [0, 1, 0];
    var cameraMatrix = lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = inverse(cameraMatrix);

    var viewProjectionMatrix = multiply(projectionMatrix, viewMatrix);

    let n = 16;
    for(let i = 0; i < n; i++){
        for(let j = 0; j < n; j++){
            for(let z = 0; z < n; z++){
                objectsToDraw.push({
                    programInfo: programInfo,
                    bufferInfo: cubeBufferInfo,
                    uniforms: {
                        u_colorMult: [1, 1, 1, 1],
                        u_matrix: placeObject(viewProjectionMatrix, [i*25, z*25, j*25]),
                    },
                })
            }
        }
    }

    // ------ Draw the objects --------

    objectsToDraw.forEach(function(object) {
        var programInfo = object.programInfo;
        var bufferInfo = object.bufferInfo;

        gl.useProgram(programInfo.program);

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        // Set the uniforms.
        webglUtils.setUniforms(programInfo, object.uniforms);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    // Increment frame count
    frameCount++;

    // Update FPS every second
    if (now - lastFpsUpdate >= fpsInterval) {
        FPSNode.nodeValue = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = now;
    }
    objectsToDraw = []
    requestAnimationFrame(drawScene);
}

drawScene(10);