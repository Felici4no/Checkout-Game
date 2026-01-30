import { GameState } from './GameState';
import { StockBot } from './StockBot';
import { MarketingSystem } from './MarketingSystem';

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
    private stockBot: StockBot | null = null;
    private marketingSystem: MarketingSystem | null = null;

    // Daily financial summary for player feedback
    public lastDailySummary: {
        revenue: number;
        costs: number;
        interest: number;
        net: number;
        lostOrders: number; // NEW: for causal feedback
        reputationImpact: number; // NEW: reputation change from lost orders
    } = { revenue: 0, costs: 0, interest: 0, net: 0, lostOrders: 0, reputationImpact: 0 };

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

    setStockBot(stockBot: StockBot): void {
        this.stockBot = stockBot;
    }

    setMarketingSystem(marketingSystem: MarketingSystem): void {
        this.marketingSystem = marketingSystem;
    }

    processDailyEconomy(): void {
        const state = this.gameState.data;

        // Reset daily summary
        this.lastDailySummary = {
            revenue: 0,
            costs: 0,
            interest: 0,
            net: 0,
            lostOrders: 0,
            reputationImpact: 0
        };

        // 1. Generate visits (controlled RNG - less dispersion)
        const range = this.config.baseVisitsMax - this.config.baseVisitsMin;
        let visits = Math.floor(
            this.config.baseVisitsMin + (Math.random() * 0.6 + 0.2) * range // 20-80% of range
        );

        // Apply marketing multiplier (campaign + viral, capped at 6x)
        if (this.marketingSystem) {
            const multiplier = this.marketingSystem.getVisitMultiplier();
            visits = Math.floor(visits * multiplier);
        }

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
        const lostOrders = potentialOrders - actualOrders;

        // Track lost orders
        this.lastDailySummary.lostOrders = lostOrders;

        // 4. Apply reputation penalty for lost orders (especially during marketing)
        if (lostOrders > 0) {
            const isMarketingActive = this.marketingSystem?.isMarketingActive() || false;
            // Harsher penalty during marketing campaigns/viral
            const basePenalty = -0.01;
            const marketingMultiplier = isMarketingActive ? 2.0 : 1.0;
            const lostOrdersFactor = Math.min(lostOrders / 10, 3.0); // Cap at 3x
            const reputationPenalty = basePenalty * marketingMultiplier * lostOrdersFactor;

            this.adjustReputation(reputationPenalty);
            this.lastDailySummary.reputationImpact = reputationPenalty;
        }

        // 5. Process sales
        const revenue = actualOrders * state.price;
        this.gameState.updateCash(revenue);
        this.gameState.updateStock(-actualOrders);
        this.gameState.state.totalRevenue += revenue;
        this.lastDailySummary.revenue = revenue;

        // 6. Apply daily costs
        this.gameState.updateCash(-this.config.dailyFixedCost);
        this.lastDailySummary.costs = this.config.dailyFixedCost;

        // 7. Apply interest on debt (1% daily - reduced from 5%)
        let interest = 0;
        if (state.debt > 0) {
            interest = state.debt * 0.01; // 1% daily
            this.gameState.state.debt += interest;
            this.gameState.updateCash(-interest);
        }
        this.lastDailySummary.interest = interest;

        // Calculate net
        this.lastDailySummary.net = revenue - this.config.dailyFixedCost - interest;

        // 8. Update metrics
        this.gameState.setDailyMetrics(visits, actualOrders, conversionRate * 100);

        // 9. Natural reputation recovery (+0.005/day if > 0.5)
        if (this.reputationScore > 0.5 && this.reputationScore < 1.0) {
            this.reputationScore = Math.min(1.0, this.reputationScore + 0.005);
        }

        // 10. Supplier reputation impact
        if (this.supplier === 'fast') {
            this.adjustReputation(this.config.fastSupplierReputationBonus);
        } else {
            this.adjustReputation(this.config.cheapSupplierReputationPenalty);
        }

        // 11. Update reputation display
        this.updateReputationDisplay();

        // 12. Emit summary event
        this.gameState.emit('daily-summary');

        // 13. Process marketing system (campaign countdown, viral check)
        if (this.marketingSystem) {
            this.marketingSystem.processDailyEffects();

            // Check for viral event
            const viral = this.marketingSystem.checkForViral();
            if (viral.occurred) {
                this.gameState.emit('viral-occurred');
                (this.gameState as any).lastViralMessage = viral.message;
            }
        }

        // 14. Run StockBot automation (if installed)
        if (this.stockBot && this.stockBot.isInstalled()) {
            const result = this.stockBot.checkAndBuyStock();
            if (result.reason) {
                this.gameState.emit('stockbot-action');
                (this.gameState as any).lastStockBotAction = result.reason;
            }
        }
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
