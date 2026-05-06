function generateCodeLines() {
  const base = [
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

  return fullCode.split(" ");
}