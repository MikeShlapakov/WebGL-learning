class Chunk {
    constructor(chunkSize, position, params) {
        this.size = chunkSize;
        this.position = position;
        this.params = params

        this.rng = new RNG(this.params.seed);
        this.perlinNoise = new PerlinNoise(this.rng);

        this.chunkGrid = new OctreeNode({ x: chunkSize.width/2, y: chunkSize.width/2, z: chunkSize.width/2 }, chunkSize.width);

        this.mesh = new Array(chunkSize.width * chunkSize.height * chunkSize.width);
        for(let i = 0; i < this.mesh.length; i++){
            this.mesh[i] = new Mesh(6);
        }

        this.instanceCount = 0;

        this.toGenerate = true;
    }

    isInBounds(x, y, z) {
        return (0 <= x && x < this.size.width) && (0 <= y && y < this.size.height) && (0 <= z && z < this.size.width);
    }

    // Get block at specific position
    getBlock(x, y, z) {
        const block = this.chunkGrid.getBlock({x, y, z});
        return block;
    }

     // Add a block to the octree
    addBlock(x, y, z, blockData) {
        this.chunkGrid.insert({
            position: {x, y, z},
            id: blockData
        });
    }

    // Delete a block at the given position
    deleteBlock(x, y, z) {
        return this.chunkGrid.delete({x, y, z});
    }

    // Clear all blocks from the tree
    clear() {
        this.chunkGrid = new OctreeNode(
            { x: this.chunkGrid.center.x, y: this.chunkGrid.center.y, z: this.chunkGrid.center.z },
            this.chunkGrid.size
        );
    }

    // Get all nodes in the tree
    getAllNodes() {
        const nodes = [];
        this.chunkGrid.getAllNodes(nodes);
        return nodes;
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
            if (!neighbors[i]) {
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
                            this.addBlock(x, y, z, 3); 
                        }
                        else{
                            this.addBlock(x, y, z, 2); // Surface block
                        }
                    } else if (y === h) {
                        if (y == 4) {
                            this.addBlock(x, y, z, 4); // Interior block
                        }else if(y < 4){
                            this.addBlock(x, y, z, 3); 
                        }
                        else{
                            this.addBlock(x, y, z, 1); // Surface block
                        }
                    }
                    
                }
            }
        }
    }

    generateMesh(){
        // update all the matrices
        let instanceNum = 0;
        let newMesh = new Array(this.size.width * this.size.height * this.size.width);
        for(let i = 0; i < this.mesh.length; i++){
            newMesh[i] = new Mesh(6);
        }

        const blocks = this.getAllNodes();
        blocks.forEach(block => {
            // console.log(block.position, block.data);

            let x = block.position.x;
            let y = block.position.y;
            let z = block.position.z;

            const faces = this.isFaceVisible(x, y, z);
            // console.log(faces)
            faces.forEach((face) => {
                instanceNum++;
                let value = ((this.getBlock(x, y, z).id - 1) << 18) | (face << 15) | (z << 10) | (y << 5) | x;
                newMesh[instanceNum].setVoxelData(face, value);
            })   
        });
        this.instanceCount = instanceNum+1;
        this.mesh = newMesh;
    }
}