import { GameState } from '../game/GameState';

export interface SoftwareItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
}

export const AVAILABLE_SOFTWARE: SoftwareItem[] = [
    {
        id: 'stockbot',
        name: 'StockBot v1.0',
        description: 'Recompra automática de estoque quando < 20 unidades. Não verifica saldo.',
        price: 250,
        icon: '🤖',
    },
];

export class StockBot {
    private gameState: GameState;
    private threshold = 20; // Fixed threshold
    private isActive = false;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    activate(): void {
        this.isActive = true;
        this.gameState.emit('stockbot-activated');
    }

    isInstalled(): boolean {
        return this.isActive;
    }

    // Called every day after economy processing
    checkAndBuyStock(): { purchased: boolean; reason?: string } {
        if (!this.isActive) {
            return { purchased: false };
        }

        const state = this.gameState.data;

        // Simple logic: if stock < threshold, buy
        if (state.stock < this.threshold) {
            // StockBot is "dumb" - doesn't check if we have enough cash
            if (state.cash >= 100) {
                this.gameState.updateCash(-100);
                this.gameState.updateStock(50);
                return {
                    purchased: true,
                    reason: `StockBot: Estoque baixo (${state.stock}), comprando 50 unidades`
                };
            } else {
                // StockBot tries but fails - creates tension
                return {
                    purchased: false,
                    reason: `StockBot: Tentou comprar mas caixa insuficiente ($${state.cash.toFixed(2)})`
                };
            }
        }

        return { purchased: false };
    }

    getThreshold(): number {
        return this.threshold;
    }
}
