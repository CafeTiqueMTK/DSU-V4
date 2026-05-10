/**
 * Toast Notification Utility
 * Designed for DSU-V4 Dashboard (Manus AI Style)
 */

/* global document, window, lucide */

class Toast {
    constructor() {
        this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');

        // Style based on type
        let bgColor = 'bg-zinc-900/90';
        let borderColor = 'border-white/10';
        let iconColor = 'text-indigo-400';
        let icon = 'info';

        if (type === 'success') {
            bgColor = 'bg-green-500/10';
            borderColor = 'border-green-500/20';
            iconColor = 'text-green-400';
            icon = 'check-circle';
        } else if (type === 'error') {
            bgColor = 'bg-red-500/10';
            borderColor = 'border-red-500/20';
            iconColor = 'text-red-400';
            icon = 'alert-circle';
        } else if (type === 'warning') {
            bgColor = 'bg-yellow-500/10';
            borderColor = 'border-yellow-500/20';
            iconColor = 'text-yellow-400';
            icon = 'alert-triangle';
        }

        toast.className = `
            ${bgColor} ${borderColor} border backdrop-blur-md
            px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3
            min-w-[300px] max-w-md animate-toast-in pointer-events-auto
            transition-all duration-300
        `;

        toast.innerHTML = `
            <div class="${iconColor} shrink-0">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-white">${message}</p>
            </div>
            <button class="text-zinc-500 hover:text-white transition-colors" onclick="this.parentElement.remove()">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        `;

        this.container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        // Auto remove
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    success(msg) { this.show(msg, 'success'); }
    error(msg) { this.show(msg, 'error'); }
    warn(msg) { this.show(msg, 'warning'); }
    info(msg) { this.show(msg, 'info'); }
}

window.showToast = new Toast();

// Add styles to head
const style = document.createElement('style');
style.textContent = `
    @keyframes toast-in {
        from { opacity: 0; transform: translateX(100%) translateY(10px); }
        to { opacity: 1; transform: translateX(0) translateY(0); }
    }
    .animate-toast-in {
        animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
`;
document.head.appendChild(style);
