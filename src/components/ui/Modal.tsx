import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  immersive?: boolean;
  showCloseButton?: boolean;
}

export function Modal({ label, onClose, children, wide = false, immersive = false, showCloseButton = true }: ModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in ${immersive ? 'p-0 sm:p-3' : 'p-4'}`} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full animate-rise-in shadow-2xl ${immersive ? 'h-[100dvh] max-w-[520px] overflow-hidden rounded-none border-0 bg-black p-0 sm:h-[min(94dvh,920px)] sm:rounded-3xl sm:border sm:border-white/10' : `${wide ? 'max-w-5xl' : 'max-w-lg'} rounded-2xl border border-white/10 bg-ink-900 p-4 sm:p-6`}`}
      >
        {showCloseButton && <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/65 text-white shadow-lg transition hover:scale-105 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${immersive ? 'top-[max(12px,env(safe-area-inset-top))]' : ''}`}
        >
          <X className="h-5 w-5" />
        </button>}
        {children}
      </div>
    </div>
  );
}
