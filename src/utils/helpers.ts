// Animated number counter utility
export function animateNumber(
    element: HTMLElement,
    from: number,
    to: number,
    duration: number = 500,
    formatter: (n: number) => string = (n) => n.toString()
): void {
    const startTime = performance.now();
    const difference = to - from;

    function update(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = from + (difference * eased);

        element.textContent = formatter(Math.round(current));
        element.classList.add('animating');

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            setTimeout(() => element.classList.remove('animating'), 300);
        }
    }

    requestAnimationFrame(update);
}

// Format currency
export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

// Format percentage
export function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
}

// Create retro button
export function createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'retro-button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}
