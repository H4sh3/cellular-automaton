const state = {
  color: 0,
  uniqStates: new Set(),
};

let settings = {
  strokeOn: true,
  nRange: 1,
  framerate: 15,
  size: 64,
  rgbOffsets: [0, 2, 4],
  initColorOffsets: function () {
    this.rgbOffsets = [];
    for (let i = 0; i < 3; i++) {
      const v = Math.floor(Math.random() * Math.floor(9));
      this.rgbOffsets.push(v);
    }
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
    this.framerate = getFramerate(n);
    activateButton(`n${n}`);
    setOtherButtonsInactive(n);
    initField();
  },
  changeFr: function (v) {
    this.framerate = this.framerate + v > 0 ? this.framerate + v : this.framerate;
  },
  changeSize: function (v) {
    this.size = Math.min(Math.max(this.size * v, 16), 1024);
    setFieldSize(this.size);
    calcBlockSize();
    initField();
  },
  getMil: function () {
    return 1000 / this.framerate;
  }
}

function setup() {
  initCanvas();
  calcBlockSize();
  setFieldSize(settings.size);
  initWorker();
  initField();
}

function initWorker() {
  worker = new Worker('calculations.js');
  worker.onmessage = function (e) {
    const changes = e.data;
    changes.forEach(c => {
      state.field[c.x][c.y].alive = c.change;
      state.field[c.x][c.y].nn = c.nn;
    })
  }
}



function getFramerate(n) {
  const nToFr = {
    1: 15,
    2: 10,
    3: 5,
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

function calcBlockSize() {
  state.blockSize = state.width / settings.size;
}

function initField() {
  worker.terminate();
  state.field = [];
  for (let x = 0; x <= settings.size; x++) {
    state.field.push([]);
    for (let y = 0; y <= settings.size; y++) {
      state.field[x][y] = { alive: false, color: { r: 0, g: 0, b: 0, a: 255 } }
    }
  }
  spawnCenter();
  initWorker();
  worker.postMessage({ field: state.field, nRange: settings.nRange });
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

function run() {
  worker.postMessage({ field: state.field, nRange: settings.nRange });
  visualizeField();
}

function initCanvas() {
  state.width = Math.floor(window.innerWidth * 0.2);
  state.height = state.width;
  // pixel size
  state.blockSize = state.width / settings.size;

  // get the canvas element on the page
  state.cxt = document.getElementById('automaton-canvas');
  state.cxt.setAttribute("width", state.width);
  state.cxt.setAttribute("height", state.height);
  // initialiaze the canvas
  state.cxt = state.cxt.getContext("2d");
}

state.colorCache = new Map()
function getColor(nn) {
  const key = `${state.color}${nn}`;
  if (state.colorCache.has(key)) {
    return state.colorCache.get(key)
  } else {

    nn *= 16;
    const range = Math.floor((255 / 8 * settings.nRange) * nn);

    if (state.color == range) {
      state.color = 0;
    }

    let newColor = state.color + nn;
    if (newColor > range) {
      newColor = newColor % range;
    }

    const center = 128;
    const width = 127;
    const frequency = Math.PI * 2 / 200;
    var r = Math.sin(frequency * newColor + settings.rgbOffsets[0]) * width + center;
    var g = Math.sin(frequency * newColor + settings.rgbOffsets[1]) * width + center;
    var b = Math.sin(frequency * newColor + settings.rgbOffsets[2]) * width + center;

    const c = { r, g, b, a: 255 };
    state.colorCache.set(key, c)
    return c;
  };
};

function visualizeField() {
  let id = '';
  for (let x = 0; x < state.field.length; x++) {
    for (let y = 0; y < state.field[x].length; y++) {
      const { alive, nn } = state.field[x][y];
      if (alive) {
        id+='1'
        const c = getColor(nn);
        state.cxt.fillStyle = `rgb(${c.r},${c.g},${c.b})`
      } else {
        id+='0'
        state.cxt.fillStyle = 'rgb(0,0,0)';
      }
      state.cxt.fillRect(x * state.blockSize, y * state.blockSize, state.blockSize, state.blockSize);
    }
  }
  state.color += 0.5;
  state.uniqStates.add(id)
}

let start;
window.onload = function () {
  setup()
  loop()
}

var loop = function () {
  var delta = Date.now();
  var deltaTime = Date.now() - delta;
  if (deltaTime >= settings.getMil()) {
    requestAnimationFrame(loop);
  }
  else {
    run()
    setTimeout(function () { requestAnimationFrame(loop); }, settings.getMil() - deltaTime);
  }
};