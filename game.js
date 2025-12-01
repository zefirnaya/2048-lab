const GRID_SIZE = 4;
const CELL_SIZE = 1;
const STORAGE_KEY = 'game2048_state';
const LEADERS_KEY = 'game2048_leaders';

let grid = [];
let score = 0;
let gameOver = false;
let lastMove = null;
let touchStartX = 0;
let touchStartY = 0;

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

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
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
    
    updateTilePosition(tile, row, col);
    
    if (lastMove && lastMove.newTiles && lastMove.newTiles.some(t => t.row === row && t.col === col && t.value === value)) {
        tile.classList.add('new-tile');
        setTimeout(() => tile.classList.remove('new-tile'), 300);
    }
    
    gridElement.appendChild(tile);
}

function updateTilePosition(tile, row, col) {
    tile.style.left = `${col * (100 / GRID_SIZE)}%`;
    tile.style.top = `${row * (100 / GRID_SIZE)}%`;
    tile.style.width = `${100 / GRID_SIZE - 2}%`;
    tile.style.height = `${100 / GRID_SIZE - 2}%`;
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
        score += result.score;
        
        const newTile = addRandomTile();
        if (newTile) result.newTiles.push(newTile);

        lastMove = {
            prevGrid,
            prevScore,
            newTiles: result.newTiles
        };
        
        updateGrid();
        updateScore();
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

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    
    gridElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    gridElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    undoBtn.addEventListener('click', undoMove);
    restartBtn.addEventListener('click', restartGame);
    leadersBtn.addEventListener('click', showLeadersModal);
    
    document.querySelectorAll('.mobile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const direction = btn.dataset.direction;
            handleMove(direction);
        });
    });
    
    window.addEventListener('resize', updateMobileControlsVisibility);
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Игра 2048 загружена');
    // Инициализация
});