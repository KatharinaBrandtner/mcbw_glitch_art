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

function drawGlitches() {
  glitchLayer.clear();

  if (!isMoving || movingPoints.length === 0) {
    return;
  }

  // Increase/decrease this value for denser/sparser glitch bursts.
  const burstsPerPoint = 25;

  for (let p of movingPoints) {
    for (let i = 0; i < burstsPerPoint; i++) {
      let angle = random(TWO_PI);

      // Spread is tied to CONFIG.glitchRadius for quick global tuning.
      let r = random(0, CONFIG.glitchRadius * 0.3);

      let x = p.x + cos(angle) * r;
      let y = p.y + sin(angle) * r;

      let c = getGlitchColor();

      glitchLayer.noStroke();

      glitchLayer.fill(
        c.r,
        c.g,
        c.b,
        random(150, 255)
      );

      glitchLayer.rect(
        x + random(-10, 10),
        y + random(-5, 5),
        random(10, 80),
        random(2, 20)
      );
    }
  }
}