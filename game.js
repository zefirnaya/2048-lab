const GRID_SIZE = 4;
const STORAGE_KEY = 'game2048_state';
const LEADERS_KEY = 'game2048_leaders';
const welcomeModal = document.getElementById('welcome-modal');
const enableSoundsBtn = document.getElementById('enable-sounds-btn');
const skipSoundsBtn = document.getElementById('skip-sounds-btn');

let grid = [];
let score = 0;
let gameOver = false;
let lastMove = null;
let touchStartX = 0;
let touchStartY = 0;

let musicEnabled = true;
let soundEnabled = true;
let userInteracted = false;

const gridElement = document.getElementById('grid');
const scoreElement = document.getElementById('score');
const undoBtn = document.getElementById('undo-btn');
const restartBtn = document.getElementById('restart-btn');
const leadersBtn = document.getElementById('leaders-btn');
const mobileControls = document.getElementById('mobile-controls');
const gameOverModal = document.getElementById('game-over-modal');
const leadersModal = document.getElementById('leaders-modal');
const finalScoreElement = document.getElementById('final-score');
const saveScoreForm = document.getElementById('save-score-form');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score-btn');
const scoreSavedMessage = document.getElementById('score-saved-message');
const restartAfterGameBtn = document.getElementById('restart-after-game-btn');
const closeLeadersBtn = document.getElementById('close-leaders-btn');
const clearLeadersBtn = document.getElementById('clear-leaders-btn');
const leadersBody = document.getElementById('leaders-body');
const musicToggleBtn = document.getElementById('music-toggle');
const soundToggleBtn = document.getElementById('sound-toggle');

let backgroundMusic = null;
let moveSound = null;
let mergeSound = null;
let gameOverSound = null;
let buttonSound = null;

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function initAudio() {
    if (backgroundMusic) return;
    
    backgroundMusic = new Audio('sounds/music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    
    buttonSound = new Audio('sounds/click.mp3');
    buttonSound.volume = 0.4;
    moveSound = new Audio('sounds/move.mp3');
    moveSound.volume = 0.3;
    mergeSound = new Audio('sounds/merge.mp3');
    mergeSound.volume = 0.4;
    gameOverSound = new Audio('sounds/gameover.mp3');
    gameOverSound.volume = 0.3;
}

function showWelcomeModal() {
    console.log('Проверяем показ окна...');
    
    const welcomeShown = localStorage.getItem('game2048_welcome_shown');
    console.log('welcomeShown:', welcomeShown);
    
    if (!welcomeShown || welcomeShown === 'false') {
        console.log('Показываем окно приветствия');
        setTimeout(() => {
            if (welcomeModal) {
                welcomeModal.style.display = 'flex';
                console.log('Окно показано!');
            } else {
                console.error('Ошибка: welcomeModal не найден!');
            }
        }, 1000);
    } else {
        console.log('Окно уже показывалось, пропускаем');
        if (soundEnabled) {
            initAudio();
        }
    }
}

function enableSounds() {
    if (welcomeModal) {
        welcomeModal.style.display = 'none';
    }
    
    localStorage.setItem('game2048_welcome_shown', 'true');
    
    soundEnabled = true;
    musicEnabled = true;
    userInteracted = true;
    
    initAudio();
    updateSoundControls();
    saveSettings();

    playSound(buttonSound);
    
    playMusic();
    
    setTimeout(() => {
        alert('🎵 Звуки включены! Наслаждайтесь игрой!');
    }, 300);
}

function skipSounds() {
    if (welcomeModal) {
        welcomeModal.style.display = 'none';
    }
    
    localStorage.setItem('game2048_welcome_shown', 'true');
    
    soundEnabled = false;
    musicEnabled = false;
    
    updateSoundControls();
    saveSettings();
    
    initAudio();
}

function playSound(sound) {
    if (!soundEnabled || !userInteracted || !sound) return;
    
    try {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    } catch (e) {}
}

function playMusic() {
    if (!musicEnabled || !backgroundMusic) return;
    
    if (!userInteracted) {
        console.log('Ожидание взаимодействия пользователя для воспроизведения музыки...');
        return;
    }
    
    try {
        if (backgroundMusic.paused) {
            backgroundMusic.currentTime = 0;
        }
        
        backgroundMusic.play()
            .then(() => {
                console.log('Фоновая музыка успешно запущена');
            })
            .catch(error => {
                console.warn('Не удалось запустить музыку:', error);
                setTimeout(() => {
                    if (musicEnabled && userInteracted) {
                        playMusic();
                    }
                }, 1000);
            });
    } catch (e) {
        console.error('Ошибка при воспроизведении музыки:', e);
    }
}

function stopMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

function toggleMusic() {
    initAudio();
    userInteracted = true;
    
    musicEnabled = !musicEnabled;
    
    if (musicEnabled) {
        playMusic();
    } else {
        stopMusic();
    }
    
    updateSoundControls();
    saveSettings();
    playSound(buttonSound);
}

function toggleSound() {
    initAudio();
    userInteracted = true;
    
    soundEnabled = !soundEnabled;
    
    updateSoundControls();
    saveSettings();
    
    if (soundEnabled) {
        playSound(buttonSound);
    }
}

function updateSoundControls() {
    if (musicToggleBtn) {
        if (musicEnabled) {
            musicToggleBtn.innerHTML = '<i class="fas fa-music"></i>';
            musicToggleBtn.classList.add('active');
            musicToggleBtn.classList.remove('inactive');
        } else {
            musicToggleBtn.innerHTML = '<i class="fas fa-music-slash"></i>';
            musicToggleBtn.classList.remove('active');
            musicToggleBtn.classList.add('inactive');
        }
    }
    
    if (soundToggleBtn) {
        if (soundEnabled) {
            soundToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            soundToggleBtn.classList.add('active');
            soundToggleBtn.classList.remove('inactive');
        } else {
            soundToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            soundToggleBtn.classList.remove('active');
            soundToggleBtn.classList.add('inactive');
        }
    }
}

function createGrid() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    
    gridElement.innerHTML = '';
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            gridElement.appendChild(cell);
        }
    }
}

