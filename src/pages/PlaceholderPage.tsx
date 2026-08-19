import type { PageId } from '@/config/navigation';
import { PageHeader } from '@/components/ui/Feedback';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  page: PageId;
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title={title} subtitle={description} />
      <div className="card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-ember-500/10 flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-ember-400/70" />
        </div>
        <h3 className="text-slate-200 font-medium mb-2">Coming in the next phase</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          This module is being crafted with the same care as the rest of your system. It will be ready soon.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-ember-400/60 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-ember-400 animate-pulse-soft" />
          IN DEVELOPMENT
        </div>
      </div>
    </div>
  );
}
