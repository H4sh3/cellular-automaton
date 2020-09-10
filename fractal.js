const state = {}
let modby;
let color;
let uniqCenter;
let stats;

let rgbOffsets;

let settings = {
  strokeOn: true,
  nRange: 1,
  frameRate: getFrameRateFor(1),
  size: 32,
  toggleStroke: function () {
    this.strokeOn = !this.strokeOn;
    if (this.strokeOn) {
      activateButton('strokeButton')
    } else {
      deactivateButton('strokeButton')
    }
  },
  changeNRange: function (n) {
    this.nRange = n;
    frameRate(getFrameRateFor(this.nRange))
    activateButton(`n${n}`)
    setOtherButtonsInactive(n)
    initState()
  },
  changeFr: function (v) {
    this.frameRate = this.frameRate + v > 0 ? this.frameRate + v : this.frameRate;
    frameRate(this.frameRate);
  },
  changeSize: function (v) { 
    this.size = Math.min(Math.max(this.size*v, 16), 128)
    setFieldSize(this.size)
    state.blockSize = width / settings.size;
    initState();
  }
}

function getFrameRateFor(n) {
  const nToFr = {
    1: 12,
    2: 4,
    3: 2,
  }
  return nToFr[n]
}

function setOtherButtonsInactive(n) {
  [1, 2, 3].filter(i => i != n).map(n => {
    deactivateButton(`n${n}`)
  })
}

function activateButton(id) {
  document.getElementById(id).className = 'button is-success'
}

function deactivateButton(id) {
  document.getElementById(id).className = 'button is-info'
}

function setFieldSize(n){
  document.getElementById('fieldsize').innerText = `${n}x${n} px`
}

function setup() {
  centerSet = new Set([])
  modby = 0;
  color = 0;

  rgbOffsets = shuffle([0, 2, 4]);

  frameRate(settings.frameRate)
  const width = initCanvas();
  stroke(0);
  background(120, 120, 120);
  state.blockSize = width / settings.size;
  setFieldSize(settings.size)
  initState()
}

function initState() {
  state.field = []
  for (let x = 0; x <= settings.size; x++) {
    state.field.push([])
    for (let y = 0; y <= settings.size; y++) {
      state.field[x][y] = { alive: false, color: { r: 0, g: 0, b: 0, a: 255 } }
    }
  }
  spawnCenter()
}


function spawnCenter() {
  const x = Math.floor(state.field.length / 2);
  const y = Math.floor(state.field.length / 2)

  state.field[x + 1][y].alive = true;
  state.field[x - 1][y].alive = true;
  state.field[x][y + 1].alive = true;
  state.field[x][y - 1].alive = true;
  state.field[x][y].alive = true;
}

function numNeighbours(x, y) {
  const f = state.field;
  let count = 0;

  for (let i = -settings.nRange; i <= settings.nRange; i++) {
    for (let j = -settings.nRange; j <= settings.nRange; j++) {
      if (i === 0 && j === 0) {
        continue;
      }

      if (f[x + i] && f[x + i][y + j]) {
        count += f[x + i][y + j].alive ? 1 : 0;
      }
    }
  }
  return count;
}

function calculateChanges() {
  let changes = [];
  for (let x = 0; x < state.field.length; x++) {
    for (let y = 0; y < state.field[x].length; y++) {
      let nn = numNeighbours(x, y)

      if (state.field[x][y].alive) {
        state.field[x][y].color = getColor(nn);
      } else {
        state.field[x][y].color = { r: 0, g: 0, b: 0, a: 255 };
      }

      const before = state.field[x][y].alive;
      let change = deadOrAlive(state.field[x][y].alive, nn)
      if (change != before) {
        changes.push({ x, y, change });
      }
    }
  }
  return changes;
}

function deadOrAlive(alive, nn) {
  const survive = [2, 3];
  const born = [3, 4];
  if (alive) {
    return survive.includes(nn)
  } else {
    return born.includes(nn)
  }
}

function draw() {
  background(120, 120, 120);
  visualizeField()
  const changes = this.calculateChanges();
  color += 1;
  changes.map(c => {
    state.field[c.x][c.y].alive = c.change;
  })
}

function getColor(nn) {
  nn *= 12;
  var newcolor; var center = 128; var width = 127;
  var frequency = Math.PI * 2 / 255;

  const range = map(nn, 0, 8, 0, 255);

  if (color == range) {
    color = 0;
  }

  newcolor = color + nn;

  if (newcolor > range) {
    newcolor = newcolor % range;
  }

  var r = Math.sin(frequency * newcolor + rgbOffsets[0]) * width + center;
  var g = Math.sin(frequency * newcolor + rgbOffsets[1]) * width + center;
  var b = Math.sin(frequency * newcolor + rgbOffsets[2]) * width + center;

  return { r, g, b, a: 255 };
};

function initCanvas() {
  var canvasDiv = document.getElementById('p5canvas');
  var width = Math.floor(canvasDiv.offsetWidth * 0.7)
  canvas = createCanvas(width, width)
  canvas.parent('p5canvas');
  return width;
}

function visualizeField() {
  for (let x = 0; x < state.field.length; x++) {
    for (let y = 0; y < state.field[x].length; y++) {
      const { color } = state.field[x][y];
      fill(color.r, color.g, color.b, color.a);
      if (settings.strokeOn) {
        stroke(color.r, color.g, color.b, color.a);
      }
      rect(x * state.blockSize, y * state.blockSize, state.blockSize, state.blockSize)
    }
  }
}