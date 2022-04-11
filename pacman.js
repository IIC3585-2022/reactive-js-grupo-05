const board = document.getElementById("board");
const ctx = board.getContext("2d");
const PLAYER_HEIGHT = 105;
const PLAYER_WIDTH = 65;
const VELOCITY = PLAYER_HEIGHT/3;
const NUM_CROWNS = 1;
const NUM_SWORDS = 1;
const NUM_ENEMIES = 2;
const ENEMY_SPEED = 0.025;
const ENEMY_PROBABILITY_RANDOM = 0.2;
const SCARE_TIME = 5000; 

const KEYMAP_PJ1 = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
};

const KEYMAP_PJ2 = {
  left: 65,
  up: 87,
  right: 68,
  down: 83,
};

// const PREV_DIR = {
//   'left': {x: VELOCITY, y: 0},
//   'right': {x: -VELOCITY, y: 0},
//   'up': {x: 0, y: VELOCITY},
//   'down': {x: 0, y: -VELOCITY},
//   0: {x: 0, y: 0}
// };

const fillBoard = () => {  
  var img = document.getElementById("grass");
  var pat = ctx.createPattern(img, "repeat");
  ctx.rect(0, 0, 3840, 2160);
  ctx.fillStyle = pat;
  ctx.fill(); 
};

const getRandomPos = (min, max) => { // Retorna un random int
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomCoord = () => {
  return {
    x: getRandomPos(0, board.width - PLAYER_WIDTH),
    y: getRandomPos(0, board.height - PLAYER_HEIGHT)
  };
}

const addPlayers = (p1, p2) => {
  let imgP1 = document.getElementById("pj1");
  ctx.drawImage(imgP1, p1.x, p1.y);
  let imgP2 = document.getElementById("pj2");
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
      let img = document.getElementById("enemy");  
      ctx.drawImage(img, enemy.x, enemy.y, 70, 70);     
  });
}

const addScore = score => {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('Score: ' + score, 40, 43);
  ctx.strokeText('Score: ' + score, 40, 43);
}

const renderScene = actors => {
  fillBoard();
  addEnemies(actors.enemies);
  addPlayers(actors.inputPJ1, actors.inputPJ2);
  addCrowns(actors.crowns);
  addSwords(actors.swords);
  addScore(actors.score);
}

const renderError = (error) => { alert("error: " + error); }

const renderGameOver = () => {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 120px sans-serif';
  ctx.fillText('GAME OVER!', board.width/2 - 400, board.height/2);
  ctx.strokeText('GAME OVER!', board.width/2 - 400, board.height/2);
}

const collision = (target1, target2) => {
  return (target1.x > target2.x - PLAYER_WIDTH && target1.x < target2.x + PLAYER_WIDTH) &&
      (target1.y > target2.y - PLAYER_HEIGHT && target1.y < target2.y + PLAYER_HEIGHT);
}

