function interpolateColor(color1, color2, t) {
    // Ensure t is between 0 and 1
    t = Math.max(0, Math.min(1, t));

    // Interpolate each color component (red, green, blue)
    const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);

    return [r, g, b];
}

function lerp(a, b, t){
    return a + t * (b - a);
}

function quinticFade(x) {
    return x * x * x * (10.0 + x * (-15.0 + x * 6.0));
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

self.onmessage = function(e) {
    const { width, height, startX, endX, startY, endY, noiseSize, z, p, resolution, isOctaveNoiseOn, fogness, perlinData} = e.data;

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
    
        let y1 = lerp(lerp(  grad (aaa, x  , y  , z), grad (baa, x-1, y  , z), u) ,
                        lerp(grad (aba, x  , y-1, z), grad (bba, x-1, y-1, z), u),
                                 v);
        let y2 = lerp (lerp( grad (aab, x  , y  , z-1),grad (bab, x-1, y  , z-1), u), 
                        lerp( grad (abb, x  , y-1, z-1),grad (bbb, x-1, y-1, z-1),u),
                        v);
        
        return (lerp (y1, y2, w)+1)/2;    
    }

    // Generate noise and image data
    let value;

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (isOctaveNoiseOn) {
                value = OctavePerlin(x * resolution, y * resolution, z * resolution, noiseSize, fogness);
            } else {
                value = noise(x * resolution, y * resolution, z * resolution);
                // console.log(value)
            }
            perlinData[y * (width) + (x)] = value;     
        }
    }

    // console.log(startX, endX, startY, endY, perlinData)
    // Send the image data back to the main thread
    self.postMessage({ startX, startY, perlinData });
};