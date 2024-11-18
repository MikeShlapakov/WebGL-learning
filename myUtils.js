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

const keys = {'`': true, 't': true}

function isDebugOn(){
    return keys['`'];
}

function showLines(){
    return keys['t'];
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
        case 't': // Debug screen
            keys['t'] = !keys['t'];
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
    constructor(chunkSize, renderDist, matrices, countInstances, worldParams = {seed: 123, terrain: {scale:30,offset: 0,magnitude: 1}}) {
        this.chunkSize = chunkSize;
        this.renderDist = renderDist;
        this.matrices = matrices;
        this.worldParams = worldParams;
        this.countInstances = countInstances;
        
        this.chunks = [];
    }

    getChunk(x, y, z) {
        if(y >= this.chunkSize.height){
            return null;
        }

        const chunkX = Math.floor(x / this.chunkSize.width);
        const chunkZ = Math.floor(z / this.chunkSize.width);
        if (chunkZ >= chunksNum || chunkX >= chunksNum ){
            // console.log("trying to get chunk out of borders")
            return null;
        }
        return this.chunks.find((chunk) => chunk.position.x == chunkX * this.chunkSize.width &&
                                            chunk.position.z == chunkZ * this.chunkSize.width);
    }

    generateChunks(){
        for (let x = -this.renderDist; x <= this.renderDist; x++) {
            for (let z = -this.renderDist; z <= this.renderDist; z++) {
                this.generateChunk(x, z);
            }
        }
        return (this.matrices, this.countInstances);
    }

    generateChunk(chunkX, chunkZ){
        const chunk = new Chunk(this.chunkSize, { x: chunkX * this.chunkSize.width, z: chunkZ * this.chunkSize.width}, this.worldParams);
        chunk.generateTerrain();
        chunk.generateMesh();

        for (let i = 0; i < chunk.instanceCount; i++) {
            if (chunk.mesh.getPositionMatrix(i) === null) break;
            const positionMatrix = chunk.mesh.getPositionMatrix(i);
            const normalMatrix = chunk.mesh.getNormalMatrix(i);
            const textureMatrix = chunk.mesh.getTextureMatrix(i);
            for (let j = 0; j < 16; ++j) {
                this.matrices.positionMatrices[this.countInstances + i][j] = positionMatrix[j];
                this.matrices.normalMatrices[this.countInstances + i][j] = normalMatrix[j]; 
            }
            for (let j = 0; j < 9; ++j) {
                this.matrices.textureMatrices[this.countInstances + i][j] = textureMatrix[j];
            }
        }
        this.countInstances += chunk.instanceCount;
        this.chunks.push(chunk);
    }

    generateAllMeshes(){
        let chunkStartIndex = 0;
        for (let c = 0; c < this.chunks.length; c++) {
            for (let i = 0; i < this.chunks[c].instanceCount; i++) {
                if (this.chunks[c].mesh.getPositionMatrix(i) === null) break;
                const positionMatrix = this.chunks[c].mesh.getPositionMatrix(i);
                const normalMatrix = this.chunks[c].mesh.getNormalMatrix(i);
                const textureMatrix = this.chunks[c].mesh.getTextureMatrix(i);
                for (let j = 0; j < 16; ++j) {
                    this.matrices.positionMatrices[chunkStartIndex + i][j] = positionMatrix[j];
                    this.matrices.normalMatrices[chunkStartIndex + i][j] = normalMatrix[j]; 
                }
                for (let j = 0; j < 9; ++j) {
                    this.matrices.textureMatrices[chunkStartIndex + i][j] = textureMatrix[j];
                }
            }
            chunkStartIndex += this.chunks[c].instanceCount;
        }
        this.countInstances = chunkStartIndex;
    }

    removeBlock(x, y, z){
        // last instanced block is getting the instances number of the breaking block
        const chunk = this.getChunk(x, y, z);
        chunk.toGenerate = true;
        const skipInstances = chunk.instanceCount;

        chunk.instanceCount--;
        const pos = chunk.getBlockPositionByInstance(chunk.instanceCount);

        chunk.setBlockInstanceId(pos.x, pos.y, pos.z, this.getBlock(x, y, z).instanceId);

        // remove the broken block from the instances
        this.setBlockId(x, y, z, 0);
        this.setBlockInstanceId(x, y, z, null);

        // regenerate the chunk
        chunk.generateMesh();

        this.generateAllMeshes();
        // let chunkStartIndex = 0;
        // for (let i = 0; i < this.chunks.length; i++) {
        //     if (this.chunks[i].toGenerate){
        //         this.chunks.splice(i, 1);
        //         break;
        //     }
        //     chunkStartIndex += this.chunks[i].instanceCount;
        // }

        // this.chunks.push(chunk);

        // for (let i = chunkStartIndex; i < this.countInstances - skipInstances; i++) {
        //     for (let j = 0; j < 16; ++j) {
        //         this.matrices.positionMatrices[i][j] = this.matrices.positionMatrices[i + skipInstances][j];
        //         this.matrices.normalMatrices[i][j] = this.matrices.normalMatrices[i + skipInstances][j]; 
        //     }
        //     for (let j = 0; j < 9; ++j) {
        //         this.matrices.textureMatrices[i][j] = this.matrices.textureMatrices[i + skipInstances][j];
        //     }
        // }

        // for (let i = 0; i < chunk.instanceCount; i++) {
        //     const positionMatrix = chunk.mesh.getPositionMatrix(i);
        //     const normalMatrix = chunk.mesh.getNormalMatrix(i);
        //     const textureMatrix = chunk.mesh.getTextureMatrix(i);
        //     for (let j = 0; j < 16; ++j) {
        //         this.matrices.positionMatrices[this.countInstances - skipInstances + i][j] = positionMatrix[j];
        //         this.matrices.normalMatrices[this.countInstances - skipInstances + i][j] = normalMatrix[j]; 
        //     }
        //     for (let j = 0; j < 9; ++j) {
        //         this.matrices.textureMatrices[this.countInstances - skipInstances +i][j] = textureMatrix[j];
        //     }
        // }

        // chunk.toGenerate = false;
        // this.countInstances += chunk.instanceCount - skipInstances;
        return (this.matrices, this.countInstances);
    }

    addBlock(x, y, z){
        
        const chunk = this.getChunk(x, y, z);
        if(!chunk) return (this.matrices, this.countInstances);

        this.setBlockId(x, y, z, 2);

        this.setBlockInstanceId(x, y, z, chunk.instanceCount);
        chunk.instanceCount++;

        chunk.generateMesh()
        
        this.generateAllMeshes();

        return (this.matrices, this.countInstances);
    }

    getBlock(x, y, z) {
        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const chunk = this.getChunk(x, y, z);

        return chunk ? chunk.getBlock(localX, y, localZ) : null;
    }

    setBlockId(x, y, z, id) {
        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;        
        const chunk = this.getChunk(x, y, z);
        if (chunk) {
            chunk.setBlockId(localX, y, localZ, id);
        }
    }

    setBlockInstanceId(x, y, z, instanceId) {
        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const chunk = this.getChunk(x, y, z);
        if (chunk) {
            chunk.setBlockInstanceId(localX, y, localZ, instanceId);
        }
    }
}

