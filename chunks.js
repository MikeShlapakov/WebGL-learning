class Chunk {
    constructor(chunkSize, position, params) {
        this.size = chunkSize;
        this.position = position;
        this.params = params

        this.rng = new RNG(this.params.seed);
        this.perlinNoise = new PerlinNoise(this.rng);

        this.chunkGrid = new OctreeNode({ x: chunkSize.width/2, y: chunkSize.width/2, z: chunkSize.width/2 }, chunkSize.width);

        this.mesh = [];

        this.ao = [];

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

        
        // const playerX = Math.floor(player.pos.x / this.size.width);
        // const playerZ = Math.floor(player.pos.z / this.size.width);
        let neighbors = []
        // if (this.position.x == playerX && this.position.z == playerZ){
            neighbors = [
                world.getBlock(this.position.x + x, y + 1, this.position.z + z), // Top
                world.getBlock(this.position.x + x, y, this.position.z + z + 1), // Front
                world.getBlock(this.position.x + x - 1, y, this.position.z + z), // Left
                world.getBlock(this.position.x + x + 1, y, this.position.z + z), // Right
                world.getBlock(this.position.x + x, y, this.position.z + z - 1), // Back
                world.getBlock(this.position.x + x, y - 1, this.position.z + z), // Bottom
            ];
        // }
        // else{
        //     neighbors = [
        //         world.getBlock(this.position.x + x, y + 1, this.position.z + z), // Top
        //     ];

        //     if (playerZ == this.position.z){
        //         neighbors.push(world.getBlock(this.position.x + x, y, this.position.z + z + 1));
        //         if (this.position.x < playerX) { 
        //             neighbors.push(1, world.getBlock(this.position.x + x + 1, y, this.position.z + z));
        //         } else if (this.position.x > playerX) {
        //             neighbors.push(world.getBlock(this.position.x + x - 1, y, this.position.z + z), 1);
        //         }
        //         neighbors.push(world.getBlock(this.position.x + x, y, this.position.z + z - 1));
        //     }
        //     else if ( this.position.z > playerZ) {
        //         neighbors.push(1);
        //         if (playerX == this.position.x){
        //             neighbors.push(world.getBlock(this.position.x + x - 1, y, this.position.z + z));
        //             neighbors.push(world.getBlock(this.position.x + x + 1, y, this.position.z + z));
        //         }
        //         else if (this.position.x < playerX) { 
        //             neighbors.push(1, world.getBlock(this.position.x + x + 1, y, this.position.z + z));
        //         } else if (this.position.x > playerX) {
        //             neighbors.push(world.getBlock(this.position.x + x - 1, y, this.position.z + z), 1);
        //         }
        //         neighbors.push(world.getBlock(this.position.x + x, y, this.position.z + z - 1));
        //     } else if (this.position.z < playerZ) {
        //         neighbors.push(world.getBlock(this.position.x + x, y, this.position.z + z + 1));
        //         if (playerX == this.position.x){
        //             neighbors.push(world.getBlock(this.position.x + x - 1, y, this.position.z + z));
        //             neighbors.push(world.getBlock(this.position.x + x + 1, y, this.position.z + z));
        //         }
        //         else if (this.position.x < playerX) { 
        //             neighbors.push(1, world.getBlock(this.position.x + x + 1, y, this.position.z + z));
        //         } else if (this.position.x > playerX) {
        //             neighbors.push(world.getBlock(this.position.x + x - 1, y, this.position.z + z), 1);
        //         }
        //         neighbors.push(1);
        //     }
        //     neighbors.push(world.getBlock(this.position.x + x, y - 1, this.position.z + z));
        // } 

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
        this.instanceCount = 0;
        this.mesh = [];
        this.ao = [];

        const blocks = this.getAllNodes();
        blocks.forEach(block => {
            // console.log(block.position, block.data);

            let x = block.position.x;
            let y = block.position.y;
            let z = block.position.z;

            const faces = this.isFaceVisible(x, y, z);
            // console.log(faces)
            faces.forEach((face) => {
                this.instanceCount++;
                let value = ((this.getBlock(x, y, z).id - 1) << 21) | (face << 18) | (z << 12) | (y << 6) | x;
                this.mesh.push(value);

                let faceNeighbours = this.getFaceNeighbours(face, this.position.x + x, y, this.position.z + z);

                this.ao.push(this.calculateCornerAO(faceNeighbours[0], faceNeighbours[1], faceNeighbours[2]),
                            this.calculateCornerAO(faceNeighbours[2], faceNeighbours[3], faceNeighbours[4]),
                            this.calculateCornerAO(faceNeighbours[4], faceNeighbours[5], faceNeighbours[6]),
                            this.calculateCornerAO(faceNeighbours[6], faceNeighbours[7], faceNeighbours[0]))
            })   
        });
    }

    getFaceNeighbours(face, x, y, z) {
        switch(face) {
            case 0: // top +Y
                return [
                    world.getBlock(x - 1, y + 1, z),
                    world.getBlock(x - 1, y + 1, z + 1),
                    world.getBlock(x, y + 1, z + 1),
                    world.getBlock(x + 1, y + 1, z + 1),
                    world.getBlock(x + 1, y + 1, z),
                    world.getBlock(x + 1, y + 1, z - 1),
                    world.getBlock(x, y + 1, z - 1),
                    world.getBlock(x - 1, y + 1, z - 1),
                ];
            case 1: // front +Z
                return [
                    world.getBlock(x - 1, y, z + 1),
                    world.getBlock(x - 1, y - 1, z + 1),
                    world.getBlock(x, y - 1, z + 1),
                    world.getBlock(x + 1, y - 1, z + 1),
                    world.getBlock(x + 1, y, z + 1),
                    world.getBlock(x + 1, y + 1, z + 1),
                    world.getBlock(x, y + 1, z + 1),
                    world.getBlock(x - 1, y + 1, z + 1),
                ];
            case 2: // left -X
                return [
                    world.getBlock(x - 1, y, z - 1),
                    world.getBlock(x - 1, y - 1, z - 1),
                    world.getBlock(x - 1, y - 1, z),
                    world.getBlock(x - 1, y - 1, z + 1),
                    world.getBlock(x - 1, y, z + 1),
                    world.getBlock(x - 1, y + 1, z + 1),
                    world.getBlock(x - 1, y + 1, z),
                    world.getBlock(x - 1, y + 1, z - 1),
                ];
            case 3: // right +X
                return [
                    world.getBlock(x + 1, y, z + 1),
                    world.getBlock(x + 1, y - 1, z + 1),
                    world.getBlock(x + 1, y - 1, z),
                    world.getBlock(x + 1, y - 1, z - 1),
                    world.getBlock(x + 1, y, z - 1),
                    world.getBlock(x + 1, y + 1, z - 1),
                    world.getBlock(x + 1, y + 1, z),
                    world.getBlock(x + 1, y + 1, z + 1),
                ];
            case 4: // back -Z
                return [
                    world.getBlock(x + 1, y, z - 1),
                    world.getBlock(x + 1, y - 1, z - 1),
                    world.getBlock(x, y - 1, z - 1),
                    world.getBlock(x - 1, y - 1, z - 1),
                    world.getBlock(x - 1, y, z - 1),
                    world.getBlock(x - 1, y + 1, z - 1),
                    world.getBlock(x, y + 1, z - 1),
                    world.getBlock(x + 1, y + 1, z - 1),
                ];
            case 5: // bottom -Y
                return [
                    world.getBlock(x - 1, y - 1, z),
                    world.getBlock(x - 1, y - 1, z - 1),
                    world.getBlock(x, y - 1, z - 1),
                    world.getBlock(x + 1, y - 1, z - 1),
                    world.getBlock(x + 1, y - 1, z),
                    world.getBlock(x + 1, y - 1, z + 1),
                    world.getBlock(x, y - 1, z + 1),
                    world.getBlock(x - 1, y - 1, z + 1),
                ];
            default:
                throw new Error("Invalid face value");
        }
    }

    // Calculate AO value for a corner based on surrounding blocks
    calculateCornerAO(side1, corner, side2) {
        
        if (side1 && side2) {
            return 0.25; 
        }
        
        let count = 0;
        if (side1) count++;
        if (side2) count++;
        if (corner) count++;
        
        return 1 - 0.25*count;
    }
}