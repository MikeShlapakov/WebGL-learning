class Mesh {
    constructor(meshSize) {
        this.meshSize = meshSize;
        this.voxelData = new Array(meshSize).fill(null);
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
    getVoxelData(index) {
        if (this.isValidIndex(index)) {
            return this.voxelData[index];
        }
    }

    // Setters
    setVoxelData(index, value) {
        if (this.isValidIndex(index)) {
            return this.voxelData[index] = value;
        }
    }
}
