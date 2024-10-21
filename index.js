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

let height = 32
let n = 64;
let chunks = 1;

let vertices = [ 0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
                -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,
                 0.5,  0.5,  0.5, -0.5,  0.5,  0.5, 
                -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
                -0.5, -0.5,  0.5, -0.5, -0.5, -0.5,
                -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,
                 0.5, -0.5, -0.5,  0.5, -0.5,  0.5,
                 0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
                -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,
                 0.5,  0.5, -0.5, -0.5,  0.5, -0.5,
                 0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
                -0.5,  0.5,  0.5,  0.5,  0.5,  0.5
]

let indices = [ 0, 2, 1, 0, 3, 2,
                4, 6, 5, 4, 7, 6,
                8, 10, 9, 8, 11, 10, 
                12, 14, 13, 12, 15, 14, 
                16, 18, 17, 16, 19, 18, 
                20, 22, 21, 20, 23, 22];

var normals = [

    // bottom
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // top
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // left
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // right
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    
    // back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
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
var _Pmatrix = gl.getUniformLocation(shaderprogram, "uPmatrix");
var _Vmatrix = gl.getUniformLocation(shaderprogram, "uVmatrix");
var _Mmatrix = gl.getAttribLocation(shaderprogram, "aMmatrix");
var aNormalMatrix = gl.getAttribLocation(shaderprogram, "aNormalMatrix");

var uAmbientLight = gl.getUniformLocation(shaderprogram, "uAmbientLight");
var uLightColor = gl.getUniformLocation(shaderprogram, "uLightColor");
var uLightPosition = gl.getUniformLocation(shaderprogram, "uLightPosition");
var uViewPosition = gl.getUniformLocation(shaderprogram, 'uViewPosition');

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
        scale: 10,
        offset : 0,
        magnitude: 0.7
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

function generateMesh(){
    let countInstances = 0;
    // update all the matrices
    for(let x = 0; x < n; x++){
        console.log(x/n * 100)
        for(let y = 0; y < height; y++){
            for(let z = 0; z < n; z++){
                if (isCubeVisible(x, y, z)) {
                    setBlockInstanceId(x, y, z, countInstances)
                    translation(x + 0.5, y + 0.5, z + 0.5, matrices[countInstances]);

                    if (getBlock(x, y, z).id == 2) {
                        colors.push(0.6, 0.12, 0.01, 1)
                    } else if (getBlock(x, y, z).id == 1) {
                        colors.push(0.2, 0.4, 0.2, 1)
                    }

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
    const loc = _Mmatrix + i ;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, i * 16);
    ext.vertexAttribDivisorANGLE(loc, 1);
}

// Upload the normal matrix data
gl.bindBuffer(gl.ARRAY_BUFFER, normalMatrixBuffer);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, normalMatrixData);

// Set up normal matrix attributes
for (let i = 0; i < 4; ++i) {
    const loc = aNormalMatrix + i;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, i * 16);
    ext.vertexAttribDivisorANGLE(loc, 1);
}

var normals_buffer = createBufferFromArray(new Float32Array(normals), gl.ARRAY_BUFFER);
gl.bindBuffer(gl.ARRAY_BUFFER, normals_buffer);

var normalLocation = gl.getAttribLocation(shaderprogram, "aNormal");
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0) ;
gl.enableVertexAttribArray(normalLocation);

// Create and store data into color buffer
var color_buffer = createBufferFromArray(new Float32Array(colors), gl.ARRAY_BUFFER);
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);

var _color = gl.getAttribLocation(shaderprogram, "aColor");
gl.vertexAttribPointer(_color, 4, gl.FLOAT, false, 0, 0) ;
gl.enableVertexAttribArray(_color);
ext.vertexAttribDivisorANGLE(_color, 1);

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
    cameraPosition: {x: 0, y:1, z:1},
    lightPosition: {x: Math.floor(n/2), y:height, z:Math.floor(n/2), ambient: 1},
    FOV: 60,
    speed: 0.25,
    // rotationSpeed: 0.02, // Speed of rotation
    zMax: 250,
    zMin: 0.25,
    skyColor: [ 150, 220, 255 ] // RGB array
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
lightPositionFolder.open()
var FOV = gui.add(obj, 'FOV').min(10).max(120).step(5);
gui.add(obj, 'speed').min(0.01).max(1).step(0.01);
gui.add(obj, 'zMax').min(10).max(500).step(10); // Increment amount
gui.add(obj, 'zMin').min(0.01).max(10).step(0.05); // Increment amount
gui.addColor(obj, 'skyColor'); // Increment amount

var animate = function(time) {
    let renderTime = performance.now();

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.LEQUAL);
        
    gl.clearColor(obj.skyColor[0]/255, obj.skyColor[1]/255, obj.skyColor[2]/255, obj.skyColor[3]);
    // gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

    gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
    gl.uniform3fv(uViewPosition, [cameraPositionArray[0], cameraPositionArray[1], cameraPositionArray[2]]);  // Your camera position
    // console.log(view_matrix)

    gl.uniform3f(uLightColor, obj.skyColor[0]/255, obj.skyColor[1]/255, obj.skyColor[2]/255);
    gl.uniform3f(uAmbientLight, obj.lightPosition.ambient, obj.lightPosition.ambient, obj.lightPosition.ambient);
    gl.uniform3fv(uLightPosition, [obj.lightPosition.x,
                                                obj.lightPosition.y,
                                                obj.lightPosition.z]);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    ext.drawElementsInstancedANGLE(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0, numInstances);

    renderSum += performance.now() - renderTime
    frameCount++;

    // Update FPS every second
    if (frameCount >= 100) {
        FPS.setValue(Math.round((frameCount * 1000) / (renderSum)));
        frameCount = 0;
        renderSum = 0;
    }

    window.requestAnimationFrame(animate);
}
animate(0);