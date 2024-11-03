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
        console.log('Error in program linking:' + lastError);

        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function createBufferFromArray(arr, glArr=gl.ARRAY_BUFFER){
    var buff = gl.createBuffer ();
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
        ext.vertexAttribDivisorANGLE(loc, 1);
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

const keys = {'`': true}

function isDebugOn(){
    return keys['`'];
}

function calculateCameraPos(cameraPos, speed, yaw, pitch){
    let normal = [0,0,0];
    if (keys['w']) // Move forward
    normal = addVectors(normal, normalize([
            Math.cos(yaw),
            0,
            Math.sin(yaw)
        ]));

    if (keys['s'])  // Move backward
        normal = addVectors(normal, normalize([
                -Math.cos(yaw),
                0,
                -Math.sin(yaw)
                ]));
            
    if (keys['a']) // Move left
        normal = addVectors(normal, normalize([
                Math.cos(pitch) * Math.sin(yaw),
                0,
                -Math.cos(pitch) * Math.cos(yaw)
            ]));
            
    if (keys['d']) // Move right
        normal = addVectors(normal, normalize([
                -Math.cos(pitch) * Math.sin(yaw),
                0,
                Math.cos(pitch) * Math.cos(yaw)
            ]));
           
    if (keys[' ']) // Move up
        normal = addVectors(normal, normalize([0,1,0]));
            
    if (keys['Shift']) // Move down
        normal = addVectors(normal, normalize([0,-1,0]));
    
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
    // console.log(event.key)
    switch(event.key) {
        // case 'ArrowLeft': // Rotate left (yaw negative)
        //     yaw -= rotationSpeed;
        //     break;
        // case 'ArrowRight': // Rotate right (yaw positive)
        //     yaw += rotationSpeed;
        //     break;
        // case 'ArrowUp': // Rotate up (pitch positive)
        //     pitch -= rotationSpeed;
        //     break;
        // case 'ArrowDown': // Rotate down (pitch negative)
        //     pitch += rotationSpeed;
        //     break;

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
        case 'Shift': // Shift key - Move down
            keys['Shift'] = true;
            break;
        case '`': // Debug screen
            keys['`'] = !keys['`'];
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
        case 'Shift': 
            keys['Shift'] = false;
            break;
        default:
            break;
        }
})

// Source: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/19301306#19301306
class RNG {
    m_w = 123456789;
    m_z = 987654321;
    mask = 0xffffffff;

    constructor(seed) {
        this.m_w = (123456789 + seed) & this.mask;
        this.m_z = (987654321 - seed) & this.mask;
    }

    random() {
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;
        result /= 4294967296;
        return result;
    }
}

class World {
    constructor(width, height, seed = 123, terrain = {scale: 20,offset: 0,magnitude: 1}) {
        this.width = width;
        this.height = height;
        this.worldGrid = [];
        this.terrain = terrain;
        
        this.rng = new RNG(seed);
        this.perlinNoise = new PerlinNoise(this.rng);

        this.initializeGrid();
    }

    initializeGrid() {
        for (let x = 0; x < this.width; x++) {
            const slice = [];
            for (let y = 0; y < this.height; y++) {
                const row = [];
                for (let z = 0; z < this.width; z++) {
                    row.push({
                        id: 0,
                        instanceId: null,
                    });
                }
                slice.push(row);
            }
            this.worldGrid.push(slice);
        }
    }

    isInBounds(x, y, z) {
        return (0 <= x && x < this.width) && (0 <= y && y < this.height) && (0 <= z && z < this.width);
    }

    getBlock(x, y, z) {
        if (this.isInBounds(x, y, z)) {
            return this.worldGrid[x][y][z];
        }
        return null;
    }

    setBlockId(x, y, z, id) {
        if (this.isInBounds(x, y, z)) {
            this.worldGrid[x][y][z].id = id;
        }
    }

    setBlockInstanceId(x, y, z, instanceId) {
        if (this.isInBounds(x, y, z)) {
            this.worldGrid[x][y][z].instanceId = instanceId;
        }
    }

    generateTerrain() {
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.width; z++) {
                const value = this.perlinNoise.noise(
                    x / this.terrain.scale,
                    z / this.terrain.scale,
                    1
                );
                const scaledNoise = value * this.terrain.magnitude + this.terrain.offset;
                const h = Math.max(0, Math.min(this.height - 1, Math.floor(scaledNoise * this.height)));

                for (let y = 0; y <= this.height; y++) {
                    if (y < h) {
                        this.setBlockId(x, y, z, 2); // Interior block
                    } else if (y === h) {
                        this.setBlockId(x, y, z, 1); // Surface block
                    }
                }
            }
        }
    }

    isCubeVisible(x, y, z) {
        const block = this.getBlock(x, y, z);
        if (!block || block.id === 0) {
            return false;
        }

        // Check if it's on the edge of the grid
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1 || z === 0 || z === this.width - 1) {
            return true;
        }

        // Check if any neighboring cube is missing
        return !this.worldGrid[x - 1][y][z].id || !this.worldGrid[x + 1][y][z].id ||
               !this.worldGrid[x][y - 1][z].id || !this.worldGrid[x][y + 1][z].id ||
               !this.worldGrid[x][y][z - 1].id || !this.worldGrid[x][y][z + 1].id;
    }
}

function castARay(world, cameraPos, cameraDirection, maxDistance){
    const blockPos = {
        x: Math.floor(cameraPos.x),
        y: Math.floor(cameraPos.y),
        z: Math.floor(cameraPos.z)
    }

    const step = {
        x: cameraDirection.x > 0 ? 1: -1,
        y: cameraDirection.y > 0 ? 1: -1,
        z: cameraDirection.z > 0 ? 1: -1
    };

    const deltaSteps = {
        x: Math.abs(1 / cameraDirection.x),
        y: Math.abs(1 / cameraDirection.y),
        z: Math.abs(1 / cameraDirection.z)
    };

    const tMax = {
        x: step.x > 0 ? (blockPos.x+1 - cameraPos.x) * deltaSteps.x : 
            (cameraPos.x - blockPos.x) * deltaSteps.x,
        y: step.y > 0 ? (blockPos.y+1 - cameraPos.y) * deltaSteps.y :
            (cameraPos.y - blockPos.y) * deltaSteps.y,
        z: step.z > 0 ? (blockPos.z+1 - cameraPos.z) * deltaSteps.z :
            (cameraPos.z - blockPos.z) * deltaSteps.z
    };

    let totalDistance = 0;
    while (totalDistance < maxDistance) {
        let normal = {x:0, y:0, z:0};

        if (tMax.x < tMax.y && tMax.x < tMax.z) {
            blockPos.x += step.x;
            totalDistance = tMax.x;
            tMax.x += deltaSteps.x;
            normal.x = step.x > 0 ? -1: 1
        } else if (tMax.y < tMax.z) {
            blockPos.y += step.y;
            totalDistance = tMax.y;
            tMax.y += deltaSteps.y;
            normal.y = step.y > 0 ? -1: 1
        } else {
            blockPos.z += step.z;
            totalDistance = tMax.z;
            tMax.z += deltaSteps.z;
            normal.z = step.z > 0 ? -1: 1
        }

        const block = world.getBlock(blockPos.x, blockPos.y, blockPos.z);
        if (block) {
            if (block.id != 0){
                return {
                    position: blockPos,
                    normal: normal,
                    hit: true
                };
            }
        }
    }

    return {
        hit: false,
    };
}