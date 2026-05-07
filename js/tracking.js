class Tracker {
  constructor() {
    this.capture = createCapture(VIDEO);
    this.capture.size(windowWidth, windowHeight);
    this.capture.hide();

    this.pg = createGraphics(windowWidth, windowHeight);

    this.cvReady = false;

    this.trackedPoints = [];
    this.prevTrackedPoints = [];
    this.movingPoints = [];

    this.isMoving = false;
  }

  loadOpenCV() {
    const script = document.createElement("script");

    script.async = true;
    script.src = "https://docs.opencv.org/4.7.0/opencv.js";
// document.head.appendChild(script);

//     setTimeout(() => {
//       if (typeof cv !== "undefined") {
//         this.cvReady = true;
//         console.log("OpenCV loaded");
//       }
//     }, 3000);
    script.onload = () => {
      // cv can appear slightly after script onload depending on init timing.
      const waitForCv = setInterval(() => {
        if (typeof cv !== "undefined") {
          this.cvReady = true;
          clearInterval(waitForCv);
          console.log("OpenCV loaded");
        }
      }, 150);

      setTimeout(() => clearInterval(waitForCv), 5000);
    };

    script.onerror = () => {
      console.log("OpenCV failed to load");
    };

    document.head.appendChild(script);
  }

  update() {
    if (!this.cvReady) return;

    this.prevTrackedPoints = [...this.trackedPoints];

    this.trackedPoints = this.detectRedPoints();

    this.checkMovement();
  }

  detectRedPoints() {
    const found = [];

    try {
      this.pg.clear();

      this.pg.push();
      this.pg.translate(width, 0);
      this.pg.scale(-1, 1);

      this.pg.image(this.capture, 0, 0, width, height);

      this.pg.pop();

      let src = cv.imread(this.pg.canvas);

      let hsv = new cv.Mat();
      let mask = new cv.Mat();

      cv.GaussianBlur(src, src, new cv.Size(5, 5), 0);

      cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);

      const low1 = cv.matFromArray(
        1,
        3,
        cv.CV_8U,
        [0, 50, 50]
      );

      const high1 = cv.matFromArray(
        1,
        3,
        cv.CV_8U,
        [25, 255, 255]
      );

      const low2 = cv.matFromArray(
        1,
        3,
        cv.CV_8U,
        [145, 50, 50]
      );

      const high2 = cv.matFromArray(
        1,
        3,
        cv.CV_8U,
        [180, 255, 255]
      );

      let mask1 = new cv.Mat();
      let mask2 = new cv.Mat();

      cv.inRange(hsv, low1, high1, mask1);
      cv.inRange(hsv, low2, high2, mask2);

      cv.add(mask1, mask2, mask);

      const kernel = cv.Mat.ones(3, 3, cv.CV_8U);

      cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
      cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);

      cv.dilate(mask, mask, kernel);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();

      cv.findContours(
        mask,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);

        const area = cv.contourArea(cnt);

        if (
          area > CONFIG.minRedArea &&
          area < 50000
        ) {
          // Tune minRedArea in config.js when tiny red points are missed.
          const M = cv.moments(cnt);

          if (M.m00 !== 0) {
            const cx = M.m10 / M.m00;
            const cy = M.m01 / M.m00;

            found.push({
              x: cx,
              y: cy,
              area
            });
          }
        }

        cnt.delete();
      }

      found.sort((a, b) => b.area - a.area);

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

    } catch (error) {
      console.log("Tracking error:", error);
    }

    return found.slice(0, 12);
  }

  findClosestPrevPoint(currentPoint, usedPrev) {
    let bestIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < this.prevTrackedPoints.length; i++) {
      if (usedPrev[i]) continue;

      const prev = this.prevTrackedPoints[i];

      const d = dist(
        currentPoint.x,
        currentPoint.y,
        prev.x,
        prev.y
      );

      if (
        d < bestDistance &&
        d < CONFIG.matchDistance
      ) {
        // matchDistance controls how far a point may jump between frames.
        bestDistance = d;
        bestIndex = i;
      }
    }

    return {
      index: bestIndex,
      distance: bestDistance
    };
  }

  checkMovement() {
    this.movingPoints = [];
    this.isMoving = false;

    if (
      this.trackedPoints.length === 0 ||
      this.prevTrackedPoints.length === 0
    ) {
      return;
    }

    const usedPrev = new Array(
      this.prevTrackedPoints.length
    ).fill(false);

    for (const current of this.trackedPoints) {
      const match = this.findClosestPrevPoint(
        current,
        usedPrev
      );

      if (match.index !== -1) {
        usedPrev[match.index] = true;

        if (
          match.distance >
          CONFIG.movementThreshold
        ) {
          // movementThreshold controls trigger sensitivity for glitch bursts.
          this.movingPoints.push({
            x: current.x,
            y: current.y,
            distance: match.distance
          });
        }
      }
    }

    this.isMoving = this.movingPoints.length > 0;
  }

  resize() {
    this.capture.size(windowWidth, windowHeight);
    this.pg.resizeCanvas(windowWidth, windowHeight);
  }
}