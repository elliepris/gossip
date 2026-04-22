// sample grid code from chat gpt the rest of the js debugged using chat also based on a p5 sketch i found
let selectedStory = null;
let guesses = [];

let canvas;
let cols = 10;
let rows = 10;
let cellW;
let cellH;

let gridSizeW;
let gridSizeH;
let offsetX;
let offsetY;

function setup() {
  const gridArea = document.querySelector(".grid-area");
  canvas = createCanvas(gridArea.clientWidth, gridArea.clientHeight);
  canvas.parent(gridArea);

  updateGridSize();
  setupStorySelection();
}

function setupStorySelection() {
  const radios = document.querySelectorAll('input[name="gossip-story"]');

  radios.forEach((radio) => {
    radio.addEventListener("change", function () {
      selectedStory = Number(this.value);
    });
  });
}

function windowResized() {
  const gridArea = document.querySelector(".grid-area");
  resizeCanvas(gridArea.clientWidth, gridArea.clientHeight);

  updateGridSize();
}

function updateGridSize() {
  // make square cells based on the smaller dimension
  let size = min(width, height) * 0.7;
  cellW = size / cols;
  cellH = size / rows;

  gridSizeW = cellW * cols;
  gridSizeH = cellH * rows;

  // center grid inside canvas
  offsetX = (width - gridSizeW) / 2;
  offsetY = (height - gridSizeH) / 2;
}

function draw() {
  clear();
  drawGrid();
  drawHover();
  drawGuesses();
}

function drawGrid() {
  stroke("white");
  strokeWeight(1.5);

  for (let x = 0; x <= cols; x++) {
    line(
      offsetX + x * cellW,
      offsetY,
      offsetX + x * cellW,
      offsetY + gridSizeH,
    );
  }

  for (let y = 0; y <= rows; y++) {
    line(
      offsetX,
      offsetY + y * cellH,
      offsetX + gridSizeW,
      offsetY + y * cellH,
    );
  }
}

function drawHover() {
  if (
    mouseX < offsetX ||
    mouseX > offsetX + gridSizeW ||
    mouseY < offsetY ||
    mouseY > offsetY + gridSizeH
  ) return;

  let col = floor((mouseX - offsetX) / cellW);
  let row = floor((mouseY - offsetY) / cellH);

  let x = offsetX + col * cellW;
  let y = offsetY + row * cellH;

  noStroke();
  fill(255, 44, 178, 70);
  rect(x, y, cellW, cellH);
}

function mousePressed() {
  if (
    mouseX < offsetX ||
    mouseX > offsetX + gridSizeW ||
    mouseY < offsetY ||
    mouseY > offsetY + gridSizeH
  ) return;

  if (selectedStory === null) {
    alert("Please select a gossip story first.");
    return;
  }

  let col = floor((mouseX - offsetX) / cellW);
  let row = floor((mouseY - offsetY) / cellH);

  let existingStoryGuess = guesses.find(
    (guess) => guess.storyId === selectedStory,
  );

  if (existingStoryGuess) {
    existingStoryGuess.col = col;
    existingStoryGuess.row = row;
  } else {
    guesses.push({
      storyId: selectedStory,
      col: col,
      row: row,
    });
  }
}

function drawGuesses() {
  textAlign(CENTER, CENTER);
  textSize(16);

  for (let guess of guesses) {
    let x = offsetX + guess.col * cellW + cellW / 2;
    let y = offsetY + guess.row * cellH + cellH / 2;

    fill(255, 44, 178);
    noStroke();
    ellipse(x, y, 20, 20);

    fill(0);
    text(guess.storyId + 1, x, y - 28);
  }
}