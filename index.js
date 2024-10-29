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

let height = 64
let n = 64;
let chunks = 1;

const textureSize = 32
let atlasWidth = 192
let atlasHeight = 128


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

var faceMatrices = [
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

// Create and store data into index buffer
var index_buffer = createBufferFromArray(new Uint32Array(indices), gl.ELEMENT_ARRAY_BUFFER);

/*=================== SHADERS =================== */

var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, document.getElementById("vertex-shader-3d").innerText);
gl.compileShader(vertShader);

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, document.getElementById("fragment-shader-3d").innerText);
gl.compileShader(fragShader);

var shaderprogram = gl.createProgram();
gl.attachShader(shaderprogram, vertShader);
gl.attachShader(shaderprogram, fragShader);

gl.linkProgram(shaderprogram);

/*======== Associating attributes to vertex shader =====*/
var uPmatrix = gl.getUniformLocation(shaderprogram, "uPmatrix");
var uVmatrix = gl.getUniformLocation(shaderprogram, "uVmatrix");
var aMmatrix = gl.getAttribLocation(shaderprogram, "aMmatrix");
var uFaceMatrix = gl.getUniformLocation(shaderprogram, "uFaceMatrix");

var uNormal = gl.getUniformLocation(shaderprogram, "uNormal");
var aNormalMatrix = gl.getAttribLocation(shaderprogram, "aNormalMatrix");

var aTexture = gl.getAttribLocation(shaderprogram, "aTextCoord");
var aTextureMatrix = gl.getAttribLocation(shaderprogram, "aTextureMatrix");
var uTextureOffset = gl.getUniformLocation(shaderprogram, "uTextureOffset");
var uTexture = gl.getUniformLocation(shaderprogram, "uTexture");

var uAmbientLight = gl.getUniformLocation(shaderprogram, "uAmbientLight");
var uLightColor = gl.getUniformLocation(shaderprogram, "uLightColor");
var uLightPosition = gl.getUniformLocation(shaderprogram, "uLightPosition");
var uViewPosition = gl.getUniformLocation(shaderprogram, 'uViewPosition');
var uGammaCorrection = gl.getUniformLocation(shaderprogram, 'uGammaCorrection');

var uFogColor = gl.getUniformLocation(shaderprogram, "uFogColor");
var uFogNear = gl.getUniformLocation(shaderprogram, "uFogNear");
var uFogFar = gl.getUniformLocation(shaderprogram, "uFogFar");

// Create and store data into vertex buffer
var vertex_buffer = createBufferFromArray(new Float32Array(vertices), gl.ARRAY_BUFFER);
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

var _position = gl.getAttribLocation(shaderprogram, "aPosition");
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(_position);

/*========== Defining and storing the geometry ==========*/

// Function to get vertices and determine visible faces for a cube
function get_cube_data(x, y, z, size = 1) {
    const half = size / 2;
    let vertices = [];
    let colors = [];
    let indices = [];
    let visibleFaces = [];

    // Check each face
    if (y === 0 || !worldGrid[x][y-1][z].id) {
        visibleFaces.push('bottom');
    }
    if (y === height - 1 || !worldGrid[x][y+1][z].id) {
        visibleFaces.push('top');
    }
    if (x === 0 || !worldGrid[x-1][y][z].id) {
        visibleFaces.push('left');
    }
    if (x === n * chunks - 1 || !worldGrid[x+1][y][z].id) {
        visibleFaces.push('right');
    }
    if (z === 0 || !worldGrid[x][y][z-1].id) {
        visibleFaces.push('back');
    }
    if (z === n * chunks - 1 || !worldGrid[x][y][z+1].id) {
        visibleFaces.push('front');
    }

    let vertexCount = 0;
    visibleFaces.forEach(face => {
        switch(face) {
            case 'back':
                vertices.push(
                    x - half, y - half, z - half,
                    x + half, y - half, z - half,
                    x + half, y + half, z - half,
                    x - half, y + half, z - half
                );
                colors = colors.concat(
                    [0,0.6,0, 0,0.6,0, 0,0.6,0, 0,0.6,0],
                );
                break;
            case 'front':
                vertices.push(
                    x + half, y - half, z + half,
                    x - half, y - half, z + half,
                    x - half, y + half, z + half,
                    x + half, y + half, z + half
                );
                colors = colors.concat(
                    [0,0.3,0, 0,0.3,0, 0,0.3,0, 0,0.3,0],
                );
                break;
            case 'left':
                vertices.push(
                    x - half, y - half, z + half,
                    x - half, y - half, z - half,
                    x - half, y + half, z - half,
                    x - half, y + half, z + half
                );
                colors = colors.concat(
                    [0,0.6,0, 0,0.6,0, 0,0.6,0, 0,0.6,0],
                );
                break;
            case 'right':
                vertices.push(
                    x + half, y - half, z - half,
                    x + half, y - half, z + half,
                    x + half, y + half, z + half,
                    x + half, y + half, z - half
                );
                colors = colors.concat(
                    [0,0.3,0, 0,0.3,0, 0,0.3,0, 0,0.3,0],
                );
                break;
            case 'bottom':
                vertices.push(
                    x + half, y - half, z - half,
                    x - half, y - half, z - half,
                    x - half, y - half, z + half,
                    x + half, y - half, z + half
                );
                colors = colors.concat(
                    [0,0,0, 0,0,0, 0,0,0, 0,0,0],
                );
                break;
            case 'top':
                vertices.push(
                    x + half, y + half, z + half,
                    x - half, y + half, z + half,
                    x - half, y + half, z - half,
                    x + half, y + half, z - half
                );
                colors = colors.concat(
                    [0,1,0, 0,1,0, 0,1,0, 0,1,0],
                );
                break;
        }
        // colors = colors.concat([1,0,0, 0,1,0, 0,0,1, 0,1,1]);
        // colors = colors.concat([x/(n*chunks),y/(height),z/(n*chunks), x/(n*chunks),y/(height),z/(n*chunks), x/(n*chunks),y/(height),z/(n*chunks), x/(n*chunks),y/(height),z/(n*chunks)]);
        indices = indices.concat([
            vertexCount, vertexCount + 2, vertexCount + 1,
            vertexCount, vertexCount + 3, vertexCount + 2
        ]);
        vertexCount += 4;
    });

    return { vertices, colors, indices };
}

