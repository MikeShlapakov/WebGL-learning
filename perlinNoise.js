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

const cell = 2**6
const grid = 8
let perlin = new Array(grid).fill(new Array(grid).fill(new Array(cell).fill(new Array(cell).fill(new Color))));

console.log(perlin);
function matrixToPNG(matrix, pixelSize = 1) {
    // Create a canvas element
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth * window.devicePixelRatio || 1
    canvas.height = window.innerHeight * window.devicePixelRatio || 1
    
    // Draw the matrix on the canvas
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        for(let i = 0; i < matrix[y][x].length; i++){
            for(let j = 0; j < matrix[y][x][i].length; j++){
                ctx.fillStyle = `rgb(${255*i/cell},${255*j/cell},0)`; // Assume matrix contains color values
                ctx.fillRect(j+x*cell, i+y*cell, pixelSize, pixelSize);
            }
        }
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