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
let labelPadding = 35;
let titlePadding = 25;

// Corner labels
const cornerLabels = [
  { text: "Juicy, harmless fun", corner: "TL" },
  { text: "Call the police — keep me updated", corner: "TR" },
  { text: "Bad news, no intrigue", corner: "BR" },
  { text: "Boring, who cares", corner: "BL" },
];

const maxDist = 180;

// ANSWER KEY
const answerKey = [
  { storyId: 0, x: 3.44, y: 4.11, spread: 4.89 },
  { storyId: 1, x: 6.30, y: 6.00, spread: 7.22 },
  { storyId: 2, x: 2.96, y: 4.85, spread: 5.30 },
  { storyId: 3, x: 2.63, y: 3.44, spread: 4.09 },
  { storyId: 4, x: 5.27, y: 6.46, spread: 7.30 },
  { storyId: 5, x: 5.07, y: 3.93, spread: 6.09 },
  { storyId: 6, x: 8.63, y: 7.30, spread: 9.31 },
];

let showKey = false;
let feedbackMessages = {};

// DVD animation state
let dvdActive = false;
let dvdX, dvdY;
let dvdSpeedX = 6;
let dvdSpeedY = 6;
let dvdW = 100;
let dvdH = 60;
let dvdColor;
let wallsHit = { top: false, bottom: false, left: false, right: false };
let dvdLoopCount = 0; // how many full cycles completed
const DVD_TOTAL_LOOPS = 2; // run twice

let dvdCanvas, dvdCtx;

function setup() {
  const wrapper = document.querySelector(".grid-wrapper");
  canvas = createCanvas(wrapper.clientWidth, wrapper.clientHeight);
  canvas.parent(wrapper);

  canvas.canvas.style.imageRendering = "pixelated";
  noSmooth();

  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  updateGridSize();
  setupStorySelection();
  setupAnswerKeyToggle();
  setupClearButton();
  setupDVDOverlay();
}

function setupStorySelection() {
  const radios = document.querySelectorAll('input[name="gossip-story"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", function () {
      selectedStory = Number(this.value);
    });
  });
}

function setupAnswerKeyToggle() {
  const btn = document.getElementById("reveal-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      showKey = !showKey;
      btn.textContent = showKey ? "Hide Answers" : "Reveal Answers";
    });
  }
}

// Clear guesses button
function setupClearButton() {
  const btn = document.getElementById("clear-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      guesses = [];
      feedbackMessages = {};
      // Remove all feedback tags in the UI
      document.querySelectorAll(".feedback-tag").forEach((tag) => tag.remove());
      // Uncheck selected radio
      document.querySelectorAll('input[name="gossip-story"]').forEach((r) => {
        r.checked = false;
      });
      selectedStory = null;
    });
  }
}

function setupDVDOverlay() {
  const gameWindow = document.getElementById("game-window");

  dvdCanvas = document.createElement("canvas");
  dvdCanvas.style.position = "absolute";
  dvdCanvas.style.top = "0";
  dvdCanvas.style.left = "0";
  dvdCanvas.style.pointerEvents = "none";
  dvdCanvas.style.zIndex = "100";
  dvdCanvas.width = gameWindow.clientWidth;
  dvdCanvas.height = gameWindow.clientHeight;
  gameWindow.appendChild(dvdCanvas);

  dvdCtx = dvdCanvas.getContext("2d");

  window.addEventListener("resize", () => {
    dvdCanvas.width = gameWindow.clientWidth;
    dvdCanvas.height = gameWindow.clientHeight;
  });
}

function windowResized() {
  const wrapper = document.querySelector(".grid-wrapper");
  resizeCanvas(wrapper.clientWidth, wrapper.clientHeight);
  updateGridSize();
}

function updateGridSize() {
  let leftSpace = labelPadding + titlePadding;
  let topSpace = titlePadding;
  let rightSpace = 15;
  let bottomSpace = labelPadding + titlePadding;

  let availableW = width - leftSpace - rightSpace;
  let availableH = height - topSpace - bottomSpace;

  let size = Math.min(availableW, availableH);

  gridSizeW = size;
  gridSizeH = size;
  cellW = gridSizeW / cols;
  cellH = gridSizeH / rows;

  offsetX = leftSpace + (availableW - size) / 2;
  offsetY = topSpace + (availableH - size) / 2;
}

function draw() {
  clear();
  drawGlow();
  drawGridBackground();
  drawCornerLabels();
  drawCellLines();
  drawGridBorder();
  drawLabels();
  drawAxisTitles();
  drawHover();
  if (showKey) drawAnswerKey();
  drawGuesses();

  if (dvdActive) updateDVD();
}

function drawGlow() {
  noStroke();
  let glowColor = color(255, 0, 181);
  for (let i = 8; i > 0; i--) {
    glowColor.setAlpha(12);
    fill(glowColor);
    rect(offsetX - i, offsetY - i, gridSizeW + i * 2, gridSizeH + i * 2);
  }
}

