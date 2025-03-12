function createProgramFromSource(gl, {vertexShader, fragmentShader}){
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, document.getElementById(vertexShader).innerText);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, document.getElementById(fragmentShader).innerText);
    gl.compileShader(fragShader);

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        // something went wrong with the link
        const lastError = gl.getProgramInfoLog(program);
        alert('Error in program linking: ' + lastError);

        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function createBufferFromArray(arr, glArr=gl.ARRAY_BUFFER){
    var buff = gl.createBuffer();
    gl.bindBuffer(glArr, buff);
    gl.bufferData(glArr, arr, gl.STATIC_DRAW);
    return buff
}

function getBytesOfDataType(gl, type) {
    switch (type) {
        case gl.FLOAT:
            return 4; // GL.FLOAT
        case gl.BYTE:
            return 1; // GL.BYTE
        case gl.UNSIGNED_BYTE:
            return 1; // GL.UNSIGNED_BYTE
        case gl.SHORT:
            return 2; // GL.SHORT
        case gl.UNSIGNED_SHORT:
            return 2; // GL.UNSIGNED_SHORT
        case gl.INT:
            return 4; // GL.INT
        case gl.UNSIGNED_INT:
            return 4; // GL.UNSIGNED_INT
        default:
            throw new Error('Unknown type: ' + type);
    }
}


function setMatrixAttributes(gl, location, size, type, normalize = false){
    const sizeOfType = getBytesOfDataType(gl, type);
    for (let i = 0; i < size; ++i) {
        const loc = location + i ;
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, type, normalize, sizeOfType * size * size, i * sizeOfType * size);
        gl.vertexAttribDivisor(loc, 1);
    }
}

function getTexturMatrix(offsetX, offsetY, width, height, atlasWidth, atlasHeight) {
    // Normalized UVs based on the tile's position and the atlas size
    return [
        width / atlasWidth,   0,                    0,
        0,                    height / atlasHeight, 0,
        offsetX / atlasWidth, offsetY / atlasHeight, 1                   
    ];
}