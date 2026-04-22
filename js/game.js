// sample grid code from chat gpt the rest of the js debugged using chat also based on a p5 sketch i found debugged using blackbox ai//

const marginTop = 50;
const marginBottom = 50;
const marginLeft = 80;
const marginRight = 80;

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

let showAxisLabels = true; // Toggle if needed

let msFont;

function preload() {
  msFont = loadFont("../assets/font/msfont.ttf");
}

function setup() {
  const gridArea = document.querySelector(".grid-area");
  const wrapper = document.querySelector(".grid-wrapper");
  textFont(msFont); // 👈 APPLY FONT HERE

  // Calculate square size based on grid-area dimensions
  const availableWidth = gridArea.clientWidth * 0.95; // 95% padding
  const availableHeight = gridArea.clientHeight * 0.95;
  const size = Math.min(availableWidth, availableHeight);

  canvas = createCanvas(size, size);
  canvas.parent(wrapper);

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
  const wrapper = document.querySelector(".grid-wrapper");

  // Recalculate square size consistently
  const availableWidth = gridArea.clientWidth * 0.95;
  const availableHeight = gridArea.clientHeight * 0.95;
  const size = Math.min(availableWidth, availableHeight);

  resizeCanvas(size, size);

  // Ensure canvas stays centered in wrapper
  wrapper.style.display = "flex";
  wrapper.style.justifyContent = "center";
  wrapper.style.alignItems = "center";

  updateGridSize();
}

function updateGridSize() {
  gridSizeW = width - marginLeft - marginRight;
  gridSizeH = height - marginTop - marginBottom;
  cellW = gridSizeW / cols;
  cellH = gridSizeH / rows;
  offsetX = marginLeft;
  offsetY = marginTop;
}

// Rest of your draw functions remain the same...
function draw() {
  clear();
  drawGridBackground();
  drawGrid();
  drawHover();
  drawGuesses();
  drawAxisLabels(); // ← ADD THIS LINE
}

function drawGridBackground() {
  noStroke();
  fill("white");
  rect(offsetX, offsetY, gridSizeW, gridSizeH);
}

function drawGrid() {
  stroke("#191919");
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
  )
    return;

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
  )
    return;

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
    guesses.push({ storyId: selectedStory, col: col, row: row });
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

function drawAxisLabels() {
  if (!showAxisLabels) return;

  // ---- STYLE ----
  noStroke();
  textSize(14);

  // =========================
  // TOP NUMBERS (1–10)
  // =========================
  fill(120); // gray like your image
  textAlign(CENTER, CENTER);

  for (let col = 0; col < cols; col++) {
    let x = offsetX + col * cellW + cellW / 2;
    let y = offsetY - 20;
    text(col + 1, x, y);
  }

  // =========================
  // RIGHT SIDE LETTERS (A–J)
  // =========================
  textAlign(CENTER, CENTER);

  for (let row = 0; row < rows; row++) {
    let x = offsetX + gridSizeW + 18;
    let y = offsetY + row * cellH + cellH / 2;
    text(String.fromCharCode(65 + row), x, y); // A–J
  }

  // =========================
  // X AXIS LABEL (BOTTOM)
  // =========================
  fill(0, 150, 255); // blue
  textSize(16);
  textAlign(CENTER, CENTER);

  text(
    "X = Does this actually matter?",
    offsetX + gridSizeW / 2,
    offsetY + gridSizeH + 30,
  );

  // =========================
  // Y AXIS LABEL (ROTATED LEFT)
  // =========================
  push();
  translate(offsetX - 50, offsetY + gridSizeH / 2);
  rotate(-HALF_PI);

  fill(255, 44, 178); // pink
  textSize(16);
  textAlign(CENTER, CENTER);

  text("Y = How entertaining is this?", 0, 0);
  pop();

  // =========================
  // CORNER LABELS
  // =========================

  // Top-left
  fill(255, 44, 178);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("The Tea is Hot", offsetX - 100, offsetY - 10);

  // Bottom-left
  text("Booooring", offsetX - 90, offsetY + gridSizeH + 10);

  fill("white");
  text("Unserious", offsetX - 90, offsetY + gridSizeH + 25);

  // Bottom-right
  textAlign(RIGHT, CENTER);
  text("Get the Police", offsetX + gridSizeW + 120, offsetY + gridSizeH + 25);
}
