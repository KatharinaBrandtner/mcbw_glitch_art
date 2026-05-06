function initRects() {
  for (let i = 0; i < CONFIG.rectCount; i++) {
    rects.push({
      x: random(width),
      y: random(height),
      vx: random(-0.5, 0.5),
      vy: random(-0.5, 0.5),
      hue: random(60, 300),
      size: random(5, 20)
    });
  }
}

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