class Chunk {
    constructor(chunkSize, position, params) {
        this.size = chunkSize;
        this.position = position;
        this.params = params

        this.rng = new RNG(this.params.seed);
        this.perlinNoise = new PerlinNoise(this.rng);

        this.chunkGrid = this.initializeGrid();

        this.mesh = new Mesh(chunkSize.width * chunkSize.height * chunkSize.width);
        this.instanceCount = 0;
    }

    initializeGrid() {
        const grid = [];
        for (let x = 0; x < this.size.width; x++) {
            const slice = [];
            for (let y = 0; y < this.size.height; y++) {
                const row = [];
                for (let z = 0; z < this.size.width; z++) {
                    row.push({ id: 0, instanceId: null });
                }
                slice.push(row);
            }
            grid.push(slice);
        }
        return grid;
    }

    isInBounds(x, y, z) {
        return (0 <= x && x < this.size.width) && (0 <= y && y < this.size.height) && (0 <= z && z < this.size.width);
    }

    getBlockPositionByInstance(instance){
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const block = this.getBlock(x, y, z);
                    if(block.instanceId == instance){
                        return {x: x, y: y, z: z};
                    };
                }
            }
        }
        return null;
    }

    getBlock(x, y, z) {
        if (this.isInBounds(x, y, z)) {
            return this.chunkGrid[x][y][z];
        }
        return null;
    }

    setBlockId(x, y, z, id) {
        if (this.isInBounds(x, y, z)) {
            this.chunkGrid[x][y][z].id = id;
        }
    }

    setBlockInstanceId(x, y, z, instanceId) {
        if (this.isInBounds(x, y, z)) {
            this.chunkGrid[x][y][z].instanceId = instanceId;
        }
    }

    isCubeVisible(x, y, z) {
        const block = this.getBlock(x, y, z);
        if (!block || block.id === 0) {
            return false;
        }

        // Check if it's on the edge of the grid
        if (x === 0 || x === this.size.width - 1 || y === 0 || y === this.size.height - 1 || z === 0 || z === this.size.width - 1) {
            return true;
        }

        // Check if any neighboring cube is missing
        return !this.chunkGrid[x - 1][y][z].id || !this.chunkGrid[x + 1][y][z].id ||
               !this.chunkGrid[x][y - 1][z].id || !this.chunkGrid[x][y + 1][z].id ||
               !this.chunkGrid[x][y][z - 1].id || !this.chunkGrid[x][y][z + 1].id;
    }

    generateTerrain() {
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                const value = this.perlinNoise.noise(
                    (this.position.x + x >= 0 ? 2*(this.position.x + x) : -2*(this.position.x + x) - 1) / this.params.terrain.scale,
                    (this.position.z + z >= 0 ? 2*(this.position.z + z) : -2*(this.position.z + z) - 1) / this.params.terrain.scale,
                    1
                );
                const scaledNoise = value * this.params.terrain.magnitude + this.params.terrain.offset;
                const h = Math.max(0, Math.min(this.size.height - 1, Math.floor(scaledNoise * this.size.height)));

                for (let y = 0; y <= this.size.height; y++) {
                    if (y < h) {
                        this.setBlockId(x, y, z, 2); // Interior block
                    } else if (y === h) {
                        this.setBlockId(x, y, z, 1); // Surface block
                    }
                }
            }
        }
    }

    generateMesh(){
        // update all the matrices
        for(let x = 0; x < this.size.width; x++){
            // console.log(x/n * 100)
            for(let y = 0; y < this.size.height; y++){
                for(let z = 0; z < this.size.width; z++){

                    if (this.isCubeVisible(x, y, z)) {
                        let instanceNum = this.getBlock(x, y, z).instanceId;
                        if(instanceNum == null){
                            this.setBlockInstanceId(x, y, z, this.instanceCount) 
                            instanceNum = this.instanceCount;
                            this.instanceCount++;
                        }

                        this.mesh.setPositionMatrix(instanceNum, translation((this.position.x + x) + 0.5, y + 0.5, (this.position.z + z) + 0.5));
                        let textureMatrix = []
                        if (this.getBlock(x, y, z).id == 2) {
                            // colors.push(1.0, 0.15, 0.045, 1)
                            textureMatrix = getTexturMatrix(0, textureSize, textureSize, textureSize, atlasWidth, atlasHeight)
    
                        } else if (this.getBlock(x, y, z).id == 1) {
                            // colors.push(0.4, 0.9, 0.3, 1)
                            textureMatrix = getTexturMatrix(0, 0, textureSize, textureSize, atlasWidth, atlasHeight)
                        }
                        this.mesh.setTextureMatrix(instanceNum, textureMatrix)
                        this.mesh.setNormalMatrix(instanceNum, transpose(inverse(this.mesh.getPositionMatrix(instanceNum))))
                    }
                }
            }
        }
    }
}

