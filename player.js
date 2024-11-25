/*================= Mouse events ======================*/

function getRelativeMousePosition(event, target) {
    target = target || event.target;

    var rect = target.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * target.width  / target.clientWidth,
        y: (event.clientY - rect.top) * target.height / target.clientHeight,
    }
}

document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas){
       // pos is in pixel coordinates for the canvas.
       // so convert to WebGL clip space coordinates
       mousePos.x = (((mousePos.x+1)/2) + e.movementX / gl.canvas.width)  *  2 - 1;
       mousePos.y = (((mousePos.y-1)/-2) + e.movementY / gl.canvas.height)  *  -2 + 1;
    }
    mousePos.y = Math.min(Math.max(-0.999, mousePos.y), 0.999);
    // console.log(mousePos.x, mousePos.y)
    player.yaw = mousePos.x * Math.PI / 2     
    player.pitch = -mousePos.y * Math.PI / 2 
});

document.addEventListener("wheel", e => {
    player.blockType = 1 + ((player.blockType += e.deltaY >= 0? 1: -1 )% typesOfBlocks + typesOfBlocks -1) % typesOfBlocks; //    console.log(e.deltaY)
 
 //    obj.FOV = Math.min(Math.max(10, obj.FOV + e.deltaY * 0.05), 120);
    FOV.updateDisplay()
}, { passive: false });

document.addEventListener("mouseup", e => {canvas.requestPointerLock();
    // console.log(e.button);
    if (player.blockSelected){
        if (e.button == 0){
            player.breakBlock = true;
        }
        else if (e.button == 2){
            player.placeBlock = true;
        }
    }
});
document.addEventListener("mouseout", e => {document.exitPointerLock();});

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
    
    
    if (!compareArrays(normal, [0, 0, 0])){
        // console.log( normal )
        cameraPos.x += speed * normal[0];
        if (!obj.flying){
            if (onTheGround && normal[1] == 1){
                y_speed = -0.15; 
                onTheGround = false;
            }
        }else{
            cameraPos.y += speed * normal[1];
        }
        cameraPos.z += speed * normal[2];
        detectCollision(world, player, normal)
    }

    return [cameraPos.x, cameraPos.y, cameraPos.z];
}

function detectCollision(world, player, normal){
    const hitbox = {
        x : {
            max : Math.ceil(player.pos.x + player.hitbox.width),
            min : Math.floor(player.pos.x - player.hitbox.width)
        },
        y : {
            max : Math.ceil(player.pos.y),
            min : Math.floor(player.pos.y - player.hitbox.height)
        },
        z : {
            max : Math.ceil(player.pos.z + player.hitbox.width),
            min : Math.floor(player.pos.z - player.hitbox.width)
        }
    }

    const collisions = []

    for (let x = hitbox.x.min; x <= hitbox.x.max; x++){
        for (let y = hitbox.y.min; y <= hitbox.y.max; y++){
            for (let z = hitbox.z.min; z <= hitbox.z.max; z++){
                const block = world.getBlock(x, y, z);
                if (block && block.id != 0){
                    collisions.push({x: x + 0.5, y: y + 0.5, z: z + 0.5});
                }
            }
        }
    }
    
    resolveCollision(collisions, player, normal);
}

function resolveCollision(candidates, player, normal) {
    for (const block of candidates) {
        if (
            block.x - 0.5 <= (player.pos.x + player.hitbox.width) &&
            block.x + 0.5 >= (player.pos.x - player.hitbox.width) &&
            block.y - 0.5 <= (player.pos.y + 0.1) &&
            block.y + 0.5 >= (player.pos.y - player.hitbox.height) &&
            block.z - 0.5 <= (player.pos.z + player.hitbox.width) &&
            block.z + 0.5 >= (player.pos.z - player.hitbox.width)
        ) {
            const overlapX = Math.min(
                (player.pos.x + player.hitbox.width) - (block.x - 0.5),
                (block.x + 0.5) - (player.pos.x - player.hitbox.width)
            );

            const overlapY = Math.min(
                (player.pos.y + 0.1) - (block.y - 0.5),
                (block.y + 0.5) - (player.pos.y - player.hitbox.height)
            );

            const overlapZ = Math.min(
                (player.pos.z + player.hitbox.width) - (block.z - 0.5),
                (block.z + 0.5) - (player.pos.z - player.hitbox.width)
            );

            // console.log(block, Math.abs(normal[0]) > Math.abs(normal[2]), Math.abs(normal[0]) , Math.abs(normal[2]))
            
            // console.log(normal, overlapX, overlapZ)
            // if(!Math.abs(normal[1])){
            //     // console.log(normal)
            // }
            if (Math.abs(normal[1])) {
                // console.log(normal)
                player.pos.y -= Math.sign(normal[1]) * overlapY;
                y_speed = 0;
                onTheGround = true;
            }
            // Resolve collision in the direction of the normal
            else if (Math.abs(normal[0]) > Math.abs(normal[2])) {
                player.pos.x -= Math.sign(normal[0]) * (overlapX*1.01);
            }
            else if (Math.abs(normal[2]) > Math.abs(normal[0])) {
                player.pos.z -= Math.sign(normal[2]) * (overlapZ*1.01);
            }

            // // Handle cases where the collision is not perfectly aligned with any axis
            // // and resolve multiple axis collisions (corner cases)
            // if (normal[0] !== 0 && normal[2] !== 0) {
            //     // If both X and Z are non-zero, handle diagonal corner collisions
            //     // Apply the smallest overlap in both directions
            //     const smallestOverlap = Math.min(overlapX, overlapZ);
            //     if (overlapX <= overlapZ) {
            //         player.pos.x -= Math.sign(normal[0]) * smallestOverlap;
            //     } else {
            //         player.pos.z -= Math.sign(normal[2]) * smallestOverlap;
            //     }
            // }
            // else if (normal[0] !== 0 && normal[1] !== 0) {
            //     // If both X and Y are non-zero
            //     const smallestOverlap = Math.min(overlapX, overlapY);
            //     if (overlapX <= overlapY) {
            //         player.pos.x -= Math.sign(normal[0]) * smallestOverlap;
            //     } else {
            //         player.pos.y -= Math.sign(normal[1]) * smallestOverlap;
            //     }
            // }
            // else if (normal[2] !== 0 && normal[1] !== 0) {
            //     // If both Z and Y are non-zero
            //     const smallestOverlap = Math.min(overlapZ, overlapY);
            //     if (overlapZ <= overlapY) {
            //         player.pos.z -= Math.sign(normal[2]) * smallestOverlap;
            //     } else {
            //         player.pos.y -= Math.sign(normal[1]) * smallestOverlap;
            //     }
            // }
        }
    }
}