import { GameState } from './GameState';

export interface ProcessResult {
    processed: number;
    overflow: number;
    lostToCapacity: number;
}

export class CapacitySystem {
    private gameState: GameState;
    private baseCapacity = 20; // Base: 20 orders/day
    private expansions = 0; // Number of warehouse expansions (max 2)
    private overflowYesterday = 0; // Overflow from previous day
    private overflowToday = 0; // Overflow created today

    private readonly EXPANSION_COSTS = [500, 900]; // Progressive costs
    private readonly CAPACITY_PER_EXPANSION = 20;
    private readonly MAX_EXPANSIONS = 2;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    getCapacity(): number {
        return this.baseCapacity + (this.expansions * this.CAPACITY_PER_EXPANSION);
    }

    getExpansions(): number {
        return this.expansions;
    }

    getNextExpansionCost(): number | null {
        if (this.expansions >= this.MAX_EXPANSIONS) {
            return null;
        }
        return this.EXPANSION_COSTS[this.expansions];
    }

    canExpand(): boolean {
        return this.expansions < this.MAX_EXPANSIONS;
    }

    purchaseExpansion(): { success: boolean; message: string } {
        if (!this.canExpand()) {
            return { success: false, message: 'Capacidade máxima atingida' };
        }

        const cost = this.getNextExpansionCost()!;
        if (this.gameState.data.cash < cost) {
            return { success: false, message: `Caixa insuficiente ($${cost})` };
        }

        this.gameState.updateCash(-cost);
        this.expansions++;

        const newCapacity = this.getCapacity();
        return {
            success: true,
            message: `🏭 Warehouse Expansion ${this.expansions}/2 comprado! Capacidade: ${newCapacity} pedidos/dia`
        };
    }

    processOrders(potentialOrders: number): ProcessResult {
        const capacity = this.getCapacity();
        let remainingCapacity = capacity;
        let processed = 0;
        let lostToCapacity = 0;

        // Priority 1: Process overflow from yesterday
        if (this.overflowYesterday > 0) {
            const processedFromYesterday = Math.min(this.overflowYesterday, remainingCapacity);
            processed += processedFromYesterday;
            remainingCapacity -= processedFromYesterday;

            // Anything not processed from yesterday is lost
            lostToCapacity = this.overflowYesterday - processedFromYesterday;
            this.overflowYesterday = 0; // Clear yesterday's overflow
        }

        // Priority 2: Process today's orders
        const processedFromToday = Math.min(potentialOrders, remainingCapacity);
        processed += processedFromToday;

        // Anything not processed today becomes overflow for tomorrow
        this.overflowToday = potentialOrders - processedFromToday;

        return {
            processed,
            overflow: this.overflowToday,
            lostToCapacity,
        };
    }

    // Called at start of new day to shift overflow
    advanceDay(): void {
        this.overflowYesterday = this.overflowToday;
        this.overflowToday = 0;
    }

    getOverflowYesterday(): number {
        return this.overflowYesterday;
    }

    getOverflowToday(): number {
        return this.overflowToday;
    }

    getTotalOverflow(): number {
        return this.overflowYesterday + this.overflowToday;
    }
}