function drawGridBackground() {
  noStroke();
  fill("white");
  rect(offsetX, offsetY, gridSizeW, gridSizeH);
}

function drawCornerLabels() {
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(offsetX, offsetY, gridSizeW, gridSizeH);
  drawingContext.clip();

  let padding = 40;
  let maxTextWidth = gridSizeW * 0.38;

  let positions = {
    TL: { x: offsetX + padding, y: offsetY + padding, align: [LEFT, TOP] },
    TR: { x: offsetX + gridSizeW - padding, y: offsetY + padding, align: [RIGHT, TOP] },
    BR: { x: offsetX + gridSizeW - padding, y: offsetY + gridSizeH - padding, align: [RIGHT, BOTTOM] },
    BL: { x: offsetX + padding, y: offsetY + gridSizeH - padding, align: [LEFT, BOTTOM] },
  };

  textStyle(BOLD);

  for (let label of cornerLabels) {
    let pos = positions[label.corner];
    let d = dist(pos.x, pos.y, mouseX, mouseY);

    let size = map(d, 0, maxDist, 20, 10, true);
    let r = map(d, 0, maxDist, 255, 160, true);
    let g = map(d, 0, maxDist, 44, 160, true);
    let b = map(d, 0, maxDist, 160, 160, true);

    textSize(size);
    textAlign(pos.align[0], pos.align[1]);
    noStroke();
    fill(r, g, b);

    text(label.text, pos.x, pos.y, maxTextWidth);
  }

  drawingContext.restore();
  pop();
}

function drawCellLines() {
  push();
  stroke(180, 180, 180, 120);
  strokeWeight(1);
  drawingContext.setLineDash([2, 3]);

  for (let x = 0; x <= cols; x++) {
    line(offsetX + x * cellW, offsetY, offsetX + x * cellW, offsetY + gridSizeH);
  }
  for (let y = 0; y <= rows; y++) {
    line(offsetX, offsetY + y * cellH, offsetX + gridSizeW, offsetY + y * cellH);
  }
  drawingContext.setLineDash([]);
  pop();
}

function drawGridBorder() {
  push();
  noFill();
  stroke(0);
  strokeWeight(2);
  drawingContext.setLineDash([2, 4]);
  rect(offsetX, offsetY, gridSizeW, gridSizeH);
  drawingContext.setLineDash([]);
  pop();
}

function drawLabels() {
  noStroke();
  fill(180);
  textSize(13);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  for (let x = 0; x < cols; x++) {
    let cx = offsetX + x * cellW + cellW / 2;
    let cy = offsetY + gridSizeH + labelPadding / 2;
    text(x + 1, cx, cy);
  }

  for (let y = 0; y < rows; y++) {
    let cx = offsetX - labelPadding / 2;
    let cy = offsetY + y * cellH + cellH / 2;
    text(rows - y, cx, cy);
  }
}

function drawAxisTitles() {
  noStroke();
  fill(180);
  textSize(14);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  text(
    "TRUTH →",
    offsetX + gridSizeW / 2,
    offsetY + gridSizeH + labelPadding + titlePadding / 2
  );

  push();
  translate(offsetX - labelPadding - titlePadding / 2, offsetY + gridSizeH / 2);
  rotate(-HALF_PI);
  text("DRAMA →", 0, 0);
  pop();
}

function drawHover() {
  // Don't show hover if answer key is open (game is "locked")
  if (showKey) return;

  if (
    mouseX < offsetX ||
    mouseX > offsetX + gridSizeW ||
    mouseY < offsetY ||
    mouseY > offsetY + gridSizeH
  )
    return;

  let col = floor((mouseX - offsetX) / cellW);
  let row = floor((mouseY - offsetY) / cellH);
  let cx = offsetX + col * cellW + cellW / 2;
  let cy = offsetY + row * cellH + cellH / 2;

  let baseSize = Math.min(cellW, cellH);

  noStroke();
  for (let i = 6; i > 0; i--) {
    let t = i / 6;
    fill(255, 44, 178, 25);
    ellipse(cx, cy, baseSize * 1.4 * t, baseSize * 1.4 * t);
  }

  fill(255, 44, 178, 120);
  ellipse(cx, cy, baseSize * 0.7, baseSize * 0.7);
}

function drawAnswerKey() {
  for (let a of answerKey) {
    let cx = offsetX + a.x * cellW;
    let cy = offsetY + (rows - a.y) * cellH;
    let spreadRadius = (a.spread / 2) * cellW;

    noStroke();
    for (let i = 6; i > 0; i--) {
      let t = i / 6;
      fill(255, 44, 178, 15);
      ellipse(cx, cy, spreadRadius * 2 * t, spreadRadius * 2 * t);
    }

    fill(180, 0, 120);
    noStroke();
    ellipse(cx, cy, 16, 16);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    textStyle(BOLD);
    text(a.storyId + 1, cx, cy);
  }
}