function updateGrid() {
    document.querySelectorAll('.tile').forEach(tile => tile.remove());
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const value = grid[row][col];
            if (value !== 0) {
                createTileElement(row, col, value);
            }
        }
    }
}

function createTileElement(row, col, value) {
    const tile = document.createElement('div');
    tile.classList.add('tile', `tile-${value}`);
    tile.textContent = value;
    tile.dataset.row = row;
    tile.dataset.col = col;
    
    tile.style.left = `${col * (100 / GRID_SIZE)}%`;
    tile.style.top = `${row * (100 / GRID_SIZE)}%`;
    tile.style.width = `${100 / GRID_SIZE - 2}%`;
    tile.style.height = `${100 / GRID_SIZE - 2}%`;
    
    if (lastMove && lastMove.newTiles && lastMove.newTiles.some(t => t.row === row && t.col === col && t.value === value)) {
        tile.classList.add('new-tile');
        setTimeout(() => tile.classList.remove('new-tile'), 300);
    }
    
    gridElement.appendChild(tile);
}

function addRandomTile() {
    const emptyCells = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === 0) {
                emptyCells.push({ row, col });
            }
        }
    }
    
    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        
        grid[randomCell.row][randomCell.col] = value;
        
        return { row: randomCell.row, col: randomCell.col, value };
    }
    
    return null;
}

function moveLeft() {
    let moved = false;
    let moveScore = 0;
    const newTiles = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
        const nonZeroTiles = grid[row].filter(cell => cell !== 0);
        
        for (let i = 0; i < nonZeroTiles.length - 1; i++) {
            if (nonZeroTiles[i] === nonZeroTiles[i + 1]) {
                nonZeroTiles[i] *= 2;
                moveScore += nonZeroTiles[i];
                nonZeroTiles.splice(i + 1, 1);
                moved = true;
            }
        }
        
        const newRow = [...nonZeroTiles, ...Array(GRID_SIZE - nonZeroTiles.length).fill(0)];
        
        if (!arraysEqual(grid[row], newRow)) {
            moved = true;
        }
        
        grid[row] = newRow;
    }
    
    return { moved, score: moveScore, newTiles };
}

