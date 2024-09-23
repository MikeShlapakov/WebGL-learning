/*============= Creating a canvas ======================*/
var canvas = document.getElementById('canvas');
gl = canvas.getContext('webgl');
if (!gl) {
   console.log("no webgl for you!")
}

gl.getExtension("OES_element_index_uint");

canvas.width = window.innerWidth * window.devicePixelRatio || 1
canvas.height = window.innerHeight * window.devicePixelRatio || 1

/*========== Defining and storing the geometry ==========*/

let n = 16;
let chunks = 1;

// Function to get vertices and determine visible faces for a cube
function get_cube_data(x, y, z, size = 1) {
    const half = size / 2;
    let vertices = [];
    let colors = [];
    let indices = [];
    let visibleFaces = [];

    // Check each face
    if (y === 0 || !visibilityGrid[x][y-1][z]) {
        visibleFaces.push('bottom');
    }
    if (y === n - 1 || !visibilityGrid[x][y+1][z]) {
        visibleFaces.push('top');
    }
    if (x === 0 || !visibilityGrid[x-1][y][z]) {
        visibleFaces.push('left');
    }
    if (x === n * chunks - 1 || !visibilityGrid[x+1][y][z]) {
        visibleFaces.push('right');
    }
    if (z === 0 || !visibilityGrid[x][y][z-1]) {
        visibleFaces.push('back');
    }
    if (z === n * chunks - 1 || !visibilityGrid[x][y][z+1]) {
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
                break;
            case 'front':
                vertices.push(
                    x + half, y - half, z + half,
                    x - half, y - half, z + half,
                    x - half, y + half, z + half,
                    x + half, y + half, z + half
                );
                break;
            case 'left':
                vertices.push(
                    x - half, y - half, z + half,
                    x - half, y - half, z - half,
                    x - half, y + half, z - half,
                    x - half, y + half, z + half
                );
                break;
            case 'right':
                vertices.push(
                    x + half, y - half, z - half,
                    x + half, y - half, z + half,
                    x + half, y + half, z + half,
                    x + half, y + half, z - half
                );
                break;
            case 'bottom':
                vertices.push(
                    x + half, y - half, z - half,
                    x - half, y - half, z - half,
                    x - half, y - half, z + half,
                    x + half, y - half, z + half
                );
                break;
            case 'top':
                vertices.push(
                    x + half, y + half, z + half,
                    x - half, y + half, z + half,
                    x - half, y + half, z - half,
                    x + half, y + half, z - half
                );
                break;
        }
        colors = colors.concat([1,0,0, 0,1,0, 0,0,1, 0,1,1]);
        //colors = colors.concat([x/(n*chunks),y/(n),z/(n*chunks), x/(n*chunks),y/(n),z/(n*chunks), x/(n*chunks),y/(n),z/(n*chunks), x/(n*chunks),y/(n),z/(n*chunks)]);
        indices = indices.concat([
            vertexCount, vertexCount + 2, vertexCount + 1,
            vertexCount, vertexCount + 3, vertexCount + 2
        ]);
        vertexCount += 4;
    });

    return { vertices, colors, indices };
}

// 3D array to store cube visibility
let visibilityGrid = new Array(n * chunks).fill(null).map(() => 
    new Array(n).fill(null).map(() => 
        new Array(n * chunks).fill(true)
    )
);

// Function to check if a cube is visible (not fully occluded)
function isCubeVisible(x, y, z) {
    // Check if it's on the edge of the grid
    if (x === 0 || x === n*chunks - 1 || y === 0 || y === n - 1 || z === 0 || z === n*chunks - 1) {
        return true;
    }
    // console.log(x,y,z, visibilityGrid)
    // Check if any neighboring cube is missing
    return !visibilityGrid[x-1][y][z] || !visibilityGrid[x+1][y][z] ||
           !visibilityGrid[x][y-1][z] || !visibilityGrid[x][y+1][z] ||
           !visibilityGrid[x][y][z-1] || !visibilityGrid[x][y][z+1];
}

let vertices = [];
let colors = [];
let indices = [];
let k = 0;

for(let w = 0; w < chunks; w++){
   for(let l = 0; l < chunks; l++){
     console.log((w/chunks+l/(chunks*chunks)) * 100)
      for(let i = 0; i < n; i++){
         for(let j = 0; j < n; j++){
            for(let z = 0; z < n; z++){
                let x = w * n + i;
                let y = z;
                let zCoord = l * n + j;
                
                if (isCubeVisible(x, y, zCoord)) {
                    // console.log(x,y,zCoord)
                    let cubeData = get_cube_data(x, y, zCoord, 1);
                    vertices = vertices.concat(cubeData.vertices);
                    colors = colors.concat(cubeData.colors);
                    indices = indices.concat(cubeData.indices.map(index => index + k));
                    k += cubeData.vertices.length / 3;
                } else {
                    // visibilityGrid[x][y][zCoord] = false;
                }
            }
         }
      }
   }
}

console.log("Number of vertices:", vertices.length);
console.log("Number of indices:", indices.length);

// Create and store data into vertex buffer
var vertex_buffer = createBufferFromArray(new Float32Array(vertices), gl.ARRAY_BUFFER);

// Create and store data into color buffer
var color_buffer = createBufferFromArray(new Float32Array(colors), gl.ARRAY_BUFFER);

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
var _Pmatrix = gl.getUniformLocation(shaderprogram, "Pmatrix");
var _Vmatrix = gl.getUniformLocation(shaderprogram, "Vmatrix");
var _Mmatrix = gl.getUniformLocation(shaderprogram, "Mmatrix");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var _position = gl.getAttribLocation(shaderprogram, "position");
gl.vertexAttribPointer(_position, 3, gl.FLOAT, false,0,0);
gl.enableVertexAttribArray(_position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
var _color = gl.getAttribLocation(shaderprogram, "color");
gl.vertexAttribPointer(_color, 3, gl.FLOAT, false,0,0) ;
gl.enableVertexAttribArray(_color);
gl.useProgram(shaderprogram);

/*==================== MATRIX ====================== */

var mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

function get_projection(fov, a, zMin, zMax) {
   var ang = degToRad(fov) // Math.tan((fov*.5)*Math.PI/180); 
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

var obj = {
    FPS: 0,
    cameraPosition: {x: 0, y:1, z:1},
    FOV: 60,
    speed: 0.25,
    // rotationSpeed: 0.02, // Speed of rotation
    zMax: 250,
    zMin: 0.25,
    color: [ 150, 220, 255 , 1] // RGB array
};

var gui = new dat.gui.GUI({ autoPlace: true });
gui.domElement.id = 'gui';

var FPS = gui.add(obj, 'FPS')
var cameraPositionFolder = gui.addFolder('Camera Position')
cameraPositionFolder.add(obj.cameraPosition, 'x')
cameraPositionFolder.add(obj.cameraPosition, 'y')  
cameraPositionFolder.add(obj.cameraPosition, 'z')
cameraPositionFolder.open()
var FOV = gui.add(obj, 'FOV').min(10).max(120).step(5);
gui.add(obj, 'speed').min(0.01).max(1).step(0.01);
gui.add(obj, 'zMax').min(10).max(500).step(10); // Increment amount
gui.add(obj, 'zMin').min(0.01).max(10).step(0.05); // Increment amount
gui.addColor(obj, 'color'); // Increment amount

var animate = function(time) {
    let renderTime = performance.now();

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.LEQUAL);
        
    gl.clearColor(obj.color[0]/255, obj.color[1]/255, obj.color[2]/255, obj.color[3]);
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
    gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

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