class Color {
    constructor(r=0, g=0, b=0) {
        this.r = this._clamp(r);
        this.g = this._clamp(g);
        this.b = this._clamp(b);
    }

    _clamp(value) {
        return Math.max(0, Math.min(255, value));
    }

    toRgbString() {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

    toHexString() {
        return `#${this.r.toString(16).padStart(2, '0')}${this.g.toString(16).padStart(2, '0')}${this.b.toString(16).padStart(2, '0')}`;
    }

    toString() {
        return this.toRgbString();
    }
}

function pseudoRnd(x){
    let f = Math.cos(Math.sin(x) * 1000)
    return f ;
}

function pseudoRndVec(vec2){
    vec2 = [vec2[0] + 1, vec2[1] + 1];
    let x = dot(vec2, [123.4, 234.5]);
    let y = dot(vec2, [345.6, 456.7]);

    let grad = [Math.sin(x), Math.sin(y)];
    grad = [grad[0] * 1234.4321, grad[1] * 5678.8765];
    grad = [Math.cos(grad[0]),Math.sin(grad[1])];

    return grad;
}

function lerp(a, b, t){
    return a + t * (b - a);
}

function coserp(a, b, t){
    let l = (1 - Math.cos(t * Math.PI)) / 2;
    return lerp(a, b, l);
}

function rotateVector(vec, deg){
    return [ Math.cos(deg)*vec[0] - Math.sin(deg)*vec[1],
             Math.sin(deg)*vec[0] + Math.cos(deg)*vec[1] ]
}

function quinticFade(x, min=0, max=1){
    // x = clamp((x - min) / (max - min));
    return x * x * x * (10.0 + x * (-15.0 + x * 6.0));
}

function cubicFade( x, min=0, max=1) {
    // x = clamp((x - edge0) / (edge1 - edge0));
    return x * x * (3 - 2 * x);
 }
 
function clamp(x, lowerlimit = 0, upperlimit = 1) {
    return Math.max(lowerlimit, Math.min(upperlimit, x));
}

// Create a canvas element
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * window.devicePixelRatio   || 1
canvas.height = window.innerHeight * window.devicePixelRatio || 1

const noiseSize = 8 // noise size
const cellsize = 2**noiseSize  
const resolution = 2  //resolution
const cellLength = cellsize/resolution; // ratio of the pixels
const gridLength = 2**(9-noiseSize)  // grid size 
const brightness = 0.9

let perlin = new Array(gridLength).fill(new Array(gridLength).fill(new Array(cellLength).fill(new Array(cellLength).fill(null))));

function cellEvaluation(x, y, vecArray){
    for (let i = 0; i < cellLength; i++) {
        for (let j = 0; j < cellLength; j++){
            let center = [(j)*resolution+resolution/2, (i)*resolution+resolution/2] // center of each pixel
            // console.log(center)
            // distance of the pixel from the corners of the cell
            let distTl = [center[0]/cellsize-0, center[1]/cellsize-0];
            let distTr = [center[0]/cellsize-1, center[1]/cellsize-0];
            let distBl = [center[0]/cellsize-0, center[1]/cellsize-1];
            let distBr = [center[0]/cellsize-1, center[1]/cellsize-1];

            // calculating the dot for each pixel
            let dotTl = dot(vecArray.tl, distTl) // vecArray[0][0]*(center[0]/cellsize-0)+vecArray[0][1]*(0-center[1]/cellsize);
            let dotTr = dot(vecArray.tr, distTr) // vecArray[1][0]*(center[0]/cellsize-1)+vecArray[1][1]*(0-center[1]/cellsize);
            let dotBl = dot(vecArray.bl, distBl) // vecArray[2][0]*(center[0]/cellsize-0)+vecArray[2][1]*(1-center[1]/cellsize);
            let dotBr = dot(vecArray.br, distBr) // vecArray[3][0]*(center[0]/cellsize-1)+vecArray[3][1]*(1-center[1]/cellsize);
            
            // cosine interpolation
            let TLTR = coserp(dotTl, dotTr, center[0]/cellsize)
            // console.log(dotTl, dotTr, center[0], TLTR)
            let BLBR = coserp(dotBl, dotBr, center[0]/cellsize)
            // console.log(dotBl, dotBr, center[1], BLBR)
            let value = coserp(TLTR, BLBR, center[1]/cellsize)
            // console.log(value, x,y, j,i)
            
            let color = Math.floor(255*quinticFade((value*brightness+0.3)))
            // perlin[y][x][i][j]  = [color,color,color];
            // console.log(i, j, perlin[y][x][i][j].toString())
            ctx.fillStyle = new Color(color,color,color);
            ctx.fillRect(j*resolution+x*cellsize,i*resolution+y*cellsize, resolution, resolution);
        }
    }
}

function matrixToPNG(matrix, pixelSize = 1) {
    let renderTime = performance.now();
    // calculate for the grid
    for (let y = 0; y < gridLength; y++) {
        for (let x = 0; x < gridLength; x++) {

            // calculate for the points of the cell
            let tl = [ x ,  y ]
            let tr = [x+1,  y ]
            let bl = [ x , y+1] 
            let br = [x+1, y+1] 
            
            // console.log(bl, br, tl, tr);
            // ctx.sbrokeStyle = '#00FF00';
            // console.log(bl[0]*gridLength, bl[1]*gridLength, tr[0]*gridLength, tr[1]*gridLength)
            // ctx.sbrokeRect(bl[0]*cellLength, bl[1]*cellLength, cellsize, cellsize);

            // // transform each point to a random vector

            // ctx.sbrokeStyle = '#FF0000';
            let tlVec = pseudoRndVec(tl) //[Math.cos(pseudoRnd(3*tl[0]+tl[1]*cellsize)*2*Math.PI), Math.sin(pseudoRnd(3*tl[0]+tl[1]*cellsize)*2*Math.PI)]// rotateVector([-1,-1], *gridLength+x) * 2*Math.PI) 
            // ctx.beginPath();
            // ctx.moveTo(tl[0]*cellsize, tl[1]*cellsize);
            // ctx.lineTo(tl[0]*cellsize+tlVec[0]*cellsize, tl[1]*cellsize+tlVec[1]*cellsize);
            // ctx.stroke();
            let trVec = pseudoRndVec(tr) //[Math.cos(pseudoRnd(3*tr[0]+tr[1]*cellsize)*2*Math.PI), Math.sin(pseudoRnd(3*tr[0]+tr[1]*cellsize)*2*Math.PI)]// rotateVector([ 1,-1], *gridLength+x+1) * 2*Math.PI) 
            // ctx.beginPath();
            // ctx.moveTo(tr[0]*cellsize, tr[1]*cellsize);
            // ctx.lineTo(tr[0]*cellsize+trVec[0]*cellsize, tr[1]*cellsize+trVec[1]*cellsize);
            // ctx.stroke();
            let blVec = pseudoRndVec(bl) //[Math.cos(pseudoRnd(3*bl[0]+bl[1]*cellsize)*2*Math.PI), Math.sin(pseudoRnd(3*bl[0]+bl[1]*cellsize)*2*Math.PI)]// rotateVector([-1, 1],  * 2*Math.PI) 
            // ctx.beginPath();
            // ctx.moveTo(bl[0]*cellsize, bl[1]*cellsize);
            // ctx.lineTo(bl[0]*cellsize+blVec[0]*cellsize, bl[1]*cellsize+blVec[1]*cellsize);
            // ctx.stroke();
            let brVec = pseudoRndVec(br) //[Math.cos(pseudoRnd(3*br[0]+br[1]*cellLength)*2*Math.PI), Math.sin(pseudoRnd(3*br[0]+br[1]*cellLength)*2*Math.PI)]// rotateVector([ 1, 1], 1) * 2*Math.PI)
            // ctx.beginPath();
            // ctx.moveTo(br[0]*cellsize, br[1]*cellsize);
            // ctx.lineTo(br[0]*cellsize+brVec[0]*cellsize, br[1]*cellsize+brVec[1]*cellsize);
            // ctx.stroke();

            // calculate the gradient for the cell
            cellEvaluation(x,y, {bl:blVec, br:brVec, tl:tlVec, tr:trVec}) 
        }
    }
    console.log(Math.floor(performance.now() - renderTime));
    // console.log(perlin)
    // // Convert canvas to PNG data URL
    // const dataURL = canvas.toDataURL('image/png');
    
    // // Create a downloadable link
    // const link = document.createElement('a');
    // link.download = 'matrix.png';
    // link.href = dataURL;
    // link.click();
}

matrixToPNG(perlin); // Creates a 3x3 PNG with 50x50 pixel squares