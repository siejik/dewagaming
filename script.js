const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const COLS = 10, ROWS = 20, BLOCK = 30;
const colors = ["#00e5ff","#4f7cff","#ff9f43","#ffe047","#47e68a","#a66cff","#ff4fa3"];
const shapes = [
  [[1,1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1],[1,1]],
  [[0,1,1],[1,1,0]],
  [[0,1,0],[1,1,1]],
  [[1,1,0],[0,1,1]]
];

let board, piece, score=0, lines=0, level=1, dropCounter=0, lastTime=0;
let dropInterval=850, gameOver=false, paused=false;

function newBoard(){ return Array.from({length:ROWS},()=>Array(COLS).fill(0)); }

function randomPiece(){
  const id=Math.floor(Math.random()*shapes.length);
  const matrix=shapes[id].map(r=>r.slice());
  return {matrix,color:colors[id],x:Math.floor((COLS-matrix[0].length)/2),y:0};
}
function reset(){
  board=newBoard(); score=0; lines=0; level=1; dropInterval=850;
  gameOver=false; paused=false; piece=randomPiece(); updateUI(); hideOverlay();
}
function drawCell(x,y,color,alpha=1){
  ctx.globalAlpha=alpha;
  ctx.fillStyle=color; ctx.fillRect(x*BLOCK+1,y*BLOCK+1,BLOCK-2,BLOCK-2);
  ctx.fillStyle="rgba(255,255,255,.18)"; ctx.fillRect(x*BLOCK+3,y*BLOCK+3,BLOCK-6,4);
  ctx.globalAlpha=1;
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#080d1b";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="rgba(255,255,255,.035)";ctx.lineWidth=1;
  for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*BLOCK,0);ctx.lineTo(x*BLOCK,canvas.height);ctx.stroke()}
  for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*BLOCK);ctx.lineTo(canvas.width,y*BLOCK);ctx.stroke()}
  board.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(x,y,v)}));
  if(piece) piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v)drawCell(piece.x+x,piece.y+y,piece.color)}));
}
function collide(p){
  for(let y=0;y<p.matrix.length;y++)for(let x=0;x<p.matrix[y].length;x++){
    if(!p.matrix[y][x])continue;
    const nx=p.x+x, ny=p.y+y;
    if(nx<0||nx>=COLS||ny>=ROWS)return true;
    if(ny>=0&&board[ny][nx])return true;
  }
  return false;
}
function merge(){
  piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{
    if(v&&piece.y+y>=0)board[piece.y+y][piece.x+x]=piece.color;
  }));
}
function rotateMatrix(m){
  return m[0].map((_,i)=>m.map(row=>row[i]).reverse());
}
function rotate(){
  if(gameOver||paused)return;
  const old=piece.matrix; const oldX=piece.x;
  piece.matrix=rotateMatrix(piece.matrix);
  let offset=1;
  while(collide(piece)){
    piece.x+=offset; offset=-(offset+(offset>0?1:-1));
    if(offset>piece.matrix[0].length){piece.matrix=old;piece.x=oldX;return}
  }
  draw();
}
function move(dir){
  if(gameOver||paused)return;
  piece.x+=dir;if(collide(piece))piece.x-=dir;draw();
}
function softDrop(){
  if(gameOver||paused)return;
  piece.y++;
  if(collide(piece)){piece.y--;lock();}
  dropCounter=0;draw();
}
function hardDrop(){
  if(gameOver||paused)return;
  let distance=0;while(!collide(piece)){piece.y++;distance++}
  piece.y--;score+=Math.max(0,distance-1)*2;lock();
}
function lock(){
  merge();clearLines();piece=randomPiece();
  if(collide(piece)){gameOver=true;showOverlay();return}
  draw();updateUI();
}
function clearLines(){
  let count=0;
  outer:for(let y=ROWS-1;y>=0;y--){
    if(board[y].every(Boolean)){
      board.splice(y,1);board.unshift(Array(COLS).fill(0));count++;y++;
    }
  }
  if(count){
    const points=[0,100,300,500,800][count]||1000;
    score+=points*level;lines+=count;level=Math.floor(lines/10)+1;
    dropInterval=Math.max(120,850-(level-1)*65);
  }
}
function update(time=0){
  const delta=time-lastTime;lastTime=time;
  if(!paused&&!gameOver){
    dropCounter+=delta;
    if(dropCounter>dropInterval)softDrop();
  }
  draw();requestAnimationFrame(update);
}
function updateUI(){
  document.getElementById("score").textContent=score;
  document.getElementById("lines").textContent=lines;
  document.getElementById("level").textContent=level;
  document.getElementById("finalScore").textContent=score;
}
function showOverlay(){document.getElementById("overlay").classList.add("show");updateUI()}
function hideOverlay(){document.getElementById("overlay").classList.remove("show")}
function togglePause(){
  if(gameOver)return;
  paused=!paused;
  document.getElementById("pauseBtn").textContent=paused?"LANJUT":"PAUSE";
}

document.addEventListener("keydown",e=>{
  const key=e.key.toLowerCase();
  if(["arrowleft","arrowright","arrowdown","arrowup"," ","p"].includes(key))e.preventDefault();
  if(key==="arrowleft")move(-1);
  else if(key==="arrowright")move(1);
  else if(key==="arrowdown")softDrop();
  else if(key==="arrowup")rotate();
  else if(key===" ")hardDrop();
  else if(key==="p")togglePause();
});
document.querySelectorAll("[data-action]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const a=btn.dataset.action;
    if(a==="left")move(-1); if(a==="right")move(1); if(a==="down")softDrop();
    if(a==="rotate")rotate(); if(a==="drop")hardDrop();
  });
});
document.getElementById("restartBtn").onclick=reset;
document.getElementById("restartSideBtn").onclick=reset;
document.getElementById("pauseBtn").onclick=togglePause;
reset();requestAnimationFrame(update);
