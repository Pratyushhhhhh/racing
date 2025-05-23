// universalAStar.js
import { sleep, updateCellClass, getNeighbors, reconstructPath, startSolveTimer, getSolveTime } from './pathUtils.js';
import { startTimer, stopTimer, updateInfo } from './mazeInfo.js';

function heuristic(a, b) {
  return Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
}
// universalAStar.js - A* Algorithm implementation

export async function universalAStar(start, end, context) {
  const { colorIndex, containerId, maze } = context;
  const abortController = context.abort || { abort: false };
  
  if (abortController.abort) return;

  const openSet = [start];
  const gScore = new Map();
  const fScore = new Map();

  maze.grid.forEach(cell => {
    gScore.set(cell, Infinity);
    fScore.set(cell, Infinity);
    cell.parent = null;
  });

  gScore.set(start, 0);
  fScore.set(start, heuristic(start, end));

  while (openSet.length > 0) {
    if (abortController.abort) return;
    
    openSet.sort((a, b) => fScore.get(a) - fScore.get(b));
    const current = openSet.shift();

    current.visited = true;
    updateCellClass(current, false, { colorIndex, containerId });
    await sleep(20);

    if (current === end) {
      const path = reconstructPath(end);
      for (const cell of path) {
        updateCellClass(cell, true, { colorIndex, containerId });
        await sleep(30);
      }
      return;
    }

    const neighbors = getNeighbors(current, maze.grid, maze);
    for (const neighbor of neighbors) {
      const tentativeGScore = gScore.get(current) + 1;
      if (tentativeGScore < gScore.get(neighbor)) {
        neighbor.parent = current;
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor, end));
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  throw new Error("No path found!");
}