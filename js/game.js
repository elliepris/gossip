// === CONFIG ===
const greyColors = ["#ffffff", "#cccccc", "#999999", "#666666", "#333333", "#000000"];

const missFonts = [
  "'Impact', sans-serif",
  "'Comic Sans MS', cursive",
  "'adobe-garamond-pro', serif",
  "'stencil-std', sans-serif",
  "'franklin-gothic-atf', sans-serif",
  "'curlz', cursive",
  "'london', cursive",
];

const cornerLabels = [
  { text: "Juicy, harmless fun", corner: "TL" },
  { text: "Call the police — keep me updated", corner: "TR" },
  { text: "Bad news, no intrigue", corner: "BR" },
  { text: "Boring, who cares", corner: "BL" },
];

const maxDist = 180;

const answerKey = [
  { storyId: 0, x: 3, y: 4 },
  { storyId: 1, x: 6, y: 6 },
  { storyId: 2, x: 3, y: 5 },
  { storyId: 3, x: 3, y: 3 },
  { storyId: 4, x: 5, y: 6 },
  { storyId: 5, x: 5, y: 4 },
  { storyId: 6, x: 9, y: 7 },
];

// === STATE ===
let xSliderTouched = false;
let ySliderTouched = false;

let confettiPieces = [];
let selectedStory = null;
let guesses = [];
let feedbackMessages = {};

let canvas;
let cols = 10;
let rows = 10;
let cellW, cellH;

let gridSizeW, gridSizeH;
let offsetX, offsetY;
let labelPadding = 50;
let titlePadding = 25;

let markerImg;

// Sliders (HTML elements now)
let xSlider, ySlider;
let previewCol = 4;
let previewRow = 5;
let isSliderDragging = false;

// DVD animation state
let dvdActive = false;
let dvdX, dvdY;
let dvdSpeedX = 6;
let dvdSpeedY = 6;
let dvdW = 100;
let dvdH = 60;
let dvdColor;
let wallsHit = { top: false, bottom: false, left: false, right: false };
let dvdLoopCount = 0;
const DVD_TOTAL_LOOPS = 1;

let dvdCanvas, dvdCtx;

// === CONFETTI CLASS ===
class Confetti {
  constructor() {
    this.x = -1000;
    this.y = -1000;
    this.size = random(20, 32);
    this.xspeed = 0;
    this.yspeed = 0;
    this.angle = 0;
    this.rotationSpeed = random(-8, 8);
    this.life = 255;
    this.col = greyColors[int(random(greyColors.length))];
    this.letter = random(["M", "I", "S", "S"]);
    this.font = missFonts[int(random(missFonts.length))];
  }

  burst(mx, my) {
    this.x = mx;
    this.y = my;
    this.xspeed = random(-10, 10);
    this.yspeed = random(-10, -5);
  }

  update() {
    this.x += this.xspeed;
    this.y += this.yspeed;
    this.angle += radians(this.rotationSpeed);
    this.yspeed += 0.4;
    this.life -= 5;
  }

  show() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    let c = color(this.col);
    c.setAlpha(this.life);
    fill(c);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(this.size);
    drawingContext.font = `bold ${this.size}px ${this.font}`;
    text(this.letter, 0, 0);
    pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

// === SETUP ===
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
  setupClearButton();
  setupDVDOverlay();
  setupSliders();
}

function setupStorySelection() {
  const radios = document.querySelectorAll('input[name="gossip-story"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", function () {
      selectedStory = Number(this.value);
      xSliderTouched = false;  // 👈 ADD
      ySliderTouched = false;  // 👈 ADD
    });
  });
}

