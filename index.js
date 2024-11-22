/*============= Creating a canvas ======================*/
var canvas = document.getElementById('canvas');
gl = canvas.getContext('webgl');
if (!gl) {
    console.alert("no webgl for you!")
}

const ext = gl.getExtension('ANGLE_instanced_arrays');
if (!ext) {
    console.alert('need ANGLE_instanced_arrays');
}

gl.getExtension("OES_element_index_uint");

canvas.width = window.innerWidth * window.devicePixelRatio || 1
canvas.height = window.innerHeight * window.devicePixelRatio || 1

const chunkWidth = 16;
const chunkHeight = 16;
const chunksNum = 4;
const renderDistance = chunksNum - 1

const typesOfBlocks = 5
const textureSize = 32
let atlasWidth = 192
let atlasHeight = 320


let vertices = [ 
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,
];

let indices = [ 
    0, 2, 1, 0, 3, 2,
];

var normals = [
    // bottom
    [0, -1, 0],
    // top
    [0, 1, 0],
    // left
    [-1, 0, 0],
    // right
    [1, 0, 0],
    // back
    [0, 0, -1],
    // front
    [0, 0, 1]
];

let textureCoords = [
    1, 1, 0, 1, 0, 0, 1, 0,
]

let textureOffsets = [[5,0], [0,0], [1,0], [2,0], [3,0], [4,0]]

const faceMatrices = [
    identity(),
    xRotation(Math.PI),
    yRotate(zRotation(Math.PI / -2), Math.PI / -2),
    yRotate(zRotation(Math.PI / 2), Math.PI / 2),
    yRotate(xRotation(Math.PI / 2), Math.PI ),
    xRotation(Math.PI / -2),
];

let colors = [];

console.log("Number of vertices:", vertices.length);
console.log("Number of indices:", indices.length);

/*=================== Initialize Programs =================== */

const mainProgram = createProgramFromSource(gl, {vertexShader:"vertex-shader-3d",
                                                fragmentShader:"fragment-shader-3d"})

const pickerProgram = createProgramFromSource(gl, {vertexShader:"picker-vertex-shader",
                                                fragmentShader:"picker-fragment-shader"})

const crosshairProgram = createProgramFromSource(gl, {vertexShader:"crosshair-vertex-shader",
                                                fragmentShader:"crosshair-fragment-shader"})

const handBlockProgram = createProgramFromSource(gl, {vertexShader:"hand-block-vertex-shader",
                                                    fragmentShader:"hand-block-fragment-shader"})

/*======== Associating attributes to vertex shader =====*/
var uPmatrix = gl.getUniformLocation(mainProgram, "uPmatrix");
var uVmatrix = gl.getUniformLocation(mainProgram, "uVmatrix");
var aMmatrix = gl.getAttribLocation(mainProgram, "aMmatrix");
var uFaceMatrix = gl.getUniformLocation(mainProgram, "uFaceMatrix");

var uNormal = gl.getUniformLocation(mainProgram, "uNormal");

var aTexture = gl.getAttribLocation(mainProgram, "aTextCoord");
var aTextureMatrix = gl.getAttribLocation(mainProgram, "aTextureMatrix");
var uTextureOffset = gl.getUniformLocation(mainProgram, "uTextureOffset");
var uTexture = gl.getUniformLocation(mainProgram, "uTexture");

var uAmbientLight = gl.getUniformLocation(mainProgram, "uAmbientLight");
var uLightColor = gl.getUniformLocation(mainProgram, "uLightColor");
var uLightPosition = gl.getUniformLocation(mainProgram, "uLightPosition");
var uViewPosition = gl.getUniformLocation(mainProgram, 'uViewPosition');
var uGammaCorrection = gl.getUniformLocation(mainProgram, 'uGammaCorrection');

var uFogColor = gl.getUniformLocation(mainProgram, "uFogColor");
var uFogNear = gl.getUniformLocation(mainProgram, "uFogNear");
var uFogFar = gl.getUniformLocation(mainProgram, "uFogFar");

// Create and store data into vertex buffer
var vertex_buffer = createBufferFromArray(new Float32Array(vertices), gl.ARRAY_BUFFER);

// Create and store data into index buffer
var index_buffer = createBufferFromArray(new Uint32Array(indices), gl.ELEMENT_ARRAY_BUFFER);

/*======== Setting Picker attributes =====*/

