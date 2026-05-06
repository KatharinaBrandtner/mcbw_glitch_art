let maskLayer;
let content;
let glitchLayer;
let rects = [];
let codeLines = [];

let pg, capture;
let cvFlag = false;
let trackedPoints = [];
let prevTrackedPoints = [];

// ✅ NEU: nur diese Punkte dürfen glitchen
let movingPoints = [];

let isMoving = false;
let movementFrames = 0;

// ✅ GEÄNDERT: empfindlicher für echte kleine Bewegungen
let movementThreshold = 5;

// ✅ NEU: maximale Distanz, damit Punkte zwischen Frames richtig gematcht werden
let matchDistance = 60;

// ✅ NEU: kleinere rote Punkte werden erkannt
let minRedArea = 8;

let glitchRadius = 150;
let t = 0;

async function setup() {
  createCanvas(windowWidth, windowHeight);
  
  maskLayer = createGraphics(width, height);
  content = createGraphics(width, height);
  glitchLayer = createGraphics(width, height);
  pg = createGraphics(width, height);
    
  content.colorMode(HSB, 360, 100, 100);
  
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();
  
  for (let i = 0; i < 600; i++) {
    rects.push({
      x: random(width), 
      y: random(height),
      vx: random(-0.5, 0.5),
      vy: random(-0.5, 0.5),
      hue: random(60, 300),
      size: random(5, 20)
    });
  }
  
  generateCode();
  loadOpenCV();
}

function getGlitchColor() {
  let colors = [
    { r: 0, g: 255, b: 255 },
    { r: 255, g: 0, b: 255 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 0 },
    { r: 128, g: 0, b: 255 }
  ];
  return random(colors);
}

function generateCode() {
  let base = [
    "function flow() {",
    "for (let i = 0; i < n; i++) {",
    "update(i); render(i);",
    "}",
    "}",
    "class Agent {",
    "constructor(x, y) {",
    "this.x = x;",
    "this.y = y;",
    "}",
    "update() {",
    "this.x += random(-1, 1);",
    "this.y += random(-1, 1);",
    "}",
    "}"
  ];

  let fullCode = "";
  for (let i = 0; i < 60; i++) {
    fullCode += random(base) + " ";
  }
  
  codeLines = fullCode.split(" ");
}

// ===============================
// TEXT (DEFAULT MODE)
// ===============================

function drawMask() {
  maskLayer.clear();
  maskLayer.textSize(25);
  maskLayer.textStyle(BOLD);

  let wordIndex = 0;
  let xOffset = 2;
  let yOffset = 40;
  let lineHeight = 30;

  for (let y = 0; y < maskLayer.height; y += lineHeight) {
    xOffset = 2;

    while (xOffset < maskLayer.width) {
      let word = codeLines[wordIndex];
      let wordWidth = maskLayer.textWidth(word);

      if (xOffset + wordWidth > maskLayer.width) break;

      let cx = xOffset + wordWidth / 2;
      let cy = yOffset;

    let wobbleX = map(noise(cx * 0.005, cy * 0.005, t), 0, 1, -2.5, 2.5);
  let wobbleY = map(noise(cx * 0.005 + 100, cy * 0.005, t), 0, 1, -2.5, 2.5);

      maskLayer.fill(255);
      maskLayer.text(word, xOffset + wobbleX, yOffset + wobbleY);

      xOffset += wordWidth + 2;
      wordIndex++;

      if (wordIndex >= codeLines.length) wordIndex = 0;
    }

    yOffset += lineHeight;
  }
}

// ===============================
// BACKGROUND (DEFAULT MODE)
// ===============================

function drawRects() {
  content.clear();

  rects.forEach((r) => {
    content.noStroke();
    content.fill(r.hue, 100, 100, 0.6);

    content.rect(r.x, r.y, r.size, r.size);

    r.x += r.vx;
    r.y += r.vy;

    if (r.x < 0) r.x = width;
    if (r.x > width) r.x = 0;
    if (r.y < 0) r.y = height;
    if (r.y > height) r.y = 0;
  });
}

// ===============================
// GLITCH NUR FÜR BEWEGTE PUNKTE
// ===============================

function drawGlitches() {
  glitchLayer.clear();

  // ✅ GEÄNDERT: nur glitchen, wenn es wirklich bewegte Punkte gibt
  if (!isMoving || movingPoints.length === 0) return;

  // ✅ GEÄNDERT: nur movingPoints statt alle trackedPoints
  for (let p of movingPoints) {
    for (let i = 0; i < 25; i++) {
      let angle = random(TWO_PI);
      let r = random(0, glitchRadius * 0.3);

      let x = p.x + cos(angle) * r;
      let y = p.y + sin(angle) * r;

      let c = getGlitchColor();

      glitchLayer.noStroke();
      glitchLayer.fill(c.r, c.g, c.b, random(150, 255));

      glitchLayer.rect(
        x + random(-10, 10),
        y + random(-5, 5),
        random(10, 80),
        random(2, 20)
      );
    }
  }
}

// ===============================
// ROTPUNKTE ERKENNEN
// ===============================

