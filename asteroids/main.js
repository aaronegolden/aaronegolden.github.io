const canvas = document.getElementById('gameCanvas');
const hud = document.getElementById('hud');
const ctx = canvas.getContext('2d');

const LASER_SOUND = new Audio('laser.wav');
const EXPLOSION_SOUND = new Audio('explosion.wav');

const PARTICLES_PER_EXPLOSION = 20;

const MAX_BULLETS = 10;
const BULLET_LENGTH = 3;
const FIRE_COOLDOWN = 10;

const MAX_ASTEROIDS = 10;
const ASTEROID_SCORE = 10;
const SMALL_BONUS = 5;

const PLAYER_SPAWN_COOLDOWN = 200;
const PLAYER_INVULNERABLE_COOLDOWN = 50;
const PLAYER_INVULNERABLE_BLINK_COOLDOWN = 2;

const NEW_WAVE_COOLDOWN = 200;

let score = 0;
let life_bonus = 0;
let lives = 3;
let wave = 1;
let player_spawn_cooldown = 0;
let player_invulnerable_cooldown = 0;
let player_invulnerable_blink = false;
let player_invulnerable_blink_cooldown = 0;
let game_over = false;
let new_wave_cooldown = 0;

let highScores = JSON.parse(localStorage.getItem('highScores')) || []; 

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 10,
  angle: 0,
  vx: 0,
  vy: 0,
  acceleration: 0,
  rotation: 0,
  firing: false,
  fireCooldown: 0,
  dead: false,
};

// Asteroids
let asteroids = [];
for (let i = 0; i < MAX_ASTEROIDS; i++) {
  asteroids.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 20 + 10,
    angle: Math.random() * Math.PI * 2,
    speed: Math.random() * 2 + 1,
    numPoints: Math.floor(Math.random() * 3) + 5,
    dead: false,
  });
}

let particles = [];

