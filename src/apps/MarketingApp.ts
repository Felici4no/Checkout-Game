import { GameState } from '../game/GameState';
import { MarketingSystem } from '../game/MarketingSystem';
import { Window } from '../ui/Window';
import { createButton, formatCurrency } from '../utils/helpers';

export class MarketingApp {
    private window: Window;
    private gameState: GameState;
    private marketingSystem: MarketingSystem;

    private campaignButton: HTMLButtonElement | null = null;
    private campaignStatusElement: HTMLElement | null = null;
    private viralStatusElement: HTMLElement | null = null;
    private warningsElement: HTMLElement | null = null;

    constructor(gameState: GameState, marketingSystem: MarketingSystem) {
        this.gameState = gameState;
        this.marketingSystem = marketingSystem;
        this.window = new Window({
            title: 'Marketing',
            width: 400,
            height: 300,
            x: 120,
            y: 100,
        });

        this.buildUI();
        this.attachListeners();
    }

    private buildUI(): void {
        const content = this.window.getContentArea();

        // Title
        const title = document.createElement('div');
        title.style.cssText = `
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #808080;
    `;
        title.textContent = 'MARKETING & CRESCIMENTO';

        // Campaign section
        const campaignSection = document.createElement('div');
        campaignSection.className = 'retro-panel';
        campaignSection.style.marginBottom = '12px';

        const campaignTitle = document.createElement('div');
        campaignTitle.style.cssText = `
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 8px;
    `;
        campaignTitle.textContent = '📢 CAMPANHA DE MARKETING';

        const campaignDesc = document.createElement('div');
        campaignDesc.style.cssText = `
      font-size: 9px;
      margin-bottom: 8px;
      line-height: 1.4;
      color: #404040;
    `;
        campaignDesc.textContent = '+150% visitas por 4 dias. Prepare estoque e caixa!';

        const campaignButtonRow = document.createElement('div');
        campaignButtonRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

        this.campaignButton = createButton(
            `Rodar Campanha (${formatCurrency(this.marketingSystem.getCampaignCost())})`,
            () => this.startCampaign()
        );

        campaignButtonRow.appendChild(this.campaignButton);

        this.campaignStatusElement = document.createElement('div');
        this.campaignStatusElement.style.cssText = `
      font-size: 9px;
      padding: 4px 8px;
      background: #E0E0E0;
      border: 1px solid #808080;
      margin-top: 4px;
    `;
        this.campaignStatusElement.textContent = 'Status: Inativa';

        campaignSection.appendChild(campaignTitle);
        campaignSection.appendChild(campaignDesc);
        campaignSection.appendChild(campaignButtonRow);
        campaignSection.appendChild(this.campaignStatusElement);

        // Viral status section
        const viralSection = document.createElement('div');
        viralSection.className = 'retro-panel';
        viralSection.style.marginBottom = '12px';

        const viralTitle = document.createElement('div');
        viralTitle.style.cssText = `
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 8px;
    `;
        viralTitle.textContent = '🔥 EVENTO VIRAL';

        const viralDesc = document.createElement('div');
        viralDesc.style.cssText = `
      font-size: 9px;
      margin-bottom: 8px;
      line-height: 1.4;
      color: #404040;
    `;
        viralDesc.textContent = 'Aleatório. +200-300% visitas por 2 dias.';

        this.viralStatusElement = document.createElement('div');
        this.viralStatusElement.style.cssText = `
      font-size: 9px;
      padding: 4px 8px;
      background: #E0E0E0;
      border: 1px solid #808080;
    `;
        this.viralStatusElement.textContent = 'Status: Aguardando...';

        viralSection.appendChild(viralTitle);
        viralSection.appendChild(viralDesc);
        viralSection.appendChild(this.viralStatusElement);

        // Warnings section
        this.warningsElement = document.createElement('div');
        this.warningsElement.style.cssText = `
      font-size: 9px;
      padding: 8px;
      background: #FFF8DC;
      border: 2px solid #F90;
      display: none;
      line-height: 1.4;
    `;

        content.appendChild(title);
        content.appendChild(campaignSection);
        content.appendChild(viralSection);
        content.appendChild(this.warningsElement);

        this.updateStatus();
    }

    private attachListeners(): void {
        this.gameState.on('campaign-ended', () => this.updateStatus());
        this.gameState.on('viral-ended', () => this.updateStatus());
        this.gameState.on('viral-occurred', () => this.updateStatus());
        this.gameState.on('day-changed', () => this.updateStatus());
    }

    private startCampaign(): void {
        const result = this.marketingSystem.startCampaign();

        if (result.success) {
            this.updateStatus();
            this.gameState.emit('marketing-action');
            (this.gameState as any).lastMarketingMessage = result.message;
        } else {
            // Show error in warnings
            if (this.warningsElement) {
                this.warningsElement.style.display = 'block';
                this.warningsElement.innerHTML = `<strong>❌ ${result.message}</strong>`;
                setTimeout(() => {
                    if (this.warningsElement) {
                        this.warningsElement.style.display = 'none';
                    }
                }, 3000);
            }
        }
    }

    private updateStatus(): void {
        const campaignStatus = this.marketingSystem.getCampaignStatus();
        const viralStatus = this.marketingSystem.getViralStatus();

        // Update campaign status
        if (this.campaignStatusElement) {
            if (campaignStatus.isActive) {
                this.campaignStatusElement.innerHTML = `<strong style="color: #0A0">✓ ATIVA</strong> — ${campaignStatus.daysRemaining} dias restantes`;
                if (this.campaignButton) {
                    this.campaignButton.disabled = true;
                    this.campaignButton.style.opacity = '0.5';
                }
            } else {
                this.campaignStatusElement.textContent = 'Status: Inativa';
                if (this.campaignButton) {
                    this.campaignButton.disabled = false;
                    this.campaignButton.style.opacity = '1';
                }
            }
        }

        // Update viral status
        if (this.viralStatusElement) {
            if (viralStatus.isActive) {
                this.viralStatusElement.innerHTML = `<strong style="color: #F00">🔥 VIRAL ATIVO!</strong> — ${viralStatus.daysRemaining} dias restantes`;
            } else {
                this.viralStatusElement.textContent = 'Status: Aguardando...';
            }
        }

        // Check warnings
        const warnings: string[] = [];
        if (this.gameState.data.stock < 100) {
            warnings.push('⚠️ Estoque baixo (< 100)');
        }
        if (this.gameState.data.cash < 400) {
            warnings.push('⚠️ Caixa apertado (< $400)');
        }

        if (this.warningsElement && warnings.length > 0 && !campaignStatus.isActive) {
            this.warningsElement.style.display = 'block';
            this.warningsElement.innerHTML = `<strong>AVISOS:</strong><br>${warnings.join('<br>')}`;
        } else if (this.warningsElement && warnings.length === 0) {
            this.warningsElement.style.display = 'none';
        }
    }

    getWindow(): Window {
        return this.window;
    }

    show(): void {
        this.window.show();
        this.updateStatus();
    }
}