var pickerPosition = gl.getAttribLocation(pickerProgram, "aPosition");
var pickerColor = gl.getAttribLocation(pickerProgram, "aPickerColor");
var pickeruPmatrix = gl.getUniformLocation(pickerProgram, "uPmatrix");
var pickeruVmatrix = gl.getUniformLocation(pickerProgram, "uVmatrix");
var pickeruMmatrix = gl.getUniformLocation(pickerProgram, "uMmatrix");
var uAlphaColor = gl.getUniformLocation(pickerProgram, "uAlphaColor");

var pickerPositionBuffer = createBufferFromArray(new Float32Array([
     0.5,  0.5,  0.5, -0.5,  0.5,  0.5, 
    -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
]), gl.ARRAY_BUFFER);

var pickerIndexbuffer = createBufferFromArray(new Uint32Array(
    [ 0, 2, 1, 0, 3, 2]
), gl.ELEMENT_ARRAY_BUFFER);

var pickerColorBuffer = createBufferFromArray(new Uint8Array([  
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  
]), gl.ARRAY_BUFFER);

/*======== Setting Crossahir attributes =====*/

var crosshairPosition = gl.getAttribLocation(crosshairProgram, "aPosition");
var crosshairColor = gl.getAttribLocation(crosshairProgram, "aColor");
var crosshairTransform = gl.getUniformLocation(crosshairProgram, "uMatrix");

var crosshairPositionBuffer = createBufferFromArray(new Float32Array([
    0, 0, 0.45,
    0, 0, 0,

    0.45, 0,  0,
    0, 0, 0,

    0, 0.4, 0,
    0, 0, 0,
]), gl.ARRAY_BUFFER);


var crosshairColorBuffer = createBufferFromArray(new Uint8Array([  
    250, 0,  0,
    100, 0, 0,

    0, 0, 250,
    0, 0, 100,

    0, 250, 0,
    0, 100, 0,
]), gl.ARRAY_BUFFER);

/*======== Setting Hand Block attributes =====*/

var handBlockPosition = gl.getAttribLocation(handBlockProgram, "aPosition");
var handBlockuMmatrix = gl.getUniformLocation(handBlockProgram, "uMmatrix");

var handBlockPositionBuffer = createBufferFromArray(new Float32Array([
     0.5,  0.5,  0.5, -0.5,  0.5,  0.5, 
    -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
    -0.5, -0.5,  0.5, -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,  0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,
     0.5,  0.5, -0.5, -0.5,  0.5, -0.5,
     0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,
     0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,
]), gl.ARRAY_BUFFER);

var handBlockIndexbuffer = createBufferFromArray(new Uint32Array(
    [ 0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11, 
        12, 13, 14, 12, 14, 15, 
        16, 17, 18, 16, 18, 19, 
        20, 21, 22, 20, 22, 23]
), gl.ELEMENT_ARRAY_BUFFER);

/*========== Defining and storing the geometry ==========*/

// setup matrices, one per instance
const numInstances = Math.min(chunkWidth*chunksNum*chunkHeight*chunkWidth*chunksNum, 2<<15);
console.log("Max Instances number:", numInstances)
// make a typed array with one view per matrix
const matrixData = new Float32Array(numInstances * 16);
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  matrices.push(new Float32Array(matrixData.buffer, i * 16 * 4, 16));
}
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);

const textureMatricesData = new Float32Array(numInstances * 9);
const textureMatrices = [];
for (let i = 0; i < numInstances; ++i) {
    textureMatrices.push(new Float32Array(textureMatricesData.buffer, i * 9 * 4, 9));
}
const textureMatrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, textureMatrixBuffer);
gl.bufferData(gl.ARRAY_BUFFER, textureMatricesData.byteLength, gl.DYNAMIC_DRAW);

let countInstances = 0;

const world = new World({width:chunkWidth, height:chunkHeight}, renderDistance, {positionMatrices:matrices, textureMatrices: textureMatrices}, countInstances);
world.generateChunks();
countInstances = world.generateAllMeshes();

console.log("Number of instances:", countInstances)

// Create a texture.
var texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);

// Fill the texture with a 1x1 blue pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([50, 200, 75, 255]));
    
// Asynchronously load an image
var image = new Image();
image.src = "./textures/GameTextures.png";
image.addEventListener('load', function() {
    atlasWidth = image.width;
    atlasHeight = image.height;
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
});

/*================= Mouse and Player ======================*/

