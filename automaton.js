const state = {};
let color;
let uniqCenter;
let worker;

let settings = {
  strokeOn: true,
  nRange: 1,
  frameRate: getFrameRateFor(1),
  size: 32,
  rgbOffsets: [0,2,4],
  initColorOffsets: function () {
    const x = [0];
    for (let i = 0; i < 3; i++) {
       x.push(Math.floor(random(0, 9)));
    }
    this.rgbOffsets = shuffle(x);
  },
  toggleStroke: function () {
    this.strokeOn = !this.strokeOn;
    if (this.strokeOn) {
      activateButton('strokeButton');
    } else {
      deactivateButton('strokeButton');
    }
  },
  changeNRange: function (n) {
    this.nRange = n;
    frameRate(getFrameRateFor(this.nRange));
    activateButton(`n${n}`);
    setOtherButtonsInactive(n);
    initField();
  },
  changeFr: function (v) {
    this.frameRate = this.frameRate + v > 0 ? this.frameRate + v : this.frameRate;
    frameRate(this.frameRate);
  },
  changeSize: function (v) {
    this.size = Math.min(Math.max(this.size * v, 16), 128);
    setFieldSize(this.size);
    calcBlockSize();
    initField();
  }
}

function getFrameRateFor(n) {
  const nToFr = {
    1: 12,
    2: 4,
    3: 2,
  }
  return nToFr[n];
}

function setOtherButtonsInactive(n) {
  [1, 2, 3].filter(i => i != n).map(n => {
    deactivateButton(`n${n}`);
  })
}

function activateButton(id) {
  document.getElementById(id).className = 'button is-success';
}

function deactivateButton(id) {
  document.getElementById(id).className = 'button is-info';
}

function setFieldSize(n) {
  document.getElementById('fieldsize').innerText = `${n}x${n} px`;
}

function calcBlockSize(){
  state.blockSize = width / settings.size;
}

function setup() {
  color = 0;
  frameRate(settings.frameRate);
  initCanvas();
  stroke(0);
  background(120, 120, 120);
  calcBlockSize();
  setFieldSize(settings.size);
  initField();

  worker = new Worker('calculations.js');
  worker.onmessage = function (e) {
    const changes = e.data;
    changes.forEach(c => {
      state.field[c.x][c.y].alive = c.change;
      state.field[c.x][c.y].nn = c.nn;
    })
  }

}

function initField() {
  state.field = [];
  for (let x = 0; x <= settings.size; x++) {
    state.field.push([]);
    for (let y = 0; y <= settings.size; y++) {
      state.field[x][y] = { alive: false, color: { r: 0, g: 0, b: 0, a: 255 } }
    }
  }
  spawnCenter();
}


function spawnCenter() {
  const x = Math.floor(state.field.length / 2);
  const y = Math.floor(state.field.length / 2);

  state.field[x + 1][y].alive = true;
  state.field[x - 1][y].alive = true;
  state.field[x][y + 1].alive = true;
  state.field[x][y - 1].alive = true;
  state.field[x][y].alive = true;
}

function draw() {
  background(120, 120, 120);
  visualizeField();
  worker.postMessage({ field: state.field, nRange: settings.nRange });
}

function initCanvas() {
  var canvasDiv = document.getElementById('p5canvas');
  var width = Math.floor(canvasDiv.offsetWidth * 0.5);
  canvas = createCanvas(width, width);
  canvas.parent('p5canvas');
}

function getColor(nn) {
  nn *= 12;
  const center = 128;
  const width = 127;
  const frequency = Math.PI * 2 / 200;
  const range = map(nn, 0, 8, 0, 255);

  if (color == range) {
    color = 0;
  }

  const newColor = color + nn;
  if (newColor > range) {
    newColor = newColor % range;
  }

  var r = Math.sin(frequency * newColor + settings.rgbOffsets[0]) * width + center;
  var g = Math.sin(frequency * newColor + settings.rgbOffsets[1]) * width + center;
  var b = Math.sin(frequency * newColor + settings.rgbOffsets[2]) * width + center;

  return { r, g, b, a: 255 };
};

function visualizeField() {
  for (let x = 0; x < state.field.length; x++) {
    for (let y = 0; y < state.field[x].length; y++) {
      const { alive, nn } = state.field[x][y];
      if (alive) {
        const c = getColor(nn);
        fill(c.r, c.g, c.b, 255);
        if (settings.strokeOn) {
          stroke(c.r, c.g, c.b, c.a);
        }
      } else {
        fill(0);
        stroke(0);
      }
      rect(x * state.blockSize, y * state.blockSize, state.blockSize, state.blockSize);
    }
  }
  color += 0.5;
}