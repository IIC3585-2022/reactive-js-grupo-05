const board = document.getElementById("board");
const ctx = board.getContext("2d");
const PLAYER_HEIGHT = 105;
const PLAYER_WIDTH = 75;
const VELOCITY = PLAYER_HEIGHT/3;

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

const fillBoard = () => {  
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, board.width, board.height);
};

const pipe = (...functions) => (value) => {
  return functions.reduce((currentValue, currentFunction) => {
    return currentFunction(currentValue);
  }, value);
};

const getRandomPos = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const addPlayer = (id) => {
  const x = getRandomPos(0, board.width - PLAYER_WIDTH);
  const y = getRandomPos(0, board.height - PLAYER_HEIGHT);
  const pj = document.getElementById("pj" + id);
  pj.onload = () => ctx.drawImage(pj, x, y);
};

const input$ = Rx.Observable.fromEvent(document, 'keydown').scan((lastMove, newMove) => {
  const nextMove = getMovement(lastMove, newMove.keyCode);
  console.log(legalMove(lastMove, nextMove));
  return legalMove(lastMove, nextMove);
}, { x: getRandomPos(0, board.width - PLAYER_WIDTH), y: getRandomPos(0, board.height - PLAYER_HEIGHT), dir: 0, pj:1})
  .subscribe(newPos => movePJ(newPos));

const inputPJ2$ = Rx.Observable.fromEvent(document, 'keydown').scan((lastMove, newMove) => {
  const nextMove = getMovement(lastMove, newMove.keyCode);
  console.log(legalMove(lastMove, nextMove));
  return legalMove(lastMove, nextMove);
}, { x: getRandomPos(0, board.width - PLAYER_WIDTH), y: getRandomPos(0, board.height - PLAYER_HEIGHT), dir: 0, pj:2})
  .subscribe(newPos => movePJ(newPos));

const movePJ = (newPos) => {
  const pj = document.getElementById("pj" + newPos.pj);
  ctx.fillRect(newPos.x + PREV_DIR[newPos.dir].x , newPos.y + PREV_DIR[newPos.dir].y, PLAYER_WIDTH, PLAYER_HEIGHT);
  ctx.drawImage(pj, newPos.x, newPos.y);
};

const getMovement = (lastMove, keyCode) => {
  let pj = 0;
  if (Object.values(KEYMAP_PJ1).includes(keyCode)) {pj = 1;}
  else if (Object.values(KEYMAP_PJ2).includes(keyCode)) {pj = 2};
  
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

document.addEventListener("DOMContentLoaded", async () => {
  fillBoard();
  //addPlayer(1);
  //addPlayer(2);
});
