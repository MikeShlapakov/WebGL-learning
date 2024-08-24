const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');
const gl = canvas.getContext("webgl");
if (!gl) {
    console.log("no webgl for you!")
}
   
canvas.width = window.innerWidth * window.devicePixelRatio || 1
canvas.height = window.innerHeight * window.devicePixelRatio || 1

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

var program = createProgram(gl, vertexShader, fragmentShader);

var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

var colorUniformLocation = gl.getUniformLocation(program, "u_color");

var positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Returns a random integer between x and y.
function randomInt(min=0, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Fills the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;

    // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
    // whatever buffer is bound to the `ARRAY_BUFFER` bind point
    // but so far we only have one buffer. If we had more than one
    // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2]), gl.STATIC_DRAW);
}

webglUtils.resizeCanvasToDisplaySize(gl.canvas);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Clear the canvas
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Tell it to use our program (pair of shaders)
gl.useProgram(program);

gl.enableVertexAttribArray(positionAttributeLocation);

// set the resolution
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

// Bind the position buffer.
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
 
// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
var size = 2;          // 2 components per iteration
var type = gl.FLOAT;   // the data is 32bit floats
var normalize = false; // don't normalize the data
var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
var offset = 0;        // start at the beginning of the buffer
gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset)

// draw 50 random rectangles in random colors
for (var ii = 0; ii < 50; ++ii) {
    // Setup a random rectangle
    // This will write to positionBuffer because
    // its the last thing we bound on the ARRAY_BUFFER
    // bind point
    setRectangle(
        gl, randomInt(0, 300), randomInt(0, 300), randomInt(50, 300), randomInt(50, 300));

    // Set a random color.
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}