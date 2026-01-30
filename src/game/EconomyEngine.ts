import { GameState } from './GameState';

export type SupplierType = 'fast' | 'cheap';

export interface EconomyConfig {
    // Base rates
    baseVisitsMin: number;
    baseVisitsMax: number;
    baseConversionRate: number;

    // Costs
    stockPurchaseCost: number;
    stockPurchaseAmount: number;
    dailyFixedCost: number;

    // Price impact
    priceElasticity: number; // How much price affects conversion

    // Supplier impact
    fastSupplierDelay: number;
    cheapSupplierDelay: number;
    fastSupplierReputationBonus: number;
    cheapSupplierReputationPenalty: number;
}

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
    baseVisitsMin: 50,
    baseVisitsMax: 100,
    baseConversionRate: 0.03, // 3%

    stockPurchaseCost: 100,
    stockPurchaseAmount: 50,
    dailyFixedCost: 50,

    priceElasticity: 0.003, // ±$1 price = ±0.3% conversion

    fastSupplierDelay: 0,
    cheapSupplierDelay: 1,
    fastSupplierReputationBonus: 0.01,
    cheapSupplierReputationPenalty: -0.01,
};

export class EconomyEngine {
    private gameState: GameState;
    private config: EconomyConfig;
    private supplier: SupplierType = 'fast';
    private reputationScore = 1.0; // 1.0 = Good, 0.5 = Average, 0.0 = Poor

    constructor(gameState: GameState, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG) {
        this.gameState = gameState;
        this.config = config;
    }

    setSupplier(supplier: SupplierType): void {
        this.supplier = supplier;
    }

    getSupplier(): SupplierType {
        return this.supplier;
    }

    processDailyEconomy(): void {
        const state = this.gameState.data;

        // 1. Generate visits
        const visits = Math.floor(
            Math.random() * (this.config.baseVisitsMax - this.config.baseVisitsMin) +
            this.config.baseVisitsMin
        );

        // 2. Calculate conversion rate
        let conversionRate = this.config.baseConversionRate;

        // Price impact: higher price = lower conversion
        const priceDeviation = state.price - 15; // $15 is baseline
        conversionRate -= priceDeviation * this.config.priceElasticity;

        // Reputation impact
        conversionRate *= this.reputationScore;

        // Clamp conversion rate
        conversionRate = Math.max(0.001, Math.min(0.15, conversionRate));

        // 3. Calculate orders (limited by stock)
        const potentialOrders = Math.floor(visits * conversionRate);
        const actualOrders = Math.min(potentialOrders, state.stock);

        // 4. Process sales
        const revenue = actualOrders * state.price;
        this.gameState.updateCash(revenue);
        this.gameState.updateStock(-actualOrders);
        this.gameState.data.totalRevenue += revenue;

        // 5. Apply daily costs
        this.gameState.updateCash(-this.config.dailyFixedCost);

        // 6. Apply interest on debt
        if (state.debt > 0) {
            const interest = state.debt * 0.05; // 5% daily
            this.gameState.data.debt += interest;
            this.gameState.updateCash(-interest);
        }

        // 7. Update metrics
        this.gameState.setDailyMetrics(visits, actualOrders, conversionRate * 100);

        // 8. Update reputation display
        this.updateReputationDisplay();
    }

    adjustReputation(delta: number): void {
        this.reputationScore = Math.max(0, Math.min(1, this.reputationScore + delta));
        this.updateReputationDisplay();
    }

    private updateReputationDisplay(): void {
        let reputation: 'Good' | 'Average' | 'Poor';
        if (this.reputationScore >= 0.7) {
            reputation = 'Good';
        } else if (this.reputationScore >= 0.4) {
            reputation = 'Average';
        } else {
            reputation = 'Poor';
        }
        this.gameState.data.reputation = reputation;
        this.gameState.emit('reputation-changed');
    }

    getReputationScore(): number {
        return this.reputationScore;
    }
}
