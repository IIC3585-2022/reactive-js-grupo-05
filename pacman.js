const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PLAYER_HEIGHT = 105;
const PLAYER_WIDTH = 75;
const NUM_PELLETS = 100;
const NUM_BONUS = 5;
const NUM_ENEMIES = 4;
const SPEED = 120; // lower is faster
const PLAYERS_SPEED = 0.5;
const ENEMY_SPEED = 0.25;
const ENEMY_PROBABILITY_RANDOM = 0.2;
const SCARE_TIME = 5000; // in miliseconds
const DEBUG = 0;


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addPlayers(p1, p2) {
    ctx.fillStyle = '#FFFF00';
    let img = document.getElementById("player1");
    ctx.drawImage(img, p1.x, p1.y);
    if (DEBUG) {
        ctx.fillText('x: ' + p1.x + ' y: ' + p1.y, p1.x, p1.y);
    }
    let img2 = document.getElementById("player2");
    ctx.drawImage(img2, p2.x, p2.y);
    if (DEBUG) {
        ctx.fillText('x: ' + p2.x + ' y: ' + p2.y, p2.x, p2.y);
    }
}

function paintPellets(pellets) {
    ctx.fillStyle = '#00FF00';
    let img = document.getElementById("cookie");
    pellets.forEach(function(position) {
        ctx.drawImage(img, position.x, position.y);
        if (DEBUG) {
            ctx.fillText('x: ' + position.x + ' y: ' + position.y, position.x, position.y);
        }
    });
}

function paintBonus(bonus) {
    let img = document.getElementById("bonus");
    bonus.forEach(function(position) {
        ctx.drawImage(img, position.x, position.y);
    });
}

function addEnemies(enemies) {
    ctx.fillStyle = '#FF0000';
    enemies.forEach(function(enemy) {
        let img = document.getElementById("enemy");
        if (enemy.scared) {
            img = document.getElementById("enemy-scared");
        }
        ctx.drawImage(img, enemy.x, enemy.y);
        if (DEBUG) {
            ctx.fillText('x: ' + enemy.x + ' y: ' + enemy.y, enemy.x, enemy.y);
        }
    });
}

function paintBackground() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameOver(p1, p2,  enemies) {
    return enemies.some(function(enemy) {
        if (enemy.scared) {
            return false;
        }
        if (collision(p1, enemy) | collision(p2, enemy)) {
            return true;
        }
        return false;
    });
}

function collision(target1, target2) {
    return (target1.x > target2.x - PLAYER_WIDTH && target1.x < target2.x + PLAYER_WIDTH) &&
        (target1.y > target2.y - PLAYER_HEIGHT && target1.y < target2.y + PLAYER_HEIGHT);
}

function getRandomPosition() {
    return {
        x: getRandomInt(0, canvas.width - PLAYER_WIDTH),
        y: getRandomInt(0, canvas.height - PLAYER_HEIGHT)
    };
}

function paintScore(score) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Score: ' + score, 40, 43);
}

function renderGameOver() {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('GAME OVER!', 100, 100);
}

function renderScene(actors) {
    paintBackground();
    paintPellets(actors.pellets);
    paintBonus(actors.bonus);
    paintScore(actors.score);
    addEnemies(actors.enemies);
    addPlayers(actors.p1, actors.p2);
}

function createInitialRandomPositions(num) {
    let pos = [];
    for (let i = 1; i <= num; i++) {
        let newPos = getRandomPosition();
        while (pos.some(function(oldPos) {
                return collision(newPos, oldPos);
            })) {
            newPos = getRandomPosition();
        }
        pos.push(newPos);
    }
    return pos;
}

function createSumFromPositions(positions) {
    return positions.reduce(function(sum, pos) {
        return sum += pos.x + pos.y;
    }, 0);
}

function getMoveTowards(from, to) {
    let xDiff = from.x - to.x;
    let yDiff = from.y - to.y;
    let direction = '';
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
            direction = 'left';
        } else {
            direction = 'right';
        }
    } else {
        if (yDiff > 0) {
            direction = 'up';
        } else {
            direction = 'down';
        }
    }
    return direction;
}

function getRandomMove() {
    let moveType = getRandomInt(0, 3);
    let direction = '';
    switch (moveType) {
        case 0:
            direction = 'up';
            break;
        case 1:
            direction = 'down';
            break;
        case 2:
            direction = 'left';
            break;
        case 3:
            direction = 'right';
            break;
    }
    return direction;
}

