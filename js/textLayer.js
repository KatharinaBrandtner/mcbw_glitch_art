

function drawMask() {
  maskLayer.clear();

  maskLayer.textSize(CONFIG.textSize);
  maskLayer.textStyle(BOLD);

  let wordIndex = 0;

  // Horizontal padding for each text line inside the mask.
  let xOffset = 2;
  let yOffset = CONFIG.textSize + 15;

  let lineHeight = CONFIG.lineHeight;

  for (let y = 0; y < maskLayer.height; y += lineHeight) {
    xOffset = 2;

    while (xOffset < maskLayer.width) {
      let word = codeLines[wordIndex];

      let wordWidth = maskLayer.textWidth(word);

      if (xOffset + wordWidth > maskLayer.width) {
        break;
      }

      let cx = xOffset + wordWidth / 2;
      let cy = yOffset;

      let wobbleX = map(
        noise(cx * 0.005, cy * 0.005, t),
        0,
        1,
        -CONFIG.wobbleAmount,
        CONFIG.wobbleAmount
      );

      let wobbleY = map(
        noise(cx * 0.005 + 100, cy * 0.005, t),
        0,
        1,
        -CONFIG.wobbleAmount,
        CONFIG.wobbleAmount
      );

      // For rougher/finer wobble texture, adjust the 0.005 noise scale.

      maskLayer.fill(255);

      maskLayer.text(
        word,
        xOffset + wobbleX,
        yOffset + wobbleY
      );

      xOffset += wordWidth + 2;

      wordIndex++;

      if (wordIndex >= codeLines.length) {
        wordIndex = 0;
      }
    }

    yOffset += lineHeight;
  }
}