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
    baseVisitsMin: 120,
    baseVisitsMax: 220,
    baseConversionRate: 0.06, // 6% - permite break-even com decisões razoáveis

    stockPurchaseCost: 100,
    stockPurchaseAmount: 50,
    dailyFixedCost: 30, // Reduzido de 50 para 30

    priceElasticity: 0.0015, // Reduzido de 0.003 para 0.0015 (±$1 = ±0.15%)

    fastSupplierDelay: 0,
    cheapSupplierDelay: 1,
    fastSupplierReputationBonus: 0.02, // Aumentado de 0.01 para 0.02
    cheapSupplierReputationPenalty: -0.01,
};

export class EconomyEngine {
    private gameState: GameState;
    private config: EconomyConfig;
    private supplier: SupplierType = 'fast';
    private reputationScore = 1.0; // 1.0 = Good, 0.5 = Average, 0.0 = Poor

    // Daily financial summary for player feedback
    public lastDailySummary: {
        revenue: number;
        costs: number;
        interest: number;
        net: number;
    } = { revenue: 0, costs: 0, interest: 0, net: 0 };

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

        // Reset daily summary
        this.lastDailySummary = { revenue: 0, costs: 0, interest: 0, net: 0 };

        // 1. Generate visits (controlled RNG - less dispersion)
        const range = this.config.baseVisitsMax - this.config.baseVisitsMin;
        const visits = Math.floor(
            this.config.baseVisitsMin + (Math.random() * 0.6 + 0.2) * range // 20-80% of range
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
        this.gameState.state.totalRevenue += revenue;
        this.lastDailySummary.revenue = revenue;

        // 5. Apply daily costs
        this.gameState.updateCash(-this.config.dailyFixedCost);
        this.lastDailySummary.costs = this.config.dailyFixedCost;

        // 6. Apply interest on debt (1% daily - reduced from 5%)
        let interest = 0;
        if (state.debt > 0) {
            interest = state.debt * 0.01; // 1% daily
            this.gameState.state.debt += interest;
            this.gameState.updateCash(-interest);
        }
        this.lastDailySummary.interest = interest;

        // Calculate net
        this.lastDailySummary.net = revenue - this.config.dailyFixedCost - interest;

        // 7. Update metrics
        this.gameState.setDailyMetrics(visits, actualOrders, conversionRate * 100);

        // 8. Natural reputation recovery (+0.005/day if > 0.5)
        if (this.reputationScore > 0.5 && this.reputationScore < 1.0) {
            this.reputationScore = Math.min(1.0, this.reputationScore + 0.005);
        }

        // 9. Supplier reputation impact
        if (this.supplier === 'fast') {
            this.adjustReputation(this.config.fastSupplierReputationBonus);
        } else {
            this.adjustReputation(this.config.cheapSupplierReputationPenalty);
        }

        // 10. Update reputation display
        this.updateReputationDisplay();

        // 11. Emit summary event
        this.gameState.emit('daily-summary');
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
        this.gameState.state.reputation = reputation;
        this.gameState.emit('reputation-changed');
    }

    getReputationScore(): number {
        return this.reputationScore;
    }
}
