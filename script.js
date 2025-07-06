const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Resize canvas dynamically
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Game variables
let score = 0;
let gameOver = false;

class Player {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.rotation = 0;
  }

  draw() {
    c.save();
    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    c.translate(-this.position.x, -this.position.y);

    c.beginPath();
    c.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
    c.fillStyle = 'purple';
    c.fill();
    c.closePath();

    c.beginPath();
    c.moveTo(this.position.x + 30, this.position.y);
    c.lineTo(this.position.x - 10, this.position.y - 10);
    c.lineTo(this.position.x - 10, this.position.y + 10);
    c.closePath();
    c.strokeStyle = 'white';
    c.stroke();

    c.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  getVertices() {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    return [
      {
        x: this.position.x + cos * 30 - sin * 0,
        y: this.position.y + sin * 30 + cos * 0,
      },
      {
        x: this.position.x + cos * -10 - sin * 10,
        y: this.position.y + sin * -10 + cos * 10,
      },
      {
        x: this.position.x + cos * -10 - sin * -10,
        y: this.position.y + sin * -10 + cos * -10,
      },
    ];
  }
}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    c.closePath();
    c.fillStyle = 'white';
    c.fill();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    c.closePath();
    c.strokeStyle = 'white';
    c.stroke();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

const player1 = new Player({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
});

const keys = {
  w: { pressed: false },
  d: { pressed: false },
  a: { pressed: false },
};

const SPEED = 3;
const ROTATIONAL_SPEED = 0.05;
const FRICTION = 0.97;
const PROJECTILE_SPEED = 4;

const projectiles = [];
const asteroids = [];

const intervalId = window.setInterval(() => {
  const index = Math.floor(Math.random() * 4);
  let x, y;
  let vx = 0,
    vy = 0;
  const radius = 50 * Math.random() + 10;

  switch (index) {
    case 0:
      x = 0 - radius;
      y = Math.random() * canvas.height;
      vx = 1;
      break;
    case 1:
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
      vy = -1;
      break;
    case 2:
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
      vx = -1;
      break;
    case 3:
      x = Math.random() * canvas.width;
      y = 0 - radius;
      vy = 1;
      break;
  }

  vx *= Math.random() * 1.5 + 0.5;
  vy *= Math.random() * 1.5 + 0.5;

  asteroids.push(
    new Asteroid({
      position: { x, y },
      velocity: { x: vx, y: vy },
      radius,
    })
  );
}, 3000);

function circleCollision(circle1, circle2) {
  const dx = circle2.position.x - circle1.position.x;
  const dy = circle2.position.y - circle1.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= circle1.radius + circle2.radius;
}

function circleTriangleCollision(circle, triangle) {
  for (let i = 0; i < 3; i++) {
    const start = triangle[i];
    const end = triangle[(i + 1) % 3];
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let length = Math.sqrt(dx * dx + dy * dy);

    let dot =
      ((circle.position.x - start.x) * dx + (circle.position.y - start.y) * dy) /
      Math.pow(length, 2);

    let closestX = start.x + dot * dx;
    let closestY = start.y + dot * dy;

    if (!isPointOnLineSegment(closestX, closestY, start, end)) {
      closestX = closestX < start.x ? start.x : end.x;
      closestY = closestY < start.y ? start.y : end.y;
    }

    dx = closestX - circle.position.x;
    dy = closestY - circle.position.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= circle.radius) return true;
  }
  return false;
}

function isPointOnLineSegment(x, y, start, end) {
  return (
    x >= Math.min(start.x, end.x) &&
    x <= Math.max(start.x, end.x) &&
    y >= Math.min(start.y, end.y) &&
    y <= Math.max(start.y, end.y)
  );
}

function animate() {
  if (gameOver) return;
  const animationId = requestAnimationFrame(animate);
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);

  player1.update();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.update();

    if (
      projectile.position.x + projectile.radius < 0 ||
      projectile.position.x - projectile.radius > canvas.width ||
      projectile.position.y - projectile.radius > canvas.height ||
      projectile.position.y + projectile.radius < 0
    ) {
      projectiles.splice(i, 1);
    }
  }

  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.update();

    if (circleTriangleCollision(asteroid, player1.getVertices())) {
      gameOver = true;
      document.getElementById('gameOver').classList.remove('hidden');
      cancelAnimationFrame(animationId);
      clearInterval(intervalId);
      return;
    }

    if (
      asteroid.position.x + asteroid.radius < 0 ||
      asteroid.position.x - asteroid.radius > canvas.width ||
      asteroid.position.y - asteroid.radius > canvas.height ||
      asteroid.position.y + asteroid.radius < 0
    ) {
      asteroids.splice(i, 1);
    }

    for (let j = projectiles.length - 1; j >= 0; j--) {
      const projectile = projectiles[j];
      if (circleCollision(asteroid, projectile)) {
        asteroids.splice(i, 1);
        projectiles.splice(j, 1);
        score += 100;
        document.getElementById('score').innerText = `Score: ${score}`;
        break;
      }
    }
  }

  if (keys.w.pressed) {
    player1.velocity.x = Math.cos(player1.rotation) * SPEED;
    player1.velocity.y = Math.sin(player1.rotation) * SPEED;
  } else {
    player1.velocity.x *= FRICTION;
    player1.velocity.y *= FRICTION;
  }

  if (keys.d.pressed) player1.rotation += ROTATIONAL_SPEED;
  else if (keys.a.pressed) player1.rotation -= ROTATIONAL_SPEED;
}

animate();

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true;
      break;
    case 'KeyA':
      keys.a.pressed = true;
      break;
    case 'KeyD':
      keys.d.pressed = true;
      break;
    case 'Space':
      if (gameOver) return;
      projectiles.push(
        new Projectile({
          position: {
            x: player1.position.x + Math.cos(player1.rotation) * 30,
            y: player1.position.y + Math.sin(player1.rotation) * 30,
          },
          velocity: {
            x: Math.cos(player1.rotation) * PROJECTILE_SPEED,
            y: Math.sin(player1.rotation) * PROJECTILE_SPEED,
          },
        })
      );
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false;
      break;
    case 'KeyA':
      keys.a.pressed = false;
      break;
    case 'KeyD':
      keys.d.pressed = false;
      break;
  }
});

function restartGame() {
  window.location.reload();
}