function detectRedPoints() {
  if (!cvFlag) return [];
  
  let found = [];

  try {
    pg.clear();
    pg.push();
    pg.translate(width, 0);
    pg.scale(-1, 1);
    pg.image(capture, 0, 0, width, height);
    pg.pop();
    
    let src = cv.imread(pg.canvas);
    let hsv = new cv.Mat();
    let mask = new cv.Mat();

    // ✅ NEU: stabilisiert kleine Punkte
    cv.GaussianBlur(src, src, new cv.Size(5, 5), 0);
    cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
    
    let low1 = cv.matFromArray(1, 3, cv.CV_8U, [0, 80, 80]);
    let high1 = cv.matFromArray(1, 3, cv.CV_8U, [18, 255, 255]);
    
    let low2 = cv.matFromArray(1, 3, cv.CV_8U, [155, 80, 80]);
    let high2 = cv.matFromArray(1, 3, cv.CV_8U, [180, 255, 255]);
    
    let mask1 = new cv.Mat();
    let mask2 = new cv.Mat();
    
    cv.inRange(hsv, low1, high1, mask1);
    cv.inRange(hsv, low2, high2, mask2);
    cv.add(mask1, mask2, mask);

    // ✅ NEU: Maske reinigen
    let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);
    cv.dilate(mask, mask, kernel);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    for (let i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let area = cv.contourArea(cnt);
      
      if (area > minRedArea && area < 50000) {
        let M = cv.moments(cnt);
        if (M.m00 !== 0) {
          let cx = M.m10 / M.m00;
          let cy = M.m01 / M.m00;

          found.push({
            x: cx,
            y: cy,
            area: area
          });
        }
      }
      cnt.delete();
    }

    // ✅ NEU: größte zuerst
    found.sort((a, b) => b.area - a.area);
    found = found.slice(0, 12);

    src.delete();
    hsv.delete();
    mask.delete();
    mask1.delete();
    mask2.delete();
    low1.delete();
    high1.delete();
    low2.delete();
    high2.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();
    
  } catch (e) {
    console.log("OpenCV Fehler:", e);
  }
  
  return found;
}

// ===============================
// ✅ NEU: NÄCHSTEN PASSENDEN ALTEN PUNKT FINDEN
// ===============================

function findClosestPrevPoint(currentPoint, prevPoints, usedPrev) {
  let bestIndex = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < prevPoints.length; i++) {
    if (usedPrev[i]) continue;

    let d = dist(
      currentPoint.x,
      currentPoint.y,
      prevPoints[i].x,
      prevPoints[i].y
    );

    if (d < bestDistance && d < matchDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }

  return {
    index: bestIndex,
    distance: bestDistance
  };
}

// ===============================
// ✅ GEÄNDERT: NUR DANN GLITCHEN,
// WENN DERSELBE PUNKT SICH BEWEGT HAT
// ===============================

function checkMovement() {
  movingPoints = [];
  isMoving = false;

  if (trackedPoints.length === 0 || prevTrackedPoints.length === 0) {
    return;
  }

  let usedPrev = new Array(prevTrackedPoints.length).fill(false);

  for (let current of trackedPoints) {
    let match = findClosestPrevPoint(current, prevTrackedPoints, usedPrev);

    if (match.index !== -1) {
      usedPrev[match.index] = true;

      // ✅ GEÄNDERT: nur echte Bewegung zählt
      if (match.distance > movementThreshold) {
        movingPoints.push({
          x: current.x,
          y: current.y,
          d: match.distance
        });
      }
    }
  }

  // ✅ GEÄNDERT: nur wenn wirklich ein Punkt bewegt wurde
  isMoving = movingPoints.length > 0;
}

// ===============================
// DRAW
// ===============================

function draw() {
  background(0);

  t += 0.003;

  if (cvFlag) {
    prevTrackedPoints = trackedPoints.slice();
    trackedPoints = detectRedPoints();
    checkMovement();
  }

  // OPTIONAL DEBUG:
  /*
  fill(255, 0, 0);
  noStroke();
  for (let p of trackedPoints) {
    circle(p.x, p.y, 8);
  }

  fill(0, 255, 0);
  for (let p of movingPoints) {
    circle(p.x, p.y, 14);
  }
  */

  drawRects();
  drawMask();
  drawGlitches();

  let contentImg = content.get();
  contentImg.mask(maskLayer.get());

  image(contentImg, 0, 0);
  image(glitchLayer, 0, 0);
}

// ===============================
// OPENCV
// ===============================

function loadOpenCV() {
  let script = document.createElement("script");
  script.async = true;
  script.src = "https://docs.opencv.org/4.7.0/opencv.js";
  document.head.appendChild(script);
  
  setTimeout(() => {
    if (typeof cv !== 'undefined') {
      cvFlag = true;
    }
  }, 3000);
}

// ===============================
// RESIZE
// ===============================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  maskLayer.resizeCanvas(width, height);
  content.resizeCanvas(width, height);
  glitchLayer.resizeCanvas(width, height);
  pg.resizeCanvas(width, height);
  capture.size(width, height);
}