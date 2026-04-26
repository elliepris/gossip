// === CONFIG ===
const greyColors = [
  "#ffffff",
  "#cccccc",
  "#999999",
  "#666666",
  "#333333",
  "#000000",
];

const missFonts = [
  "'Impact', sans-serif",
  "'Comic Sans MS', cursive",
  "'adobe-garamond-pro', serif",
  "'stencil-std', sans-serif",
  "'franklin-gothic-atf', sans-serif",
  "'curlz', cursive",
  "'london', cursive",
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

const guessEmojis = [
  "💔", // Story 1 — perfect couple
  "😩", // Story 2 — overworked
  "👭", // Story 3 — besties
  "🎭", // Story 4 — twins
  "💰", // Story 5 — earn money now
  "🪖", // Story 6 — army guy
  "🤢", // Story 7 — teacher
];

// 👇 ADD THIS
const storyTitles = [
  "It's Me or Them",      // Story 1
  "Too Much",             // Story 2
  "Messy Emmy",           // Story 3
  "It Took a Haircut",    // Story 4
  "Got His Bag",          // Story 5
  "Charmer or Creeper",   // Story 6
  "Speak Up",             // Story 7
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
let labelPadding = 38;
let titlePadding = 38;

let markerImg;

// Sliders
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
let dvdImg; // 👈 ADD
let dvdImgLoaded = false;
let dvdOverlay;

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
  const wrapper = document.querySelector(".game-play-wrapper");
  canvas = createCanvas(wrapper.clientWidth, wrapper.clientHeight);
  canvas.parent(wrapper);

  canvas.canvas.style.imageRendering = "pixelated";
  noSmooth();

  updateGridSize();
  setupClearButton();
  setupSubmitButton();
  setupDVDOverlay();
  setupSliders();
  setupAnswerKeyButton();
setupEnterKey();                       // 👈 ADD


  // Observe the wrapper for size changes (handles grid layout shifts)
  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas(wrapper.clientWidth, wrapper.clientHeight);
    updateGridSize();
  });
  resizeObserver.observe(wrapper);
}

function setStoryFromChat(storyId) {
  if (storyId === undefined || storyId === null || isNaN(storyId)) {   // 👈 FIXED
    console.warn("Invalid storyId:", storyId);
    return;
  }

  selectedStory = Number(storyId);
  xSliderTouched = false;
  ySliderTouched = false;

  const labelEl = document.getElementById("current-story-label");
  if (labelEl) {
    const emoji = guessEmojis[selectedStory] || "❓";
    const title = storyTitles[selectedStory] || "Unknown Story";
    labelEl.textContent = `${emoji} ${title}`;
  }
}

function setupClearButton() {
  const btn = document.getElementById("clear-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      guesses = [];
      feedbackMessages = {};
      document.querySelectorAll(".feedback-tag").forEach((tag) => tag.remove());
      selectedStory = null;
      answerKeyVisible = false; // 👈 ADD — reset flag when clearing

      const labelEl = document.getElementById("current-story-label");
      if (labelEl) {
        labelEl.innerHTML = "<em>No story selected</em>";
      }

      resetSliders();
    });
  }
}

function setupSubmitButton() {
  const btn = document.getElementById("submit-btn");
  if (btn) {
    btn.addEventListener("click", submitSliderGuess);
  }
}

