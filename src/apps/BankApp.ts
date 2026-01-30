import { GameState } from '../game/GameState';
import { Window } from '../ui/Window';
import { createButton, formatCurrency } from '../utils/helpers';

export class BankApp {
    private window: Window;
    private gameState: GameState;
    private balanceElement: HTMLElement | null = null;
    private debtElement: HTMLElement | null = null;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.window = new Window({
            title: 'BANCO — Sistema Financeiro',
            width: 450,
            height: 350,
            x: 150,
            y: 120,
        });

        this.buildUI();
        this.attachListeners();
    }

    private buildUI(): void {
        const content = this.window.getContentArea();

        // Title
        const title = document.createElement('div');
        title.style.fontSize = '14px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '16px';
        title.style.textAlign = 'center';
        title.style.borderBottom = '2px solid #000';
        title.style.paddingBottom = '8px';
        title.textContent = 'SISTEMA BANCÁRIO';

        // Balance display
        const balancePanel = document.createElement('div');
        balancePanel.className = 'retro-panel';
        balancePanel.style.marginBottom = '12px';

        const balanceLabel = document.createElement('div');
        balanceLabel.style.fontSize = '10px';
        balanceLabel.style.marginBottom = '4px';
        balanceLabel.textContent = 'SALDO DA CONTA:';

        this.balanceElement = document.createElement('div');
        this.balanceElement.style.fontSize = '20px';
        this.balanceElement.style.fontWeight = 'bold';
        this.balanceElement.style.fontFamily = "'Courier New', monospace";
        this.balanceElement.textContent = formatCurrency(this.gameState.data.cash);

        balancePanel.appendChild(balanceLabel);
        balancePanel.appendChild(this.balanceElement);

        // Debt display
        const debtPanel = document.createElement('div');
        debtPanel.className = 'retro-panel';
        debtPanel.style.marginBottom = '12px';

        const debtLabel = document.createElement('div');
        debtLabel.style.fontSize = '10px';
        debtLabel.style.marginBottom = '4px';
        debtLabel.textContent = 'DÍVIDA PENDENTE:';

        this.debtElement = document.createElement('div');
        this.debtElement.style.fontSize = '20px';
        this.debtElement.style.fontWeight = 'bold';
        this.debtElement.style.fontFamily = "'Courier New', monospace";
        this.debtElement.style.color = '#C00';
        this.debtElement.textContent = formatCurrency(this.gameState.data.debt);

        const interestInfo = document.createElement('div');
        interestInfo.style.fontSize = '9px';
        interestInfo.style.marginTop = '4px';
        interestInfo.style.color = '#666';
        interestInfo.textContent = 'Taxa de juros: 5% ao dia';

        debtPanel.appendChild(debtLabel);
        debtPanel.appendChild(this.debtElement);
        debtPanel.appendChild(interestInfo);

        // Loan section
        const loanPanel = document.createElement('div');
        loanPanel.style.background = '#fff';
        loanPanel.style.border = '2px solid #000';
        loanPanel.style.padding = '12px';
        loanPanel.style.marginBottom = '12px';

        const loanTitle = document.createElement('div');
        loanTitle.style.fontWeight = 'bold';
        loanTitle.style.marginBottom = '8px';
        loanTitle.textContent = 'SOLICITAR EMPRÉSTIMO';

        const loanOptions = document.createElement('div');
        loanOptions.style.display = 'flex';
        loanOptions.style.flexDirection = 'column';
        loanOptions.style.gap = '8px';

        const loan100 = createButton('$100', () => this.requestLoan(100));
        const loan250 = createButton('$250', () => this.requestLoan(250));
        const loan500 = createButton('$500', () => this.requestLoan(500));

        loanOptions.appendChild(loan100);
        loanOptions.appendChild(loan250);
        loanOptions.appendChild(loan500);

        loanPanel.appendChild(loanTitle);
        loanPanel.appendChild(loanOptions);

        // Warning
        const warning = document.createElement('div');
        warning.style.fontSize = '10px';
        warning.style.padding = '8px';
        warning.style.background = '#FFC';
        warning.style.border = '1px solid #CC0';
        warning.innerHTML = `
      <strong>AVISO:</strong><br>
      Empréstimos não quitados acumulam juros diários.<br>
      Inadimplência resulta em falência.
    `;

        content.appendChild(title);
        content.appendChild(balancePanel);
        content.appendChild(debtPanel);
        content.appendChild(loanPanel);
        content.appendChild(warning);
    }

    private attachListeners(): void {
        this.gameState.on('cash-changed', () => this.updateBalance());
        this.gameState.on('debt-changed', () => this.updateDebt());
    }

    private requestLoan(amount: number): void {
        this.gameState.updateCash(amount);
        this.gameState.updateDebt(amount);
    }

    private updateBalance(): void {
        if (!this.balanceElement) return;
        this.balanceElement.textContent = formatCurrency(this.gameState.data.cash);
    }

    private updateDebt(): void {
        if (!this.debtElement) return;
        this.debtElement.textContent = formatCurrency(this.gameState.data.debt);
    }

    getWindow(): Window {
        return this.window;
    }

    show(): void {
        this.window.show();
    }
}
