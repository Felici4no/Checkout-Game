import { GameState } from './GameState';

export interface MarketingCampaign {
    isActive: boolean;
    daysRemaining: number;
    visitMultiplier: number; // 2.0 = +100%, 3.0 = +200%
}

export interface ViralEvent {
    isActive: boolean;
    daysRemaining: number;
    visitMultiplier: number; // 3.0-4.0 = +200-300%
    lastViralDay: number; // For cooldown
}

export class MarketingSystem {
    private gameState: GameState;
    private campaign: MarketingCampaign = {
        isActive: false,
        daysRemaining: 0,
        visitMultiplier: 1.0,
    };
    private viral: ViralEvent = {
        isActive: false,
        daysRemaining: 0,
        visitMultiplier: 1.0,
        lastViralDay: -999, // Start far in past
    };

    private readonly CAMPAIGN_COST = 200;
    private readonly CAMPAIGN_DURATION = 4; // 4 days
    private readonly CAMPAIGN_MULTIPLIER = 2.5; // +150% visits
    private readonly VIRAL_PROBABILITY = 0.08; // 8% per day
    private readonly VIRAL_COOLDOWN = 7; // 7 days between virals
    private readonly VIRAL_DURATION = 2; // 2 days
    private readonly VIRAL_MULTIPLIER_MIN = 3.0; // +200%
    private readonly VIRAL_MULTIPLIER_MAX = 4.0; // +300%
    private readonly MAX_MULTIPLIER = 6.0; // Cap to prevent absurd stacking

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    // Manual action: start marketing campaign
    startCampaign(): { success: boolean; message: string } {
        if (this.campaign.isActive) {
            return { success: false, message: 'Campanha já está ativa' };
        }

        if (this.gameState.data.cash < this.CAMPAIGN_COST) {
            return { success: false, message: `Caixa insuficiente ($${this.CAMPAIGN_COST})` };
        }

        // Contextualized warnings (before starting campaign)
        const warnings: string[] = [];
        const expectedVisits = 170 * this.CAMPAIGN_MULTIPLIER; // ~425 visits
        const expectedOrders = Math.floor(expectedVisits * 0.06); // ~25 orders

        if (this.gameState.data.stock < expectedOrders * 2) {
            warnings.push(`⚠️ CRÍTICO: Estoque baixo! Espera-se ~${expectedOrders} pedidos/dia`);
        } else if (this.gameState.data.stock < expectedOrders * 4) {
            warnings.push(`⚠️ Estoque pode não durar os 4 dias`);
        }

        if (this.gameState.data.cash < 400) {
            warnings.push('⚠️ Caixa apertado para recomprar estoque');
        }

        this.gameState.updateCash(-this.CAMPAIGN_COST);
        this.campaign.isActive = true;
        this.campaign.daysRemaining = this.CAMPAIGN_DURATION;
        this.campaign.visitMultiplier = this.CAMPAIGN_MULTIPLIER;

        const warningText = warnings.length > 0 ? `\n\n${warnings.join('\n')}` : '';
        return {
            success: true,
            message: `📢 Campanha iniciada! +150% visitas por ${this.CAMPAIGN_DURATION} dias${warningText}`
        };
    }

    // Check for random viral event
    checkForViral(): { occurred: boolean; message?: string } {
        const currentDay = this.gameState.data.currentDay;

        // Don't trigger if already active
        if (this.viral.isActive) {
            return { occurred: false };
        }

        // Check cooldown (invisible to player)
        if (currentDay - this.viral.lastViralDay < this.VIRAL_COOLDOWN) {
            return { occurred: false };
        }

        // Random chance
        if (Math.random() > this.VIRAL_PROBABILITY) {
            return { occurred: false };
        }

        // Trigger viral event!
        this.viral.isActive = true;
        this.viral.daysRemaining = this.VIRAL_DURATION;
        this.viral.visitMultiplier =
            this.VIRAL_MULTIPLIER_MIN +
            Math.random() * (this.VIRAL_MULTIPLIER_MAX - this.VIRAL_MULTIPLIER_MIN);
        this.viral.lastViralDay = currentDay;

        const percentage = Math.round((this.viral.visitMultiplier - 1) * 100);

        // Contextualized warning for viral
        const currentStock = this.gameState.data.stock;
        const expectedVisits = 170 * this.viral.visitMultiplier;
        const expectedOrders = Math.floor(expectedVisits * 0.06);
        const warning = currentStock < expectedOrders * 2
            ? `\n⚠️ ATENÇÃO: Estoque atual (${currentStock}) pode não ser suficiente!`
            : '';

        return {
            occurred: true,
            message: `🔥 VIRAL! Post explodiu nas redes! +${percentage}% visitas por ${this.VIRAL_DURATION} dias!${warning}`
        };
    }

    // Process daily effects
    processDailyEffects(): void {
        // Countdown campaign
        if (this.campaign.isActive) {
            this.campaign.daysRemaining--;
            if (this.campaign.daysRemaining <= 0) {
                this.campaign.isActive = false;
                this.campaign.visitMultiplier = 1.0;
                this.gameState.emit('campaign-ended');
            }
        }

        // Countdown viral
        if (this.viral.isActive) {
            this.viral.daysRemaining--;
            if (this.viral.daysRemaining <= 0) {
                this.viral.isActive = false;
                this.viral.visitMultiplier = 1.0;
                this.gameState.emit('viral-ended');
            }
        }
    }

    // Get total visit multiplier (campaign + viral stack, with cap)
    getVisitMultiplier(): number {
        let multiplier = 1.0;

        if (this.campaign.isActive) {
            multiplier *= this.campaign.visitMultiplier;
        }

        if (this.viral.isActive) {
            multiplier *= this.viral.visitMultiplier;
        }

        // Cap at 6x to prevent absurd stacking (e.g., 2.5x × 4x = 10x → capped to 6x)
        return Math.min(multiplier, this.MAX_MULTIPLIER);
    }

    getCampaignStatus(): { isActive: boolean; daysRemaining: number } {
        return {
            isActive: this.campaign.isActive,
            daysRemaining: this.campaign.daysRemaining,
        };
    }

    getViralStatus(): { isActive: boolean; daysRemaining: number } {
        return {
            isActive: this.viral.isActive,
            daysRemaining: this.viral.daysRemaining,
        };
    }

    getCampaignCost(): number {
        return this.CAMPAIGN_COST;
    }

    isMarketingActive(): boolean {
        return this.campaign.isActive || this.viral.isActive;
    }
}
