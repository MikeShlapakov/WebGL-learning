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

var vertices = []
var colors = []
var indices = []
function get_ver(x, y, z, size = 1) {
   // Vertices for a single cube, relative to (x, y, z)
   const half = size / 2;
   return [
      // back
      x - half, y - half, z - half,  // 1: bottom-right
      x + half, y - half, z - half,  // 0: bottom-left
      x + half, y + half, z - half,  // 2: top-left
      x - half, y + half, z - half,  // 3: top-right
      
      // front
      x + half, y - half, z + half,  // 5: bottom-right
      x - half, y - half, z + half,  // 4: bottom-left
      x - half, y + half, z + half,  // 7: top-left
      x + half, y + half, z + half,  // 6: top-right

      // left
      x - half, y - half, z + half,  // 11: bottom-right
      x - half, y - half, z - half,  // 8: bottom-left
      x - half, y + half, z - half,  // 9: top-left
      x - half, y + half, z + half,  // 10: top-right

      // right
      x + half, y - half, z - half,  // 12: bottom-right
      x + half, y - half, z + half,  // 14: bottom-left
      x + half, y + half, z + half,  // 14: top-left
      x + half, y + half, z - half,  // 13: top-right

      // bottom
      x + half, y - half, z - half,  // 19: bottom-right
      x - half, y - half, z - half,  // 16: bottom-left
      x - half, y - half, z + half,  // 17: top-left
      x + half, y - half, z + half,  // 18: top-right

      // top
      x + half, y + half, z + half,  // 22: bottom-right
      x - half, y + half, z + half,  // 21: bottom-left
      x - half, y + half, z - half,  // 20: top-left
      x + half, y + half, z - half,  // 23: top-right
   ];
}

var col = [
   1,0,0, 0,1,0, 0,0,1, 1,1,0, // back
   1,0,0, 0,1,0, 0,0,1, 1,1,0, // front
   1,0,0, 0,1,0, 0,0,1, 1,1,0, // right
   1,0,0, 0,1,0, 0,0,1, 1,1,0, // left
   1,0,0, 0,1,0, 0,0,1, 1,1,0, // bottom
   1,0,0, 0,1,0, 0,0,1, 1,1,0  // top
];

// console.log(colors)

function get_indices(k){ 
   return [
      0+k, 2+k, 1+k, 0+k, 3+k, 2+k, // Back face
      4+k, 6+k, 5+k, 4+k, 7+k, 6+k, // Front face
      8+k, 10+k, 9+k, 8+k, 11+k,10+k, // Left face
      12+k,14+k, 13+k, 12+k, 15+k, 14+k,// Right face
      16+k,18+k, 17+k, 16+k, 19+k, 18+k,// Bottom face
      20+k,22+k, 21+k, 20+k, 23+k,  22+k // Top face
   ];
}

let n = 16;
let chunks = 1
let k = 0;
for(let w = 1; w <= chunks; w++){
   console.log(w/chunks * 100)
   for(let l = 1; l <= chunks; l++){
      for(let i = 0; i < n; i++){
         for(let j = 0; j < n; j++){
            for(let z = 0; z < n; z++){
               // console.log((i*n+j)*n+z, i, j, z)
               // console.log(1 < i && i < n )
               // if (0 < i && i < n-1 && 0 < j && j < n-1 && 0 < z && z < n-1) continue;
               vertices = vertices.concat(get_ver((w*n)+i,z,(l*n)+j))
               colors = colors.concat(col)
               indices = indices.concat(get_indices(k*24))
               k++;
            }
         }
      }
   }
}

console.log(indices.length)

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
   var ang = degToRad(fov) //Math.tan((angle*.5)*Math.PI/180);
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
   FOV += e.deltaY * 0.05; 
   // Restrict scale
   FOV = Math.min(Math.max(10, FOV), 120);
}, { passive: false });


// canvas.addEventListener("mousedown", mouseDown, false);
// canvas.addEventListener("mouseup", mouseUp, false);
document.addEventListener("click", e => {canvas.requestPointerLock();});
document.addEventListener("mouseout", e => {document.exitPointerLock();});

/*=================== Drawing =================== */

let frameCount = 0;
let renderSum = 0; // Update FPS every second

var FPSElement = document.querySelector("#fps");
var FPSNode = document.createTextNode("");
FPSElement.appendChild(FPSNode);

let FOV = 60;

const cameraPos = {x: 0, y: 2, z: 0}

const speed = 0.25;
const rotationSpeed = 0.02; // Speed of rotation

var animate = function(time) {
   let renderTime = performance.now();

   gl.enable(gl.CULL_FACE);
   gl.enable(gl.DEPTH_TEST);
   // gl.depthFunc(gl.LEQUAL);

   gl.clearColor(0.7, 0.9, 1.0, 1);
   // gl.clearDepth(1.0);
   gl.viewport(0.0, 0.0, canvas.width, canvas.height);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   var proj_matrix = get_projection(FOV, canvas.width/canvas.height, 1, 100);
   let cameraPosition = calculateCameraPos(cameraPos, speed, yaw, pitch);
   var target = [ cameraPosition[0] + Math.cos(pitch) * Math.sin(yaw),
                  cameraPosition[1] - Math.sin(pitch),
                  cameraPosition[2] - Math.cos(pitch) * Math.cos(yaw)
               ];

   var up = [0, 1, 0];
   var cameraMatrix = lookAt(cameraPosition, target, up);

   // Make a view matrix from the camera matrix.
   var view_matrix = inverse(cameraMatrix);

   gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix);
   gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
   gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix);

   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
   gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
   
   renderTime = performance.now() - renderTime
   renderSum += renderTime
   frameCount++;

   // Update FPS every second
   if (frameCount >= 100) {
       FPSNode.nodeValue = Math.round((frameCount * 1000) / (renderSum));
       frameCount = 0;
       renderSum = 0;
   }

   window.requestAnimationFrame(animate);
}
animate(0);