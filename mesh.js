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
