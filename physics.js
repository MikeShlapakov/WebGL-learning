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