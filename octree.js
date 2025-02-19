class OctreeNode {
    constructor(center, size) {
        this.center = center;  // {x, y, z}
        this.size = size;      // Size of the cube
        this.block = null;     // Block data if this is a leaf node
        this.children = null;  // Array of 8 children when subdivided
        this.isLeaf = true;
        this.minNodeSize = 1;
    }

    // Check if a point is within this node's boundaries
    containsPoint(point) {
        const halfSize = this.size / 2;
        return (
            point.x >= this.center.x - halfSize &&
            point.x < this.center.x + halfSize &&
            point.y >= this.center.y - halfSize &&
            point.y < this.center.y + halfSize &&
            point.z >= this.center.z - halfSize &&
            point.z < this.center.z + halfSize
        );
    }

    // Subdivide this node into 8 children
    subdivide() {
        if (!this.isLeaf) return;

        const quarterSize = this.size / 4;
        this.children = [];
        this.isLeaf = false;

        // Create 8 children (octants)
        for (let i = 0; i < 8; i++) {
            const offsetX = ((i & 1) ? quarterSize : -quarterSize);
            const offsetY = ((i & 2) ? quarterSize : -quarterSize);
            const offsetZ = ((i & 4) ? quarterSize : -quarterSize);

            const childCenter = {
                x: this.center.x + offsetX,
                y: this.center.y + offsetY,
                z: this.center.z + offsetZ
            };

            this.children.push(new OctreeNode(childCenter, this.size / 2));
        }

        // If this node had a block, move it to appropriate child
        if (this.block) {
            const appropriateChild = this.getChildIndexForPoint(this.block.position);
            this.children[appropriateChild].block = this.block;
            this.block = null;
        }
    }

    // Get index of child that would contain the given point
    getChildIndexForPoint(point) {
        const offsetX = point.x >= this.center.x ? 1 : 0;
        const offsetY = point.y >= this.center.y ? 2 : 0;
        const offsetZ = point.z >= this.center.z ? 4 : 0;
        return offsetX + offsetY + offsetZ;
    }

    // Internal recursive get method
    getBlock(position) {
        if (!this.containsPoint(position)) {
            return null;
        }

        if (this.isLeaf) {
            if (this.block && 
                this.block.position.x === position.x &&
                this.block.position.y === position.y &&
                this.block.position.z === position.z) {
                return this.block;
            }
            return null;
        }

        const childIndex = this.getChildIndexForPoint(position);
        return this.children[childIndex].getBlock(position);
    }


    // Internal recursive insert method
    insert(block) {
        // If this doesn't contain the point, return
        if (!this.containsPoint(block.position)) {
            return false;
        }

        // If this is at minimum size or is a leaf with no block
        if (this.size <= this.minNodeSize || (this.isLeaf && !this.block)) {
            this.block = block;
            return true;
        }

        // If this is a leaf but has a block, subdivide
        if (this.isLeaf && this.block) {
            this.subdivide();
        }

        // If this isn't a leaf, recursively insert into appropriate child
        if (!this.isLeaf) {
            const childIndex = this.getChildIndexForPoint(block.position);
            return this.children[childIndex].insert(block);
        }

        return false;
    }

    // Internal recursive delete method
    delete(position) {
        // If this doesn't contain the point, return false
        if (!this.containsPoint(position)) {
            return false;
        }

        // If we're at a leaf this
        if (this.isLeaf) {
            // If there's no block or position doesn't match exactly, return false
            if (!this.block || 
                this.block.position.x !== position.x ||
                this.block.position.y !== position.y ||
                this.block.position.z !== position.z) {
                return false;
            }

            // Remove the block
            this.block = null;
            return true;
        }

        // If not a leaf, recurse into appropriate child
        const childIndex = this.getChildIndexForPoint(position);
        const deleted = this.children[childIndex].delete(position);

        // After deletion, check if we can collapse this this
        if (deleted) {
            this.tryCollapse();
        }

        return deleted;
    }

    // Try to collapse a node if all its children are empty leaves
    tryCollapse() {
        if (this.isLeaf) return;

        // Check if all children are empty leaves
        const canCollapse = this.children.every(child => 
            child.isLeaf && !child.block
        );

        if (canCollapse) {
            this.children = null;
            this.isLeaf = true;
            this.block = null;
        }
    }

    // Internal recursive method to collect nodes
    getAllNodes(nodes) {
        // Add current node if it contains a block
        if (this.isLeaf && this.block) {
            nodes.push(this.block);
        }

        // Recursively collect nodes from children
        if (!this.isLeaf && this.children) {
            for (const child of this.children) {
                child.getAllNodes(nodes);
            }
        }

        return nodes;
    }
}