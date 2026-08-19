import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-ember-400 ${className}`} />;
}

export function FullPageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-ink-600" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-ember-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Loader2;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-ink-700/50 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-500" />
      </div>
      <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-sm">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400">
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <h3 className="text-slate-300 font-medium mb-1">Something went wrong</h3>
      <p className="text-slate-500 text-sm max-w-sm">{message}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 animate-slide-up">
      <h1 className="text-2xl font-display font-semibold text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
