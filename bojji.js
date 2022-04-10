const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PLAYER_HEIGHT = 105;
const PLAYER_WIDTH = 75;
const NUM_CROWNS = 10;
const NUM_SWORDS = 5;
const NUM_ENEMIES = 4;
const SPEED = 120; // lower is faster
const PLAYERS_SPEED = 0.5;
const ENEMY_SPEED = 0.025;
const ENEMY_PROBABILITY_RANDOM = 0.2;
const SCARE_TIME = 5000; // in miliseconds
const DEBUG = 0;


const KEYMAP_PJ1 = {
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

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const addPlayers = (p1, p2) => {
    let imgP1 = document.getElementById("player1");
    ctx.drawImage(imgP1, p1.x, p1.y);
    let imgP2 = document.getElementById("player2");
    ctx.drawImage(imgP2, p2.x, p2.y);
}

const addCrowns = crowns => { 
    let img = document.getElementById("crown");
    crowns.forEach(position => { ctx.drawImage(img, position.x, position.y, 50, 50) });
}

const addSwords = swords => {
    let img = document.getElementById("sword");
    swords.forEach( position => { ctx.drawImage(img, position.x, position.y,50,50) });
}

const addEnemies = enemies => {    
    enemies.forEach( enemy => {
        let img;
        enemy.scared
            ? img = document.getElementById("enemy-scared")
            : img = document.getElementById("enemy");  
        ctx.drawImage(img, enemy.x, enemy.y);     
    });
}

const addBackground = () => {    
    var img = document.getElementById("grass");
    var pat = ctx.createPattern(img, "repeat");
    ctx.rect(0, 0, 3840, 2160);
    ctx.fillStyle = pat;
    ctx.fill(); 
}

const gameOver = (p1, p2,  enemies) => {
    return enemies.some( enemy =>   {
        return enemy.scared ? false : (collision(p1, enemy) || collision(p2, enemy)) ? true : false 
    });
}

const collision = (target1, target2) => {
    return (target1.x > target2.x - PLAYER_WIDTH && target1.x < target2.x + PLAYER_WIDTH) &&
        (target1.y > target2.y - PLAYER_HEIGHT && target1.y < target2.y + PLAYER_HEIGHT);
}

const getRandomPosition = () => {
    return {
        x: getRandomInt(0, canvas.width - PLAYER_WIDTH),
        y: getRandomInt(0, canvas.height - PLAYER_HEIGHT)
    };
}

const addScore = score => {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Score: ' + score, 40, 43);
    ctx.strokeText('Score: ' + score, 40, 43);
}

const renderGameOver = () => {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 120px sans-serif';
    ctx.fillText('GAME OVER!', canvas.width/2 - 400, canvas.height/2);
    ctx.strokeText('GAME OVER!', canvas.width/2 - 400, canvas.height/2);
}

const renderScene = actors => {
    addBackground();
    addCrowns(actors.crowns);
    addSwords(actors.swords);
    addScore(actors.score);
    addEnemies(actors.enemies);
    addPlayers(actors.p1, actors.p2);
}

const createInitialRandomPositions = num => { // PASAR A ABUILD
    let pos = [];
    for (let i = 1; i <= num; i++) {
        let newPos = getRandomPosition();
        while (pos.some( oldPos => {
                return collision(newPos, oldPos);
            })) {
            newPos = getRandomPosition();
        }
        pos.push(newPos);
    }
    return pos;
}

const createSumFromPositions = positions => {
    return positions.reduce( (sum, pos) => {
        return sum += pos.x + pos.y;
    }, 0);
}

const getMoveTowards = (from, to) => {
    let xDiff = from.x - to.x;
    let yDiff = from.y - to.y;
    let direction = '';
    Math.abs(xDiff) > Math.abs(yDiff) 
        ? xDiff > 0 ? direction = 'left' : direction = 'right'
        : yDiff > 0 ? direction = 'up' : direction = 'down'
    return direction;
}

const getRandomMove = () => { // REFACTORIZAR ESTO SI ES QUE SE PUEDE
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

const getPositionsWithoutCollision = (positions, collisionPosition) => {
    positions.forEach((positionToTest, index, object) => {
            if (collision(positionToTest, collisionPosition)) {
                object.splice(index, 1);
            }
        }
    );
    return positions;
}

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


const input$ = Rx.Observable.fromEvent(document, 'keydown').scan( (lastDir, event) => {
    let nextMove = lastDir;
    switch (event.keyCode) {
        case KEYMAP_PJ1.left:
            nextMove = {
                x: -PLAYER_WIDTH * PLAYERS_SPEED,
                y: 0,
                direction: 'left',
                player: 1
            };
            break;
        case KEYMAP_PJ1.right:
            nextMove = {
                x: PLAYER_WIDTH * PLAYERS_SPEED,
                y: 0,
                direction: 'right',
                player: 1
            };
            break;
        case KEYMAP_PJ1.up:
            nextMove = {
                x: 0,
                y: -PLAYER_HEIGHT * PLAYERS_SPEED,
                direction: 'up',
                player: 1
            };
            break;
        case KEYMAP_PJ1.down:
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
    .scan( (pos, keypress) => {
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
    .scan( (pos, keypress) => {

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

const crowns$ = p1$.scan( (crowns, p1Pos) => {
    return getPositionsWithoutCollision(crowns, p1Pos);
}, createInitialRandomPositions(NUM_CROWNS)).distinctUntilChanged(createSumFromPositions) || p2$.scan( (crowns, p2Pos) => {
  return getPositionsWithoutCollision(crowns, p2Pos);
}, createInitialRandomPositions(NUM_CROWNS)).distinctUntilChanged(createSumFromPositions) 

const swords$ = p1$.scan( (crowns, p1Pos) => {
  return getPositionsWithoutCollision(crowns, p1Pos);
}, createInitialRandomPositions(NUM_SWORDS)).distinctUntilChanged(createSumFromPositions) || p2$.scan( (crowns, p2Pos) => {
  return getPositionsWithoutCollision(crowns, p2Pos);
}, createInitialRandomPositions(NUM_SWORDS)).distinctUntilChanged(createSumFromPositions) 

const swordsTaken$ = swords$.scan( (prevNumber, swords) => {
    return prevNumber + 1;
}, -1).timestamp();

const swordsEnd$ = swordsTaken$.skip(1).delay(SCARE_TIME).timestamp().startWith({
    timestamp: 0
});

const enemies$ = ticker$.withLatestFrom(p1$, p2$, swordsTaken$, swordsEnd$)
    .scan( (enemyPositions, [ticker, p1Pos, p2Pos, swordsTaken, swordsEnd]) => {
        let enemySpeed = ENEMY_SPEED;
        let scared = false;
        if (swordsTaken.value > 0 && swordsTaken.timestamp > swordsEnd.timestamp) {
            scared = true;
            enemySpeed = 0.5 * enemySpeed;
        }
        let newPositions = [];
        enemyPositions.forEach(
            (enemyPos) => {
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

const length$ = crowns$.scan( (prevLength, apple) => {
    return prevLength + 1;
}, -1);

const score$ = length$.withLatestFrom(swordsTaken$).map( ([length, numSwords]) => {
    return Math.max(0, length * 10 + 100 * numSwords.value);
});

const renderError = (error) => {
    alert("error: " + error);
}

const game$ = Rx.Observable.combineLatest(
        p1$, p2$, crowns$, score$, enemies$, swords$,
        (p1, p2, crowns, score, enemies, swords) => {
            return {
                p1: p1,
                p2: p2,
                crowns: crowns,
                score: score,
                enemies: enemies,
                swords: swords
            };
        })
    .sample(SPEED);


game$.takeWhile( (actors) =>{
    return gameOver(actors.p1, actors.p2, actors.enemies) === false;
}).subscribe(renderScene, renderError, renderGameOver);
