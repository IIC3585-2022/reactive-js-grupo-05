//import { Observable, Subject, ReplaySubject, fromEvent, of, range } from 'https://dev.jspm.io/rxjs@6/_esm2015';
//import { map, filter, switchMap } from 'https://dev.jspm.io/rxjs@6/_esm2015/operators';


export const add_player = (id, color) => {
  const board = document.getElementById("board");
  const ctx = board.getContext("2d");
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 500, 500);
  console.log("Player");
  const source = fromEvent(document, 'click');
  const subscribe = source.subscribe(val => console.log(val));
};


