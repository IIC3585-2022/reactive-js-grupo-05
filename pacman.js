const board = document.getElementById("board");
const ctx = board.getContext("2d");
const PLAYER_SIZE = 50;

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

const addPlayer = (id, color) => {
  ctx.fillStyle = color;
  const x = getRandomPos(0, board.width - PLAYER_SIZE);
  const y = getRandomPos(0, board.height - PLAYER_SIZE);
  ctx.fillRect(x, y, PLAYER_SIZE, PLAYER_SIZE);
};

const input$ = Rx.Observable.fromEvent(document, 'keydown').subscribe((event) => console.log(event));

document.addEventListener("DOMContentLoaded", () => {
  pipe(
    fillBoard,
    addPlayer(1, "red"),
    addPlayer(2, "green")
  );
});
