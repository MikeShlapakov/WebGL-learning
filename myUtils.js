function createBufferFromArray(arr, glArr=gl.ARRAY_BUFFER){
    var buff = gl.createBuffer ();
    gl.bindBuffer(glArr, buff);
    gl.bufferData(glArr, arr, gl.STATIC_DRAW);
    return buff
 }
 
function getRelativeMousePosition(event, target) {
    target = target || event.target;

    var rect = target.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * target.width  / target.clientWidth,
        y: (event.clientY - rect.top) * target.height / target.clientHeight,
    }
}

function degToRad(d) {
    return d * Math.PI / 180;
}

// Normalize a vector
function normalizeVector(vector) {
    let length = Math.sqrt(vector[0]**2 + vector[1]**2 + vector[2]**2);
    return [vector[0] / length, vector[1] / length, vector[2] / length];
}

// Normalize a vector
function addVector(vector1, vector2) {
    // let length = Math.sqrt(vector[0]**2 + vector[1]**2 + vector[2]**2);
    return [vector1[0] + vector2[0], vector1[1] + vector2[1], vector1[2] + vector2[2]];
}

const keys = {}
function calculateCameraPos(cameraPos, speed, yaw, pitch){
    let normal = [0,0,0];
    if (keys['a'])
        normal = addVector(normal, normalizeVector([
                -Math.cos(yaw),
                0,
                -Math.sin(yaw)
                ]));

    if (keys['d']) // Move right
        normal = addVector(normal, normalizeVector([
                Math.cos(yaw),
                0,
                Math.sin(yaw)
            ]));
            
    if (keys['w']) // Move forward
        normal = addVector(normal, normalizeVector([
                Math.cos(pitch) * Math.sin(yaw),
                0,
                -Math.cos(pitch) * Math.cos(yaw)
            ]));
            
    if (keys['s']) // Move backward
        normal = addVector(normal, normalizeVector([
                -Math.cos(pitch) * Math.sin(yaw),
                0,
                Math.cos(pitch) * Math.cos(yaw)
            ]));
           
    if (keys[' ']) // Move up
        normal = addVector(normal, normalizeVector([0,1,0]));
            
    if (keys['Control']) // Move down
        normal = addVector(normal, normalizeVector([0,-1,0]));
    
    if (normal != [0,0,0]){
        // console.log( normal )
        cameraPos.x += speed * normal[0];
        cameraPos.y += speed * normal[1];
        cameraPos.z += speed * normal[2];
    }

    return [cameraPos.x, cameraPos.y, cameraPos.z];
}

// Keydown event listener
document.addEventListener('keydown', function(event) {

    switch(event.key) {
        case 'ArrowLeft': // Rotate left (yaw negative)
            yaw -= rotationSpeed;
            break;
        case 'ArrowRight': // Rotate right (yaw positive)
            yaw += rotationSpeed;
            break;
        case 'ArrowUp': // Rotate up (pitch positive)
            pitch -= rotationSpeed;
            break;
        case 'ArrowDown': // Rotate down (pitch negative)
            pitch += rotationSpeed;
            break;

        case 'a':
        case 'A': 
            keys['a'] = true;
            break;
        case 'd':
        case 'D': 
            keys['d'] = true;
            break;
        case 'w':
        case 'W': 
            keys['w'] = true;
            break;
        case 's':
        case 'S': 
            keys['s'] = true;
            break;
        case ' ':
            keys[' '] = true;
            break;
        case 'Control': // Shift key - Move down
            keys['Control'] = true;
            break;
        default:
            break;
    }
});

// Keyup event listener
document.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'a':
        case 'A': 
            keys['a'] = false;
            break;
        case 'd':
        case 'D': 
            keys['d'] = false;
            break;
        case 'w':
        case 'W':
            keys['w'] = false;
            break;
        case 's':
        case 'S': 
            keys['s'] = false;
            break;
        case ' ':
            keys[' '] = false;
            break;
        case 'Control': 
            keys['Control'] = false;
            break;
        default:
            break;
        }
})

