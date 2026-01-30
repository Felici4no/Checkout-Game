import { GameState } from './GameState';

export class TimeSystem {
    private gameState: GameState;
    private intervalId: number | null = null;
    private readonly DAY_DURATION_MS = 20000; // 20 seconds = 1 game day
    private elapsedTime = 0;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    start(): void {
        if (this.intervalId !== null) return;

        this.intervalId = window.setInterval(() => {
            if (this.gameState.data.isPaused) return;

            this.elapsedTime += 100;

            if (this.elapsedTime >= this.DAY_DURATION_MS) {
                this.elapsedTime = 0;
                this.onDayEnd();
            }
        }, 100);
    }

    stop(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private onDayEnd(): void {
        // For M1, just advance the day and simulate cash change
        this.gameState.advanceDay();

        // Simple simulation: random cash change for demo
        const change = Math.floor(Math.random() * 100) - 30;
        this.gameState.updateCash(change);

        this.gameState.trackNegativeDay();

        // Check bankruptcy
        if (this.gameState.isBankrupt()) {
            this.stop();
            this.gameState.emit('game-over');
        }
    }

    getProgress(): number {
        return (this.elapsedTime / this.DAY_DURATION_MS) * 100;
    }
}
