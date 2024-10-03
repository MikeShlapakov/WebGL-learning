function lerp(a, b, t){
    return a + t * (b - a);
}

function interpolateColor(color1, color2, t) {
    // Ensure t is between 0 and 1
    t = Math.max(0, Math.min(1, t));

    // Interpolate each color component (red, green, blue)
    const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);

    return [r, g, b];
}

function quinticFade(x, min=0, max=1){
    // x = clamp((x - min) / (max - min));
    return x * x * x * (10.0 + x * (-15.0 + x * 6.0));
}

function cubicFade( x, min=0, max=1) {
    // x = clamp((x - min) / (max - min));
    return x * x * (3 - 2 * x);
}

function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

function noise(x, y, z){
    let xi = x & 255;                              // Calculate the "unit cube" that the point asked will be located in
    let yi = y & 255;                              // The left bound is ( |_x_|,|_y_|,|_z_| ) and the right bound is that
    let zi = z & 255;                              // plus 1.  Next we calculate the location (from 0.0 to 1.0) in that cube.
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    let u = quinticFade(x)
    let v = quinticFade(y)
    let w = quinticFade(z)

    let aaa = p[p[p[ xi ]+  yi ]+  zi ];
    let aba = p[p[p[ xi ]+ yi+1]+  zi ];
    let aab = p[p[p[ xi ]+  yi ]+ zi+1];
    let abb = p[p[p[ xi ]+ yi+1]+ zi+1];
    let baa = p[p[p[xi+1]+  yi ]+  zi ];
    let bba = p[p[p[xi+1]+ yi+1]+  zi ];
    let bab = p[p[p[xi+1]+  yi ]+ zi+1];
    let bbb = p[p[p[xi+1]+ yi+1]+ zi+1];

    let x1 = lerp(  grad (aaa, x  , y  , z),            // The gradient function calculates the dot product between a pseudorandom
                    grad (baa, x-1, y  , z),            // gradient vector and the vector from the input coordinate to the 8
                    u);                                    // surrounding points in its unit cube.
    let x2 = lerp(  grad (aba, x  , y-1, z),            // This is all then lerped together as a sort of weighted average based on the faded (u,v,w)
                    grad (bba, x-1, y-1, z),            // values we made earlier.
                    u);
    let y1 = lerp(x1, x2, v);

    x1 = lerp(  grad (aab, x  , y  , z-1),
                grad (bab, x-1, y  , z-1),
                u);
    x2 = lerp( grad (abb, x  , y-1, z-1),
                grad (bbb, x-1, y-1, z-1),
                u);
    let y2 = lerp (x1, x2, v);
    
    return (lerp (y1, y2, w)+1)/2;    
}

const gradients = [
    [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
    [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
    [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1],
    [1,1,0], [0,-1,1], [-1,1,0], [0,-1,-1]
];

function grad(hash, x, y, z) {
    const g = gradients[hash & 0xF];
    return g[0] * x + g[1] * y + g[2] * z;
}

// Create a canvas element
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 2**9  // window.innerWidth * window.devicePixelRatio   || 1
canvas.height = 2**9 //window.innerHeight * window.devicePixelRatio || 1

console.log(canvas.width, canvas.height)

const imageData = ctx.createImageData(canvas.width, canvas.height);
const imageDataArray = imageData.data;

var gui = new dat.gui.GUI();

var noiseGui = {
    FPS: 60,
    Speed: 1,
    noiseSize: 2,
    OctaveNoise: false,
    Fogness: 1,
    Color1: [255, 255, 255],
    Color2: [0, 0, 0 ]
};

var FPS = gui.add(noiseGui, 'FPS')
var noiseSize = gui.add(noiseGui, 'noiseSize').min(1).max(8).step(1); // noise size
var speed = gui.add(noiseGui, 'Speed').min(0).max(3).step(0.1);
var isOctaveNoiseOn = gui.add(noiseGui, 'OctaveNoise');
var fogness = gui.add(noiseGui, 'Fogness').min(0).max(3).step(0.25);
var color1 = gui.addColor(noiseGui, 'Color1');
var color2 = gui.addColor(noiseGui, 'Color2');

let perlin = new Float32Array(canvas.height*canvas.width);

let p = new Array(512);

for (let i = 0; i < 256; i ++) {
    p[ i ] = p[ i + 256] = Math.floor( Math.random() * 256 );
}

function OctavePerlin(x, y, z, octaves, persistence) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;  // Used for normalizing result to 0.0 - 1.0
    for(let i = 0; i < octaves; i++) {
        total += noise(x * frequency, y * frequency, z * frequency) * amplitude;
        
        maxValue += amplitude;
        
        amplitude *= persistence;
        frequency /= 2;
    }
    
    return total/maxValue;
}

function cellEvaluation(z = 1){
    let resolution = 2**noiseSize.getValue()/Math.max(canvas.width, canvas.height)
    let value = 0;
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++){
            if(isOctaveNoiseOn.getValue()){
                value = OctavePerlin(x*resolution, y*resolution, z*resolution, noiseSize.getValue(), fogness.getValue());
            }
            else{
                value = noise(x*resolution, y*resolution, z*resolution);
            }
            perlin[y*canvas.width+x] = value;
        }
    }
}

let calcTime = performance.now();
cellEvaluation()
console.log("Calculation Time:", Math.floor(performance.now() - calcTime));

function matrixToPNG() {
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let val = perlin[y * canvas.width + x];
            const color = interpolateColor(color1.getValue(), color2.getValue(), val)
            let index = (y * canvas.width + x) * 4;
            imageDataArray[index] = color[0];
            imageDataArray[index + 1] = color[1];
            imageDataArray[index + 2] = color[2];
            imageDataArray[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

let renderTime = performance.now();
matrixToPNG();
console.log("Render Time:", Math.floor(performance.now() - renderTime));

// simple function to animate the noise
let change = 1
let frameCount = 0;
let renderSum = 0;
let t,interval = 16;

function animateNoise() {
    let lastFrameTime = performance.now();
    cellEvaluation(change)
    matrixToPNG()
    renderSum += performance.now() - lastFrameTime
    frameCount++;

    // Update FPS every second
    if (frameCount >= 100) {
        FPS.setValue(Math.round((frameCount * 1000) / (renderSum)));
        frameCount = 0;
        renderSum = 0;
    }
    change+=speed.getValue()
    t = 1000/FPS.getValue() > 16 ? 1000/FPS.getValue() : 16 ;
    // console.log(t)
    clearInterval(interval);
    interval = setInterval(animateNoise, t);
}

animateNoise()