onmessage = function (e) {
    const field = e.data.field;
    const nRange = e.data.nRange;
    let changes = [];
    for (let x = 0; x < field.length; x++) {
        for (let y = 0; y < field[x].length; y++) {
            let nn = numNeighbours(field, x, y,nRange)
            const before = field[x][y].alive;
            let change = deadOrAlive(field[x][y].alive, nn)
            if (change != before) {
                changes.push({ x, y, change, nn });
            }
        }
    }
    postMessage(changes);
}

function numNeighbours(f, x, y,nRange) {
    let count = 0;
    for (let i = -nRange; i <= nRange; i++) {
        for (let j = -nRange; j <= nRange; j++) {
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

function deadOrAlive(alive, nn) {
    const survive = [2,3];
    const born = [3, 4];
    if (alive) {
        return survive.includes(nn)
    } else {
        return born.includes(nn)
    }
}

