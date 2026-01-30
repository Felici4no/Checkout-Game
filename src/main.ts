import './style.css';
import { GameState } from './game/GameState';
import { TimeSystem } from './game/TimeSystem';
import { EconomyEngine } from './game/EconomyEngine';
import { EventSystem } from './game/EventSystem';
import { StockBot } from './game/StockBot';
import { MarketingSystem } from './game/MarketingSystem';
import { Desktop } from './ui/Desktop';
import { SystemClock } from './ui/SystemClock';
import { DayProgressBar } from './ui/DayProgressBar';
import { DayTransitionOverlay } from './ui/DayTransitionOverlay';
import { GameOverModal } from './ui/GameOverModal';
import { EventPopup } from './ui/EventPopup';
import { ViralPopup } from './ui/ViralPopup';
import { CheckoutApp } from './apps/CheckoutApp';
import { BankApp } from './apps/BankApp';
import { MarketingApp } from './apps/MarketingApp';

class Game {
    private gameState: GameState;
    private timeSystem: TimeSystem;
    private economyEngine: EconomyEngine;
    private eventSystem: EventSystem;
    private stockBot: StockBot;
    private marketingSystem: MarketingSystem;
    private desktop: Desktop;
    private checkoutApp: CheckoutApp;
    private bankApp: BankApp;
    private marketingApp: MarketingApp;
    private desktopElement: HTMLElement | null = null;
    private systemClock: SystemClock | null = null;
    private dayProgressBar: DayProgressBar;
    private dayTransitionOverlay: DayTransitionOverlay;

    constructor() {
        // Initialize core systems
        this.gameState = new GameState();
        this.economyEngine = new EconomyEngine(this.gameState);
        this.eventSystem = new EventSystem(this.gameState, this.economyEngine);
        this.stockBot = new StockBot(this.gameState);
        this.marketingSystem = new MarketingSystem(this.gameState);
        this.timeSystem = new TimeSystem(this.gameState);
        this.timeSystem.setEconomyEngine(this.economyEngine);
        this.timeSystem.setEventSystem(this.eventSystem);

        // Connect systems
        this.economyEngine.setStockBot(this.stockBot);
        this.economyEngine.setMarketingSystem(this.marketingSystem);

        // Build UI
        this.desktop = new Desktop();
        this.checkoutApp = new CheckoutApp(this.gameState, this.economyEngine, this.stockBot);
        this.bankApp = new BankApp(this.gameState);
        this.marketingApp = new MarketingApp(this.gameState, this.marketingSystem);
        this.dayProgressBar = new DayProgressBar();
        this.dayTransitionOverlay = new DayTransitionOverlay();

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
        this.desktop.appendChild(this.marketingApp.getWindow().getElement());
        this.checkoutApp.getWindow().hide();
        this.bankApp.getWindow().hide();
        this.marketingApp.getWindow().hide();

        // Add day progress bar to desktop
        this.desktopElement.appendChild(this.dayProgressBar.getElement());

        // Add day transition overlay to desktop
        this.desktopElement.appendChild(this.dayTransitionOverlay.getElement());

        monitorFrame.appendChild(monitorScreen);
        app.appendChild(monitorFrame);

        // Get system clock reference from desktop
        const systemTray = this.desktopElement.querySelector('.system-tray');
        if (systemTray) {
            this.systemClock = (this.desktop as any).systemClock;
        }

        // Add desktop icons
        this.desktop.addIcon('Checkout', '💼', () => {
            this.bankApp.getWindow().hide();
            this.marketingApp.getWindow().hide();
            this.checkoutApp.show();
        });

        this.desktop.addIcon('Banco', '🏦', () => {
            this.checkoutApp.getWindow().hide();
            this.marketingApp.getWindow().hide();
            this.bankApp.show();
        });

        this.desktop.addIcon('Marketing', '📢', () => {
            this.checkoutApp.getWindow().hide();
            this.bankApp.getWindow().hide();
            this.marketingApp.show();
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

        // Listen for viral events
        this.gameState.on('viral-occurred', () => {
            this.handleViralEvent();
        });

        // Listen for time progress
        this.gameState.on('time-progress', () => {
            this.updateDayProgress();
        });

        // Listen for day ending
        this.gameState.on('day-ending', () => {
            this.handleDayEnding();
        });

        // Listen for day changed (after economy processing)
        this.gameState.on('day-changed', () => {
            this.handleDayChanged();
        });
    }

    private updateDayProgress(): void {
        const progress = this.timeSystem.getProgress();
        this.dayProgressBar.updateProgress(progress);
    }

    private handleDayEnding(): void {
        // Visual feedback: flash clock and progress bar
        if (this.systemClock) {
            this.systemClock.flash();
        }
        this.dayProgressBar.flash();
    }

    private handleDayChanged(): void {
        // Show day transition overlay with summary
        const summary = this.economyEngine.lastDailySummary;
        this.dayTransitionOverlay.show(this.gameState.data.currentDay, summary);
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

    private handleViralEvent(): void {
        if (!this.desktopElement) return;
        const message = (this.gameState as any).lastViralMessage;
        if (!message) return;

        const popup = new ViralPopup(message, () => {
            // Viral acknowledged
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