function allButIndices(name) {
    return name !== 'indices';
}

function deindexVertices(vertices) {
    const indices = vertices.indices;
    const newVertices = {};
    const numElements = indices.length;

    function expandToUnindexed(channel) {
        const srcBuffer = vertices[channel];
        const numComponents = srcBuffer.numComponents;
        const dstBuffer = webglUtils.createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
        for (let ii = 0; ii < numElements; ++ii) {
        const ndx = indices[ii];
        const offset = ndx * numComponents;
        for (let jj = 0; jj < numComponents; ++jj) {
            dstBuffer.push(srcBuffer[offset + jj]);
        }
        }
        newVertices[channel] = dstBuffer;
    }

    Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);

    return newVertices;
}

function createFlattenedFunc(vertFunc, color) {
    const vertices = vertFunc;
    const { indices, ...attributes } = vertices;
    const numElements = indices.length;
    
    const newVertices = Object.fromEntries(
        Object.entries(attributes).map(([name, attr]) => {
            const newAttr = new attr.constructor(numElements * attr.numComponents);
            for (let i = 0; i < numElements; i++) {
                const index = indices[i] * attr.numComponents;
                for (let j = 0; j < attr.numComponents; j++) {
                    newAttr[i * attr.numComponents + j] = attr[index + j];
                }
            }
            return [name, newAttr];
        })
    );

    // Add random colors
    newVertices.color = new Uint8Array(numElements * 4);
    for (let i = 0; i < numElements; i += 6) {
        // const color = [Math.random() * 128,Math.random() * 128,Math.random() * 128,255].map(Math.floor);
        newVertices.color.set(color.concat(color, color, color, color, color), i * 4);
    }

    return webglUtils.createBufferInfoFromArrays(gl, newVertices);
};


const CUBE_FACE_INDICES = [
    [3, 7, 5, 1], // right
    [6, 2, 0, 4], // left
    [6, 7, 3, 2], // ??
    [0, 1, 5, 4], // ??
    [7, 6, 4, 5], // front
    [2, 3, 1, 0], // back
];


/**
 * Creates the vertices and indices for a cube. The
 * cube will be created around the origin. (-size / 2, size / 2)
 *
 * @param {number} size Width, height and depth of the cube.
 * @return {Object.<string, TypedArray>} The
 *         created plane vertices.
 */
function createCubeVertices(size) {
    const k = size / 2;

    const cornerVertices = [
      [-k, -k, -k],
      [+k, -k, -k],
      [-k, +k, -k],
      [+k, +k, -k],
      [-k, -k, +k],
      [+k, -k, +k],
      [-k, +k, +k],
      [+k, +k, +k],
    ];

    const faceNormals = [
      [+1, +0, +0],
      [-1, +0, +0],
      [+0, +1, +0],
      [+0, -1, +0],
      [+0, +0, +1],
      [+0, +0, -1],
    ];

    const uvCoords = [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ];

    const numVertices = 6 * 4;
    const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    const normals   = webglUtils.createAugmentedTypedArray(3, numVertices);
    const texCoords = webglUtils.createAugmentedTypedArray(2 , numVertices);
    const indices   = webglUtils.createAugmentedTypedArray(3, 6 * 2, Uint16Array);

    for (let f = 0; f < 6; ++f) {
      const faceIndices = CUBE_FACE_INDICES[f];
      for (let v = 0; v < 4; ++v) {
        const position = cornerVertices[faceIndices[v]];
        const normal = faceNormals[f];
        const uv = uvCoords[v];

        // Each face needs all four vertices because the normals and texture
        // coordinates are not all the same.
        positions.push(position);
        normals.push(normal);
        texCoords.push(uv);
      }
      // Two triangles make a square face.
      const offset = 4 * f;
      indices.push(offset + 0, offset + 1, offset + 2);
      indices.push(offset + 0, offset + 2, offset + 3);
    }

    return {
      position: positions,
      normal: normals,
      texcoord: texCoords,
      indices: indices,
    };
}