const mousePos = {x: 0, y: 0}

const player = {pos: {x: chunkWidth/2, y:chunkHeight+1, z: chunkWidth/2}, yaw: 0, pitch: 0, blockType: 3, blockSelected: false, breakBlock: false, placeBlock: false}

/*=================== Drawing =================== */

let frameCount = 0;
let renderSum = 0; // sum of render time for each frame

var precentage = {precent: 0}
var obj = {
    FPS: 0,
    cameraPosition: player.pos,
    lightPosition: {x: Math.floor(chunkWidth/2), y:chunkHeight, z:Math.floor(chunkWidth/2), ambient: 0.3, gamma: 1},
    FOV: 60,
    speed: 0.5,
    // rotationSpeed: 0.02, // Speed of rotation
    zMax: Math.max(10, chunkWidth*chunksNum),
    zMin: 0.25,
    skyColor: [ 150, 220, 255 ], // RGB array
    fogNear: 0.75,
    fogFar: 1.0,
    dayLightCycle: true,
};

var gui = new dat.gui.GUI({ autoPlace: true });
gui.domElement.id = 'gui';

// var perc = gui.add(precentage, 'precent')
var FPS = gui.add(obj, 'FPS')
var cameraPositionFolder = gui.addFolder('Camera Position')
cameraPositionFolder.add(obj.cameraPosition, 'x')
cameraPositionFolder.add(obj.cameraPosition, 'y')
cameraPositionFolder.add(obj.cameraPosition, 'z')
cameraPositionFolder.open()
var lightPositionFolder = gui.addFolder('Light Position')
lightPositionFolder.add(obj.lightPosition, 'x').min(-chunkWidth*chunksNum*2).max(chunkWidth*chunksNum*2).step(1);
lightPositionFolder.add(obj.lightPosition, 'y').min(-chunkHeight*2).max(chunkHeight*2).step(1);
lightPositionFolder.add(obj.lightPosition, 'z').min(-chunkWidth*chunksNum*2).max(chunkWidth*chunksNum*2).step(1);
lightPositionFolder.add(obj.lightPosition, 'ambient').min(0).max(2).step(0.01);
lightPositionFolder.add(obj.lightPosition, 'gamma').min(0).max(2).step(0.01);
lightPositionFolder.open()
var FOV = gui.add(obj, 'FOV').min(10).max(120).step(5);
gui.add(obj, 'speed').min(0.01).max(1).step(0.01);
gui.add(obj, 'zMax').min(10).max(500).step(10); // Increment amount
gui.add(obj, 'zMin').min(0.01).max(10).step(0.05); // Increment amount
gui.addColor(obj, 'skyColor'); // Increment amount
gui.add(obj, 'fogNear').min(0).max(1).step(0.01); // Increment amount
gui.add(obj, 'fogFar').min(0).max(1).step(0.01); // Increment amount
gui.add(obj, 'dayLightCycle'); 

// Sky color (sunrise to sunset)
const dayLightCycle = 2*Math.PI;
const skyColors = [
    { time: 0, color: [205, 204, 255] },      // Sunrise (yellow)
    { time: Math.PI/4, color: [150, 226, 255] }, // Day (blue)
    { time: 3*Math.PI/4, color: [245, 115, 25] },   // Sunset (orange)
    { time: 9*Math.PI/10, color: [150, 100, 120] }, // Sunset (pink)
    { time: Math.PI, color: [0, 0, 0] },          // Night (black)
    { time: 1.75*Math.PI, color: [0, 0, 0] },          // Night (black)
    { time: 2*Math.PI, color: [205, 204, 255] },
];

var time = 0;