// 3D array to store cube visibility
let worldGrid = []
for(let x = 0; x < n; x++){
    const slice = []
    for(let y = 0; y < height; y++){
        const row = []
        for(let z = 0; z < n; z++){
            row.push({
                id : 0,
                instanceId: null
            })
        }
        slice.push(row)
    }
    worldGrid.push(slice)
}

const params = {
    terrain: {
        scale: 20,
        offset : 0,
        magnitude: 1
    },
}

let rng = new RNG(123);
let perlinNoise = new PerlinNoise(rng);

function generateTerrain(){
    for(let x = 0; x < n; x++){
        for(let z = 0; z < n; z++){
            const value = perlinNoise.noise(
                x / params.terrain.scale,
                z / params.terrain.scale,
                1
            )
            const scalsedNoise = value * params.terrain.magnitude + params.terrain.offset

            const h = Math.max(0, Math.min(height - 1, Math.floor(scalsedNoise*height)))

            for(let y = 0; y <= height; y++){
                if (y < h){
                    setBlockId(x, y, z, 2);
                }
                else if (y == h){
                    setBlockId(x, y, z, 1);
                }
            }
        }
    }
}

generateTerrain()

function isInBounbs(x, y, z){
    return (0 <= x && x < n) && (0 <= y && y < height) && (0 <= z && z < n);
}

function getBlock(x, y, z){
    if(isInBounbs(x, y, z)){
        return worldGrid[x][y][z];
    }
    return null;
}

function setBlockId(x, y, z, id){
    if(isInBounbs(x, y, z)){
        worldGrid[x][y][z].id = id;
    }
}

function setBlockInstanceId(x, y, z, instanceId){
    if(isInBounbs(x, y, z)){
        worldGrid[x][y][z].instanceId = instanceId;
    }
}

// Function to check if a cube is visible (not fully occluded)
function isCubeVisible(x, y, z) {
    if (getBlock(x, y, z).id == 0) {
        return false
    }
    // Check if it's on the edge of the grid
    if (x === 0 || x === n*chunks - 1 || y === 0 || y === height - 1 || z === 0 || z === n*chunks - 1) {
        return true;
    }
    // console.log(x,y,z, worldGrid)
    // Check if any neighboring cube is missing
    return !worldGrid[x-1][y][z].id || !worldGrid[x+1][y][z].id ||
           !worldGrid[x][y-1][z].id || !worldGrid[x][y+1][z].id ||
           !worldGrid[x][y][z-1].id || !worldGrid[x][y][z+1].id;
}


// setup matrices, one per instance
const numInstances = n*height*n;
// make a typed array with one view per matrix
const matrixData = new Float32Array(numInstances * 16);
const matrices = [];
for (let i = 0; i < numInstances; ++i) {
  matrices.push(new Float32Array(matrixData.buffer, i * 16 * 4, 16));
}
const matrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);

const normalMatrixData = new Float32Array(numInstances * 16);
const normalMatrices = [];
for (let i = 0; i < numInstances; ++i) {
  normalMatrices.push(new Float32Array(normalMatrixData.buffer, i * 16 * 4, 16));
}
const normalMatrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalMatrixBuffer);
gl.bufferData(gl.ARRAY_BUFFER, normalMatrixData.byteLength, gl.DYNAMIC_DRAW);

