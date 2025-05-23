import { sleep, updateCellClass, getNeighbors, reconstructPath, startSolveTimer, getSolveTime } from './pathUtils.js';

function heuristic(a, b) {
  // Manhattan distance
  return Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
}

export async function universalGreedyBFS(start, end, algorithm, abortController) {
  if (abortController.abort) {
    console.log("Solver aborted!");
    return;
  }
  startSolveTimer();
  const openSet = [start];
  const openSetSet = new Set([`${start.i},${start.j}`]);
  const visited = new Set();

  // Reset parents
  algorithm.grid.forEach(cell => cell.parent = null);

  while (openSet.length > 0) {
    if (abortController.abort) {
      console.log("Solver aborted during run!");
      return;
    }
    // Sort openSet based on heuristic to end
    openSet.sort((a, b) => heuristic(a, end) - heuristic(b, end));
    const current = openSet.shift();
    const currentKey = `${current.i},${current.j}`;
    openSetSet.delete(currentKey);

    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    current.visited = true;
    updateCellClass(current);
    await sleep(20);

    if (current === end) {
      const path = reconstructPath(end);
      for (const cell of path) {
        updateCellClass(cell, true);
        await sleep(30);
      }
      console.log(`✅ Path found in ${getSolveTime()}s`);
      return;
    }

    const neighbors = getNeighbors(current, algorithm.grid, algorithm);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.i},${neighbor.j}`;
      if (!visited.has(neighborKey) && !openSetSet.has(neighborKey)) {
        neighbor.parent = current;
        openSet.push(neighbor);
        openSetSet.add(neighborKey);
      }
    }
  }

  console.log("❌ No path found!");
}
