import { GameState } from './GameState';
import { EconomyEngine } from './EconomyEngine';
import { EventSystem } from './EventSystem';

export class TimeSystem {
    private gameState: GameState;
    private economyEngine: EconomyEngine | null = null;
    private eventSystem: EventSystem | null = null;
    private intervalId: number | null = null;
    private readonly DAY_DURATION_MS = 20000; // 20 seconds = 1 game day
    private elapsedTime = 0;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    setEconomyEngine(engine: EconomyEngine): void {
        this.economyEngine = engine;
    }

    setEventSystem(system: EventSystem): void {
        this.eventSystem = system;
    }

    start(): void {
        if (this.intervalId !== null) return;

        this.intervalId = window.setInterval(() => {
            if (this.gameState.data.isPaused) return;

            this.elapsedTime += 100;

            // Emit progress update
            this.gameState.emit('time-progress');

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
        // Emit day-end event BEFORE processing (for visual ritual)
        this.gameState.emit('day-ending');

        // Small delay for visual ritual
        setTimeout(() => {
            // Advance the day
            this.gameState.advanceDay();

            // Process economy (M2: deterministic, no random changes)
            if (this.economyEngine) {
                this.economyEngine.processDailyEconomy();
            }

            // Check for random events
            if (this.eventSystem) {
                const event = this.eventSystem.checkForEvent();
                if (event) {
                    this.eventSystem.triggerEvent(event);
                    // Emit event with data for popup
                    this.gameState.emit('event-occurred');
                    (this.gameState as any).lastEvent = event; // Store for popup
                }
            }

            this.gameState.trackNegativeDay();

            // Check bankruptcy
            if (this.gameState.isBankrupt()) {
                this.stop();
                this.gameState.emit('game-over');
            }
        }, 100);
    }

    getProgress(): number {
        return (this.elapsedTime / this.DAY_DURATION_MS) * 100;
    }
}