function setupClearButton() {
  const btn = document.getElementById("clear-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      guesses = [];
      feedbackMessages = {};
      document.querySelectorAll(".feedback-tag").forEach((tag) => tag.remove());
      document.querySelectorAll('input[name="gossip-story"]').forEach((r) => {
        r.checked = false;
      });
      selectedStory = null;
      xSliderTouched = false;  // 👈 ADD
      ySliderTouched = false;  // 👈 ADD
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

function setupSliders() {
  xSlider = document.getElementById("x-slider");
  ySlider = document.getElementById("y-slider");

  if (!xSlider || !ySlider) {
    console.warn("Sliders not found in HTML!");
    return;
  }

  xSlider.addEventListener("input", () => {
    previewCol = Number(xSlider.value) - 1;
    isSliderDragging = true;
    xSliderTouched = true;
  });
  ySlider.addEventListener("input", () => {
    previewRow = rows - Number(ySlider.value);
    isSliderDragging = true;
    ySliderTouched = true;
  });

  xSlider.addEventListener("change", submitSliderGuess);
  ySlider.addEventListener("change", submitSliderGuess);

  previewCol = Number(xSlider.value) - 1;
  previewRow = rows - Number(ySlider.value);
}

function positionSliders() {
  if (!xSlider || !ySlider) return;

  const xContainer = document.querySelector(".x-slider-container");
  const yContainer = document.querySelector(".y-slider-container");
  if (!xContainer || !yContainer) return;

  // X slider along bottom of grid
  xContainer.style.left = offsetX + "px";
  xContainer.style.top = offsetY + gridSizeH + 8 + "px";
  xContainer.style.width = gridSizeW + "px";
  xSlider.style.width = gridSizeW + "px";

// Y slider along left of grid (rotated via CSS)
// After rotating -90deg around top-left corner, the slider extends upward.
// So we need to position it such that after rotation it sits along the left side of the grid.
yContainer.style.left = (offsetX - 8) + "px";
yContainer.style.top = (offsetY + gridSizeH) + "px";  // 👈 start at BOTTOM of grid
yContainer.style.width = gridSizeH + "px";
ySlider.style.width = gridSizeH + "px";
}

function windowResized() {
  const wrapper = document.querySelector(".grid-wrapper");
  resizeCanvas(wrapper.clientWidth, wrapper.clientHeight);
  updateGridSize();
  positionSliders();
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

// === DRAW LOOP ===
function draw() {
  clear();
  drawGlow();
  drawGridBackground();
  drawCornerLabels();
  drawCellLines();
  drawHover();
  drawGuesses();

  updateCoordDisplay();
  updateSliderLabelSizes();

  for (let i = confettiPieces.length - 1; i >= 0; i--) {
    confettiPieces[i].update();
    confettiPieces[i].show();
    if (confettiPieces[i].isDead()) {
      confettiPieces.splice(i, 1);
    }
  }

  if (dvdActive) updateDVD();
}

function updateCoordDisplay() {
  const coordEl = document.getElementById("coord-display");
  if (coordEl && xSlider && ySlider) {
    coordEl.textContent = `(${xSlider.value}, ${ySlider.value})`;
  }
}

function updateSliderLabelSizes() {
  if (!xSlider || !ySlider) return;

  const xVal = Number(xSlider.value);
  const yVal = Number(ySlider.value);

  // X slider → Boring (low) vs Juicy (high)
  styleLabel("truth-left", 11 - xVal);  // distance from 1
  styleLabel("truth-right", xVal);       // distance from 10 = 10 - dist

  // Y slider → Harmless (low) vs Dramatic (high)
  styleLabel("drama-left", 11 - yVal);
  styleLabel("drama-right", yVal);
}

function styleLabel(id, closeness) {
  // closeness: higher = closer to that end
  const el = document.getElementById(id);
  if (!el) return;
  const size = map(closeness, 1, 10, 12, 24);
  const isClose = closeness >= 7;
  el.style.fontSize = size + "px";
  el.style.color = isClose ? "#ff2cb2" : "#666";
}

function drawGlow() {
  noStroke();
  let glowColor = color("#ff2cb2");
  for (let i = 10; i > 0; i--) {
    glowColor.setAlpha(12);
    fill(glowColor);
    rect(offsetX - i, offsetY - i, gridSizeW + i * 2, gridSizeH + i * 2);
  }
}

function drawGridBackground() {
  noStroke();
  fill("#cbcbcb");
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
  stroke("#191919");
  strokeWeight(1);

  for (let x = 0; x <= cols; x++) {
    line(offsetX + x * cellW, offsetY, offsetX + x * cellW, offsetY + gridSizeH);
  }
  for (let y = 0; y <= rows; y++) {
    line(offsetX, offsetY + y * cellH, offsetX + gridSizeW, offsetY + y * cellH);
  }
  pop();
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
    TL: { x: offsetX + padding, y: offsetY + padding, align: [LEFT, TOP], xTarget: 1, yTarget: 10 },
    TR: { x: offsetX + gridSizeW - padding, y: offsetY + padding, align: [RIGHT, TOP], xTarget: 10, yTarget: 10 },
    BR: { x: offsetX + gridSizeW - padding, y: offsetY + gridSizeH - padding, align: [RIGHT, BOTTOM], xTarget: 10, yTarget: 1 },
    BL: { x: offsetX + padding, y: offsetY + gridSizeH - padding, align: [LEFT, BOTTOM], xTarget: 1, yTarget: 1 },
  };

  let xVal = xSlider ? Number(xSlider.value) : 5;
  let yVal = ySlider ? Number(ySlider.value) : 5;

  textStyle(BOLD);

  for (let label of cornerLabels) {
    let pos = positions[label.corner];

    // "distance" in slider space (max = sqrt(9² + 9²) ≈ 12.7)
    let dx = pos.xTarget - xVal;
    let dy = pos.yTarget - yVal;
    let d = Math.sqrt(dx * dx + dy * dy);
    let maxD = 12.7;

    let size = map(d, 0, maxD, 24, 11, true);
    let r = map(d, 0, maxD, 255, 160, true);
    let g = map(d, 0, maxD, 44, 160, true);
    let b = map(d, 0, maxD, 178, 160, true);

    textSize(size);
    textAlign(pos.align[0], pos.align[1]);
    noStroke();
    fill(r, g, b);

    text(label.text, pos.x, pos.y, maxTextWidth);
  }

  drawingContext.restore();
  pop();
}
function drawHover() {
  if (!xSlider || !ySlider) return;

  let col = previewCol;
  let row = previewRow;
  let cx = offsetX + col * cellW;
  let cy = offsetY + row * cellH;

  noStroke();
  if (xSliderTouched && ySliderTouched) {
    fill(255, 44, 178, 180);
  } else {
    fill(255, 44, 178, 80);
  }
  rect(cx, cy, cellW, cellH);
}

function submitSliderGuess() {
  if (selectedStory === null) {
    alert("Please select a gossip story first.");
    return;
  }

  if (!xSliderTouched || !ySliderTouched) {
    return;
  }

  let col = Number(xSlider.value) - 1;
  let row = rows - Number(ySlider.value);

  let existing = guesses.find((g) => g.storyId === selectedStory);
  if (existing) {
    existing.col = col;
    existing.row = row;
  } else {
    guesses.push({ storyId: selectedStory, col, row });
  }

  checkGuess(selectedStory, col, row);

  xSliderTouched = false;   // 👈 reset for next guess
  ySliderTouched = false;   // 👈 reset for next guess
  isSliderDragging = false;
}

function checkGuess(storyId, col, row) {
  let answer = answerKey.find((a) => a.storyId === storyId);
  if (!answer) return;

  let answerCol = floor(answer.x) - 1;
  let answerRow = rows - floor(answer.y);

  let result = col === answerCol && row === answerRow ? "HIT" : "MISS";

  feedbackMessages[storyId] = result;
  updateFeedbackUI(storyId, result);

  if (result === "HIT") {
    startDVDAnimation();
  } else {
    // Burst confetti from the marker position
    let markerX = offsetX + col * cellW + cellW / 2;
    let markerY = offsetY + row * cellH + cellH / 2;
    for (let i = 0; i < 40; i++) {
      let c = new Confetti();
      c.burst(markerX, markerY);
      confettiPieces.push(c);
    }
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

  if (wallsHit.top && wallsHit.bottom && wallsHit.left && wallsHit.right) {
    dvdLoopCount++;
    if (dvdLoopCount >= DVD_TOTAL_LOOPS) {
      setTimeout(() => {
        dvdActive = false;
        dvdCtx.clearRect(0, 0, dvdCanvas.width, dvdCanvas.height);
      }, 500);
    } else {
      wallsHit = { top: false, bottom: false, left: false, right: false };
    }
  }
}

function drawGuesses() {
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(NORMAL);

  let markerSize = Math.min(cellW, cellH) * 0.8;

  for (let guess of guesses) {
    let x = offsetX + guess.col * cellW + cellW / 2;
    let y = offsetY + guess.row * cellH + cellH / 2;

    if (markerImg) {
      imageMode(CENTER);
      image(markerImg, x, y, markerSize, markerSize);
    } else {
      // Fallback if no image
      fill(255, 44, 178);
      noStroke();
      ellipse(x, y, markerSize * 0.7);
    }

    fill(0);
    noStroke();
    text(guess.storyId + 1, x, y - markerSize / 2 - 10);
  }
}

// === Toggle helpers (for [anim] elements) ===
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[anim]").forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("toggled"));
  });
});