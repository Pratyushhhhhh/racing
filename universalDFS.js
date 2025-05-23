import { sleep, updateCellClass, getNeighbors, reconstructPath, startSolveTimer, getSolveTime } from './pathUtils.js';

export async function universalDFS(start, end, algorithm, abortController) {
  if (abortController.abort) {
    console.log("Solver aborted!");
    return;
  }
  startSolveTimer();
  const stack = [start];
  const visited = new Set();
  algorithm.grid.forEach(cell => cell.parent = null);

  while (stack.length > 0) {
    if (abortController.abort) {
      console.log("Solver aborted during run!");
      return;
    }
    const current = stack.pop();

    if (visited.has(current)) continue;
    visited.add(current);

    current.visited = true;
    updateCellClass(current);
    await sleep(20);

    // Early exit if end found
    if (current === end) {
      const path = reconstructPath(end);
      for (const cell of path) {
        updateCellClass(cell, true);
        await sleep(30);
      }
      return;
    }

    // Get neighbors in natural order (no reverse)
    const neighbors = getNeighbors(current, algorithm.grid, algorithm);
    
    // Process neighbors in standard order
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        neighbor.parent = current;
        stack.push(neighbor);
      }
    });
  }
  console.log("No path found!");
}