const textureMatricesData = new Float32Array(numInstances * 9);
const textureMatrices = [];
for (let i = 0; i < numInstances; ++i) {
    textureMatrices.push(new Float32Array(textureMatricesData.buffer, i * 9 * 4, 9));
}
const textureMatrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, textureMatrixBuffer);
gl.bufferData(gl.ARRAY_BUFFER, textureMatricesData.byteLength, gl.DYNAMIC_DRAW);

let countInstances = 0;

function generateMesh(){
    // update all the matrices
    for(let x = 0; x < n; x++){
        console.log(x/n * 100)
        for(let y = 0; y < height; y++){
            for(let z = 0; z < n; z++){
                if (isCubeVisible(x, y, z)) {
                    setBlockInstanceId(x, y, z, countInstances)
                    translation(x + 0.5, y + 0.5, z + 0.5, matrices[countInstances]);
                    let m = []
                    if (getBlock(x, y, z).id == 2) {
                        colors.push(1.0, 0.15, 0.045, 1)
                        m = getTexturMatrix(0, textureSize, textureSize, textureSize, atlasWidth, atlasHeight)

                    } else if (getBlock(x, y, z).id == 1) {
                        colors.push(0.4, 0.9, 0.3, 1)
                        m = getTexturMatrix(0, 0, textureSize, textureSize, atlasWidth, atlasHeight)
                    }
                    for (let j = 0; j < 9; ++j) {
                        textureMatrices[countInstances][j] = m[j]
                    }
                    // if (countInstances == 0) {
                    //     colors.push(0.2, 0.2, 0.9, 1)
                    // }
                    // Copy coordinates to the texture array
                    // for (let i = 0; i < textureCoords.length; i++) {
                    //     textureInstances[countInstances][i] = textureCoords[i];
                    // }
                    // console.log(textureInstances[countInstances])
                    // textureInstances[countInstances] = textureCoords;
                    // calculate normal the matrix
                    transpose(inverse(matrices[countInstances]), normalMatrices[countInstances])

                    countInstances++;
                }
            }
        }
    }
}

generateMesh()

// upload the new matrix data
gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

for (let i = 0; i < 4; ++i) {
    const loc = aMmatrix + i ;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 4 * 16, i * 4 * 4);
    ext.vertexAttribDivisorANGLE(loc, 1);
}

// Upload the normal matrix data
gl.bindBuffer(gl.ARRAY_BUFFER, normalMatrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, normalMatrixData);

// Set up normal matrix attributes
for (let i = 0; i < 4; ++i) {
    const loc = aNormalMatrix + i;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 4 * 16, i * 4 * 4);
    ext.vertexAttribDivisorANGLE(loc, 1);
}

// // Create and store data into color buffer
// var color_buffer = createBufferFromArray(new Float32Array(colors), gl.ARRAY_BUFFER);
// gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);

// var _color = gl.getAttribLocation(shaderprogram, "aColor");
// gl.vertexAttribPointer(_color, 4, gl.FLOAT, false, 0, 0) ;
// gl.enableVertexAttribArray(_color);
// ext.vertexAttribDivisorANGLE(_color, 1);

gl.bindBuffer(gl.ARRAY_BUFFER, textureMatrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, textureMatricesData);
for (let i = 0; i < 3; ++i) {
    const loc = aTextureMatrix + i;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 4 * 9, i * 4 * 3);
    ext.vertexAttribDivisorANGLE(loc, 1);
}

var textureBuffer = createBufferFromArray(new Float32Array(textureCoords), gl.ARRAY_BUFFER);
gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);

gl.enableVertexAttribArray(aTexture);
gl.vertexAttribPointer(aTexture, 2, gl.FLOAT, false, 0, 0);
// ext.vertexAttribDivisorANGLE(aTexture, 1);

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

gl.useProgram(shaderprogram);

/*==================== MATRIX ====================== */

function get_projection(fov, a, zMin, zMax) {
   var ang = degToRad(fov)*.5 // Math.tan((fov*.5)*Math.PI/180); 
   return [
      0.5/ang, 0 , 0, 0,
      0, 0.5*a/ang, 0, 0,
      0, 0, -(zMax+zMin)/(zMax-zMin), -1,
      0, 0, (-2*zMax*zMin)/(zMax-zMin), 0 
   ];
}

/*================= Mouse events ======================*/

const mousePos = {x: 0, y: 0}

let yaw = 0;   // Horizontal angle (yaw)
let pitch = 0; // Vertical angle (pitch)