class Mesh {
    constructor(meshSize) {
        this.meshSize = meshSize;
        this.positionMatrix = new Array(meshSize).fill(null);
        this.normalMatrix = new Array(meshSize).fill(null);
        this.textureMatrix = new Array(meshSize).fill(null);
    }

    // Helper function to check bounds
    isValidIndex(index) {
        if (index >= 0 && index < this.meshSize) {
            return true;
        }
        console.log('Index out of mesh bounds');
        return false;
    }

    // Getters
    getPositionMatrix(index) {
        if (this.isValidIndex(index)) {
            return this.positionMatrix[index];
        }
    }

    getNormalMatrix(index) {
        if (this.isValidIndex(index)) {
            return this.normalMatrix[index];
        }
    }

    getTextureMatrix(index) {
        if (this.isValidIndex(index)) {
            return this.textureMatrix[index];
        }
    }

    // Setters
    setPositionMatrix(index, value) {
        if (this.isValidIndex(index)) {
            if (value.length === 16) {
                this.positionMatrix[index] = value;
            } else {
                throw new Error('Value must be of length 16');
            }
        }
    }

    setNormalMatrix(index, value) {
        if (this.isValidIndex(index)) {
            if (value.length === 16) {
                this.normalMatrix[index] = value;
            } else {
                throw new Error('Value must be of length 16');
            }
        }
    }

    setTextureMatrix(index, value) {
        if (this.isValidIndex(index)) {
            if (value.length === 9) {
                this.textureMatrix[index] = value;
            } else {
                throw new Error('Value must be of length 9');
            }
        }
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