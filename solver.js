// Constraints & Solver

window.validateBoard = function(board) {
    const size = board.length;
    let isValid = true;
    let isComplete = true;
    let errorCells = [];
    
    const half = size / 2;
    
    for (let i = 0; i < size; i++) {
        let rowSuns = 0, rowMoons = 0;
        let colSuns = 0, colMoons = 0;
        
        for (let j = 0; j < size; j++) {
            // Check Row Counts
            if (board[i][j] === SUN) rowSuns++;
            if (board[i][j] === MOON) rowMoons++;
            if (board[i][j] === EMPTY) isComplete = false;
            
            // Check Col Counts
            if (board[j][i] === SUN) colSuns++;
            if (board[j][i] === MOON) colMoons++;
            
            // Adjacency Constraints (Row)
            if (j >= 2) {
                if (board[i][j] !== EMPTY && 
                    board[i][j] === board[i][j-1] && 
                    board[i][j] === board[i][j-2]) {
                    isValid = false;
                    errorCells.push({r: i, c: j}, {r: i, c: j-1}, {r: i, c: j-2});
                }
            }
            
            // Adjacency Constraints (Col)
            if (j >= 2) {
                if (board[j][i] !== EMPTY && 
                    board[j][i] === board[j-1][i] && 
                    board[j][i] === board[j-2][i]) {
                    isValid = false;
                    // Note: j is row, i is col
                    errorCells.push({r: j, c: i}, {r: j-1, c: i}, {r: j-2, c: i});
                }
            }
        }
        
        if (rowSuns > half || rowMoons > half) {
            isValid = false;
            // Highlight entire row
            for(let c=0; c<size; c++) if(board[i][c] !== EMPTY) errorCells.push({r: i, c: c});
        }
        if (colSuns > half || colMoons > half) {
            isValid = false;
            // Highlight entire col
            for(let r=0; r<size; r++) if(board[r][i] !== EMPTY) errorCells.push({r: r, c: i});
        }
    }
    
    // Deduplicate error cells
    const uniqueErrors = [];
    const seen = new Set();
    for (let c of errorCells) {
        const key = `${c.r},${c.c}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueErrors.push(c);
        }
    }
    
    return {
        isValid,
        isComplete,
        errorCells: uniqueErrors
    };
};

function copyBoardLocal(board) {
    return board.map(row => [...row]);
}

window.solveInstant = function(board) {
    const size = board.length;
    let b = copyBoardLocal(board);
    
    function solve() {
        // Find empty
        let nextEmpty = null;
        outer: for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (b[r][c] === EMPTY) {
                    nextEmpty = {r, c};
                    break outer;
                }
            }
        }
        
        if (!nextEmpty) {
            return window.validateBoard(b).isValid; // Complete!
        }
        
        const {r, c} = nextEmpty;
        
        for (let symbol of [SUN, MOON]) {
            b[r][c] = symbol;
            if (window.validateBoard(b).isValid) {
                if (solve()) return true;
            }
        }
        
        b[r][c] = EMPTY; // Backtrack
        return false;
    }
    
    if (solve()) {
        return b;
    }
    return null;
};

const delay = ms => new Promise(res => setTimeout(res, ms));

window.solveStepByStep = async function(board, renderCallback) {
    const size = board.length;
    const speed = 150; // ms
    
    async function solve() {
        // Find empty
        let nextEmpty = null;
        outer: for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === EMPTY) {
                    nextEmpty = {r, c};
                    break outer;
                }
            }
        }
        
        if (!nextEmpty) return true;
        
        const {r, c} = nextEmpty;
        
        for (let symbol of [SUN, MOON]) {
            board[r][c] = symbol;
            
            const symbolName = symbol === SUN ? '☀' : '🌙';
            window.logMessage('Try', `Trying (Row ${r+1}, Col ${c+1}) = ${symbolName}`);
            
            renderCallback(r, c);
            await delay(speed);
            
            if (window.validateBoard(board).isValid) {
                window.logMessage('Success', `Constraint satisfied on (Row ${r+1}, Col ${c+1}) = ${symbolName}`);
                if (await solve()) return true;
            } else {
                 window.logMessage('Fail', `Constraint failed on (Row ${r+1}, Col ${c+1}) = ${symbolName}`);
            }
        }
        
        board[r][c] = EMPTY;
        window.logMessage('Backtrack', `Backtracking from (Row ${r+1}, Col ${c+1})...`);
        renderCallback(r, c);
        await delay(speed/2);
        
        return false;
    }
    
    return await solve();
};