var animate = function() {
    let renderTime = performance.now();

    time = (time + 0.01);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.LEQUAL);
    
    var color = obj.skyColor;
    // Update sky color based on time
    if (obj.dayLightCycle){
        for (let i = 0; i < skyColors.length - 1; i++) {
            const current = skyColors[i];
            const next = skyColors[i + 1];
            if (time % dayLightCycle >= current.time && time % dayLightCycle <= next.time) {
            const factor = (time % dayLightCycle - current.time) / (next.time - current.time);
            color = interpolateColor(current.color, next.color, factor);
            }
        }
    }

    gl.clearColor(color[0]/255, color[1]/255, color[2]/255, 1);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(mainProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    
    var aPosition = gl.getAttribLocation(mainProgram, "aPosition");
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    // upload the transformation matrix data
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
    setMatrixAttributes(gl, aMmatrix, 4, gl.FLOAT);

    // Upload the texture matrix data
    gl.bindBuffer(gl.ARRAY_BUFFER, textureMatrixBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, textureMatricesData);
    setMatrixAttributes(gl, aTextureMatrix, 3, gl.FLOAT);

    var textureBuffer = createBufferFromArray(new Float32Array(textureCoords), gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);

    gl.enableVertexAttribArray(aTexture);
    gl.vertexAttribPointer(aTexture, 2, gl.FLOAT, false, 0, 0);
    // ext.vertexAttribDivisorANGLE(aTexture, 1);

    // set the fog color and amount
    gl.uniform4fv(uFogColor, [color[0]/255, color[1]/255, color[2]/255, 1]);
    gl.uniform1f(uFogNear, obj.fogNear * obj.zMax);
    gl.uniform1f(uFogFar, obj.fogFar * obj.zMax);

    var proj_matrix = get_projection(obj.FOV, canvas.width/canvas.height, obj.zMin, obj.zMax);
    var cameraPositionArray = calculateCameraPos(obj.cameraPosition, obj.speed, player.yaw, player.pitch);
    countInstances = world.renderChunks(Math.floor(obj.cameraPosition.x / chunkWidth), 
                                            Math.floor(obj.cameraPosition.z / chunkWidth))
    cameraPositionFolder.updateDisplay()
    var target = [ cameraPositionArray[0] + Math.cos(player.pitch) * Math.cos(player.yaw),
                    cameraPositionArray[1] - Math.sin(player.pitch),
                    cameraPositionArray[2] - Math.cos(player.pitch) * Math.sin(-player.yaw)
                    ];

    var up = [0, 1, 0];
    var cameraMatrix = lookAt(cameraPositionArray, target, up);

    // Make a view matrix from the camera matrix.
    var view_matrix = inverse(cameraMatrix);

    gl.uniformMatrix4fv(uPmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(uVmatrix, false, view_matrix);
    gl.uniform3fv(uViewPosition, [cameraPositionArray[0], cameraPositionArray[1], cameraPositionArray[2]]);  // Your camera position

    gl.uniform3f(uLightColor, color[0]/255, color[1]/255, color[2]/255);
    gl.uniform3f(uAmbientLight, obj.lightPosition.ambient, obj.lightPosition.ambient, obj.lightPosition.ambient);
    gl.uniform3f(uGammaCorrection, obj.lightPosition.gamma, obj.lightPosition.gamma, obj.lightPosition.gamma);
    if (obj.dayLightCycle){
        gl.uniform3fv(uLightPosition, [ chunkWidth * chunksNum * Math.sin((time/2))*Math.sin((time/2)),
                                        2 * chunkHeight * Math.sin(time),
                                        chunkWidth * chunksNum * Math.sin((time/2))*Math.sin((time/2))]);
    }
    else{
        gl.uniform3fv(uLightPosition, [ obj.lightPosition.x,
                                    obj.lightPosition.y,
                                    obj.lightPosition.z]);
    }


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

    faceMatrices.forEach(function(faceMatrix, ndx) {
        gl.uniform2fv(uTextureOffset, new Float32Array(textureOffsets[ndx]));
        gl.uniform3fv(uNormal, new Float32Array(normals[ndx]));
        gl.uniformMatrix4fv(uFaceMatrix, false, faceMatrix);
        ext.drawElementsInstancedANGLE(showLines() ? gl.TRIANGLES : gl.LINES, indices.length, gl.UNSIGNED_INT, 0, countInstances);
    });
    
    renderSum += performance.now() - renderTime
    frameCount++;

    // Update FPS every second
    if (frameCount >= 100) {
        FPS.setValue(Math.round((frameCount * 600) / (renderSum)));
        frameCount = 0;
        renderSum = 0;
    }

    let ray = castARay(world, 
        {
            x: obj.cameraPosition.x,
            y: obj.cameraPosition.y,
            z: obj.cameraPosition.z
            }, 
        {
            x: Math.cos(player.pitch) * Math.cos(player.yaw),
            y: -Math.sin(player.pitch),
            z: -Math.cos(player.pitch) * Math.sin(-player.yaw)
        }, 5)
    
    if(ray.hit){
        // console.log(ray);
        player.blockSelected = true
        drawPicker(time, ray.position, ray.normal, proj_matrix, view_matrix)
        if(player.breakBlock){
            countInstances = world.removeBlock(ray.position.x, ray.position.y, ray.position.z);
            // console.log("done", world.chunks, countInstances)
            player.breakBlock = false;
        }
        if(player.placeBlock){
            countInstances = world.addBlock(ray.position.x + ray.normal.x,
                                                ray.position.y + ray.normal.y, 
                                                ray.position.z + ray.normal.z,
                                                player.blockType)
            player.placeBlock = false;
        }
    }
    else{
        player.blockSelected = false
    }

    if (isDebugOn()){
        drawCrosshair()
        gui.open();
    }
    else{
        gui.close();
    }

    drawHandBlock(time, player.blockType);

    window.requestAnimationFrame(animate);
}
animate(0);

function drawPicker(time, pos, normal, Pmatrix, Vmatrix){
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(pickerProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, pickerPositionBuffer);
    gl.enableVertexAttribArray(pickerPosition);
    gl.vertexAttribPointer(pickerPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(pickeruPmatrix, false, Pmatrix);
    gl.uniformMatrix4fv(pickeruVmatrix, false, Vmatrix);

    const mMatrix = [1,0,0,0,
                    0,1,0,0,
                    0,0,1,0,
                    pos.x + 0.5,pos.y+ 0.5,pos.z+ 0.5,1
                ];

    switch (`${normal.x},${normal.y},${normal.z}`) {
        case '0,1,0': // top
            break;
        case '0,-1,0': // bottom
            xRotate(mMatrix, -Math.PI, mMatrix);
            break;
        case '1,0,0': // right
            zRotate(mMatrix, Math.PI / -2, mMatrix)
            break;
        case '-1,0,0': // left
            zRotate(mMatrix, Math.PI / 2, mMatrix)
            break;
        case '0,0,1': // front
            xRotate(mMatrix, Math.PI / 2, mMatrix)
            break;
        case '0,0,-1': // back
            xRotate(mMatrix, Math.PI / -2, mMatrix)
            break;
    }

    gl.uniformMatrix4fv(pickeruMmatrix, false, mMatrix);
                                            
    gl.uniform1f(uAlphaColor, Math.sin(time*100) / 10 + 0.25);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pickerIndexbuffer);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
}

function drawCrosshair(){
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(crosshairProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, crosshairPositionBuffer);
    gl.enableVertexAttribArray(crosshairPosition);
    gl.vertexAttribPointer(crosshairPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, crosshairColorBuffer);
    gl.enableVertexAttribArray(crosshairColor);
    gl.vertexAttribPointer(crosshairColor, 3, gl.UNSIGNED_BYTE, true, 0, 0);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var matrix = get_projection(80, aspect, 0, 1);
    matrix = xRotate(matrix, -player.pitch);
    matrix = yRotate(matrix, -player.yaw);

    gl.uniformMatrix4fv(crosshairTransform, false, matrix);

    gl.drawArrays(gl.LINES, 0, 6);
}

function drawHandBlock(time, blockType){
    // gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    gl.useProgram(handBlockProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, handBlockPositionBuffer);
    gl.enableVertexAttribArray(handBlockPosition);
    gl.vertexAttribPointer(handBlockPosition, 3, gl.FLOAT, false, 0, 0);

    const w = textureSize/atlasWidth;
    const h = textureSize/atlasHeight;
    const textureCoords = [];

    for (let face = 0; face < 6; face++) {
        const start = face * w;
        const end = (face + 1) * w;

        textureCoords.push(
            end, blockType * h, start, blockType * h, start, (blockType - 1) * h, end, (blockType - 1) * h
        );
    }
    var textureBuffer = createBufferFromArray(new Float32Array(textureCoords), gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.enableVertexAttribArray(aTexture);
    gl.vertexAttribPointer(aTexture, 2, gl.FLOAT, false, 0, 0);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var matrix = get_projection(1, aspect, 0, 1);
    matrix = xRotate(matrix, -Math.PI/8);

    matrix = yRotate(matrix, time*16);
    matrix[15] = gl.canvas.clientWidth * 0.4;
    matrix[12] = matrix[15] * 0.8;
    matrix[13] = matrix[15] * (Math.sin(time*32) * 0.025 - 0.7);

    gl.uniformMatrix4fv(handBlockuMmatrix, false, matrix);                       
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, handBlockIndexbuffer);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_INT, 0);
}