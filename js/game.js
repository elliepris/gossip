let canvas;
//debugged code from chatGPT
function setup() {
  const gameWindow = document.querySelector("#game_window");
  canvas = createCanvas(gameWindow.clientWidth, gameWindow.clientHeight);
  canvas.parent("game_window");
}

function windowResized() {
  const gameWindow = document.querySelector("#game_window");
  resizeCanvas(gameWindow.clientWidth, gameWindow.clientHeight);
}

function draw() {
  clear();
}