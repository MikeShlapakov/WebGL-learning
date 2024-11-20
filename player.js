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
    
    if (normal != [0,0,0]){
        // console.log( normal )
        cameraPos.x += speed * normal[0];
        cameraPos.y += speed * normal[1];
        cameraPos.z += speed * normal[2];
    }

    return [cameraPos.x, cameraPos.y, cameraPos.z];
}