let bullets = [];
for (let i = 0; i < MAX_BULLETS; i++) {
    bullets.push({
        x: -100,
        y: -100,
        vx: 0,
        vy: 0,
        ready: true,
    });
}

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update player
  player.angle += player.rotation;
  player.vx += -Math.sin(player.angle) * player.acceleration;
  player.vy += Math.cos(player.angle) * player.acceleration;
  let mod = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (mod > 5) {
    player.vx *= 5 / mod;
    player.vy *= 5 / mod;
  }
  player.x += player.vx;
  player.y += player.vy;

  if (player.dead == false && player.firing && player.fireCooldown == 0) {
    for (let i = 0; i < MAX_BULLETS; i++) {
        let nextBullet = bullets[i];
        if (nextBullet.ready) {
            nextBullet.x = player.x;
            nextBullet.y = player.y;
            nextBullet.vx = -Math.sin(player.angle) * 10;
            nextBullet.vy = Math.cos(player.angle) * 10;
            nextBullet.ready = false;
            PlaySound(LASER_SOUND);
            player.fireCooldown = FIRE_COOLDOWN;
            break;
        }
    }
  }
  if (player.fireCooldown > 0) {
    player.fireCooldown--;
  }

  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    drawBullet(bullet);

    if (bullet.x < -20 || bullet.y < -20 || bullet.x > canvas.width + 20 || bullet.y > canvas.height + 20) {
        bullet.ready = true;
        bullet.vx = 0;
        bullet.vy = 0;
    }
  }

  // Wrap player around screen
  if (player.x < 0) player.x += canvas.width;
  if (player.x > canvas.width) player.x -= canvas.width;
  if (player.y < 0) player.y += canvas.height;
  if (player.y > canvas.height) player.y -= canvas.height;

  // Update and draw asteroids
  for (let i = 0; i < asteroids.length; i++) {
    const asteroid = asteroids[i];
    asteroid.x += Math.cos(asteroid.angle) * asteroid.speed;
    asteroid.y += Math.sin(asteroid.angle) * asteroid.speed;

    // Wrap asteroids around screen
    if (asteroid.x < 0) asteroid.x += canvas.width;
    if (asteroid.x > canvas.width) asteroid.x -= canvas.width;
    if (asteroid.y < 0) asteroid.y += canvas.height;
    if (asteroid.y > canvas.height) asteroid.y -= canvas.height;

    drawAsteroid(asteroid);
  }

  for (let i = 0; i < asteroids.length; i++) {
    const asteroid = asteroids[i];
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        if (bullet.ready == false) {
            let dx = bullet.x - asteroid.x;
            let dy = bullet.y - asteroid.y;
            let r = Math.sqrt(dx * dx + dy * dy);
            if (r <= asteroid.radius && asteroid.dead == false) {
                bullet.ready = true;
                asteroid.dead = true;
                PlaySound(EXPLOSION_SOUND);

                smallBonus = 0;
                if (asteroid.radius <= 10) {
                  smallBonus = SMALL_BONUS;
                }
                AddLifeBonus(1);
                AddScore(ASTEROID_SCORE + smallBonus + life_bonus);

                for (let i = 0; i < PARTICLES_PER_EXPLOSION; i++) {
                  particles.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    angle: Math.random() * Math.PI * 2,
                    speed: Math.random() * 5,
                    life: 50,
                  });
                }

                if (asteroid.radius > 10) {
                  asteroids.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    radius: 10,
                    angle: asteroid.angle - Math.random() * Math.PI / 2.0,
                    speed: asteroid.speed,
                    numPoints: Math.floor(Math.random() * 3) + 5,
                    dead: false,
                  });
                  asteroids.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    radius: 10,
                    angle: asteroid.angle + Math.random() * Math.PI / 2.0,
                    speed: asteroid.speed,
                    numPoints: Math.floor(Math.random() * 3) + 5,
                    dead: false,
                  });
                }
            }
        }
    }    
  }
  asteroids = asteroids.filter(function(a) {
    return a.dead == false;
  });
  if (asteroids.length == 0 && new_wave_cooldown == 0) {
    wave++;
    UpdateHUD();
    new_wave_cooldown = NEW_WAVE_COOLDOWN;
  }

  if (player.dead == true && player_spawn_cooldown > 0) {
    player_spawn_cooldown--;
    if (player_spawn_cooldown == 0) {
      player_invulnerable_cooldown = PLAYER_INVULNERABLE_COOLDOWN;
      player_invulnerable_blink_cooldown = PLAYER_INVULNERABLE_BLINK_COOLDOWN;
      player_invulnerable_blink = true;
      player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        angle: 0,
        vx: 0,
        vy: 0,
        acceleration: 0,
        rotation: 0,
        firing: false,
        fireCooldown: 0,
        dead: false,    
      }
    }
  }

  if (player_invulnerable_cooldown > 0) {
    player_invulnerable_cooldown--;
  }
  if (player_invulnerable_blink_cooldown > 0) {
    player_invulnerable_blink_cooldown--;
    if (player_invulnerable_blink_cooldown == 0) {
      player_invulnerable_blink = !player_invulnerable_blink;
      player_invulnerable_blink_cooldown = PLAYER_INVULNERABLE_BLINK_COOLDOWN;
    }
  }

  if (player.dead == false && player_invulnerable_cooldown == 0) {
    for (let i = 0; i < asteroids.length; i++) {
      a = asteroids[i];
      dx = player.x - a.x;
      dy = player.y - a.y;
      if (dx * dx + dy * dy < a.radius * a.radius) {
        player.dead = true;
        lives--;
        if (lives == 0) {
          GameOver();
        }
        SetLifeBonus(0);
        player_spawn_cooldown = PLAYER_SPAWN_COOLDOWN;
        PlaySound(EXPLOSION_SOUND);
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: player.x,
            y: player.y,
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 5,
            life: 50,
          });
        }
      }
    }
  }

  for (let i = 0; i < particles.length; i++) {
    p = particles[i];
    p.x += p.speed * Math.cos(p.angle);
    p.y += p.speed * Math.sin(p.angle);
    p.life--;
  }
  drawParticles();
  particles = particles.filter(function(p) {
    return p.life > 0;
  });

  if (player_invulnerable_cooldown == 0 || player_invulnerable_blink) {
    drawPlayer();
  }

  if (new_wave_cooldown > 0) {
    new_wave_cooldown--;
    if (new_wave_cooldown == 0) {
      for (let i = 0; i < MAX_ASTEROIDS; i++) {
        asteroids.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 20 + 10,
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 2 + 1,
          numPoints: Math.floor(Math.random() * 3) + 5,
          dead: false,
        });
      }
    }
  }

    if (game_over == false) {
    requestAnimationFrame(gameLoop);
  }
}

