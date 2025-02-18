class Chunk {
    constructor(chunkSize, position, params) {
        this.size = chunkSize;
        this.position = position;
        this.params = params

        this.rng = new RNG(this.params.seed);
        this.perlinNoise = new PerlinNoise(this.rng);

        this.chunkGrid = this.initializeGrid();

        this.mesh = new Array(chunkSize.width * chunkSize.height * chunkSize.width);
        for(let i = 0; i < this.mesh.length; i++){
            this.mesh[i] = new Mesh(6);
        }

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

    isFaceVisible(x, y, z){
        let visibleFaces = [];

        const block = this.getBlock(x, y, z);
        if (!block || block.id === 0) {
            return visibleFaces;
        }

        const neighbors = [
            world.getBlock(this.position.x + x, y + 1, this.position.z + z), // Top
            world.getBlock(this.position.x + x, y, this.position.z + z + 1), // Front
            world.getBlock(this.position.x + x - 1, y, this.position.z + z), // Left
            world.getBlock(this.position.x + x + 1, y, this.position.z + z), // Right
            world.getBlock(this.position.x + x, y, this.position.z + z - 1), // Back
            world.getBlock(this.position.x + x, y - 1, this.position.z + z), // Bottom
        ];

        for(let i = 0; i < neighbors.length; i++){
            if (neighbors[i] && neighbors[i].id == 0) {
                visibleFaces.push(i);
            };
        }
        return visibleFaces;
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
                        if(y < 4){
                            this.setBlockId(x, y, z, 3); 
                        }
                        else{
                            this.setBlockId(x, y, z, 2); // Surface block
                        }
                    } else if (y === h) {
                        if (y == 4) {
                            this.setBlockId(x, y, z, 4); // Interior block
                        }else if(y < 4){
                            this.setBlockId(x, y, z, 3); 
                        }
                        else{
                            this.setBlockId(x, y, z, 1); // Surface block
                        }
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
                    const faces = this.isFaceVisible(x, y, z);

                    faces.forEach((face) => {
                        let instanceNum = this.getBlock(x, y, z).instanceId;
                        if(instanceNum == null){
                            this.setBlockInstanceId(x, y, z, this.instanceCount) 
                            instanceNum = this.instanceCount;
                            this.instanceCount++;
                        }

                        const positionMatrix = translation((this.position.x + x) + 0.5, y + 0.5, (this.position.z + z) + 0.5);
                        switch(face) {
                            case 0: // top
                                this.mesh[instanceNum].setPositionMatrix(face, xRotate(positionMatrix, Math.PI));
                                break;
                            case 1: 
                                // front
                                this.mesh[instanceNum].setPositionMatrix(face, xRotate(positionMatrix, Math.PI / -2));
                                break;
                            case 2: // left
                                this.mesh[instanceNum].setPositionMatrix(face, yRotate(zRotate(positionMatrix, Math.PI / -2), Math.PI / -2));
                                break;
                            case 3: // right
                                this.mesh[instanceNum].setPositionMatrix(face, yRotate(zRotate(positionMatrix, Math.PI / 2), Math.PI / 2));
                                break;
                            case 4: // back
                                this.mesh[instanceNum].setPositionMatrix(face, yRotate(xRotate(positionMatrix, Math.PI / 2), Math.PI));
                                break;
                            case 5: 
                                // bottom
                                this.mesh[instanceNum].setPositionMatrix(face, positionMatrix);
                                break;
                        }

                        this.mesh[instanceNum].setTextureMatrix(face, getTexturMatrix(face*textureSize, (this.getBlock(x, y, z).id - 1)*textureSize, textureSize, textureSize, atlasWidth, atlasHeight))
                        // this.mesh[instanceNum].setNormalMatrix(face, transpose(inverse(this.mesh[instanceNum].getPositionMatrix(face))))
                        this.mesh[instanceNum].setNormalMatrix(face, normals[face])
                    })   
                }
            }
        }
    }
}