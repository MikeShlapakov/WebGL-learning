// Create a canvas element
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 2**9  // window.innerWidth * window.devicePixelRatio   || 1
canvas.height = 2**9 //window.innerHeight * window.devicePixelRatio || 1

console.log(canvas.width, canvas.height)

const imageData = ctx.createImageData(canvas.width, canvas.height);
const imageDataArray = imageData.data;

var gui = new dat.gui.GUI();

var noiseGui = {
   FPS: 60,
   Speed: 1,
   noiseSize: 2,
   OctaveNoise: false,
   Fogness: 1,
   Color1: [255, 255, 255],
   Color2: [0, 0, 0 ]
};

var FPS = gui.add(noiseGui, 'FPS')
var noiseSize = gui.add(noiseGui, 'noiseSize').min(1).max(8).step(1); // noise size
var speed = gui.add(noiseGui, 'Speed').min(0).max(3).step(0.1);
var isOctaveNoiseOn = gui.add(noiseGui, 'OctaveNoise');
var fogness = gui.add(noiseGui, 'Fogness').min(0).max(3).step(0.25);
var color1 = gui.addColor(noiseGui, 'Color1');
var color2 = gui.addColor(noiseGui, 'Color2');

// Create workers
const workers = [
   new Worker('worker.js'),
   new Worker('worker.js'),
   new Worker('worker.js'),
   new Worker('worker.js'),
];

const sectionWidth = canvas.width / 2;
const sectionHeight = canvas.height / 2;

function updateCanvas(startX, startY, perlinData) {
   for (let y = 0; y < sectionHeight; y++) {
      for (let x = 0; x < sectionWidth; x++) {
         let index = ((y + startY) * canvas.width + (x + startX))
         const color = interpolateColor(color1.getValue(), color2.getValue(), perlinData[index]);
         imageData.data[index * 4] = color[0];
         imageData.data[index * 4 + 1] = color[1];
         imageData.data[index * 4 + 2] = color[2];
         imageData.data[index * 4 + 3] = 255;
      }
   }
   ctx.putImageData(imageData, 0, 0);
}

const perlinData = new Float32Array(canvas.height*canvas.width);

const p = new Array(512);

for (let i = 0; i < 256; i ++) {
   p[ i ] = p[ i + 256] = Math.floor( Math.random() * 256 );
}

let z = 1;
let frameCount = 0;
let renderSum = 0;

function animateNoise() {
   let lastFrameTime = performance.now();

   const promises = [];

   z += speed.getValue()

   for (let i = 0; i < workers.length; i++) {
      const startX = (i % 2) * sectionWidth;
      const startY = Math.floor(i / 2) * sectionHeight;
      const endX = startX + sectionWidth;
      const endY = startY + sectionHeight;

      const workerParams = {
         width: canvas.width,
         height: canvas.height,
         startX,
         startY,
         endX,
         endY,
         noiseSize: noiseSize.getValue(),
         z: z, // or any dynamic z value
         p: p,
         resolution: 2 ** noiseSize.getValue() / Math.max(canvas.width, canvas.height),
         isOctaveNoiseOn: isOctaveNoiseOn.getValue(),
         fogness: fogness.getValue(),
         perlinData: perlinData,
      };

      promises.push(
         new Promise((resolve) => {
            workers[i].postMessage(workerParams);
            workers[i].onmessage = function(e) {
               resolve(e.data);
            };
         })
      );
   }

   // When all workers finish
   Promise.all(promises).then((results) => {
      // console.log(results)
      results.forEach(({ startX, startY, perlinData }) => {
         updateCanvas(startX, startY, perlinData);
      })
   });

   renderSum += performance.now() - lastFrameTime
   frameCount++;

   // Update FPS every second
   if (frameCount >= 100) {
      FPS.setValue(Math.round((frameCount * 1000) / (renderSum)));
      frameCount = 0;
      renderSum = 0;
   }

   // console.log("done")
}
setInterval(animateNoise, 17);