const createInitialRandomPositions = num => {
  let pos = [];
  for (let i = 1; i <= num; i++) {
    let newPos = getRandomCoord();
    while (pos.some( oldPos => {
      return collision(newPos, oldPos);
    })) { newPos = getRandomCoord(); }
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
  let direction;
  Math.abs(xDiff) > Math.abs(yDiff) 
      ? xDiff > 0 ? direction = 'left' : direction = 'right'
      : yDiff > 0 ? direction = 'up' : direction = 'down'
  return direction;
}

const getRandomMove = () => { // REFACTORIZAR ESTO SI ES QUE SE PUEDE
  let moveType = getRandomPos(0, 3);
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

const inputPJ1$ = Rx.Observable.fromEvent(document, 'keydown').scan((lastMove, newMove) => {
  const nextMove = getMovement(newMove.keyCode);
  return legalMove(lastMove, nextMove);
}, { x: getRandomPos(0, board.width - PLAYER_WIDTH), y: getRandomPos(0, board.height - PLAYER_HEIGHT), dir: 0, pj:1}).sample(120);

const inputPJ2$ = Rx.Observable.fromEvent(document, 'keydown').scan((lastMove, newMove) => {
  const nextMove = getMovement(newMove.keyCode);
  return legalMove(lastMove, nextMove);
}, { x: getRandomPos(0, board.width - PLAYER_WIDTH), y: getRandomPos(0, board.height - PLAYER_HEIGHT), dir: 0, pj:2}).sample(120);

const ticker$ = Rx.Observable
  .interval(120, Rx.Scheduler.requestAnimationFrame)
  .map(() => ({ time: Date.now(), deltaTime: null }))
  .scan((previous, current) => ({
      time: current.time,
      deltaTime: (current.time - previous.time) / 1000
  }));

const crowns$ = inputPJ1$.scan( (crowns, p1Pos) => {
    return getPositionsWithoutCollision(crowns, p1Pos);
}, createInitialRandomPositions(NUM_CROWNS)).distinctUntilChanged(createSumFromPositions);

const swords$ = inputPJ2$.scan( (swords, p2Pos) => {
  return getPositionsWithoutCollision(swords, p2Pos);
}, createInitialRandomPositions(NUM_SWORDS)).distinctUntilChanged(createSumFromPositions);

const swordsTaken$ = swords$.scan( prevNumber => {
  return prevNumber + 1;
}, -1).timestamp();

const swordsEnd$ = swordsTaken$.skip(1).delay(SCARE_TIME).timestamp().startWith({
  timestamp: 0
});

const length$ = crowns$.scan( prevLength => { return prevLength + 1; }, -1);

const score$ = length$.withLatestFrom(swordsTaken$).map( ([length, numSwords]) => {
  return Math.max(0, length * 10 + 100 * numSwords.value);
});

const enemies$ = ticker$.withLatestFrom(inputPJ1$, inputPJ2$, swordsTaken$, swordsEnd$)
  .scan( (enemyPositions, [ticker, p1Pos]) => {
      let enemySpeed = ENEMY_SPEED;
      let newPositions = [];
      enemyPositions.forEach(
          (enemyPos) => {
              let direction = Math.random() > ENEMY_PROBABILITY_RANDOM ? getMoveTowards(enemyPos, p1Pos) : getRandomMove();
              let xPos, yPos;
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
              newPositions.push({ x: xPos, y: yPos, direction: direction });
          }
      );
      return newPositions;
  }, createInitialRandomPositions(NUM_ENEMIES));


const movePJ = (newPos) => {
  const pj = document.getElementById("pj" + newPos.pj);
  ctx.fillRect(newPos.x + PREV_DIR[newPos.dir].x , newPos.y + PREV_DIR[newPos.dir].y, PLAYER_WIDTH, PLAYER_HEIGHT);
  ctx.drawImage(pj, newPos.x, newPos.y);
};movePJ

const getMovement = keyCode => {
  let pj = 0;
  if (Object.values(KEYMAP_PJ1).includes(keyCode)) {pj = 1;}
  else if (Object.values(KEYMAP_PJ2).includes(keyCode)) {pj = 2;}
  
  if (keyCode == KEYMAP_PJ1.left || keyCode == KEYMAP_PJ2.left){
    return {x: -VELOCITY, y: 0, dir: 'left', pj};
  } else if (keyCode == KEYMAP_PJ1.right || keyCode == KEYMAP_PJ2.right){
    return {x: VELOCITY, y: 0, dir: 'right', pj};
  } else if (keyCode == KEYMAP_PJ1.up || keyCode == KEYMAP_PJ2.up){
    return {x: 0, y: -VELOCITY, dir:'up', pj};
  } else if (keyCode == KEYMAP_PJ1.down || keyCode == KEYMAP_PJ2.down){
    return {x: 0, y: +VELOCITY, dir:'down', pj};
  }
  return {x: 0, y:0, dir: 0, pj};
};

const legalMove = (lastMove, nextMove) => {
  if (lastMove.pj != nextMove.pj) return lastMove;
  const dir = nextMove.dir
  const pj = nextMove.pj
  if (lastMove.x + nextMove.x > board.width){
    return {x: 0, y: lastMove.y, dir, pj};
  } else if (lastMove.x + nextMove.x < 0){
    return {x: board.width - PLAYER_WIDTH, y: lastMove.y, dir, pj};
  } else if (lastMove.y + nextMove.y > board.height){
    return {x: lastMove.x, y: 0, dir, pj};
  } else if (lastMove.y + nextMove.y < 0){
    return {x: lastMove.x, y: board.height - PLAYER_HEIGHT, dir, pj};
  }
  return {x: lastMove.x + nextMove.x, y: lastMove.y + nextMove.y, dir, pj};
};

const getPositionsWithoutCollision = (positions, collisionPosition) => {
  positions.forEach((positionToTest, index, object) => {
      if (collision(positionToTest, collisionPosition)) {
          object.splice(index, 1);
      }
  });
  return positions;
}

const gameOver = (p1, p2,  enemies) => {
  return enemies.some( enemy =>   {
      return (collision(p1, enemy) || collision(p2, enemy)) ? true : false 
  });
}

const game$ = Rx.Observable.combineLatest(
  inputPJ1$, inputPJ2$, enemies$, crowns$, score$, swords$,
  (inputPJ1, inputPJ2, enemies, crowns, score, swords) => {
    return {
        inputPJ1: inputPJ1,
        inputPJ2: inputPJ2,
        enemies: enemies,
        crowns: crowns, 
        score: score, 
        swords: swords
    };
  })
.sample(VELOCITY);


game$.takeWhile((actors) => {
  return gameOver(actors.inputPJ1, actors.inputPJ2, actors.enemies) === false;
}).subscribe(renderScene, renderError, renderGameOver);