document.addEventListener('mousemove', e => {
   if (document.pointerLockElement === canvas){
      // pos is in pixel coordinates for the canvas.
      // so convert to WebGL clip space coordinates
      mousePos.x = (((mousePos.x+1)/2) + e.movementX / gl.canvas.width)  *  2 - 1;
      mousePos.y = (((mousePos.y-1)/-2) + e.movementY / gl.canvas.height)  *  -2 + 1;
   }
   mousePos.y = Math.min(Math.max(-0.999, mousePos.y), 0.999);
   // console.log(mousePos.x, mousePos.y)
   yaw = mousePos.x * Math.PI / 2     
   pitch = -mousePos.y * Math.PI / 2 
});

document.addEventListener("wheel", e => {
   // scale the FOV by 5 units
   obj.FOV += e.deltaY * 0.05; 
   // Restrict scale
   obj.FOV = Math.min(Math.max(10, obj.FOV), 120);
   FOV.updateDisplay()
}, { passive: false });


// canvas.addEventListener("mousedown", mouseDown, false);
// canvas.addEventListener("mouseup", mouseUp, false);
document.addEventListener("click", e => {canvas.requestPointerLock();});
document.addEventListener("mouseout", e => {document.exitPointerLock();});

/*=================== Drawing =================== */

let frameCount = 0;
let renderSum = 0; // sum of render time for each frame

var precentage = {precent: 0}
var obj = {
    FPS: 0,
    cameraPosition: {x: 1, y:1, z:3},
    lightPosition: {x: Math.floor(n/2), y:height, z:Math.floor(n/2), ambient: 0.3, gamma: 1},
    FOV: 60,
    speed: 0.5,
    // rotationSpeed: 0.02, // Speed of rotation
    zMax: 250,
    zMin: 0.25,
    skyColor: [ 150, 220, 255 ], // RGB array
    fogNear: 0.4,
    fogFar: 0.5,
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
lightPositionFolder.add(obj.lightPosition, 'x').min(-64).max(64).step(1);
lightPositionFolder.add(obj.lightPosition, 'y').min(-64).max(64).step(1);
lightPositionFolder.add(obj.lightPosition, 'z').min(-64).max(64).step(1);
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

// Sky color (sunrise to sunset)
const skyColors = [
    { time: 0, color: [205, 204, 255] },      // Sunrise (yellow)
    { time: 0.15, color: [150, 226, 255] }, // Day (blue)
    { time: 0.85, color: [255, 165, 0] },   // Sunset (orange)
    { time: 0.95, color: [200, 155, 250] }, // Sunset (pink)
    { time: 1, color: [0, 0, 0] },          // Night (black)
    { time: 1.1, color: [205, 204, 255] },
];

var time = 0;

var animate = function() {
    let renderTime = performance.now();

    time = (time + 0.001) % 1.1;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.LEQUAL);
    
    var color = [150, 226, 255]
    // Update sky color based on time
    for (let i = 0; i < skyColors.length - 1; i++) {
        const current = skyColors[i];
        const next = skyColors[i + 1];
        if (time >= current.time && time <= next.time) {
          const factor = (time - current.time) / (next.time - current.time);
          color = interpolateColor(current.color, next.color, factor);
        }
    }

    gl.clearColor(color[0]/255, color[1]/255, color[2]/255, 1);
    // gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set the fog color and amount
    gl.uniform4fv(uFogColor, [color[0]/255, color[1]/255, color[2]/255, 1]);
    gl.uniform1f(uFogNear, obj.fogNear * obj.zMax);
    gl.uniform1f(uFogFar, obj.fogFar * obj.zMax);

    var proj_matrix = get_projection(obj.FOV, canvas.width/canvas.height, obj.zMin, obj.zMax);
    var cameraPositionArray = calculateCameraPos(obj.cameraPosition, obj.speed, yaw, pitch);
    cameraPositionFolder.updateDisplay()
    var target = [ cameraPositionArray[0] + Math.cos(pitch) * Math.sin(yaw),
                    cameraPositionArray[1] - Math.sin(pitch),
                    cameraPositionArray[2] - Math.cos(pitch) * Math.cos(yaw)
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
    gl.uniform3fv(uLightPosition, [ n * time,
                                    2 * height * Math.sqrt(Math.max(Math.sin(time*Math.PI), 0)),
                                    n * time]);
    
    gl.uniform1i(uTexture, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

    faceMatrices.forEach(function(faceMatrix, ndx) {
        gl.uniform2fv(uTextureOffset, new Float32Array(textureOffsets[ndx]));
        gl.uniform3fv(uNormal, new Float32Array(normals[ndx]));
        gl.uniformMatrix4fv(uFaceMatrix, false, faceMatrix);
        ext.drawElementsInstancedANGLE(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0, countInstances);
    });

    renderSum += performance.now() - renderTime
    frameCount++;

    // Update FPS every second
    if (frameCount >= 100) {
        FPS.setValue(Math.round((frameCount * 100) / (renderSum)));
        frameCount = 0;
        renderSum = 0;
    }

    window.requestAnimationFrame(animate);
}
animate(0);