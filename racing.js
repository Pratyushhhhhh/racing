import * as prim from './prim.js';
import * as recdiv from './recdiv.js';
import * as dfs from './dfs.js';
import * as eller from './eller.js';
import * as kruskal from './kruskal.js';
import { universalBFS } from './universalBFS.js';
import { universalDijkstra } from './universalDijkstra.js';
import { universalAStar } from './universalAStar.js';
import { universalGreedyBFS } from './universalGreedyBFS.js';
import { universalWallFollower } from './universalWallFollower.js';
import { universalDFS } from './universalDFS.js';

const SOLVER_COLORS = {
  path: ['#FF6B6B', '#4ECDC4'], // Different colors for each solver
  visited: ['#FFE66D', '#45B7D1']
};


let raceType = 'generation';
let racing = false;
let commonMaze = null;
let abortControllers = [];

// DOM Event Listeners
document.getElementById('raceType').addEventListener('change', (e) => {
  raceType = e.target.value;
  document.getElementById('generationRace').style.display = 
    raceType === 'generation' ? 'flex' : 'none';
  document.getElementById('solvingRace').style.display = 
    raceType === 'solving' ? 'flex' : 'none';
});

document.getElementById('startRace').addEventListener('click', async () => {
  if (racing) return;
  racing = true;
  document.getElementById('startRace').disabled = true;
  
  try {
    if (raceType === 'generation') {
      await runGenerationRace();
    } else {
      await runSolvingRace();
    }
  } catch (error) {
    console.error('Race error:', error);
    document.getElementById('raceResult').innerHTML = 
      `<div class="loser">Error: ${error.message}</div>`;
  }
  
  document.getElementById('startRace').disabled = false;
  racing = false;
});

// Core Race Functions
async function runGenerationRace() {
  const algoSelects = document.querySelectorAll('#generationRace .gen-algo');
  if (algoSelects.length < 2) throw new Error('Missing algorithm selects');
  
  const [algo1, algo2] = [algoSelects[0].value, algoSelects[1].value];
  const [time1, time2] = await Promise.all([
    runGeneration(algo1, 1),
    runGeneration(algo2, 2)
  ]);
  
  showRaceResult(time1, time2, 'Generation');
}

// Fix the Promise.all syntax in runSolvingRace
async function runSolvingRace() {
  const genAlgo = document.getElementById('solvingMazeAlgo').value || 'dfs';
  commonMaze = await generateCommonMaze(genAlgo);
  
  const solverSelects = document.querySelectorAll('#solvingRace .solver-algo');
  const [solver1, solver2] = [solverSelects[0].value, solverSelects[1].value];
  
  const contexts = [
    { id: 1, solver: solver1, colorIndex: 0 },
    { id: 2, solver: solver2, colorIndex: 1 }
  ];

  // Fix missing closing paren
  const results = await Promise.all(contexts.map(ctx => 
    runSolver(ctx.solver, ctx.id, ctx.colorIndex)
  )); // Added closing paren
  
  showRaceResult(results[0].time, results[1].time, 'Solving');
}

// Generation Functions
async function runGeneration(algo, instanceNum) {
  const containerId = `canvas-container-${instanceNum}`;
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container ${containerId} not found`);
  
  container.innerHTML = ''; // Clear previous canvas
  
  return new Promise((resolve) => {
    const p5Instance = new p5((p) => {
      let startTime;
      let currentAlgo;
      
      p.setup = () => {
        const canvas = p.createCanvas(400, 400);
        canvas.parent(containerId);
        
        // Initialize selected algorithm
        switch(algo) {
          case 'prim': 
            currentAlgo = prim;
            prim.generateMaze(p, 400, 400);
            break;
          case 'eller': 
            currentAlgo = eller;
            eller.generateMaze(p, 400, 400);
            break;
          case 'kruskal': 
            currentAlgo = kruskal;
            kruskal.generateMaze(p, 400, 400);
            break;
          case 'recdiv':
            currentAlgo = recdiv;
            recdiv.generateMaze(p, 400, 400);
            break;
    
          default: 
            currentAlgo = dfs;
            dfs.generateMaze(p, 400, 400);
        }
        
        startTime = performance.now();
      };

      p.draw = () => {
        currentAlgo.mazeDraw(p);
        if (currentAlgo.isComplete?.()) {
          const endTime = performance.now();
          p.noLoop();
          resolve((endTime - startTime) / 1000);
        }
      };
    });

    abortControllers.push(() => {
      p5Instance.remove();
      container.innerHTML = '';
    });
  });
}

// Solving Functions
async function generateCommonMaze(algo) {
  return new Promise((resolve) => {
    const p5Instance = new p5((p) => {
      p.setup = () => {
        switch(algo) {
          case 'prim': prim.generateMaze(p, 400, 400); break;
          case 'eller': eller.generateMaze(p, 400, 400); break;
          case 'kruskal': kruskal.generateMaze(p, 400, 400); break;
          default: dfs.generateMaze(p, 400, 400);
        }
      };

      p.draw = () => {
        if (p5Instance[algo]?.isComplete?.()) {
          resolve(p5Instance[algo]);
          p.noLoop();
          p.remove();
        }
      };
    });
  });
}


async function runSolver(solver, instanceNum, colorIndex) {
  const containerId = `solver-canvas-${instanceNum}`;
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container ${containerId} not found`);

  container.innerHTML = '';
  const start = commonMaze.grid[0];
  const end = commonMaze.grid[commonMaze.grid.length - 1];
  const abortController = { abort: false };

  return new Promise(async (resolve) => {
    const p5Instance = new p5((p) => {
      p.setup = () => {
        const canvas = p.createCanvas(400, 400);
        canvas.parent(containerId);
        p.frameRate(60);
      };
    });

    const solverContext = {
      colorIndex,
      containerId,
      maze: commonMaze,
      abort: abortController
    };

    const startTime = performance.now();
    let success = false;
    
    try {
      switch(solver) {
        case 'bfs': 
          await universalBFS(start, end, solverContext);
          break;
        // Add other solvers similarly
      }
      success = true;
    } catch (e) {
      console.error(`${solver} failed:`, e);
    }

    const solveTime = (performance.now() - startTime) / 1000;
    p5Instance.remove();
    resolve({ time: solveTime, success });
  });
}
// Helper Functions
function showRaceResult(time1, time2, type) {
  const resultDiv = document.getElementById('raceResult');
  resultDiv.innerHTML = `
    <h3>${type} Race Results</h3>
    <div class="${time1 < time2 ? 'winner' : 'loser'}">
      Participant 1: ${time1.toFixed(2)}s
    </div>
    <div class="${time2 < time1 ? 'winner' : 'loser'}">
      Participant 2: ${time2.toFixed(2)}s
    </div>
    <h4>Winner: ${time1 < time2 ? 'Participant 1' : 'Participant 2'}</h4>
  `;
}

// Cleanup
window.addEventListener('beforeunload', () => {
  abortControllers.forEach(abort => abort());
});