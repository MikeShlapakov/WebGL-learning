function degToRad(d) {
    return d * Math.PI / 180;
}

const keys = {'`': true, 't': true}

function isDebugOn(){
    return keys['`'];
}

function showLines(){
    return keys['t'];
}

// Keydown event listener
document.addEventListener('keydown', function(event) {
    // console.log(event.key)
    switch(event.key) {
        // case 'ArrowLeft': // Rotate left (yaw negative)
        //     yaw -= rotationSpeed;
        //     break;
        // case 'ArrowRight': // Rotate right (yaw positive)
        //     yaw += rotationSpeed;
        //     break;
        // case 'ArrowUp': // Rotate up (pitch positive)
        //     pitch -= rotationSpeed;
        //     break;
        // case 'ArrowDown': // Rotate down (pitch negative)
        //     pitch += rotationSpeed;
        //     break;

        case 'a':
        case 'A': 
            keys['a'] = true;
            break;
        case 'd':
        case 'D': 
            keys['d'] = true;
            break;
        case 'w':
        case 'W': 
            keys['w'] = true;
            break;
        case 's':
        case 'S': 
            keys['s'] = true;
            break;
        case ' ':
            keys[' '] = true;
            break;
        case 'Shift': // Shift key - Move down
            keys['Shift'] = true;
            break;
        case '`': // Debug screen
            keys['`'] = !keys['`'];
            break;
        case 't': // Debug screen
            keys['t'] = !keys['t'];
            break;
        default:
            break;
    }
});

// Keyup event listener
document.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'a':
        case 'A': 
            keys['a'] = false;
            break;
        case 'd':
        case 'D': 
            keys['d'] = false;
            break;
        case 'w':
        case 'W':
            keys['w'] = false;
            break;
        case 's':
        case 'S': 
            keys['s'] = false;
            break;
        case ' ':
            keys[' '] = false;
            break;
        case 'Shift': 
            keys['Shift'] = false;
            break;
        default:
            break;
        }
})

// Source: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/19301306#19301306
class RNG {
    m_w = 123456789;
    m_z = 987654321;
    mask = 0xffffffff;

    constructor(seed) {
        this.m_w = (123456789 + seed) & this.mask;
        this.m_z = (987654321 - seed) & this.mask;
    }

    random() {
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;
        result /= 4294967296;
        return result;
    }
}