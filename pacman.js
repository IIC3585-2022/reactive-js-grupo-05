const board = document.getElementById("board");
const ctx = board.getContext("2d");
const PLAYER_HEIGHT = 105;
const PLAYER_WIDTH = 75;
const VELOCITY = PLAYER_HEIGHT/3;
const CROWN_SIZE = 75;

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

const PREV_DIR = {
  'left': {x: VELOCITY, y: 0},
  'right': {x: -VELOCITY, y: 0},
  'up': {x: 0, y: VELOCITY},
  'down': {x: 0, y: -VELOCITY},
  0: {x: 0, y: 0}
};

const RANDOM_DIR = {
  0: {x: -VELOCITY, y: 0, dir: 'left'},
  1: {x: VELOCITY, y: 0, dir: 'right'},
  2: {x: 0, y: -VELOCITY, dir: 'up'},
  3: {x: 0, y: VELOCITY, dir: 'down'} 
};

const getRandomPos = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const enemies = [  {'x': getRandomPos(0, board.width), 'y': getRandomPos(0, board.height), 'dir': 0, 'pj': 'e1'}, 
  {'x': getRandomPos(0, board.width), 'y': getRandomPos(0, board.height), 'dir': 0, 'pj': 'e2'},
  {'x': getRandomPos(0, board.width), 'y': getRandomPos(0, board.height), 'dir': 0, 'pj': 'e3'},
  {'x': getRandomPos(0, board.width), 'y': getRandomPos(0, board.height), 'dir': 0, 'pj': 'e4'},
];

const crowns = [
  {x: getRandomPos(0, board.width), y: getRandomPos(0, board.height)},
  {x: getRandomPos(0, board.width), y: getRandomPos(0, board.height)},
  {x: getRandomPos(0, board.width), y: getRandomPos(0, board.height)},
  {x: getRandomPos(0, board.width), y: getRandomPos(0, board.height)},
];

const fillBoard = () => {  
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, board.width, board.height);
};

const drawCrowns = (crowns) => {
  const crownImg = document.getElementById("crown");
  crownImg.onload = () => {
  crowns.forEach( crown => {
    ctx.drawImage(crownImg, crown.x, crown.y);});
  };
};

let inputPJ1$ = Rx.Observable.fromEvent(document, 'keydown').scan((lastMove, newMove) => {
  const nextMove = getMovement(lastMove, newMove.keyCode);
  return legalMove(lastMove, nextMove);
}, { x: getRandomPos(0, board.width - PLAYER_WIDTH), y: getRandomPos(0, board.height - PLAYER_HEIGHT), dir: 0, pj:'pj1'});

const movePJ1$ = inputPJ1$.subscribe(newPos => movePJ(newPos));

const inputPJ2$ = Rx.Observable.fromEvent(document, 'keydown').scan((lastMove, newMove) => {
  const nextMove = getMovement(lastMove, newMove.keyCode);
  return legalMove(lastMove, nextMove);
}, { x: getRandomPos(0, board.width - PLAYER_WIDTH), y: getRandomPos(0, board.height - PLAYER_HEIGHT), dir: 0, pj:'pj2'});

const movePJ2$ = inputPJ2$.subscribe(newPos => movePJ(newPos));

const movePJ = (newPos) => {
  const pj = document.getElementById(newPos.pj);
  const x = newPos.x + PREV_DIR[newPos.dir].x;
  const y = newPos.y + PREV_DIR[newPos.dir].y;
  if (newPos.x == 0 && PREV_DIR[newPos.dir].x < 0){
    ctx.fillRect(board.width - PLAYER_WIDTH, y, PLAYER_WIDTH, PLAYER_HEIGHT);
  } else if (newPos.x == board.width - PLAYER_WIDTH && PREV_DIR[newPos.dir].x > 0) {
    ctx.fillRect(0, y, PLAYER_WIDTH + VELOCITY, PLAYER_HEIGHT);
  } else if (newPos.y == 0 && PREV_DIR[newPos.dir].y < 0){
    ctx.fillRect(x, board.height - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);
  } else if (newPos.y == board.height - PLAYER_HEIGHT && PREV_DIR[newPos.dir].y > 0){
    ctx.fillRect(x, 0, PLAYER_WIDTH, PLAYER_HEIGHT + VELOCITY);
  } else {
    ctx.fillRect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
  }
  ctx.drawImage(pj, newPos.x, newPos.y);
};

const moveEnemy = (enemy) => {
  const move = RANDOM_DIR[getRandomPos(0, 3)];
  const newMove = {
    x: move.x,
    y: move.y,
    dir: move.dir,
    pj: enemy.pj
  };
  const nextMove = legalMove(enemy, newMove);

  movePJ(nextMove);

  return nextMove;
};

const enemiesMove = Rx.Observable.timer(1000, 1000).subscribe(event => {
  enemies.forEach(enemy => {
    const newMove = moveEnemy(enemy);
    enemy.x = newMove.x	;
    enemy.y = newMove.y;
    enemy.dir = newMove.dir;
  });
});

const checkCollision$ = new Rx.Observable.create(sub => { 
Rx.Observable.merge(inputPJ1$, inputPJ2$).subscribe((newPos) => {
    if (collision(enemies, newPos)){
      gameOver("Game Over", "red");
    }
    crowns.forEach(crown => {
      if ((newPos.x + PLAYER_WIDTH > crown.x && newPos.x - PLAYER_WIDTH < crown.x) && (newPos.y + PLAYER_HEIGHT > crown.y && newPos.y - PLAYER_HEIGHT < crown.y)){
	const id = crowns.indexOf(crown);
	crowns.splice(id, 1);
	sub.next([crown, newPos]);
      }
    });
});});

const subject = new Rx.Subject();
const getCrown$ = new Rx.Observable.create(sub => {
  checkCollision$.subscribe((data) => {
    const crown = data[0]; const newPos = data[1];
    ctx.fillRect(crown.x, crown.y, CROWN_SIZE, CROWN_SIZE);
    movePJ(newPos);
    sub.next(crowns.length);
  });
}).subscribe(subject);

const collision = (entities, newPos) => {
  let bool = 0;
  entities.forEach((entity) => {
    if ((newPos.x + PLAYER_WIDTH > entity.x && newPos.x - PLAYER_WIDTH < entity.x) && (newPos.y + PLAYER_HEIGHT > entity.y && newPos.y - PLAYER_HEIGHT < entity.y)){
      bool = 1;
    }
  }); 
  return bool;
};

const score$ = subject.scan( prevLength => { return prevLength + 1; }, 0);

const winGame = Rx.Observable.combineLatest(subject, score$).subscribe(([crownsLeft, score]) => {
  if (crownsLeft == 0)
  {
    gameOver("You won!", "white");
  }
});


const getMovement = (lastMove, keyCode) => {
  let pj = 0;
  if (Object.values(KEYMAP_PJ1).includes(keyCode)) {pj = 'pj1';}
  else if (Object.values(KEYMAP_PJ2).includes(keyCode)) {pj = 'pj2'};
  
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
  const dir = nextMove.dir;
  const pj = nextMove.pj;
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

const gameOver = (text, color) => {
  movePJ1$.dispose();
  movePJ2$.dispose();
  enemiesMove.dispose();
  ctx.font = "108px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(text, board.width/ 2, board.height/2);
};

document.addEventListener("DOMContentLoaded", async () => {
  fillBoard();
  drawCrowns(crowns);
});
