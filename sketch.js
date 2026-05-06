let maskLayer;
let content;
let glitchLayer;

let rects = [];
let codeLines = [];

let tracker;
let isMoving = false;
let movingPoints = [];
let trackedPoints = [];
let prevTrackedPoints = [];
let debugMode = false;

let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  maskLayer = createGraphics(width, height);
  content = createGraphics(width, height);
  glitchLayer = createGraphics(width, height);

  content.colorMode(HSB, 360, 100, 100);

  initRects();

  codeLines = generateCodeLines();

  // Tracker encapsulates webcam capture + OpenCV movement detection.
  tracker = new Tracker();
  tracker.loadOpenCV();
}

function draw() {
  background(0);

  // Global time step for noise-based wobble in the text mask.
  t += CONFIG.wobbleSpeed;

  // Pull the latest tracking state once per frame.
  tracker.update();
  isMoving = tracker.isMoving;
  movingPoints = tracker.movingPoints;
  trackedPoints = tracker.trackedPoints;
  prevTrackedPoints = tracker.prevTrackedPoints;

  drawRects();
  drawMask();
  drawGlitches();

  let contentImg = content.get();

  contentImg.mask(maskLayer.get());

  image(contentImg, 0, 0);
  image(glitchLayer, 0, 0);

  if (debugMode) {
    drawDebugOverlay();
  }
}

function drawDebugOverlay() {
  push();

  // Red circles: all currently detected red points.
  noStroke();
  fill(255, 70, 70, 220);
  for (const p of trackedPoints) {
    circle(p.x, p.y, 8);
  }

  // Green circles: points that passed movement threshold.
  stroke(20, 255, 120);
  strokeWeight(2);
  noFill();
  for (const p of movingPoints) {
    circle(p.x, p.y, 18);
  }

  noStroke();
  fill(0, 170);
  rect(12, 12, 320, 74, 8);

  fill(255);
  textSize(13);
  textAlign(LEFT, TOP);
  text(
    "DEBUG [D]: ON\n" +
      "tracked: " + trackedPoints.length +
      " | moving: " + movingPoints.length + "\n" +
      "cv ready: " + (tracker && tracker.cvReady ? "yes" : "no"),
    22,
    20
  );

  pop();
}

function keyPressed() {
  if (key === "d" || key === "D") {
    debugMode = !debugMode;
    console.log("Debug mode:", debugMode ? "ON" : "OFF");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  maskLayer.resizeCanvas(width, height);
  content.resizeCanvas(width, height);
  glitchLayer.resizeCanvas(width, height);

  if (tracker) {
    tracker.resize();
  }
}