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

        this.toGenerate = true;
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

        // console.log(world)
        // Check all six faces
        const neighbors = [
            world.getBlock(this.position.x + x - 1, y, this.position.z + z), // Left
            world.getBlock(this.position.x + x + 1, y, this.position.z + z), // Right
            world.getBlock(this.position.x + x, y - 1, this.position.z + z), // Bottom
            world.getBlock(this.position.x + x, y + 1, this.position.z + z), // Top
            world.getBlock(this.position.x + x, y, this.position.z + z - 1), // Back
            world.getBlock(this.position.x + x, y, this.position.z + z + 1)  // Front
        ];

        for(let neighbor of neighbors){
            if (neighbor && !neighbor.id) return true;
        }
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
                        textureMatrix = getTexturMatrix(0, (this.getBlock(x, y, z).id - 1)*textureSize, textureSize, textureSize, atlasWidth, atlasHeight)
                        this.mesh.setTextureMatrix(instanceNum, textureMatrix)

                    }
                }
            }
        }
    }
}