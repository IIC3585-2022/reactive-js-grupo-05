const board = document.getElementById("board");
const ctx = board.getContext("2d");

const fill_board = () => {  
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, board.width, board.height);
};

const add_player = (id, color) => {
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 100, 100);
  const keysDown$ = Rx.Observable.fromEvent(document, 'keydown');
  console.log(keysDown$);
};

document.addEventListener("DOMContentLoaded", () => {
  fill_board();
  add_player(1, "red");
});
