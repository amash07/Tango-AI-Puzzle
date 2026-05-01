// Game State
let currentBoard = [];
let initialBoard = [];
let gridSize = 6;
let currentDifficulty = 'medium';
let aiSolving = false;
let stepDelay = 200;

// DOM Elements
const gridElement = document.getElementById('puzzle-grid');
const statusPanel = document.getElementById('status-panel');
const statusMessage = document.getElementById('status-message');
const btnCheck = document.getElementById('btn-check');
const btnSolve = document.getElementById('btn-solve');
const btnStep = document.getElementById('btn-step');
const btnGenerate = document.getElementById('btn-generate');
const btnReset = document.getElementById('btn-reset');
const selectSize = document.getElementById('grid-size');
const selectDifficulty = document.getElementById('difficulty');
const logContent = document.getElementById('ai-log');

// Modal Elements
const victoryModal = document.getElementById('victory-modal');
const btnModalClose = document.getElementById('btn-modal-close');
const modalDesc = document.getElementById('modal-desc');

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
let isDarkTheme = false;

// Initialize Game
function initGame() {
    gridSize = parseInt(selectSize.value);
    document.documentElement.style.setProperty('--grid-size', gridSize);
    currentDifficulty = selectDifficulty.value;
    
    // Generate new valid board
    generateNewPuzzle();
}

function generateNewPuzzle() {
    clearLog();
    logMessage('System', 'Generating new puzzle...');
    setStatus('Generating...', 'info');
    
    // Will be defined in puzzleGenerator.js
    initialBoard = window.generateBoard(gridSize, currentDifficulty);
    currentBoard = copyBoard(initialBoard);
    
    renderGrid();
    setStatus('Ready to play', 'info');
}

function renderGrid() {
    gridElement.innerHTML = '';
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cellVal = currentBoard[r][c];
            const isClue = initialBoard[r][c] !== EMPTY;
            
            const cellDiv = document.createElement('div');
            cellDiv.className = `cell ${SYMBOL_CLASSES[cellVal]}`;
            if (isClue) cellDiv.classList.add('clue');
            
            cellDiv.textContent = SYMBOLS[cellVal];
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;
            
            if (!isClue && !aiSolving) {
                cellDiv.addEventListener('click', () => handleCellClick(r, c));
            }
            
            gridElement.appendChild(cellDiv);
        }
    }
}

function handleCellClick(r, c) {
    if (aiSolving) return;
    
    let val = currentBoard[r][c];
    // Toggle: EMPTY -> SUN -> MOON -> EMPTY
    if (val === EMPTY) val = SUN;
    else if (val === SUN) val = MOON;
    else val = EMPTY;
    
    currentBoard[r][c] = val;
    renderGrid();
    checkBoardStatus();
}

function checkBoardStatus(aiSolved = false) {
    // Will be defined in solver.js
    const validation = window.validateBoard(currentBoard);
    
    if (validation.isValid && validation.isComplete) {
        setStatus('Puzzle solved!', 'success');
        highlightCells([], '', false); // clear errors
        
        // Show Modal
        if (aiSolved) {
            modalDesc.textContent = "The AI successfully solved the puzzle!";
        } else {
            modalDesc.textContent = "You completed the puzzle successfully!";
        }
        victoryModal.classList.add('active');
        
    } else if (!validation.isValid) {
        setStatus('Invalid placement detected', 'error');
        // Highlight errors
        renderGrid(); // Reset first to clear highlights
        
        // Wait a small tick then add error classes
        setTimeout(() => {
            if(validation.errorCells) {
                for (let cell of validation.errorCells) {
                    const el = document.querySelector(`.cell[data-row="${cell.r}"][data-col="${cell.c}"]`);
                    if(el) el.classList.add('error-highlight'); // will now use inner box-shadow so clue background remains
                }
            }
        }, 10);
    } else {
        setStatus('Keep going...', 'info');
    }
}

function highlightCells(cells, className, add) {
     if (!cells) return;
     // Helper just to clear all specific highlights if empty array passed
     if (cells.length === 0) renderGrid();
}

function setStatus(msg, type) {
    statusPanel.className = `status-panel ${type}`;
    statusMessage.textContent = msg;
}