function getPositionsWithoutCollision(positions, collisionPosition) {
    positions.forEach(
        function(positionToTest, index, object) {
            if (collision(positionToTest, collisionPosition)) {
                object.splice(index, 1);
            }
        }
    );
    return positions;
}

const KEYMAP = {
    left: 37,
    up: 38,
    right: 39,
    down: 40
};

const KEYMAP_PJ2 = {
  left: 65,
  up: 87,
  right: 68,
  down: 83,
};

const ticker$ = Rx.Observable
    .interval(SPEED, Rx.Scheduler.requestAnimationFrame)
    .map(() => ({
        time: Date.now(),
        deltaTime: null
    }))
    .scan(
        (previous, current) => ({
            time: current.time,
            deltaTime: (current.time - previous.time) / 1000
        })
    );


const input$ = Rx.Observable.fromEvent(document, 'keydown').scan(function(lastDir, event) {
    let nextMove = lastDir;
    switch (event.keyCode) {
        case KEYMAP.left:
            nextMove = {
                x: -PLAYER_WIDTH * PLAYERS_SPEED,
                y: 0,
                direction: 'left',
                player: 1
            };
            break;
        case KEYMAP.right:
            nextMove = {
                x: PLAYER_WIDTH * PLAYERS_SPEED,
                y: 0,
                direction: 'right',
                player: 1
            };
            break;
        case KEYMAP.up:
            nextMove = {
                x: 0,
                y: -PLAYER_HEIGHT * PLAYERS_SPEED,
                direction: 'up',
                player: 1
            };
            break;
        case KEYMAP.down:
            nextMove = {
                x: 0,
                y: PLAYER_HEIGHT * PLAYERS_SPEED,
                direction: 'down',
                player: 1
            };
            break;
        case KEYMAP_PJ2.left:
            nextMove = {
                x: -PLAYER_WIDTH * PLAYERS_SPEED,
                y: 0,
                direction: 'left',
                player: 2
            };
            break;
        case KEYMAP_PJ2.right:
            nextMove = {
                x: PLAYER_WIDTH * PLAYERS_SPEED,
                y: 0,
                direction: 'right',
                player: 2
            };
            break;
        case KEYMAP_PJ2.up:
            nextMove = {
                x: 0,
                y: -PLAYER_HEIGHT * PLAYERS_SPEED,
                direction: 'up',
                player: 2
            };
            break;
        case KEYMAP_PJ2.down:
            nextMove = {
                x: 0,
                y: PLAYER_HEIGHT * PLAYERS_SPEED,
                direction: 'down',
                player: 2
            };
            break;
    }
    return nextMove;
}, {
    x: PLAYER_WIDTH * PLAYERS_SPEED,
    y: 0,
    direction: 'right',
    player: 1
}).sample(SPEED);



const p1$ = input$
    .scan(function(pos, keypress) {
      if (keypress.player == 1) {
        let nextX = Math.max(0, Math.min(pos.x + keypress.x, canvas.width - PLAYER_WIDTH));
        let nextY = Math.max(0, Math.min(pos.y + keypress.y, canvas.height - PLAYER_HEIGHT));
        return {
            x: nextX,
            y: nextY,
            direction: keypress.direction,
            player: keypress.player
        }
      } else {
        let nextX = pos.x;
        let nextY = pos.y;
        return {
            x: nextX,
            y: nextY,
            direction: keypress.direction,
            player: keypress.player
        }
      }
        
    }, {
        x: 10,
        y: 10,
        direction: 'right',
        player: 1
    });
  
const p2$ = input$
    .scan(function(pos, keypress) {

    if (keypress.player == 2) {
        let nextX = Math.max(0, Math.min(pos.x + keypress.x, canvas.width - PLAYER_WIDTH));
        let nextY = Math.max(0, Math.min(pos.y + keypress.y, canvas.height - PLAYER_HEIGHT));
        return {
            x: nextX,
            y: nextY,
            direction: keypress.direction,
            player: keypress.player
        }
    } else {
        let nextX = Math.max(0, pos.x);
        let nextY = Math.max(0, pos.y);
        return {
            x: nextX,
            y: nextY,
            direction: keypress.direction,
            player: keypress.player
        };
      }
    }, {
      x: 10,
      y: 10,
      direction: 'right',
      player: 2
  });

