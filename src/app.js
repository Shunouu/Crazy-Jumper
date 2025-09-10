// Variables du jeu
let player;
let platforms = [];
let score = 0;
let lives = 3;
let gameStarted = false;

let jumpSpeed = 15;  // Vitesse du saut
let gravity = 2;     // Gravité
let isJumping = false;

const startBottom = 400;
const startLeft = 100;

// DOM
const scoreElement = document.querySelector('.score');
const livesElement = document.querySelector('.lives');
const gameOverElement = document.querySelector('.game-over');
const startMessageElement = document.querySelector('.start-message');
const gameArea = document.getElementById('gameArea');
const platformsContainer = document.getElementById('platforms');

// Préchargement du son
const bounceSound = new Audio('assets/sounds/bounce.wav');
const gameOverSound = new Audio('assets/sounds/game-over-sound.wav');

// Init
function initGame() {
    score = 0;
    lives = 3;
    platformsContainer.innerHTML = '';
    platforms = [];

    if (!player) {
        player = document.createElement('div');
        player.classList.add('player');
        gameArea.appendChild(player);
    }
    resetPlayerPosition();

    generatePlatforms();
    startMessageElement.style.display = 'none';
    gameOverElement.style.display = 'none';

    gameStarted = true;
    gameLoop();
}

// Génération de plateformes
function generatePlatforms() {
    for (let i = 0; i < 7; i++) {
        createPlatform(i * 100 + 50);
    }
}

function createPlatform(bottom) {
    const platform = document.createElement('div');
    platform.classList.add('platform');
    platform.style.left = `${Math.random() * (gameArea.offsetWidth - 120)}px`;
    platform.style.bottom = `${bottom}px`;
    platformsContainer.appendChild(platform);
    platforms.push(platform);
}

// Reset joueur
function resetPlayerPosition() {
    player.style.left = startLeft + 'px';
    player.style.bottom = startBottom + 'px';
    isJumping = false;
}

// Mise à jour du joueur
let lastBounceTime = 0;
function updatePlayer() {
    let falling = true;
    const playerBottom = parseFloat(player.style.bottom);
    const currentTime = Date.now();

    platforms.forEach(platform => {
        const platBottom = parseFloat(platform.style.bottom);
        const platLeft = parseFloat(platform.style.left);
        const platRight = platLeft + platform.offsetWidth;

        // Si le joueur touche une plateforme et que 100ms sont passées depuis le dernier rebond
        if (
            playerBottom <= platBottom + 20 &&
            playerBottom >= platBottom - 10 &&
            parseFloat(player.style.left) + player.offsetWidth > platLeft &&
            parseFloat(player.style.left) < platRight &&
            !isJumping &&
            currentTime - lastBounceTime > 100
        ) {
            handleJump();
            bounceSound.play();  // Jouer le son de rebond
            lastBounceTime = currentTime;
            falling = false;
        }
    });

    if (playerBottom <= 0) {
        loseLife();
        falling = false;
    }

    if (falling) {
        fallPlayer();
    }

    // Défilement si le joueur est assez haut
    if (playerBottom > gameArea.offsetHeight / 2) {
        const delta = playerBottom - gameArea.offsetHeight / 2;
        player.style.bottom = parseFloat(player.style.bottom) - delta + 'px';
        platforms.forEach(platform => {
            platform.style.bottom = parseFloat(platform.style.bottom) - delta + 'px';
            if (parseFloat(platform.style.bottom) < -20) {
                platformsContainer.removeChild(platform);
                platforms.splice(platforms.indexOf(platform), 1);
                createPlatform(gameArea.offsetHeight + 50);
            }
        });
        score += Math.floor(delta); // Score augmente avec la hauteur
    }
}

// Chute
function fallPlayer() {
    player.style.bottom = parseFloat(player.style.bottom) - gravity + 'px';
}

// Perte de vie
function loseLife() {
    lives--;
    updateScoreAndLives();

    if (lives <= 0) {
        gameOver();
    } else {
        resetPlayerPosition();
    }
}

// Score & vies
function updateScoreAndLives() {
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Vies: ${lives}`;
}

// Game Over
function gameOver() {
    gameOverElement.style.display = 'block';
    gameOverElement.querySelector('span').textContent = 'Game Over! Score: ' + score;
    gameOverSound.play();  // Joue le son de fin de jeu
    gameStarted = false;
}

// Déplacements
function movePlayerLeft() {
    const left = parseFloat(player.style.left);
    if (left > 0) player.style.left = left - 90 + 'px';
}

function movePlayerRight() {
    const left = parseFloat(player.style.left);
    if (left < gameArea.offsetWidth - player.offsetWidth)
        player.style.left = left + 90 + 'px';
}

// Saut
function handleJump() {
    if (!isJumping) {
        isJumping = true;
        let jumpHeight = 0;

        const jumpInterval = setInterval(() => {
            if (jumpHeight < 1200) {
                player.style.bottom = parseFloat(player.style.bottom) + jumpSpeed + 'px';
                jumpHeight += jumpSpeed;
            } else {
                clearInterval(jumpInterval);
                isJumping = false;
            }
        }, 20);
    }
}

// Boucle
function gameLoop() {
    updatePlayer();
    updateScoreAndLives();

    if (gameStarted) requestAnimationFrame(gameLoop);
}

// Clavier
function keyDown(e) {
    if (!gameStarted) initGame();
    else {
        if (e.key === 'ArrowLeft') movePlayerLeft();
        if (e.key === 'ArrowRight') movePlayerRight();
    }
}

document.addEventListener('keydown', keyDown);
