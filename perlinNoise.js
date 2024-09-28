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
    let f = Math.cos(Math.sin(x+1) * 1000)
    return f - Math.floor(f);
}

function pseudoRndVec(vec2){
    vec2 = [vec2[0] + 0.02, vec2[1] + 0.02];
    x = dot(vec2, [123.4, 234.5]);
    y = dot(vec2, [345.6, 456.7]);
    let gradient = [x, y];
    gradient = [Math.sin(gradient[0]),Math.cos(gradient[1])];
    gradient = [gradient[0] * 1234.4321, gradient[1] * 5678.8765];
    
    gradient = [Math.cos(gradient[0]),Math.sin(gradient[1])];
    return gradient;
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

const cellsize = 64   // grid size
const cellLength = cellsize/2  //resulotion
const gridLength = 16  // grid 
const brightness = 2.0

let perlin = new Array(gridLength).fill(new Array(gridLength).fill(new Array(cellLength).fill(new Array(cellLength).fill(null))));

function cellEvaluation(x, y, vecArray){
    let ratio = cellsize/cellLength;
    for (let i = 0; i < cellLength; i++) {
        for (let j = 0; j < cellLength; j++){
            let center = [(j)*ratio+ratio/2, (i)*ratio+ratio/2]
            // console.log(center)
            let distTl = [center[0]/cellsize-0, center[1]/cellsize-1];
            let distTr = [center[0]/cellsize-1, center[1]/cellsize-1];
            let distBl = [center[0]/cellsize-0, center[1]/cellsize-0];
            let distBr = [center[0]/cellsize-1, center[1]/cellsize-0];

            let dotTl = dot(vecArray[0], distTl) // vecArray[0][0]*(center[0]/cellsize-0)+vecArray[0][1]*(0-center[1]/cellsize);
            let dotTr = dot(vecArray[1], distTr) // vecArray[1][0]*(center[0]/cellsize-1)+vecArray[1][1]*(0-center[1]/cellsize);
            let dotBl = dot(vecArray[2], distBl) // vecArray[2][0]*(center[0]/cellsize-0)+vecArray[2][1]*(1-center[1]/cellsize);
            let dotBr = dot(vecArray[3], distBr) // vecArray[3][0]*(center[0]/cellsize-1)+vecArray[3][1]*(1-center[1]/cellsize);

            let TLTR = coserp(dotTl, dotTr, center[0]/cellsize)
            // console.log(dotTl, dotTr, center[0], TLTR)
            let BLBR = coserp(dotBl, dotBr, center[0]/cellsize)
            // console.log(dotBl, dotBr, center[1], BLBR)
            let value = coserp(BLBR, TLTR, center[1]/cellsize)
            // console.log(value, x,y, j,i)
            
            let color = Math.floor(255*quinticFade((value+0.3)))
            ctx.fillStyle = new Color(color,color,color);
            // console.log(i, j, perlin[y][x][i][j].toString())
            ctx.fillRect(j*ratio+x*cellsize,i*ratio+y*cellsize, ratio, ratio);
        }
    }
}

function matrixToPNG(matrix, pixelSize = 1) {
    // Draw the matrix on the canvas
    for (let y = 0; y < gridLength; y++) {
        for (let x = 0; x < gridLength; x++) {

            let tr = [(x+1), ( y+1 )] 
            let tl = [( x ), ( y+1 )] 
            let br = [(x+1), ( y )]
            let bl = [( x ), ( y )]
            
            // console.log(tl, tr, bl, br);
            ctx.strokeStyle = '#00FF00';
            // console.log(tl[0]*gridLength, tl[1]*gridLength, br[0]*gridLength, br[1]*gridLength)
            // ctx.strokeRect(tl[0]*cellLength, tl[1]*cellLength, cellsize, cellsize);

            ctx.strokeStyle = '#ff0000';
            let trVec = pseudoRndVec(tr) //[Math.cos(pseudoRnd(3*tr[0]+tr[1]*cellLength)*2*Math.PI), Math.sin(pseudoRnd(3*tr[0]+tr[1]*cellLength)*2*Math.PI)]// rotateVector([ 1, 1], 1) * 2*Math.PI)
            ctx.beginPath();
            ctx.moveTo(tr[0]*cellsize, tr[1]*cellsize);
            ctx.lineTo(tr[0]*cellsize+trVec[0]*cellsize, tr[1]*cellsize+trVec[1]*cellsize);
            // ctx.stroke();
            let tlVec = pseudoRndVec(tl) //[Math.cos(pseudoRnd(3*tl[0]+tl[1]*cellsize)*2*Math.PI), Math.sin(pseudoRnd(3*tl[0]+tl[1]*cellsize)*2*Math.PI)]// rotateVector([-1, 1],  * 2*Math.PI) 
            ctx.beginPath();
            ctx.moveTo(tl[0]*cellsize, tl[1]*cellsize);
            ctx.lineTo(tl[0]*cellsize+tlVec[0]*cellsize, tl[1]*cellsize+tlVec[1]*cellsize);
            // ctx.stroke();
            let brVec = pseudoRndVec(br) //[Math.cos(pseudoRnd(3*br[0]+br[1]*cellsize)*2*Math.PI), Math.sin(pseudoRnd(3*br[0]+br[1]*cellsize)*2*Math.PI)]// rotateVector([ 1,-1], *gridLength+x+1) * 2*Math.PI) 
            ctx.beginPath();
            ctx.moveTo(br[0]*cellsize, br[1]*cellsize);
            ctx.lineTo(br[0]*cellsize+brVec[0]*cellsize, br[1]*cellsize+brVec[1]*cellsize);
            // ctx.stroke();
            let blVec = pseudoRndVec(bl) //[Math.cos(pseudoRnd(3*bl[0]+bl[1]*cellsize)*2*Math.PI), Math.sin(pseudoRnd(3*bl[0]+bl[1]*cellsize)*2*Math.PI)]// rotateVector([-1,-1], *gridLength+x) * 2*Math.PI) 
            ctx.beginPath();
            ctx.moveTo(bl[0]*cellsize, bl[1]*cellsize);
            ctx.lineTo(bl[0]*cellsize+blVec[0]*cellsize, bl[1]*cellsize+blVec[1]*cellsize);
            // ctx.stroke();

            cellEvaluation(x,y, [tlVec,trVec,blVec,brVec]) 
        }
    }
    // // Convert canvas to PNG data URL
    // const dataURL = canvas.toDataURL('image/png');
    
    // // Create a downloadable link
    // const link = document.createElement('a');
    // link.download = 'matrix.png';
    // link.href = dataURL;
    // link.click();
}

matrixToPNG(perlin); // Creates a 3x3 PNG with 50x50 pixel squares