function drawPlayer() {
  if (player.dead) {
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.lineTo(10, -10);
  ctx.lineTo(0, 20);
  ctx.closePath();
  ctx.fill();

  if (player.acceleration > 0) {
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(0, -18);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// Draw asteroid function
function drawAsteroid(asteroid) {
    if (asteroid.dead) {
        return;
    }
  ctx.fillStyle = 'gray';
  ctx.beginPath();
  const angleStep = Math.PI * 2 / asteroid.numPoints;
  let angle = 0;
  ctx.moveTo(asteroid.x + asteroid.radius * Math.cos(angle), 
             asteroid.y + asteroid.radius * Math.sin(angle));
  for (let i = 1; i <= asteroid.numPoints; i++) {
    angle += angleStep;
    ctx.lineTo(asteroid.x + asteroid.radius * Math.cos(angle), 
               asteroid.y + asteroid.radius * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
}

function drawParticles() {
  ctx.fillStyle = 'white';
  for (let i = 0; i < particles.length; i++) {
    p = particles[i];
    ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);
  }
}

// Draw bulet function
function drawBullet(bullet) {
    if (bullet.ready) {
      return;
    }
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x + bullet.vx * BULLET_LENGTH, bullet.y + bullet.vy * BULLET_LENGTH);
    ctx.closePath();
    ctx.stroke();
  }
  
  function PlaySound(sound) {
    sound.currentTime = 0;
    sound.play();
  }
  
  function AddScore(s) {
    score += s;
    UpdateHUD();
  }

  function AddLifeBonus(b) {
    life_bonus += b;
    UpdateHUD();
  }

  function SetLifeBonus(b) {
    life_bonus = b;
    UpdateHUD();
  }

function UpdateHUD() {
  hud.innerText = `SCORE: ${score}\nBONUS: ${life_bonus}\nLIVES: ${lives}\nWAVES: ${wave}`;
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      player.rotation = -0.1; 
    } else if (event.key === 'ArrowRight') {
      player.rotation = 0.1;
    } else if (event.key === 'ArrowUp') {
      player.acceleration += 1; 
    } else if (event.key === ' ') {
      player.firing = true;
    }
  });
  
window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      player.rotation = 0; 
    } else if (event.key === 'ArrowUp') {
      player.acceleration = 0; 
    } else if (event.key === ' ') {
      player.firing = false;
    }
  });

  function showHighScores() {    
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = '';

    // Update and display high scores
    highScores.forEach((entry, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
      scoreList.appendChild(listItem);
    });

    // Show the high score table
    document.getElementById('highScoreTable').style.display = 'block';
    document.getElementById('playerNameInput').focus();
  }

  function saveScore() {
    const playerName = document.getElementById('playerNameInput').value;

    highScores.push({ name: playerName, score: score }); 
    highScores.sort((a, b) => b.score - a.score); 
    highScores = highScores.slice(0, 10); 

    // Sort high scores in descending order
    highScores.sort((a, b) => b.score - a.score);
    localStorage.setItem('highScores', JSON.stringify(highScores));

    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = '';

    highScores.forEach((entry, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
      scoreList.appendChild(listItem);
    });
  }

  function handleKeyPress(event) {
    if (event.key === "Enter") {
      saveScore();
      document.getElementById('enterNameHeader').hidden = true;
      document.getElementById('playerNameInput').hidden = true;
    }
  }

  function GameOver() {
    game_over = true;

    document.getElementById('finalScore').innerText = `Score: ${score}`;
    highScore = false;
    if (highScores.length < 10) {
      highScore = true;
    } else {
      for (let i = 0; i < highScores.length; i++) {
        if (score > highScores[i].score) {
          highScore = true;
          break;
        }
      }
    }
    document.getElementById('enterNameHeader').hidden = !highScore;
    document.getElementById('playerNameInput').hidden = !highScore;

    showHighScores();
  }

UpdateHUD();
requestAnimationFrame(gameLoop);