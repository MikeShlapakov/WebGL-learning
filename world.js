class World {
    constructor(chunkSize, renderDist, matrices, countInstances, worldParams = {seed: 123, terrain: {scale:20,offset: 0,magnitude: 0.4}}) {
        this.chunkSize = chunkSize;
        this.renderDist = renderDist;
        this.matrices = matrices;
        this.worldParams = worldParams;
        this.countInstances = countInstances;
        
        this.chunks = [];
    }

    positionToChunk(x, y, z){
        if(y >= this.chunkSize.height){
            return null;
        }

        const chunkX = Math.floor(x / this.chunkSize.width);
        const chunkZ = Math.floor(z / this.chunkSize.width);
        return {x: chunkX, z: chunkZ};
    }

    getChunk(coords) {
        if(!coords) return null;
        return this.chunks.find((chunk) => chunk.position.x == coords.x * this.chunkSize.width &&
                                            chunk.position.z == coords.z * this.chunkSize.width);
    }

    generateChunks(){
        for (let x = -this.renderDist; x <= this.renderDist; x++) {
            for (let z = -this.renderDist; z <= this.renderDist; z++) {
                this.generateChunk(x, z);
            }
        }
    }

    generateChunk(chunkX, chunkZ){
        const chunk = new Chunk(this.chunkSize, { x: chunkX * this.chunkSize.width, z: chunkZ * this.chunkSize.width}, this.worldParams);
        chunk.generateTerrain();
        this.chunks.push(chunk);
    }

    generateAllMeshes(){
        let chunkStartIndex = 0;
        for (const chunk of this.chunks) {
            if(chunk.toGenerate){
                chunk.generateMesh();
                chunk.toGenerate = false;
            } 
            for (let i = 0; i < chunk.instanceCount; i++) {
                for (let face = 0; face < 6; face++){
                    if (chunk.mesh[i].getPositionMatrix(face) === null) continue;
                    const positionMatrix = chunk.mesh[i].getPositionMatrix(face);
                    const normalMatrix = chunk.mesh[i].getNormalMatrix(face);
                    const textureMatrix = chunk.mesh[i].getTextureMatrix(face);
                    for (let j = 0; j < 16; ++j) {
                        this.matrices.positionMatrices[chunkStartIndex][j] = positionMatrix[j];
                        this.matrices.normalMatrices[chunkStartIndex][j] = normalMatrix[j]; 
                    }
                    for (let j = 0; j < 9; ++j) {
                        this.matrices.textureMatrices[chunkStartIndex][j] = textureMatrix[j];
                    }
                    chunkStartIndex++;
                }
            }
        }
        this.countInstances = chunkStartIndex;
        return this.countInstances;
    }

    removeBlock(x, y, z){
        // last instanced block is getting the instances number of the breaking block
        const chunk = this.getChunk(this.positionToChunk(x, y, z));
        chunk.toGenerate = true;
 
        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;       

        chunk.deleteBlock(localX, y, localZ);

        const neighborChunks = [{x: x + 1, y, z: z},
                                {x: x - 1, y, z: z},
                                {x: x, y, z: z + 1},
                                {x: x, y, z: z - 1}]
        for(let neighbor of neighborChunks){
            const c = this.getChunk(this.positionToChunk(neighbor.x, neighbor.y, neighbor.z))
            if(c){
                c.toGenerate = true;
            }
        }

        // requestIdleCallback(this.generateAllMeshes.bind(this), { timeout: 1000 });
        this.generateAllMeshes();
        return this.countInstances;
    }

    addBlock(x, y, z, blockType){
        
        const chunk = this.getChunk(this.positionToChunk(x, y, z));
        if(!chunk) return this.countInstances;

        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;       

        chunk.addBlock(localX, y, localZ, blockType);

        chunk.toGenerate = true;
        
        this.generateAllMeshes();

        return this.countInstances;
    }

    renderChunks(chunkX, chunkZ){
        const prevChunks = this.chunks;

        const needToRender = []
        for (let x = -this.renderDist; x <= this.renderDist; x++) {
            for (let z = -this.renderDist; z <= this.renderDist; z++) {
                needToRender.push({x: chunkX + x, z: chunkZ + z});
            }   
        }

        this.chunks = this.chunks.filter((chunk) => 
            needToRender.find((coords) => chunk.position.x / this.chunkSize.width == coords.x &&
                                        chunk.position.z / this.chunkSize.width == coords.z)
        )

        const needToAdd = needToRender.filter((coords) => 
            !this.chunks.find((chunk) => chunk.position.x / this.chunkSize.width == coords.x &&
                                        chunk.position.z / this.chunkSize.width == coords.z)
        )
        // console.log(needToAdd.length)
        const chunksToGenerate = [];
        needToAdd.forEach((coords) => {
            this.generateChunk(coords.x, coords.z);

            const neighborChunks = [{x: coords.x+1, z: coords.z},
                                    {x: coords.x-1, z: coords.z},
                                    {x: coords.x, z: coords.z+1},
                                    {x: coords.x, z: coords.z-1},
                                    {x: coords.x, z: coords.z}
                                    ]
            for(let neighbor of neighborChunks){
                const c = this.getChunk(neighbor)
                if(c && !chunksToGenerate.includes(c)){
                    chunksToGenerate.push(c)
                }
            }
        })

        const batchSize = Math.floor(chunksToGenerate.length/5); // Adjust as needed
    
        for (let i = 0; i < chunksToGenerate.length; i += batchSize) {
            const batch = chunksToGenerate.slice(i, i + batchSize);
            
            batch.forEach(chunk => {
                requestIdleCallback(chunk.generateMesh.bind(chunk), { timeout: 1000 });
                // chunk.toGenerate = false;
            });
        }

        for (let chunk = 0; chunk < prevChunks.length; chunk++) {
            if (!this.chunks.includes(prevChunks[chunk])){
                this.generateAllMeshes();
                break;
            }
        }

        return this.countInstances;
    }

    getBlock(x, y, z) {
        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const chunk = this.getChunk(this.positionToChunk(x, y, z));

        return chunk ? chunk.getBlock(localX, y, localZ) : null;
    }

    setBlockId(x, y, z, id) {
        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;        
        const chunk = this.getChunk(this.positionToChunk(x, y, z));
        if (chunk) {
            chunk.setBlockId(localX, y, localZ, id);
        }
    }

    setBlockInstanceId(x, y, z, instanceId) {
        const localX = (x % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const localZ = (z % this.chunkSize.width + this.chunkSize.width) % this.chunkSize.width;
        const chunk = this.getChunk(this.positionToChunk(x, y, z));
        if (chunk) {
            chunk.setBlockInstanceId(localX, y, localZ, instanceId);
        }
    }
}