import './style.css';
import { GameState } from './game/GameState';
import { TimeSystem } from './game/TimeSystem';
import { EconomyEngine } from './game/EconomyEngine';
import { EventSystem } from './game/EventSystem';
import { IncomingStockSystem } from './game/IncomingStockSystem';
import { MarketingSystem } from './game/MarketingSystem';
import { CapacitySystem } from './game/CapacitySystem';
// Challenge system disabled for infinite mode
// import { ChallengeSystem, ChallengeType } from './game/ChallengeSystem';
import { Desktop } from './ui/Desktop';
import { SystemClock } from './ui/SystemClock';
import { DayProgressBar } from './ui/DayProgressBar';
import { DayTransitionOverlay } from './ui/DayTransitionOverlay';
import { GameOverModal } from './ui/GameOverModal';
import { EventPopup } from './ui/EventPopup';
import { ViralPopup } from './ui/ViralPopup';
// import { VictoryModal } from './ui/VictoryModal'; // Disabled
// import { ChallengeSelector } from './ui/ChallengeSelector'; // Disabled
import { StoreOnboarding } from './ui/StoreOnboarding';
import { CheckoutApp } from './apps/CheckoutApp';
import { BankApp } from './apps/BankApp';
import { MarketingApp } from './apps/MarketingApp';
import { CapacityApp } from './apps/CapacityApp';

class Game {
    private gameState: GameState;
    private timeSystem: TimeSystem;
    private economyEngine: EconomyEngine;
    private eventSystem: EventSystem;
    private incomingStockSystem: IncomingStockSystem;
    private marketingSystem: MarketingSystem;
    private capacitySystem: CapacitySystem;
    private challengeSystem: ChallengeSystem | null = null;
    private desktop: Desktop;
    private checkoutApp: CheckoutApp;
    private bankApp: BankApp;
    private marketingApp: MarketingApp;
    private capacityApp: CapacityApp;
    private desktopElement: HTMLElement | null = null;
    private systemClock: SystemClock | null = null;
    private dayProgressBar: DayProgressBar;
    private dayTransitionOverlay: DayTransitionOverlay;

    constructor() {
        // Show onboarding first
        this.showStoreOnboarding();
    }

    private showStoreOnboarding(): void {
        const app = document.querySelector<HTMLDivElement>('#app')!;

        console.log('[DEBUG] Creating StoreOnboarding...');
        const onboarding = new StoreOnboarding((storeName: string, domain: string) => {
            console.log('[DEBUG] Onboarding completed!', { storeName, domain });
            this.initializeGame(storeName, domain);
        });

        onboarding.show(app);
        console.log('[DEBUG] Onboarding shown');
    }

    private initializeGame(storeName: string, domain: string): void {
        console.log('[DEBUG] Initializing game...', { storeName, domain });
        // Initialize core systems
        this.gameState = new GameState();

        // Set store profile from onboarding
        this.gameState.setStoreProfile(storeName, domain);

        this.economyEngine = new EconomyEngine(this.gameState);
        this.eventSystem = new EventSystem(this.gameState, this.economyEngine);
        this.incomingStockSystem = new IncomingStockSystem(this.gameState);
        this.marketingSystem = new MarketingSystem(this.gameState);
        this.capacitySystem = new CapacitySystem(this.gameState);

        // Challenge system disabled for infinite mode
        // this.challengeSystem = new ChallengeSystem(this.gameState, 'none');
        this.challengeSystem = null;

        this.timeSystem = new TimeSystem(this.gameState);
        this.timeSystem.setEconomyEngine(this.economyEngine);
        this.timeSystem.setEventSystem(this.eventSystem);

        // Connect systems
        this.economyEngine.setIncomingStockSystem(this.incomingStockSystem);
        this.economyEngine.setMarketingSystem(this.marketingSystem);
        this.economyEngine.setCapacitySystem(this.capacitySystem);

        // Store systems in gameState for UI access
        (this.gameState as any).incomingStockSystem = this.incomingStockSystem;
        (this.gameState as any).capacitySystem = this.capacitySystem;
        (this.gameState as any).economyEngine = this.economyEngine;
        // (this.gameState as any).challengeSystem = this.challengeSystem; // Disabled

        // Build UI
        this.desktop = new Desktop();
        this.checkoutApp = new CheckoutApp(this.gameState, this.economyEngine);
        this.bankApp = new BankApp(this.gameState);
        this.marketingApp = new MarketingApp(this.gameState, this.marketingSystem);
        this.capacityApp = new CapacityApp(this.gameState, this.capacitySystem);
        this.dayProgressBar = new DayProgressBar();
        this.dayTransitionOverlay = new DayTransitionOverlay();

        this.setupUI();
        this.start();
    }

    private setupUI(): void {
        const app = document.querySelector<HTMLDivElement>('#app')!;

        console.log('[DEBUG] Setting up UI...');

        // Clear onboarding screen
        app.innerHTML = '';

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
        this.desktop.appendChild(this.capacityApp.getWindow().getElement());
        this.checkoutApp.getWindow().hide();
        this.bankApp.getWindow().hide();
        this.marketingApp.getWindow().hide();
        this.capacityApp.getWindow().hide();

        // Add day progress bar to desktop
        this.desktopElement.appendChild(this.dayProgressBar.getElement());

        // Add day transition overlay to desktop
        this.desktopElement.appendChild(this.dayTransitionOverlay.getElement());

        monitorFrame.appendChild(monitorScreen);
        app.appendChild(monitorFrame);

        console.log('[DEBUG] UI setup complete');

        // Get system clock reference from desktop
        const systemTray = this.desktopElement.querySelector('.system-tray');
        if (systemTray) {
            this.systemClock = (this.desktop as any).systemClock;
        }

        // Add desktop icons
        this.desktop.addIcon('Checkout', '💼', () => {
            this.bankApp.getWindow().hide();
            this.marketingApp.getWindow().hide();
            this.capacityApp.getWindow().hide();
            this.checkoutApp.show();
        });

        this.desktop.addIcon('Banco', '🏦', () => {
            this.checkoutApp.getWindow().hide();
            this.marketingApp.getWindow().hide();
            this.capacityApp.getWindow().hide();
            this.bankApp.show();
        });

        this.desktop.addIcon('Marketing', '📢', () => {
            this.checkoutApp.getWindow().hide();
            this.bankApp.getWindow().hide();
            this.capacityApp.getWindow().hide();
            this.marketingApp.show();
        });

        this.desktop.addIcon('Capacidade', '⚙️', () => {
            this.checkoutApp.getWindow().hide();
            this.bankApp.getWindow().hide();
            this.marketingApp.getWindow().hide();
            this.capacityApp.show();
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
            // Victory disabled for infinite mode
            // this.checkVictory();
        });
    }

    // Victory checking disabled for infinite mode
    /*
    private checkVictory(): void {
        if (!this.challengeSystem || !this.challengeSystem.hasActiveChallenge()) return;

        if (this.challengeSystem.checkVictory()) {
            this.handleVictory();
        }
    }

    private handleVictory(): void {
        if (!this.desktopElement || !this.challengeSystem) return;

        const challenge = this.challengeSystem.getActiveChallenge();
        const state = this.gameState.data;

        const modal = new VictoryModal(
            challenge.name,
            {
                days: state.currentDay,
                revenue: state.totalRevenue,
                cash: state.cash,
                reputation: state.reputation,
            },
            () => {
                // Continue playing (just close modal)
            },
            () => {
                // Restart game
                window.location.reload();
            }
        );

        modal.show(this.desktopElement);
    }
    */

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
