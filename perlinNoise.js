function lerp(a, b, t){
    return a + t * (b - a);
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
    let xf = x - Math.floor(x);
    let yf = y - Math.floor(y);
    let zf = z - Math.floor(z);

    let u = quinticFade(xf)
    let v = quinticFade(yf)
    let w = quinticFade(zf)

    let aaa = p[p[p[ xi ]+  yi ]+  zi ];
    let aba = p[p[p[ xi ]+ yi+1]+  zi ];
    let aab = p[p[p[ xi ]+  yi ]+ zi+1];
    let abb = p[p[p[ xi ]+ yi+1]+ zi+1];
    let baa = p[p[p[xi+1]+  yi ]+  zi ];
    let bba = p[p[p[xi+1]+ yi+1]+  zi ];
    let bab = p[p[p[xi+1]+  yi ]+ zi+1];
    let bbb = p[p[p[xi+1]+ yi+1]+ zi+1];

    let x1 = lerp(  grad (aaa, xf  , yf  , zf),            // The gradient function calculates the dot product between a pseudorandom
                    grad (baa, xf-1, yf  , zf),            // gradient vector and the vector from the input coordinate to the 8
                    u);                                    // surrounding points in its unit cube.
    let x2 = lerp(  grad (aba, xf  , yf-1, zf),            // This is all then lerped together as a sort of weighted average based on the faded (u,v,w)
                    grad (bba, xf-1, yf-1, zf),            // values we made earlier.
                    u);
    let y1 = lerp(x1, x2, v);

    x1 = lerp(  grad (aab, xf  , yf  , zf-1),
                grad (bab, xf-1, yf  , zf-1),
                u);
    x2 = lerp( grad (abb, xf  , yf-1, zf-1),
                grad (bbb, xf-1, yf-1, zf-1),
                u);
    let y2 = lerp (x1, x2, v);
    
    return (lerp (y1, y2, w)+1)/2;    
}

function grad(hash, x, y, z)
{
    switch(hash & 0xF)
    {
        case 0x0: return  x + y;
        case 0x1: return -x + y;
        case 0x2: return  x - y;
        case 0x3: return -x - y;
        case 0x4: return  x + z;
        case 0x5: return -x + z;
        case 0x6: return  x - z;
        case 0x7: return -x - z;
        case 0x8: return  y + z;
        case 0x9: return -y + z;
        case 0xA: return  y - z;
        case 0xB: return -y - z;
        case 0xC: return  y + x;
        case 0xD: return -y + z;
        case 0xE: return  y - x;
        case 0xF: return -y - z;
        default: return 0; // never happens
    }
}

// Create a canvas element
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * window.devicePixelRatio   || 1
canvas.height = window.innerHeight * window.devicePixelRatio || 1

const noiseSize = 4   // noise size
const resolution = 2**noiseSize/Math.max(canvas.width, canvas.height)

let perlin = new Array(canvas.height*canvas.width).fill(0);

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

function cellEvaluation(){
    let calcTime = performance.now();
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++){
            // let value = OctavePerlin(x*resolution, y*resolution, noiseSize, 1);
            let value = noise(x*resolution, y*resolution, 1);
            perlin[y*canvas.width+x] = Math.floor(value * 255);
        }
    }
    console.log("Calculation Time:", Math.floor(performance.now() - calcTime));
}

cellEvaluation()

function matrixToPNG() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const d = imageData.data;

    let renderTime = performance.now();
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const m = perlin[y * canvas.width + x];
            const index = (y * canvas.width + x) * 4;
            d[index] = m;
            d[index + 1] = m;
            d[index + 2] = m;
            d[index + 3] = 255;
        }
    }
    console.log("Render Time:", Math.floor(performance.now() - renderTime));

    ctx.putImageData(imageData, 0, 0);
}

matrixToPNG();