function submitSliderGuess() {
  // 👇 ADD: block guesses while answer key is showing
if (answerKeyVisible) return;   // silently do nothing

  if (selectedStory === null) {
    alert("Open a gossip story's chat log first!");
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

  resetSliders();
  isSliderDragging = false;
  updateSliderLabelSizes();
}

function setupDVDOverlay() {
  const gameWindow = document.getElementById("game-window");

  // 👇 NEW: Create the dark overlay (behind the DVD canvas)
  dvdOverlay = document.createElement("div");
  dvdOverlay.style.position = "absolute";
  dvdOverlay.style.top = "0";
  dvdOverlay.style.left = "0";
  dvdOverlay.style.width = "100%";
  dvdOverlay.style.height = "100%";
  dvdOverlay.style.background = "rgba(0, 0, 0, 0.6)";   // 60% black
  dvdOverlay.style.pointerEvents = "none";
  dvdOverlay.style.zIndex = "99";                        // below the DVD canvas (z=100)
  dvdOverlay.style.opacity = "0";                        // hidden by default
  dvdOverlay.style.transition = "opacity 0.4s ease";     // smooth fade
  gameWindow.appendChild(dvdOverlay);

  // Existing DVD canvas code
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

  dvdImg = new Image();
  dvdImg.onload = () => {
    dvdImgLoaded = true;
  };
  dvdImg.src = "assets/img/dvd_logo.png";

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

  // Live preview only — no auto-submit
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

  previewCol = Number(xSlider.value) - 1;
  previewRow = rows - Number(ySlider.value);
}

function resetSliders() {
  if (!xSlider || !ySlider) return;

  xSlider.value = 5;
  ySlider.value = 5;
  previewCol = 4;
  previewRow = 5;
  xSliderTouched = false;
  ySliderTouched = false;

  updateSliderLabelSizes();
}

function windowResized() {
  const wrapper = document.querySelector(".game-play-wrapper");
  if (!wrapper) return;
  resizeCanvas(wrapper.clientWidth, wrapper.clientHeight);
  updateGridSize();
}

function updateGridSize() {
  let leftSpace = labelPadding;
  let topSpace = titlePadding;
  let rightSpace = labelPadding;
  let bottomSpace = titlePadding;

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
  drawCellLines();
  drawAxisLabels();
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

// === AXIS LABELS ===
function drawAxisLabels() {
  push();
  fill("white");
  noStroke();
  textStyle(BOLD);

  // X-axis label (bottom, below the grid)
  textAlign(CENTER, CENTER);
  textSize(18);
  drawingContext.font = "italic 500 13px franklin-gothic-atf, sans-serif";
  text(
    "X = DOES THIS ACTUALLY MATTER?",
    offsetX + gridSizeW / 2,
    offsetY + gridSizeH + 25,
  );

  // Y-axis label (left side, rotated vertically)
  push();
  translate(offsetX - 25, offsetY + gridSizeH / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  textSize(18);
  drawingContext.font = "italic 500 13px franklin-gothic-atf, sans-serif";
  text("Y = HOW ENTERTAINING IS THIS?", 0, 0);
  pop();

  pop();
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

  if (xSliderTouched) {
    styleLabel("truth-left", 11 - xVal);
    styleLabel("truth-right", xVal);
  } else {
    resetLabelStyle("truth-left");
    resetLabelStyle("truth-right");
  }

  if (ySliderTouched) {
    styleLabel("drama-left", 11 - yVal);
    styleLabel("drama-right", yVal);
  } else {
    resetLabelStyle("drama-left");
    resetLabelStyle("drama-right");
  }
}

function styleLabel(id, closeness) {
  const el = document.getElementById(id);
  if (!el) return;

  let t = map(closeness, 1, 10, 0, 1);
  t = constrain(t, 0, 1);

  // controls drama/intensity
  t = Math.pow(t, 2.5);

  // text size grows from 14px to 20px (smaller max so it stays in the box)
  const size = lerp(14, 18, t); // 👈 was 20, now 18 for safety

  el.style.fontSize = size + "px";
  // color + fontWeight intentionally removed — stays the same
}

function resetLabelStyle(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.style.fontSize = "14px";
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
  fill("#c0c0c0");
  rect(offsetX, offsetY, gridSizeW, gridSizeH);
}

function drawCellLines() {
  push();
  stroke("#191919");
  strokeWeight(1);

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
  pop();
}

function drawHover() {
  if (!xSlider || !ySlider) return;
  if (answerKeyVisible) return; // 👈 ADD — hide hover square + ❓ when showing answers

  let col = previewCol;
  let row = previewRow;
  let cx = offsetX + col * cellW;
  let cy = offsetY + row * cellH;

  // Draw the pink hover square
  noStroke();
  if (xSliderTouched && ySliderTouched) {
    fill(255, 44, 178, 180);
  } else {
    fill(255, 44, 178, 80);
  }
  rect(cx, cy, cellW, cellH);

  // 👇 CHANGED: always show an emoji — ❓ by default, story emoji once selected
  let emoji = selectedStory !== null ? guessEmojis[selectedStory] : "❓";
  let pulse = sin(millis() * 0.005) * 0.05 + 1; // 0.95 → 1.05
  let emojiSize = Math.min(cellW, cellH) * 0.7 * pulse;

  fill(0, 180);
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(emojiSize);
  drawingContext.font = `${emojiSize}px sans-serif`;
  text(emoji, cx + cellW / 2, cy + cellH / 2);
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
  const labelEl = document.getElementById("current-story-label");
  if (!labelEl) return;

  const tag = document.createElement("span");
  tag.textContent = ` — ${result}!`;
  tag.style.color = result === "HIT" ? "#ff2cb2" : "#ff2cb2";
  tag.style.marginLeft = "4px";
  tag.className = "feedback-tag";

  labelEl.querySelectorAll(".feedback-tag").forEach((t) => t.remove());
  labelEl.appendChild(tag);
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

  // 👇 NEW: fade in the overlay
  if (dvdOverlay) dvdOverlay.style.opacity = "1";
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

  // Draw the tinted image
  if (dvdImgLoaded) {
    dvdCtx.save();
    dvdCtx.drawImage(dvdImg, dvdX, dvdY, dvdW, dvdH);
    dvdCtx.globalCompositeOperation = "source-in";
    dvdCtx.fillStyle = dvdColor;
    dvdCtx.fillRect(dvdX, dvdY, dvdW, dvdH);
    dvdCtx.restore();
  } else {
    dvdCtx.fillStyle = dvdColor;
    dvdCtx.fillRect(dvdX, dvdY, dvdW, dvdH);
  }

  if (wallsHit.top && wallsHit.bottom && wallsHit.left && wallsHit.right) {
    dvdLoopCount++;
    if (dvdLoopCount >= DVD_TOTAL_LOOPS) {
      setTimeout(() => {
        dvdActive = false;
        dvdCtx.clearRect(0, 0, dvdCanvas.width, dvdCanvas.height);

        if (dvdOverlay) dvdOverlay.style.opacity = "0";   // 👈 ADD THIS LINE
      }, 500);
    } else {
      wallsHit = { top: false, bottom: false, left: false, right: false };
    }
  }
}

function drawGuesses() {
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);

  let markerSize = Math.min(cellW, cellH) * 0.8;

  for (let guess of guesses) {
    let x = offsetX + guess.col * cellW + cellW / 2;
    let y = offsetY + guess.row * cellH + cellH / 2;

    // Pick the emoji for this story (fallback to ❓ if missing)
    let emoji = guessEmojis[guess.storyId] || "❓";

    fill(0);
    noStroke();
    textSize(markerSize);
    drawingContext.font = `${markerSize}px sans-serif`;
    text(emoji, x, y);
  }
}

let answerKeyVisible = false;

function showAnswerKey() {
  if (answerKeyVisible) {
    // HIDE — clear everything
    guesses = [];
    answerKeyVisible = false;
    const labelEl = document.getElementById("current-story-label");
    if (labelEl) labelEl.innerHTML = "<em>No story selected</em>";
    return;
  }

  // SHOW
  guesses = [];
  feedbackMessages = {};
  document.querySelectorAll(".feedback-tag").forEach((tag) => tag.remove());

  for (let answer of answerKey) {
    let col = floor(answer.x) - 1;
    let row = rows - floor(answer.y);
    guesses.push({ storyId: answer.storyId, col: col, row: row });
  }

  const labelEl = document.getElementById("current-story-label");
  if (labelEl) {
    labelEl.innerHTML = "<em>🔑 Showing answer key</em>";
  }

  selectedStory = null;
  resetSliders();
  answerKeyVisible = true;
}

function setupAnswerKeyButton() {
  const link = document.getElementById("open-answer-key");
  if (link) {
    link.addEventListener("click", (e) => {
      e.preventDefault(); // prevent the # jump
      showAnswerKey();
    });
  }
}

function setupEnterKey() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSliderGuess();
    }
  });
}

const title = document.querySelector(".slide-title img");

document.querySelectorAll('input[type="range"]').forEach((slider) => {
  slider.addEventListener("input", () => {
    title.classList.remove("pulse");
  });
});

// === Toggle helpers (for [anim] elements) ===
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[anim]").forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("toggled"));
  });
});
