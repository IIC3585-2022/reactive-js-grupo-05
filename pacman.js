const board = document.getElementById("board");
const ctx = board.getContext("2d");
const PLAYER_SIZE = 50;
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
  const x = getRandomPos(0, board.width - PLAYER_SIZE);
  const y = getRandomPos(0, board.height - PLAYER_SIZE);
  const pj = document.getElementById("pj" + id);
  pj.onload = () => ctx.drawImage(pj, x, y);
};

const debug = () => {
  return ctx.drawImage(document.getElementById("pj2"), 500, 500);
};

const input$ = Rx.Observable.fromEvent(document, 'keydown').subscribe((event) => console.log(event.keyCode));

document.addEventListener("DOMContentLoaded", () => {
  fillBoard();
  addPlayer(1);
  addPlayer(2);
});
