import { Ball } from './ball.js';
import { Platform } from './platform.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ball = new Ball(canvas.width / 2, canvas.height - 50);
const platforms = [];
let score = 0;

const gravity = 0.5;
const jumpPower = -10;

// Créer des plateformes initiales
function createPlatforms() {
    for (let i = 0; i < 5; i++) {
        const width = Math.random() * 200 + 50;
        const x = Math.random() * (canvas.width - width);
        const y = i * 200 + 150;
        platforms.push(new Platform(x, y, width, 20));
    }
}

// Mise à jour de l'état du jeu
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ball.update();
    platforms.forEach(platform => platform.update());

    // Vérification des collisions avec les plateformes
    platforms.forEach(platform => {
        if (ball.collidesWith(platform)) {
            ball.ySpeed = 0;
            ball.y = platform.y - ball.radius;
        }
    });

    // Affichage du score
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText('Score: ' + score, 20, 40);

    if (ball.y + ball.radius > canvas.height) {
        alert('Game Over!');
        score = 0;
        ball.reset();
        platforms.length = 0;
        createPlatforms();
    }

    // Afficher la balle
    ball.draw(ctx);
    requestAnimationFrame(update);
}

// Contrôles de la balle
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') ball.moveLeft();
    if (e.key === 'ArrowRight') ball.moveRight();
    if (e.key === ' ' && ball.isOnGround()) ball.jump();
});

// Initialisation du jeu
createPlatforms();
update();
