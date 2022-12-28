var system;
var particleColor;
var particleC;
var img;
var emitter;
var modo;

function preload() {

  img = loadImage("data/bola.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();
  system = new ParticleSystem(createVector(width / 2, 50));
  modo = int(random(1, 5));
 
}

function draw() {
  //background(51);
  emitter = createVector(random(width), random(height));
  fill(0, 2);
  rect(0, 0, width, height);

  if (frameCount % 20 == 0) {
    system.addParticle();
  }
  system.run();

  particleColor = color(random(200, 250), random(70, 100), random(70, 100), random(80, 90));

}

// A simple Particle class
var Particle = function(position, col) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-5, 5), random(-2, 2));
  this.nvelocity = createVector(0, 0);
  this.position = position.copy();
  this.lifespan = 255.0;
  this.col = color(random(360), 100, 100);;

};

Particle.prototype.run = function() {
  this.update();
  this.display();
};

// Method to update position
Particle.prototype.update = function() {
  if (modo <= 2) {
    //para que el giro sea mas sutil y no en linea recta, modificar la acc en vez de la vel
    if (frameCount % 10 == 0) this.acceleration.y = random(-1, 1);
    if (frameCount % 10 == 0) this.acceleration.x = random(-1, 1);
  }
  if (modo == 2) {
    this.velocity.add(this.acceleration.mult(0.8));
  }
  if (modo == 3) {
    //para que el giro sea mas sutil y no en linea recta, modificar la acc en vez de la vel
    if (frameCount % 30 == 0) this.velocity.y = random(-2, 2);
    if (frameCount % 30 == 0) this.velocity.x = random(-2, 2);
  }
  if (modo == 4) {

    var moneda = random(2)
    if (moneda < 1) {
      if (frameCount % 30 == 0) this.velocity.y = random(-10, 10);
      if (frameCount % 30 == 0) this.velocity.x = 0; //random(-10, 10);
    } else {
      if (frameCount % 30 == 0) this.velocity.y = 0; //random(-10, 10);
      if (frameCount % 30 == 0) this.velocity.x = random(-10, 10);
    }
  }
  this.position.add(this.velocity);
  this.lifespan -= 1;
};

// Method to display
Particle.prototype.display = function() {
  //stroke(200, this.lifespan);
  //strokeWeight(2);
  tint(this.col, this.lifespan);
  //tint(particleColor, random(50, 100), this.lifespan);

  //--- MODO COLOR 1-----
  /*
  tint(200, 100, 100, this.lifespan);
  if (this.lifespan < 200) tint(100, 100, 100, this.lifespan);
  if (this.lifespan < 100) tint(20, 100, 100, this.lifespan);
  */

  //ellipse(this.position.x, this.position.y, this.lifespan*0.1, this.lifespan*0.1);

  image(img, this.position.x, this.position.y, this.lifespan * 0.2, this.lifespan * 0.2);
};

// Is the particle still useful?
Particle.prototype.isDead = function() {
  if (this.lifespan < 0) {
    return true;
  } else {
    return false;
  }
};

var ParticleSystem = function(position, pC) {
  this.origin = createVector(width / 2, height / 2);
  this.particleC = pC;
  this.particles = [];
};

ParticleSystem.prototype.addParticle = function() {
  this.particles.push(new Particle(emitter, particleColor));
};

ParticleSystem.prototype.run = function() {
  for (var i = this.particles.length - 1; i >= 0; i--) {
    var p = this.particles[i];
    p.run();
    if (p.isDead()) {
      this.particles.splice(i, 1);
    }
  }
};

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}