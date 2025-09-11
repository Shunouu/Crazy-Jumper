document.addEventListener('DOMContentLoaded', async () => {
  // Sélecteurs DOM avec destructuration
  const menuOverlay = document.getElementById('menu')
  const playBtn = document.getElementById('playBtn')
  const countdownDiv = document.getElementById('countdown')
  const gameArea = document.getElementById('gameArea')
  const platformsContainer = document.getElementById('platforms')
  const scoreElement = document.querySelector('.score')
  const livesElement = document.querySelector('.lives')
  const pauseBtn = document.getElementById('pauseBtn')
  const pauseMenu = document.getElementById('pauseMenu')
  const resumeBtn = document.getElementById('resumeBtn')
  const retryBtnPause = document.getElementById('retryBtnPause')
  const retryBtn = document.getElementById('retryBtn')
  const menuBtns = document.querySelectorAll('.menu-btn')
  const charactersDiv = document.getElementById('characters')
  const gameOverElement = document.querySelector('.game-over')
  const gameOverTextSpan = gameOverElement?.querySelector('span')

  // Chargement audio (promesses + await)
  const audioFiles = {
    bounce: 'assets/sounds/bounce.wav',
    gameover: 'assets/sounds/game-over-sound.wav',
    music: 'assets/sounds/music.mp3'
  }
  const audios = {}
  const loadAudio = src => new Promise(resolve => {
    const a = new Audio()
    a.src = src
    a.addEventListener('canplaythrough', () => resolve(a), { once: true })
    a.addEventListener('error', () => resolve(a), { once: true })
  })
  await Promise.all(
    Object.entries(audioFiles).map(([k, s]) =>
      loadAudio(s).then(a => (audios[k] = a))
    )
  )
  audios.music && (audios.music.loop = true)

  // Variables du jeu
  let player = null
  const playerW = 60
  const playerH = 60
  let playerX = 100
  let playerY = 200
  let vy = 0
  const gravity = 0.1
  const jumpVelocity = 20
  const moveStep = 90

  let platforms = []
  const platformW = 150
  const platformH = 20
  let platformGap = 100

  let score = 0
  let lives = 3
  let gameStarted = false
  let paused = false
  let selectedColor = localStorage.getItem('cj_color') || 'lime'
  let bestScore = parseInt(localStorage.getItem('cj_best') || '0', 10)

  // Choix des couleurs (spread + mise à jour instantanée)
  const colors = ['lime', 'cyan', 'red', 'orange', 'violet']
  const renderColorChoices = () => {
    charactersDiv.innerHTML = ''
    colors.forEach(c => {
      const d = document.createElement('div')
      d.className = 'character-option' + (c === selectedColor ? ' active' : '')
      d.style.backgroundColor = c
      d.onclick = () => {
        selectedColor = c
        localStorage.setItem('cj_color', c)
        document.querySelectorAll('.character-option').forEach(el =>
          el.classList.remove('active')
        )
        d.classList.add('active')
        if (player) player.style.background = c
      }
      charactersDiv.appendChild(d)
    })
  }
  renderColorChoices()

  const updateScoreLives = () => {
    scoreElement.textContent = `Score: ${score}`
    livesElement.textContent = `Vies: ${lives}`
  }

  const createPlayerElement = () => {
    const el = document.createElement('div')
    el.className = 'player'
    Object.assign(el.style, {
      width: `${playerW}px`,
      height: `${playerH}px`,
      position: 'absolute',
      background: selectedColor,
      left: `${playerX}px`,
      bottom: `${playerY}px`
    })
    return el
  }

  const createPlatform = y => {
    const el = document.createElement('div')
    el.className = 'platform'
    const x = Math.max(
      0,
      Math.random() * (Math.max(320, gameArea.offsetWidth) - platformW)
    )
    el.style.left = `${x}px`
    el.style.bottom = `${y}px`
    platformsContainer.appendChild(el)
    platforms.push({ el, x, y, scored: false })
  }

  const generateInitialPlatforms = () => {
    platformsContainer.innerHTML = ''
    platforms = []
    const base = 50
    platformGap = Math.max(80, Math.floor(gameArea.offsetHeight / 7))
    for (let i = 0; i < 7; i++) createPlatform(base + i * platformGap)
  }

  const resetPlayerVars = () => {
    playerX = (gameArea.offsetWidth / 2) - (playerW / 2) // place la balle au centre
    playerY = (gameArea.offsetHeight / 2) - (playerH / 2) // centre aussi en hauteur)
    vy = 0
  }

  const spawnPlayer = () => {
    player?.remove()
    player = createPlayerElement()
    gameArea.appendChild(player)
  }

  const startCountdown = onFinish => {
    if (!countdownDiv) return onFinish?.()
    let c = 3
    countdownDiv.style.display = 'grid'
    countdownDiv.textContent = c
    countdownDiv.style.opacity = '1'
    const t = setInterval(() => {
      c--
      countdownDiv.textContent = c > 0 ? `${c}` : 'GO!'
      if (c < 0) {
        clearInterval(t)
        countdownDiv.style.opacity = '0'
        setTimeout(() => (countdownDiv.style.display = 'none'), 300)
        onFinish?.()
      }
    }, 1000)
  }

  const launchGame = () => {
    generateInitialPlatforms()
    resetPlayerVars()
    spawnPlayer()
    platforms.forEach(p => (p.scored = false))
    score = 0
    lives = 3
    updateScoreLives()
    gameStarted = true
    paused = false
    try {
      audios.music?.play()
    } catch {}
    requestAnimationFrame(loop)
  }

  const initGame = () => {
    menuOverlay.style.display = 'none'
    startCountdown(launchGame)
  }

  const removePlatform = idx => {
    const p = platforms[idx]
    p?.el?.remove()
    platforms.splice(idx, 1)
  }

  const createPlatformAtTop = () => {
    const maxY = Math.max(...platforms.map(p => p.y))
    createPlatform(maxY + platformGap)
  }

  const doGameOver = () => {
    gameStarted = false
    paused = true
    try {
      audios.gameover?.play()
      audios.music?.pause()
    } catch {}
    if (gameOverTextSpan)
      gameOverTextSpan.textContent = `Game Over! Score: ${score}`
    gameOverElement.style.display = 'block'
    if (score > bestScore) {
      bestScore = score
      localStorage.setItem('cj_best', `${bestScore}`)
    }
  }

  const handleLanding = p => {
    vy = jumpVelocity
    if (!p.scored) {
      p.scored = true
      score++
      updateScoreLives()
      try {
        audios.bounce?.play()
      } catch {}
    }
  }

  let prevPlayerY = 0
  const loop = () => {
    if (!gameStarted || paused) return
    prevPlayerY = playerY
    vy -= gravity
    playerY += vy
    if (player) {
      player.style.left = `${playerX}px`
      player.style.bottom = `${playerY}px`
    }
    if (playerY <= -40) {
      lives--
      updateScoreLives()
      if (lives <= 0) return doGameOver()
      resetPlayerVars()
      if (player) player.style.bottom = `${playerY}px`
      return requestAnimationFrame(loop)
    }
    if (vy < 0) {
      for (const p of platforms) {
        const pLeft = p.x,
          pRight = p.x + platformW,
          platformTop = p.y + platformH,
          playerLeft = playerX,
          playerRight = playerX + playerW
        if (
          prevPlayerY > platformTop &&
          playerY <= platformTop &&
          playerRight > pLeft &&
          playerLeft < pRight
        ) {
          playerY = platformTop
          handleLanding(p)
          break
        }
      }
    }
    const threshold = gameArea.offsetHeight * 0.6
    if (playerY > threshold) {
      const dy = playerY - threshold
      playerY = threshold
      player.style.bottom = `${playerY}px`
      platforms.forEach(p => {
        p.y -= dy
        p.el.style.bottom = `${p.y}px`
      })
      platforms = [...platforms.filter(p => p.y > -platformH - 50)]
      while (platforms.length < 7) createPlatformAtTop()
    }
    requestAnimationFrame(loop)
  }

  // Contrôles clavier
  document.addEventListener('keydown', e => {
    if (!gameStarted || paused) return
    if (e.code === 'ArrowLeft')
      playerX = Math.max(0, playerX - moveStep)
    if (e.code === 'ArrowRight')
      playerX = Math.min(gameArea.offsetWidth - playerW, playerX + moveStep)
    if (e.code === 'Space') vy = jumpVelocity
  })

  // 🖱️ Boutons
  playBtn?.addEventListener('click', initGame)
  retryBtn?.addEventListener('click', () => {
    gameOverElement.style.display = 'none'
    initGame()
  })
  retryBtnPause?.addEventListener('click', () => {
    pauseMenu.style.display = 'none'
    initGame()
  })
  pauseBtn?.addEventListener('click', () => {
    if (!gameStarted) return
    paused = true
    pauseMenu.style.display = 'flex'
    try {
      audios.music?.pause()
    } catch {}
  })
  resumeBtn?.addEventListener('click', () => {
    pauseMenu.style.display = 'none'
    startCountdown(() => {
      paused = false
      try {
        audios.music?.play()
      } catch {}
      requestAnimationFrame(loop)
    })
  })
  menuBtns.forEach(b =>
    b.addEventListener('click', () => {
      pauseMenu.style.display = 'none'
      gameOverElement.style.display = 'none'
      menuOverlay.style.display = 'grid'
      gameStarted = false
      paused = false
      try {
        audios.music?.pause()
      } catch {}
    })
  )

  updateScoreLives()
})