class Candy {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.alpha = 255;
    this.size = 25;
    this.type = floor(random(2));

    let palette = [
      color(255, 140, 0),
      color(160, 32, 240),
      color(0, 255, 80),
      color(255),
      color(255, 60, 60)
    ];
    this.baseColor = random(palette);
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.02, 0.02);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    this.alpha -= 2;
  }

  finished() {
    return (
      this.alpha <= 0 ||
      this.x < -60 ||
      this.x > width + 60 ||
      this.y < -60 ||
      this.y > height + 60
    );
  }

  show() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    fill(
      red(this.baseColor),
      green(this.baseColor),
      blue(this.baseColor),
      this.alpha
    );
    noStroke();

    if (this.type === 0) this.drawWrappedCandy();
    else this.drawLollipop();

    pop();
  }

  drawWrappedCandy() {
    let s = this.size;
    triangle(-s * 0.8, 0, -s * 1.1, -s * 0.3, -s * 1.1, s * 0.3);
    triangle(s * 0.8, 0, s * 1.1, -s * 0.3, s * 1.1, s * 0.3);
    ellipse(0, 0, s, s * 0.7);
  }

  drawLollipop() {
    let s = this.size * 0.8;
    stroke(255, this.alpha * 0.6);
    strokeWeight(2);
    line(0, s * 0.8, 0, s * 2);
    noStroke();
    ellipse(0, 0, s);
    fill(255, 80);
    arc(0, 0, s, s, 0, PI / 2);
  }
}
