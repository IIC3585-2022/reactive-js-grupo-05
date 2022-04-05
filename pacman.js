const fill_board = () => {
  const board = document.getElementById("board");
  const ctx = board.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, board.width, board.height);
};

document.addEventListener("DOMContentLoaded", () => {
  fill_board();
});
