import './style.css';
import { GameState } from './game/GameState';
import { TimeSystem } from './game/TimeSystem';
import { EconomyEngine } from './game/EconomyEngine';
import { EventSystem } from './game/EventSystem';
import { Desktop } from './ui/Desktop';
import { GameOverModal } from './ui/GameOverModal';
import { EventPopup } from './ui/EventPopup';
import { CheckoutApp } from './apps/CheckoutApp';
import { BankApp } from './apps/BankApp';

class Game {
    private gameState: GameState;
    private timeSystem: TimeSystem;
    private economyEngine: EconomyEngine;
    private eventSystem: EventSystem;
    private desktop: Desktop;
    private checkoutApp: CheckoutApp;
    private bankApp: BankApp;
    private desktopElement: HTMLElement | null = null;

    constructor() {
        // Initialize core systems
        this.gameState = new GameState();
        this.economyEngine = new EconomyEngine(this.gameState);
        this.eventSystem = new EventSystem(this.gameState, this.economyEngine);
        this.timeSystem = new TimeSystem(this.gameState);
        this.timeSystem.setEconomyEngine(this.economyEngine);
        this.timeSystem.setEventSystem(this.eventSystem);

        // Build UI
        this.desktop = new Desktop();
        this.checkoutApp = new CheckoutApp(this.gameState, this.economyEngine);
        this.bankApp = new BankApp(this.gameState);

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

        // Add windows to desktop (hidden initially)
        this.desktop.appendChild(this.checkoutApp.getWindow().getElement());
        this.desktop.appendChild(this.bankApp.getWindow().getElement());
        this.checkoutApp.getWindow().hide();
        this.bankApp.getWindow().hide();

        monitorFrame.appendChild(monitorScreen);
        app.appendChild(monitorFrame);

        // Add desktop icons
        this.desktop.addIcon('Checkout', '💼', () => {
            this.bankApp.getWindow().hide();
            this.checkoutApp.show();
        });

        this.desktop.addIcon('Banco', '🏦', () => {
            this.checkoutApp.getWindow().hide();
            this.bankApp.show();
        });
    }

    private start(): void {
        // Start time system
        this.timeSystem.start();

        // Listen for game over
        this.gameState.on('game-over', () => {
            this.handleGameOver();
        });

        // Listen for events
        this.gameState.on('event-occurred', () => {
            this.handleEvent();
        });
    }

    private handleEvent(): void {
        if (!this.desktopElement) return;
        const event = (this.gameState as any).lastEvent;
        if (!event) return;

        const popup = new EventPopup(event, () => {
            // Event acknowledged
        });
        popup.show(this.desktopElement);
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
