// pathUtils.js
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function updateCellClass(cell, isPath = false, context) {
  const canvas = document.getElementById(context.containerId);
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  const colors = SOLVER_COLORS[isPath ? 'path' : 'visited'];
  
  ctx.fillStyle = colors[context.colorIndex];
  ctx.fillRect(
    cell.i * cell.cellSize,
    cell.j * cell.cellSize,
    cell.cellSize,
    cell.cellSize
  );
}

export function getNeighbors(cell, grid, algorithm) {
  const neighbors = [];
  const directions = [
    { dx: 0, dy: -1, wallIndex: 0 }, // Top
    { dx: 1, dy: 0, wallIndex: 1 },  // Right
    { dx: 0, dy: 1, wallIndex: 2 },  // Bottom
    { dx: -1, dy: 0, wallIndex: 3 }  // Left
  ];

  directions.forEach(({ dx, dy, wallIndex }) => {
    if (!cell.walls[wallIndex]) {
      const ni = cell.i + dx;
      const nj = cell.j + dy;
      const idx = algorithm.index(ni, nj);
      if (idx !== -1) neighbors.push(grid[idx]);
    }
  });
  return neighbors;
}

export function reconstructPath(end) {
  const path = [];
  let current = end;
  while (current) {
    path.push(current);
    current = current.parent;
  }
  return path.reverse();
}

// Timing functions
let solveStartTime = null;

export function startSolveTimer() {
  solveStartTime = performance.now();
}

export function getSolveTime() {
  return ((performance.now() - solveStartTime) / 1000).toFixed(2);
}

export function clearSolverState(grid, context) {
  const canvas = document.getElementById(context.containerId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  grid.forEach(cell => {
    // Reset solver-related logical state
    cell.visited = false;
    cell.inPath = false;
    cell.parent = null;
    cell.distance = Infinity;
    cell.f = Infinity;
    cell.g = Infinity;
    cell.h = Infinity;
    cell.isFrontier = false;

    // Erase only the translucent overlay (red or blue tint) by redrawing the maze cell background
    // Fill with white so walls are still visible (if maze uses white background)
    ctx.clearRect(cell.i * cell.cellSize, cell.j * cell.cellSize, cell.cellSize, cell.cellSize);
    
    // Redraw the cell walls manually (non-destructively)
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    const x = cell.i * cell.cellSize;
    const y = cell.j * cell.cellSize;

    if (cell.walls[0]) { // top
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + cell.cellSize, y);
      ctx.stroke();
    }
    if (cell.walls[1]) { // right
      ctx.beginPath();
      ctx.moveTo(x + cell.cellSize, y);
      ctx.lineTo(x + cell.cellSize, y + cell.cellSize);
      ctx.stroke();
    }
    if (cell.walls[2]) { // bottom
      ctx.beginPath();
      ctx.moveTo(x + cell.cellSize, y + cell.cellSize);
      ctx.lineTo(x, y + cell.cellSize);
      ctx.stroke();
    }
    if (cell.walls[3]) { // left
      ctx.beginPath();
      ctx.moveTo(x, y + cell.cellSize);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  });
}
