// Puzzle Generator

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.generateBoard = function(size, difficulty) {
    let emptyBoard = Array.from({length: size}, () => Array(size).fill(EMPTY));
    
    // Instead of completely random which might take long,
    // we use a modified solver that shuffles the symbol order to try.
    function solveRandom(b) {
        let nextEmpty = null;
        outer: for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (b[r][c] === EMPTY) {
                    nextEmpty = {r, c};
                    break outer;
                }
            }
        }
        
        if (!nextEmpty) return true; // complete
        
        const {r, c} = nextEmpty;
        
        // Randomize whether we try SUN or MOON first
        const symbols = shuffleArray([SUN, MOON]);
        
        for (let symbol of symbols) {
            b[r][c] = symbol;
            if (window.validateBoard(b).isValid) {
                if (solveRandom(b)) return true;
            }
        }
        
        b[r][c] = EMPTY;
        return false;
    }
    
    // We can pre-fill a couple of random cells to ensure entirely different seeds
    emptyBoard[0][Math.floor(Math.random() * size)] = Math.random() > 0.5 ? SUN : MOON;
    if(size >= 6) {
        emptyBoard[size-1][Math.floor(Math.random() * size)] = Math.random() > 0.5 ? SUN : MOON;
    }

    solveRandom(emptyBoard);
    
    // Now we have a FULL valid board. Let's punch holes.
    let fillLevels = {
        'easy': 0.6,
        'medium': 0.45,
        'hard': 0.3
    };
    
    let targetFilled = Math.floor(size * size * fillLevels[difficulty]);
    let cells = [];
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
            cells.push({r, c});
        }
    }
    
    shuffleArray(cells);
    
    let removed = 0;
    let cellsToRemove = (size * size) - targetFilled;
    
    // We just remove random cells (for a real puzzle game we'd ensure unique solutions,
    // but for our CSP demo this is sufficient)
    for(let i=0; i<cellsToRemove; i++) {
        let cell = cells[i];
        emptyBoard[cell.r][cell.c] = EMPTY;
    }
    
    return emptyBoard;
};