const pellets$ = p1$.scan(function(pellets, p1Pos) {
    return getPositionsWithoutCollision(pellets, p1Pos);
}, createInitialRandomPositions(NUM_PELLETS)).distinctUntilChanged(createSumFromPositions) || p2$.scan(function(pellets, p2Pos) {
  return getPositionsWithoutCollision(pellets, p2Pos);
}, createInitialRandomPositions(NUM_PELLETS)).distinctUntilChanged(createSumFromPositions) 

const bonus$ = p1$.scan(function(pellets, p1Pos) {
  return getPositionsWithoutCollision(pellets, p1Pos);
}, createInitialRandomPositions(NUM_PELLETS)).distinctUntilChanged(createSumFromPositions) || p2$.scan(function(pellets, p2Pos) {
  return getPositionsWithoutCollision(pellets, p2Pos);
}, createInitialRandomPositions(NUM_PELLETS)).distinctUntilChanged(createSumFromPositions) 

const bonusTaken$ = bonus$.scan(function(prevNumber, bonus) {
    return prevNumber + 1;
}, -1).timestamp();

const bonusEnd$ = bonusTaken$.skip(1).delay(SCARE_TIME).timestamp().startWith({
    timestamp: 0
});

const enemies$ = ticker$.withLatestFrom(p1$, p2$, bonusTaken$, bonusEnd$)
    .scan(function(enemyPositions, [ticker, p1Pos, p2Pos, bonusTaken, bonusEnd]) {
        let enemySpeed = ENEMY_SPEED;
        let scared = false;
        if (bonusTaken.value > 0 && bonusTaken.timestamp > bonusEnd.timestamp) {
            scared = true;
            enemySpeed = 0.5 * enemySpeed;
        }
        let newPositions = [];
        enemyPositions.forEach(
            function(enemyPos) {
                let direction = '';
                if (scared) {
                    if (collision(enemyPos, p1Pos) || collision(enemyPos, p2Pos)) {
                        // Put scared ghost touching p1 far away
                        enemyPos.x = p1Pos.x + 200;
                        enemyPos.y = p1Pos.y + 200;
                    }
                    direction = getMoveTowards(p1Pos, enemyPos); // Move pacman needs to do to run towards enemy is the same as enemy running away from pacman
                } else {
                    if (Math.random() > ENEMY_PROBABILITY_RANDOM) {
                        direction = getMoveTowards(enemyPos, p1Pos);
                    } else {
                        direction = getRandomMove();
                    }
                }
                switch (direction) {
                    case 'up':
                        xPos = enemyPos.x;
                        yPos = enemyPos.y + (-enemySpeed * PLAYER_HEIGHT);
                        break;
                    case 'down':
                        xPos = enemyPos.x,
                            yPos = enemyPos.y + (enemySpeed * PLAYER_HEIGHT);
                        break;
                    case 'left':
                        xPos = enemyPos.x + (-enemySpeed * PLAYER_WIDTH);
                        yPos = enemyPos.y;
                        break;
                    case 'right':
                        xPos = enemyPos.x + (enemySpeed * PLAYER_WIDTH);
                        yPos = enemyPos.y;
                        break;
                }
                newPositions.push({
                    x: xPos,
                    y: yPos,
                    direction: direction,
                    scared: scared
                });
            }
        );
        return newPositions;
    }, createInitialRandomPositions(NUM_ENEMIES));

const length$ = pellets$.scan(function(prevLength, apple) {
    return prevLength + 1;
}, -1);

const score$ = length$.withLatestFrom(bonusTaken$).map(function([length, numBonus]) {
    return Math.max(0, length * 10 + 100 * numBonus.value);
});

function renderError(error) {
    alert("error: " + error);
}

const game$ = Rx.Observable.combineLatest(
        p1$, p2$, pellets$, score$, enemies$, bonus$,
        function(p1, p2, pellets, score, enemies, bonus) {
            return {
                p1: p1,
                p2: p2,
                pellets: pellets,
                score: score,
                enemies: enemies,
                bonus: bonus
            };
        })
    .sample(SPEED);


game$.takeWhile(function(actors) {
    return gameOver(actors.p1, actors.p2, actors.enemies) === false;
}).subscribe(renderScene, renderError, renderGameOver);