function moveRight() {
    let moved = false;
    let moveScore = 0;
    const newTiles = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
        const nonZeroTiles = grid[row].filter(cell => cell !== 0);
        
        for (let i = nonZeroTiles.length - 1; i > 0; i--) {
            if (nonZeroTiles[i] === nonZeroTiles[i - 1]) {
                nonZeroTiles[i] *= 2;
                moveScore += nonZeroTiles[i];
                nonZeroTiles.splice(i - 1, 1);
                i--;
                moved = true;
            }
        }
        
        const newRow = [...Array(GRID_SIZE - nonZeroTiles.length).fill(0), ...nonZeroTiles];
        
        if (!arraysEqual(grid[row], newRow)) {
            moved = true;
        }
        
        grid[row] = newRow;
    }
    
    return { moved, score: moveScore, newTiles };
}

function moveUp() {
    let moved = false;
    let moveScore = 0;
    const newTiles = [];
    
    for (let col = 0; col < GRID_SIZE; col++) {
        const column = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            column.push(grid[row][col]);
        }
        
        const nonZeroTiles = column.filter(cell => cell !== 0);
        
        for (let i = 0; i < nonZeroTiles.length - 1; i++) {
            if (nonZeroTiles[i] === nonZeroTiles[i + 1]) {
                nonZeroTiles[i] *= 2;
                moveScore += nonZeroTiles[i];
                nonZeroTiles.splice(i + 1, 1);
                moved = true;
            }
        }
        
        const newColumn = [...nonZeroTiles, ...Array(GRID_SIZE - nonZeroTiles.length).fill(0)];
        
        for (let row = 0; row < GRID_SIZE; row++) {
            if (grid[row][col] !== newColumn[row]) {
                moved = true;
            }
            grid[row][col] = newColumn[row];
        }
    }
    
    return { moved, score: moveScore, newTiles };
}

function moveDown() {
    let moved = false;
    let moveScore = 0;
    const newTiles = [];
    
    for (let col = 0; col < GRID_SIZE; col++) {
        const column = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            column.push(grid[row][col]);
        }
        
        const nonZeroTiles = column.filter(cell => cell !== 0);
        
        for (let i = nonZeroTiles.length - 1; i > 0; i--) {
            if (nonZeroTiles[i] === nonZeroTiles[i - 1]) {
                nonZeroTiles[i] *= 2;
                moveScore += nonZeroTiles[i];
                nonZeroTiles.splice(i - 1, 1);
                i--;
                moved = true;
            }
        }
        
        const newColumn = [...Array(GRID_SIZE - nonZeroTiles.length).fill(0), ...nonZeroTiles];
        
        for (let row = 0; row < GRID_SIZE; row++) {
            if (grid[row][col] !== newColumn[row]) {
                moved = true;
            }
            grid[row][col] = newColumn[row];
        }
    }
    
    return { moved, score: moveScore, newTiles };
}

function updateScore() {
    scoreElement.textContent = score;
}

function checkGameOver() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === 0) {
                return false;
            }
        }
    }
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE - 1; col++) {
            if (grid[row][col] === grid[row][col + 1]) {
                return false;
            }
        }
    }
    
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE - 1; row++) {
            if (grid[row][col] === grid[row + 1][col]) {
                return false;
            }
        }
    }
    
    return true;
}

function handleMove(direction) {
    if (gameOver) return;
    
    const prevGrid = grid.map(row => [...row]);
    const prevScore = score;
    
    let result;
    
    switch (direction) {
        case 'left':
            result = moveLeft();
            break;
        case 'right':
            result = moveRight();
            break;
        case 'up':
            result = moveUp();
            break;
        case 'down':
            result = moveDown();
            break;
        default:
            return;
    }
    
    if (result.moved) {
        playSound(moveSound);
        
        if (result.score > 0) {
            playSound(mergeSound);
        }
        
        score += result.score;
        
        const tilesToAdd = Math.random() < 0.1 ? 2 : 1;
        for (let i = 0; i < tilesToAdd; i++) {
            const newTile = addRandomTile();
            if (newTile) result.newTiles.push(newTile);
        }
        
        lastMove = {
            prevGrid,
            prevScore,
            newTiles: result.newTiles
        };
        
        updateGrid();
        updateScore();
        saveGameState();
        
        if (checkGameOver()) {
            setTimeout(() => {
                showGameOverModal();
            }, 300);
        }
    }
}

