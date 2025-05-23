import { sleep, updateCellClass, getNeighbors, reconstructPath, startSolveTimer, getSolveTime } from './pathUtils.js';


export async function universalBFS(start, end, algorithm, abortController) {
  if (abortController.abort) {
    console.log("Solver aborted!");
    return;
  }
  startSolveTimer();
  algorithm.grid.forEach(cell => cell.parent = null);
  const queue = [start];
  const visited = new Set();

  while (queue.length > 0) {
    if (abortController.abort) {
      console.log("Solver aborted during run!");
      return;
    }

    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    updateCellClass(current);

    // Check abort before awaiting
    if (abortController.abort) {
      console.log("Solver aborted before sleep!");
      return;
    }
    await sleep(20);

    if (current === end) {
      const path = reconstructPath(end);
      for (const cell of path) {
        if (abortController.abort) {
          console.log("Solver aborted while drawing path!");
          return;
        }
        updateCellClass(cell, true);
        await sleep(30);
      }
      return;
    }

    const neighbors = getNeighbors(current, algorithm.grid, algorithm);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        neighbor.parent = current;
        queue.push(neighbor);
      }
    }
  }
  console.log("No path found!");
}
