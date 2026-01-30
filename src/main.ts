import './style.css';
import { GameState } from './game/GameState';
import { TimeSystem } from './game/TimeSystem';
import { Desktop } from './ui/Desktop';
import { GameOverModal } from './ui/GameOverModal';
import { CheckoutApp } from './apps/CheckoutApp';

class Game {
    private gameState: GameState;
    private timeSystem: TimeSystem;
    private desktop: Desktop;
    private checkoutApp: CheckoutApp;
    private desktopElement: HTMLElement | null = null;

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
        this.desktopElement = this.desktop.getElement();
        monitorScreen.appendChild(this.desktopElement);

        // Add Checkout window to desktop (hidden initially)
        this.desktop.appendChild(this.checkoutApp.getWindow().getElement());
        this.checkoutApp.getWindow().hide();

        monitorFrame.appendChild(monitorScreen);
        app.appendChild(monitorFrame);

        // Add desktop icon for Checkout
        this.desktop.addIcon('Checkout', '💼', () => {
            this.checkoutApp.show();
        });
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
        if (!this.desktopElement) return;

        const modal = new GameOverModal(this.gameState, () => {
            window.location.reload();
        });

        modal.show(this.desktopElement);
    }
}

// Start the game
new Game();
