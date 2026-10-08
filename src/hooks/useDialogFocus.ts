import { useEffect } from 'react';
/** Keep keyboard focus inside the active modal and return it to its trigger. */
export function useDialogFocus() {
    useEffect(() => {
        let dialog: HTMLElement | null = null;
        let previous = document.activeElement as HTMLElement | null;
        const focusable = () => dialog ? [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')] : [];
        const track = (event: FocusEvent) => {
            if (!dialog && event.target instanceof HTMLElement)
                previous = event.target;
        };
        const update = () => {
            const current = document.querySelector<HTMLElement>('[role="dialog"]');
            if (current === dialog)
                return;
            const old = dialog;
            dialog = current;
            if (dialog) {
                if (!dialog.contains(document.activeElement))
                    focusable()[0]?.focus();
            }
            else if (old && previous?.isConnected)
                previous.focus();
        };
        const key = (event: KeyboardEvent) => {
            if (!dialog || event.key !== 'Tab')
                return;
            const nodes = focusable();
            if (!nodes.length) {
                event.preventDefault();
                return;
            }
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('focusin', track);
        document.addEventListener('keydown', key);
        const observer = new MutationObserver(update);
        observer.observe(document.body, { childList: true, subtree: true });
        update();
        return () => { observer.disconnect(); document.removeEventListener('focusin', track); document.removeEventListener('keydown', key); };
    }, []);
}