function copyBoard(board) {
    return board.map(row => [...row]);
}

// Logging System
function clearLog() {
    logContent.innerHTML = '';
}

function logMessage(type, message) {
    const p = document.createElement('p');
    p.className = `log-entry ${type.toLowerCase()}`;
    p.textContent = `[${new Date().toLocaleTimeString().split(' ')[0]}] ${message}`;
    logContent.appendChild(p);
    logContent.scrollTop = logContent.scrollHeight;
}

window.logMessage = logMessage;
window.clearLog = clearLog;

// Event Listeners
btnReset.addEventListener('click', () => {
    if (aiSolving) return;
    currentBoard = copyBoard(initialBoard);
    renderGrid();
    setStatus('Board reset', 'info');
    clearLog();
    logMessage('System', 'Board reset back to clues.');
});

btnGenerate.addEventListener('click', () => {
    if (aiSolving) return;
    initGame();
    // Close modal if reset/generated
    victoryModal.classList.remove('active');
});

selectSize.addEventListener('change', () => {
    if (aiSolving) return;
    initGame();
     // Close modal if changed size
    victoryModal.classList.remove('active');
});

selectDifficulty.addEventListener('change', () => {
    if (aiSolving) return;
    initGame();
     // Close modal if changed difficulty
    victoryModal.classList.remove('active');
});

btnCheck.addEventListener('click', () => {
    if (aiSolving) return;
    checkBoardStatus();
});

// AI Solvers
btnSolve.addEventListener('click', () => {
    if (aiSolving) return;
    if (window.validateBoard(currentBoard).isValid === false) {
        setStatus('Board is currently invalid. Reset or fix errors first.', 'error');
        return;
    }
    
    clearLog();
    logMessage('System', 'Starting Instant AI Solver...');
    
    const startTime = performance.now();
    const solution = window.solveInstant(currentBoard);
    const endTime = performance.now();
    
    if (solution) {
        currentBoard = solution;
        renderGrid();
        setStatus(`Solved by AI in ${(endTime - startTime).toFixed(2)}ms`, 'success');
        logMessage('Win', 'Solution found and applied!');
        
        // Check board status will pop up modal
        checkBoardStatus(true);
    } else {
        setStatus('No solution exists for current board', 'error');
        logMessage('Fail', 'Solver exhausted all possibilities. No solution.');
    }
});

btnStep.addEventListener('click', async () => {
    if (aiSolving) return;
     if (window.validateBoard(currentBoard).isValid === false) {
        setStatus('Board is currently invalid. Reset or fix errors first.', 'error');
        return;
    }
    
    aiSolving = true;
    toggleControls(false);
    clearLog();
    setStatus('AI searching...', 'info');
    logMessage('System', 'Starting Step-by-Step AI Solver...');
    
    const success = await window.solveStepByStep(currentBoard, renderGridAndUpdateCell);
    
    aiSolving = false;
    toggleControls(true);
    
    if (success) {
        setStatus('Puzzle solved by AI!', 'success');
        logMessage('Win', 'Final solution reached!');
        // Trigger modal explicitly
        checkBoardStatus(true);
    } else {
        setStatus('No solution exists', 'error');
        logMessage('Fail', 'Backtracking complete. No solution found.');
    }
});

function toggleControls(enable) {
    btnCheck.disabled = !enable;
    btnSolve.disabled = !enable;
    btnStep.disabled = !enable;
    btnGenerate.disabled = !enable;
    btnReset.disabled = !enable;
    selectSize.disabled = !enable;
    selectDifficulty.disabled = !enable;
}

function renderGridAndUpdateCell(r, c) {
    renderGrid();
    if (r !== undefined && c !== undefined) {
        const el = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (el) el.classList.add('active-ai');
    }
}

// Initial Boot
// wait for DOM and other scripts to load completely
window.addEventListener('load', () => {
    // We defer initGame just slightly in case puzzleGenerator isn't parsed first in some weird cases
    setTimeout(initGame, 50);
});

// Modal Close Event
btnModalClose.addEventListener('click', () => {
    victoryModal.classList.remove('active');
});

// Theme Toggle Event
themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Toggle Light Mode';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Toggle Dark Mode';
    }
});
