import { GameState } from '../game/GameState';
import { CapacitySystem } from '../game/CapacitySystem';
import { Window } from '../ui/Window';
import { createButton, formatCurrency } from '../utils/helpers';

export class CapacityApp {
    private window: Window;
    private gameState: GameState;
    private capacitySystem: CapacitySystem;

    private capacityDisplayElement: HTMLElement | null = null;
    private queueDisplayElement: HTMLElement | null = null;
    private lostDisplayElement: HTMLElement | null = null;
    private expansion1Button: HTMLButtonElement | null = null;
    private expansion2Button: HTMLButtonElement | null = null;

    constructor(gameState: GameState, capacitySystem: CapacitySystem) {
        this.gameState = gameState;
        this.capacitySystem = capacitySystem;
        this.window = new Window({
            title: 'Capacidade',
            width: 420,
            height: 320,
            x: 140,
            y: 120,
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
        title.textContent = 'CAPACIDADE DE PROCESSAMENTO';

        // Current capacity section
        const capacitySection = document.createElement('div');
        capacitySection.className = 'retro-panel';
        capacitySection.style.marginBottom = '12px';

        const capacityTitle = document.createElement('div');
        capacityTitle.style.cssText = `
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 8px;
    `;
        capacityTitle.textContent = '⚙️ CAPACIDADE ATUAL';

        this.capacityDisplayElement = document.createElement('div');
        this.capacityDisplayElement.style.cssText = `
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #000;
    `;
        this.capacityDisplayElement.textContent = '20 pedidos/dia';

        const capacityDesc = document.createElement('div');
        capacityDesc.style.cssText = `
      font-size: 9px;
      color: #404040;
      line-height: 1.4;
    `;
        capacityDesc.textContent = 'Máximo de pedidos que você pode processar por dia.';

        capacitySection.appendChild(capacityTitle);
        capacitySection.appendChild(this.capacityDisplayElement);
        capacitySection.appendChild(capacityDesc);

        // Queue section
        const queueSection = document.createElement('div');
        queueSection.className = 'retro-panel';
        queueSection.style.marginBottom = '12px';

        const queueTitle = document.createElement('div');
        queueTitle.style.cssText = `
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 8px;
    `;
        queueTitle.textContent = '📦 FILA DE PROCESSAMENTO';

        this.queueDisplayElement = document.createElement('div');
        this.queueDisplayElement.style.cssText = `
      font-size: 9px;
      padding: 6px 8px;
      background: #E0E0E0;
      border: 1px solid #808080;
      margin-bottom: 4px;
    `;
        this.queueDisplayElement.innerHTML = 'Fila para amanhã: <strong>0 pedidos</strong>';

        this.lostDisplayElement = document.createElement('div');
        this.lostDisplayElement.style.cssText = `
      font-size: 9px;
      padding: 6px 8px;
      background: #FFE0E0;
      border: 1px solid #C00;
      display: none;
    `;
        this.lostDisplayElement.innerHTML = 'Perdidos ontem: <strong style="color: #C00;">0 pedidos</strong>';

        queueSection.appendChild(queueTitle);
        queueSection.appendChild(this.queueDisplayElement);
        queueSection.appendChild(this.lostDisplayElement);

        // Employee section
        const employeeSection = document.createElement('div');
        employeeSection.className = 'retro-panel';
        employeeSection.style.marginBottom = '12px';

        const employeeTitle = document.createElement('div');
        employeeTitle.style.cssText = `
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 8px;
    `;
        employeeTitle.textContent = '👷 OPERADOR';

        const employeeDesc = document.createElement('div');
        employeeDesc.style.cssText = `
      font-size: 9px;
      margin-bottom: 8px;
      line-height: 1.4;
      color: #404040;
    `;
        employeeDesc.textContent = 'Contrate um operador para aumentar capacidade (+15/dia). Salário: $30/dia.';

        const employeeStatusElement = document.createElement('div');
        employeeStatusElement.id = 'employee-status';
        employeeStatusElement.style.cssText = `
      font-size: 9px;
      padding: 6px 8px;
      margin-bottom: 8px;
      background: #E0E0E0;
      border: 1px solid #808080;
    `;
        employeeStatusElement.innerHTML = 'Status: <strong>Não contratado</strong>';

        const employeeButton = createButton(
            'Contratar Operador',
            () => this.toggleEmployee()
        );
        employeeButton.id = 'employee-button';
        employeeButton.style.width = '100%';

        employeeSection.appendChild(employeeTitle);
        employeeSection.appendChild(employeeDesc);
        employeeSection.appendChild(employeeStatusElement);
        employeeSection.appendChild(employeeButton);

        // Warehouse expansion section
        const expansionSection = document.createElement('div');
        expansionSection.className = 'retro-panel';

        const expansionTitle = document.createElement('div');
        expansionTitle.style.cssText = `
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 8px;
    `;
        expansionTitle.textContent = '🏭 WAREHOUSE EXPANSION';

        const expansionDesc = document.createElement('div');
        expansionDesc.style.cssText = `
      font-size: 9px;
      margin-bottom: 8px;
      line-height: 1.4;
      color: #404040;
    `;
        expansionDesc.textContent = 'Aumente sua capacidade de processamento permanentemente.';

        // Expansion buttons
        const buttonsRow = document.createElement('div');
        buttonsRow.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    `;

        this.expansion1Button = createButton(
            'Nível 1 ($500)',
            () => this.purchaseExpansion()
        );
        this.expansion1Button.style.flex = '1';

        this.expansion2Button = createButton(
            'Nível 2 ($900)',
            () => this.purchaseExpansion()
        );
        this.expansion2Button.style.flex = '1';

        buttonsRow.appendChild(this.expansion1Button);
        buttonsRow.appendChild(this.expansion2Button);

        const expansionInfo = document.createElement('div');
        expansionInfo.style.cssText = `
      font-size: 8px;
      color: #606060;
      font-style: italic;
    `;
        expansionInfo.textContent = 'Cada nível adiciona +20 pedidos/dia';

        expansionSection.appendChild(expansionTitle);
        expansionSection.appendChild(expansionDesc);
        expansionSection.appendChild(buttonsRow);
        expansionSection.appendChild(expansionInfo);

        content.appendChild(title);
        content.appendChild(capacitySection);
        content.appendChild(queueSection);
        content.appendChild(employeeSection);
        content.appendChild(expansionSection);

        this.updateDisplay();
    }

    private attachListeners(): void {
        this.gameState.on('day-changed', () => this.updateDisplay());
        this.gameState.on('daily-summary', () => this.updateDisplay());
    }

    private toggleEmployee(): void {
        const isHired = this.capacitySystem.isEmployeeHired();

        let result;
        if (isHired) {
            result = this.capacitySystem.fireEmployee();
        } else {
            result = this.capacitySystem.hireEmployee();
        }

        if (result.success) {
            this.updateDisplay();
            this.gameState.emit('capacity-action');
            (this.gameState as any).lastCapacityMessage = result.message;
        } else {
            alert(result.message);
        }
    }

    private purchaseExpansion(): void {
        const result = this.capacitySystem.purchaseExpansion();

        if (result.success) {
            this.updateDisplay();
            this.gameState.emit('capacity-action');
            (this.gameState as any).lastCapacityMessage = result.message;
        } else {
            // Show error briefly
            alert(result.message);
        }
    }

    private updateDisplay(): void {
        const capacity = this.capacitySystem.getCapacity();
        const expansions = this.capacitySystem.getExpansions();
        const overflowToday = this.capacitySystem.getOverflowToday();
        const overflowYesterday = this.capacitySystem.getOverflowYesterday();

        // Update capacity display
        if (this.capacityDisplayElement) {
            this.capacityDisplayElement.textContent = `${capacity} pedidos/dia`;
        }

        // Update queue display
        if (this.queueDisplayElement) {
            const queueColor = overflowToday > 0 ? '#F90' : '#000';
            this.queueDisplayElement.innerHTML = `Fila para amanhã: <strong style="color: ${queueColor};">${overflowToday} pedidos</strong>`;
        }

        // Update lost display (from yesterday's overflow that couldn't be processed)
        if (this.lostDisplayElement) {
            const summary = (this.gameState as any).economyEngine?.lastDailySummary;
            const lostToCapacity = summary?.lostToCapacity || 0;

            if (lostToCapacity > 0) {
                this.lostDisplayElement.style.display = 'block';
                this.lostDisplayElement.innerHTML = `Perdidos ontem: <strong style="color: #C00;">${lostToCapacity} pedidos</strong> (capacidade insuficiente)`;
            } else {
                this.lostDisplayElement.style.display = 'none';
            }
        }

        // Update expansion buttons
        const nextCost = this.capacitySystem.getNextExpansionCost();

        if (this.expansion1Button && this.expansion2Button) {
            if (expansions === 0) {
                // No expansions yet
                this.expansion1Button.disabled = false;
                this.expansion1Button.style.opacity = '1';
                this.expansion2Button.disabled = true;
                this.expansion2Button.style.opacity = '0.5';
            } else if (expansions === 1) {
                // First expansion purchased
                this.expansion1Button.textContent = '✓ Nível 1';
                this.expansion1Button.disabled = true;
                this.expansion1Button.style.opacity = '0.5';
                this.expansion2Button.disabled = false;
                this.expansion2Button.style.opacity = '1';
            } else {
                // Both purchased
                this.expansion1Button.textContent = '✓ Nível 1';
                this.expansion1Button.disabled = true;
                this.expansion1Button.style.opacity = '0.5';
                this.expansion2Button.textContent = '✓ Nível 2';
                this.expansion2Button.disabled = true;
                this.expansion2Button.style.opacity = '0.5';
            }
        }

        // Update employee status
        const employeeStatusElement = document.getElementById('employee-status');
        const employeeButton = document.getElementById('employee-button') as HTMLButtonElement;

        if (employeeStatusElement && employeeButton) {
            const isHired = this.capacitySystem.isEmployeeHired();
            const didWork = this.capacitySystem.didEmployeeWork();

            if (isHired) {
                employeeButton.textContent = 'Demitir Operador';

                if (didWork) {
                    employeeStatusElement.innerHTML = 'Status: <strong style="color: #0A0;">✓ Ativo</strong> (+15 capacidade)';
                } else {
                    employeeStatusElement.innerHTML = 'Status: <strong style="color: #F90;">⚠ Faltou (sem caixa)</strong>';
                }
            } else {
                employeeButton.textContent = 'Contratar Operador';
                employeeStatusElement.innerHTML = 'Status: <strong>Não contratado</strong>';
            }
        }
    }

    getWindow(): Window {
        return this.window;
    }

    show(): void {
        this.window.show();
        this.updateDisplay();
    }
}
