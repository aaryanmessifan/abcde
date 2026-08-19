import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { processUserMessage } from '@/lib/ai/engine';
import type { PageId } from '@/config/navigation';
import type { ChatMessage } from '@/types';

interface CommandBoxProps {
  onActionComplete?: () => void;
  onNavigate: (page: PageId) => void;
  placeholder?: string;
}

export function CommandBox({ onActionComplete, onNavigate, placeholder = 'What would you like to do?' }: CommandBoxProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;

    setLoading(true);
    try {
      const response = await processUserMessage(value.trim(), { conversationId: 'command', history: [] });

      if (response.actions.some((a) => a.success && (a.type === 'create_task' || a.type === 'complete_task' || a.type === 'delete_task'))) {
        onActionComplete?.();
      }

      const hasQuery = response.actions.some((a) => a.type === 'query_tasks' && a.success);
      if (hasQuery) {
        onNavigate('tasks');
      }

      setValue('');
    } catch (err) {
      console.error('Command error:', err);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Remind me to call Rahul tomorrow at 10',
    'What are my tasks today?',
    'Add a task to renew insurance on September 10',
  ];

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`glass rounded-2xl transition-all duration-300 ${
            focused ? 'border-ember-500/30 shadow-ember' : ''
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex-shrink-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                focused ? 'bg-ember-500/20' : 'bg-white/[0.04]'
              }`}>
                <Sparkles size={16} className={focused ? 'text-ember-400' : 'text-slate-500'} />
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-[15px] resize-none outline-none leading-relaxed pt-1"
            />
            <button
              type="submit"
              disabled={!value.trim() || loading}
              className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-ember-500 hover:bg-ember-400 disabled:bg-ink-600 disabled:text-slate-600 text-white flex items-center justify-center transition-all duration-200 active:scale-90"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </form>

      {!value && !loading && (
        <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setValue(s)}
              className="text-xs text-slate-500 hover:text-ember-400 bg-white/[0.03] hover:bg-ember-500/10 border border-white/[0.04] hover:border-ember-500/20 px-3 py-1.5 rounded-full transition-all duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