function handleKeyDown(e) {
    if (gameOverModal.style.display === 'flex' || leadersModal.style.display === 'flex') {
        return;
    }
    
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            handleMove('left');
            break;
        case 'ArrowRight':
            e.preventDefault();
            handleMove('right');
            break;
        case 'ArrowUp':
            e.preventDefault();
            handleMove('up');
            break;
        case 'ArrowDown':
            e.preventDefault();
            handleMove('down');
            break;
    }
}

function handleTouchStart(e) {
    if (gameOverModal.style.display === 'flex' || leadersModal.style.display === 'flex') {
        return;
    }
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    if (gameOverModal.style.display === 'flex' || leadersModal.style.display === 'flex') {
        return;
    }
    
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipeDistance) {
            if (dx > 0) {
                handleMove('right');
            } else {
                handleMove('left');
            }
        }
    } else {
        if (Math.abs(dy) > minSwipeDistance) {
            if (dy > 0) {
                handleMove('down');
            } else {
                handleMove('up');
            }
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
}

function updateMobileControlsVisibility() {
    if (gameOverModal.style.display === 'flex' || leadersModal.style.display === 'flex') {
        mobileControls.style.display = 'none';
    } else {
        if (window.innerWidth <= 768) {
            mobileControls.style.display = 'flex';
        } else {
            mobileControls.style.display = 'none';
        }
    }
}

function showGameOverModal() {
    gameOver = true;
    finalScoreElement.textContent = score;
    gameOverModal.style.display = 'flex';
    saveScoreForm.classList.remove('hidden');
    scoreSavedMessage.classList.add('hidden');
    playerNameInput.value = '';
    
    playSound(gameOverSound);
    
    updateMobileControlsVisibility();
}

function hideGameOverModal() {
    gameOverModal.style.display = 'none';
}

function showLeadersModal() {
    leadersModal.style.display = 'flex';
    updateLeadersTable();
    
    updateMobileControlsVisibility();
}

function hideLeadersModal() {
    leadersModal.style.display = 'none';
    
    updateMobileControlsVisibility();
}

function updateLeadersTable() {
    const leaders = getLeaders();
    leadersBody.innerHTML = '';
    
    if (leaders.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'Пока нет рекордов';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        row.appendChild(cell);
        leadersBody.appendChild(row);
        return;
    }
    
    leaders.forEach((leader, index) => {
        const row = document.createElement('tr');
        
        const placeCell = document.createElement('td');
        placeCell.textContent = index + 1;
        row.appendChild(placeCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = leader.name;
        row.appendChild(nameCell);
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = leader.score;
        row.appendChild(scoreCell);
        
        const dateCell = document.createElement('td');
        const date = new Date(leader.date);
        dateCell.textContent = date.toLocaleDateString();
        row.appendChild(dateCell);
        
        leadersBody.appendChild(row);
    });
}

function getLeaders() {
    const leadersJSON = localStorage.getItem(LEADERS_KEY);
    return leadersJSON ? JSON.parse(leadersJSON) : [];
}

function saveScoreToLeaders(name) {
    const leaders = getLeaders();
    
    leaders.push({
        name: name || 'Аноним',
        score,
        date: new Date().toISOString()
    });
    
    leaders.sort((a, b) => b.score - a.score);
    
    const topLeaders = leaders.slice(0, 10);
    
    localStorage.setItem(LEADERS_KEY, JSON.stringify(topLeaders));
}

function clearLeaders() {
    if (confirm('Вы уверены, что хотите очистить таблицу лидеров?')) {
        localStorage.removeItem(LEADERS_KEY);
        updateLeadersTable();
    }
}

function saveGameState() {
    const gameState = {
        grid,
        score,
        gameOver
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    
    if (savedState) {
        const gameState = JSON.parse(savedState);
        grid = gameState.grid;
        score = gameState.score;
        gameOver = gameState.gameOver;
        
        if (gameOver) {
            setTimeout(() => {
                showGameOverModal();
            }, 100);
        }
    }
}

function saveSettings() {
    const settings = {
        musicEnabled,
        soundEnabled
    };
    
    localStorage.setItem('game2048_settings', JSON.stringify(settings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('game2048_settings');
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        musicEnabled = settings.musicEnabled !== undefined ? settings.musicEnabled : true;
        soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
    }
}

function undoMove() {
    if (lastMove && !gameOver) {
        playSound(buttonSound);
        
        grid = lastMove.prevGrid;
        score = lastMove.prevScore;
        
        lastMove = null;
        
        updateGrid();
        updateScore();
        saveGameState();
    }
}

function restartGame() {
    playSound(buttonSound);
    
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    gameOver = false;
    lastMove = null;
    
    const initialTilesCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < initialTilesCount; i++) {
        addRandomTile();
    }
    
    updateGrid();
    updateScore();
    
    hideGameOverModal();
    
    saveGameState();
    
    updateMobileControlsVisibility();
}

function initGame() {
    createGrid();
    loadGameState();
    loadSettings();
    
    if (grid.flat().every(cell => cell === 0)) {
        const initialTilesCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < initialTilesCount; i++) {
            addRandomTile();
        }
    }
    
    updateGrid();
    updateScore();
    
    updateMobileControlsVisibility();
    initAudio();
    updateSoundControls();
    
    showWelcomeModal();
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    
    gridElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    gridElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    undoBtn.addEventListener('click', () => {
        playSound(buttonSound);
        undoMove();
    });
    
    restartBtn.addEventListener('click', restartGame);
    
    leadersBtn.addEventListener('click', () => {
        playSound(buttonSound);
        showLeadersModal();
    });
    
    document.querySelectorAll('.mobile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound(buttonSound);
            const direction = btn.dataset.direction;
            handleMove(direction);
        });
    });
    
    saveScoreBtn.addEventListener('click', () => {
        playSound(buttonSound);
        const playerName = playerNameInput.value.trim();
        saveScoreToLeaders(playerName);
        
        saveScoreForm.classList.add('hidden');
        scoreSavedMessage.classList.remove('hidden');
    });
    
    restartAfterGameBtn.addEventListener('click', restartGame);
    
    closeLeadersBtn.addEventListener('click', () => {
        playSound(buttonSound);
        hideLeadersModal();
    });
    
    clearLeadersBtn.addEventListener('click', () => {
        playSound(buttonSound);
        clearLeaders();
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === gameOverModal) {
            hideGameOverModal();
        }
        if (e.target === leadersModal) {
            hideLeadersModal();
        }
    });
    
    window.addEventListener('resize', updateMobileControlsVisibility);
    
    if (musicToggleBtn) {
        musicToggleBtn.addEventListener('click', toggleMusic);
    }
    
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', toggleSound);
    }

    if (enableSoundsBtn) {
        enableSoundsBtn.addEventListener('click', enableSounds);
    }
    
    if (skipSoundsBtn) {
        skipSoundsBtn.addEventListener('click', skipSounds);
    }
    
    document.addEventListener('click', function() {
        if (!userInteracted) {
            userInteracted = true;
            if (musicEnabled) {
                playMusic();
            }
        }
    });
}

function createSakuraPetals() {
    const petalCount = 15;
    
    for (let i = 0; i < petalCount; i++) {
        const petal = document.createElement('div');
        petal.classList.add('sakura-petal');
        
        petal.style.left = `${Math.random() * 100}vw`;
        petal.style.top = `${-Math.random() * 100}px`;
        
        const duration = 15 + Math.random() * 20;
        petal.style.animationDuration = `${duration}s`;
        petal.style.animationDelay = `${Math.random() * 5}s`;
        
        document.body.appendChild(petal);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupEventListeners();
    createSakuraPetals();
});