import { useEffect, useState } from "react";
import { Board } from "./components/Board";
import { ControlsMenu } from "./components/ControlsMenu";
import { GameOverlay } from "./components/GameOverlay";
import { Header } from "./components/Header";
import {
  chord,
  createGame,
  remainingMineCount,
  reveal,
  toggleFlag,
} from "./engine/engine";
import type { Difficulty } from "./engine/types";
import {
  IndexedDbStatsStore,
  type DifficultySummary,
} from "./stats/statsStore";
import "./App.css";

const statsStore = new IndexedDbStatsStore();

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [game, setGame] = useState(() => createGame(difficulty));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [summary, setSummary] = useState<DifficultySummary | null>(null);

  const startNewGame = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty);
    setGame(createGame(nextDifficulty));
    setElapsedSeconds(0);
  };

  useEffect(() => {
    statsStore
      .getSummary(difficulty)
      .then(setSummary)
      .catch((error: unknown) => {
        console.error("Failed to load stats summary", error);
      });
  }, [difficulty]);

  useEffect(() => {
    if (game.status !== "playing" || game.startTime === null) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - game.startTime!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [game.status, game.startTime]);

  useEffect(() => {
    if (game.status !== "won" && game.status !== "lost") return;
    const elapsedMs =
      game.endTime !== null && game.startTime !== null
        ? game.endTime - game.startTime
        : 0;
    statsStore
      .recordResult(difficulty, {
        won: game.status === "won",
        elapsedMs,
        timestamp: Date.now(),
      })
      .then(() => statsStore.getSummary(difficulty))
      .then(setSummary)
      .catch((error: unknown) => {
        console.error("Failed to record stats result", error);
      });
  }, [game.status, game.endTime, game.startTime, difficulty]);

  const gameOver = game.status === "won" || game.status === "lost";

  return (
    <main className="app">
      <div className="app__content" inert={gameOver || undefined}>
        <Header
          minesRemaining={remainingMineCount(game)}
          elapsedSeconds={elapsedSeconds}
          status={game.status}
        />
        <ControlsMenu
          difficulty={difficulty}
          summary={summary}
          onNewGame={() => startNewGame(difficulty)}
          onChangeDifficulty={startNewGame}
        />
        <div className="app__board-wrap">
          <Board
            game={game}
            onReveal={(row, col) => setGame((g) => reveal(g, row, col))}
            onFlag={(row, col) => setGame((g) => toggleFlag(g, row, col))}
            onChord={(row, col) => setGame((g) => chord(g, row, col))}
          />
        </div>
      </div>
      <GameOverlay
        status={game.status}
        elapsedSeconds={elapsedSeconds}
        onPlayAgain={() => startNewGame(difficulty)}
      />
    </main>
  );
}

export default App;
