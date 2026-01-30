import './style.css';
import { GameState } from './game/GameState';
import { TimeSystem } from './game/TimeSystem';
import { Desktop } from './ui/Desktop';
import { CheckoutApp } from './apps/CheckoutApp';

class Game {
    private gameState: GameState;
    private timeSystem: TimeSystem;
    private desktop: Desktop;
    private checkoutApp: CheckoutApp;

    constructor() {
        // Initialize core systems
        this.gameState = new GameState();
        this.timeSystem = new TimeSystem(this.gameState);

        // Build UI
        this.desktop = new Desktop();
        this.checkoutApp = new CheckoutApp(this.gameState);

        this.setupUI();
        this.start();
    }

    private setupUI(): void {
        const app = document.querySelector<HTMLDivElement>('#app')!;

        // Create monitor frame
        const monitorFrame = document.createElement('div');
        monitorFrame.className = 'monitor-frame';

        const monitorScreen = document.createElement('div');
        monitorScreen.className = 'monitor-screen';

        // Add desktop to screen
        monitorScreen.appendChild(this.desktop.getElement());

        // Add Checkout window to desktop
        this.desktop.appendChild(this.checkoutApp.getWindow().getElement());

        monitorFrame.appendChild(monitorScreen);
        app.appendChild(monitorFrame);

        // Add desktop icon for Checkout
        this.desktop.addIcon('Checkout', '💼', () => {
            this.checkoutApp.show();
        });

        // Show Checkout app by default
        this.checkoutApp.show();
    }

    private start(): void {
        // Start time system
        this.timeSystem.start();

        // Listen for game over
        this.gameState.on('game-over', () => {
            this.handleGameOver();
        });
    }

    private handleGameOver(): void {
        alert(`BANKRUPTCY\n\nYour business has failed.\n\nDays Survived: ${this.gameState.data.currentDay}\nFinal Cash: $${this.gameState.data.cash.toFixed(2)}\n\nReload to try again.`);
    }
}

// Start the game
new Game();