function mousePressed() {
  // LOCK: block guesses while answer key is visible
  if (showKey) return;

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
    (guess) => guess.storyId === selectedStory
  );

  if (existingStoryGuess) {
    existingStoryGuess.col = col;
    existingStoryGuess.row = row;
  } else {
    guesses.push({ storyId: selectedStory, col: col, row: row });
  }

  checkGuess(selectedStory, col, row);
}

function checkGuess(storyId, col, row) {
  let answer = answerKey.find((a) => a.storyId === storyId);
  if (!answer) return;

  let answerCol = floor(answer.x);
  let answerRow = rows - 1 - floor(answer.y);

  let result = col === answerCol && row === answerRow ? "HIT" : "MISS";

  feedbackMessages[storyId] = result;
  updateFeedbackUI(storyId, result);

  if (result === "HIT") {
    startDVDAnimation();
  }
}

function updateFeedbackUI(storyId, result) {
  const label = document.querySelector(`label[for="gossip${storyId + 1}"]`);
  if (!label) return;

  let existing = label.parentElement.querySelector(".feedback-tag");
  if (existing) existing.remove();

  let tag = document.createElement("span");
  tag.className = "feedback-tag";
  tag.textContent = result;
  tag.style.marginLeft = "8px";
  tag.style.fontWeight = "bold";
  tag.style.color = result === "HIT" ? "#ff2cb2" : "#888";
  label.parentElement.appendChild(tag);
}

// === DVD BOUNCE ANIMATION ===

function startDVDAnimation() {
  dvdActive = true;
  dvdLoopCount = 0;
  dvdX = random(dvdCanvas.width - dvdW);
  dvdY = random(dvdCanvas.height - dvdH);
  dvdSpeedX = random() > 0.5 ? 6 : -6;
  dvdSpeedY = random() > 0.5 ? 6 : -6;
  wallsHit = { top: false, bottom: false, left: false, right: false };
  pickPinkColor();
}

function pickPinkColor() {
  let r = floor(random(220, 256));
  let g = floor(random(20, 150));
  let b = floor(random(150, 220));
  dvdColor = `rgb(${r},${g},${b})`;
}

function updateDVD() {
  dvdCtx.clearRect(0, 0, dvdCanvas.width, dvdCanvas.height);

  dvdX += dvdSpeedX;
  dvdY += dvdSpeedY;

  if (dvdX + dvdW >= dvdCanvas.width) {
    dvdSpeedX = -Math.abs(dvdSpeedX);
    dvdX = dvdCanvas.width - dvdW;
    wallsHit.right = true;
    pickPinkColor();
  } else if (dvdX <= 0) {
    dvdSpeedX = Math.abs(dvdSpeedX);
    dvdX = 0;
    wallsHit.left = true;
    pickPinkColor();
  }

  if (dvdY + dvdH >= dvdCanvas.height) {
    dvdSpeedY = -Math.abs(dvdSpeedY);
    dvdY = dvdCanvas.height - dvdH;
    wallsHit.bottom = true;
    pickPinkColor();
  } else if (dvdY <= 0) {
    dvdSpeedY = Math.abs(dvdSpeedY);
    dvdY = 0;
    wallsHit.top = true;
    pickPinkColor();
  }

  dvdCtx.fillStyle = dvdColor;
  dvdCtx.fillRect(dvdX, dvdY, dvdW, dvdH);

  dvdCtx.fillStyle = "white";
  dvdCtx.font = "bold 28px sans-serif";
  dvdCtx.textAlign = "center";
  dvdCtx.textBaseline = "middle";
  dvdCtx.fillText("HIT!", dvdX + dvdW / 2, dvdY + dvdH / 2);

  // Check if all 4 walls have been hit = one full loop complete
  if (wallsHit.top && wallsHit.bottom && wallsHit.left && wallsHit.right) {
    dvdLoopCount++;
    if (dvdLoopCount >= DVD_TOTAL_LOOPS) {
      // Done — stop and clear
      setTimeout(() => {
        dvdActive = false;
        dvdCtx.clearRect(0, 0, dvdCanvas.width, dvdCanvas.height);
      }, 500);
    } else {
      // Reset walls for next loop, keep going
      wallsHit = { top: false, bottom: false, left: false, right: false };
    }
  }
}

function drawGuesses() {
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(NORMAL);

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

let anims = [...document.querySelectorAll("[anim]")];
let click = (el, cb) => el.addEventListener("click", cb);
let toggle = (el) => el.classList.toggle("toggled");
let clickTog = (el) => click(el, () => toggle(el));
anims.map(clickTog);