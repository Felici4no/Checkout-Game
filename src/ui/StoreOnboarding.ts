export class StoreOnboarding {
    private container: HTMLElement;
    private onComplete: (storeName: string, domain: string) => void;

    constructor(onComplete: (storeName: string, domain: string) => void) {
        this.onComplete = onComplete;
        this.container = document.createElement('div');
        this.container.className = 'store-onboarding';
        this.buildUI();
    }

    private buildUI(): void {
        this.container.innerHTML = `
            <div class="onboarding-modal">
                <div class="onboarding-header">
                    <h1>💼 Bem-vindo ao Checkout Game</h1>
                    <p>Configure seu e-commerce para começar</p>
                </div>
                
                <div class="onboarding-content">
                    <label for="store-name-input">Nome da sua loja:</label>
                    <input 
                        type="text" 
                        id="store-name-input" 
                        placeholder="Ex: Minha Loja" 
                        maxlength="20"
                        autocomplete="off"
                    />
                    
                    <div class="domain-preview">
                        <span class="preview-label">Seu domínio:</span>
                        <span class="preview-domain" id="domain-preview">minhaloja.com</span>
                    </div>
                    
                    <div class="validation-message" id="validation-message"></div>
                    
                    <button id="confirm-button" class="confirm-btn" disabled>
                        Criar Loja
                    </button>
                </div>
                
                <div class="onboarding-message" id="onboarding-message"></div>
            </div>
        `;

        const input = this.container.querySelector<HTMLInputElement>('#store-name-input')!;
        const preview = this.container.querySelector<HTMLElement>('#domain-preview')!;
        const confirmBtn = this.container.querySelector<HTMLButtonElement>('#confirm-button')!;
        const validationMsg = this.container.querySelector<HTMLElement>('#validation-message')!;

        // Real-time preview and validation
        input.addEventListener('input', () => {
            const name = input.value;
            const domain = this.generateDomain(name);
            preview.textContent = domain ? `${domain}.com` : 'seudominio.com';

            const validation = this.validateName(name);
            if (validation.valid) {
                validationMsg.textContent = '';
                validationMsg.className = 'validation-message';
                confirmBtn.disabled = false;
            } else {
                validationMsg.textContent = validation.message || '';
                validationMsg.className = 'validation-message error';
                confirmBtn.disabled = true;
            }
        });

        // Submit on Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                this.handleSubmit(input.value);
            }
        });

        // Submit on button click
        confirmBtn.addEventListener('click', () => {
            this.handleSubmit(input.value);
        });

        // Auto-focus input
        setTimeout(() => input.focus(), 100);
    }

    private validateName(name: string): { valid: boolean; message?: string } {
        if (!name || name.trim().length === 0) {
            return { valid: false, message: 'Digite um nome para sua loja' };
        }

        if (name.trim().length < 3) {
            return { valid: false, message: 'Nome muito curto (mínimo 3 caracteres)' };
        }

        if (name.length > 20) {
            return { valid: false, message: 'Nome muito longo (máximo 20 caracteres)' };
        }

        return { valid: true };
    }

    private generateDomain(name: string): string {
        if (!name || name.trim().length === 0) {
            return '';
        }

        // Generate slug: lowercase, remove accents, replace spaces with hyphens
        return name
            .toLowerCase()
            .normalize('NFD') // Decompose accented characters
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }

    private handleSubmit(storeName: string): void {
        const validation = this.validateName(storeName);
        if (!validation.valid) {
            return;
        }

        const domain = this.generateDomain(storeName);
        const messageEl = this.container.querySelector<HTMLElement>('#onboarding-message')!;
        const contentEl = this.container.querySelector<HTMLElement>('.onboarding-content')!;

        // Hide form
        contentEl.style.display = 'none';

        // Show confirmation message
        messageEl.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✓</div>
                <h2>${domain}.com está online agora</h2>
                <p>Iniciando seu e-commerce...</p>
            </div>
        `;
        messageEl.style.display = 'block';

        // Start game after delay
        setTimeout(() => {
            console.log('[DEBUG] Calling onComplete callback...', { storeName: storeName.trim(), domain });
            this.onComplete(storeName.trim(), domain);
        }, 2000);
    }

    show(parent: HTMLElement): void {
        parent.innerHTML = '';
        parent.appendChild(this.container);
    }

    hide(): void {
        this.container.remove();
    }
}
