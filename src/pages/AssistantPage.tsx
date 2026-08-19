import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2, Plus, CheckCircle2, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { processUserMessage, isAIConfigured } from '@/lib/ai/engine';
import {
  fetchConversations,
  createConversation,
  deleteConversation,
  fetchMessages,
  saveMessage,
} from '@/lib/services/conversationService';
import type { AIConversation, AIMessage, ChatMessage, AIAction } from '@/types';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';

interface AssistantPageProps {
  onTaskChanged?: () => void;
}

export function AssistantPage({ onTaskChanged }: AssistantPageProps) {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingIndicator]);

  const loadConversations = async () => {
    try {
      const convs = await fetchConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConversation) {
        setActiveConversation(convs[0].id);
      } else if (convs.length === 0) {
        const newConv = await createConversation();
        setConversations([newConv]);
        setActiveConversation(newConv.id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await fetchMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleNewConversation = async () => {
    const conv = await createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveConversation(conv.id);
    setMessages([]);
  };

  const handleDeleteConversation = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConversation(deleteTarget);
      const remaining = conversations.filter((c) => c.id !== deleteTarget);
      setConversations(remaining);
      if (activeConversation === deleteTarget) {
        if (remaining.length > 0) {
          setActiveConversation(remaining[0].id);
        } else {
          const newConv = await createConversation();
          setConversations([newConv]);
          setActiveConversation(newConv.id);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !activeConversation) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: userText };
    setMessages((prev) => [
      ...prev,
      {
        id: 'temp-user-' + Date.now(),
        conversation_id: activeConversation,
        role: 'user',
        content: userText,
        actions: null,
        created_at: new Date().toISOString(),
      },
    ]);

    setSending(true);
    setTypingIndicator(true);

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        actions: m.actions ?? undefined,
      }));

      const response = await processUserMessage(userText, {
        conversationId: activeConversation,
        history,
      });

      await saveMessage(activeConversation, userMsg);
      const savedAssistant = await saveMessage(activeConversation, {
        role: 'assistant',
        content: response.content,
        actions: response.actions,
      });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp-user-' + Date.now()),
        savedAssistant,
      ]);

      if (response.actions.some((a) => a.success && a.type !== 'answer' && a.type !== 'query_tasks')) {
        onTaskChanged?.();
      }
    } catch (err) {
      console.error('AI error:', err);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp-user-' + Date.now()),
        {
          id: 'error-' + Date.now(),
          conversation_id: activeConversation,
          role: 'assistant',
          content: "I ran into an issue processing that. Please try again.",
          actions: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      setTypingIndicator(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen">
      {/* Conversation list */}
      <div className="hidden lg:flex flex-col w-64 border-r border-white/[0.04] bg-ink-900/30">
        <div className="p-3 border-b border-white/[0.04]">
          <button onClick={handleNewConversation} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                activeConversation === conv.id
                  ? 'bg-ember-500/10 border border-ember-500/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => setActiveConversation(conv.id)}
            >
              <MessageSquare size={15} className="flex-shrink-0 text-slate-500" />
              <span className="text-sm text-slate-300 truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ember-500/20 to-frost-500/10 flex items-center justify-center">
              <Bot size={18} className="text-ember-400" />
            </div>
            <div>
              <h1 className="text-sm font-display font-semibold text-white">AI Assistant</h1>
              <p className="text-[11px] text-slate-500">
                {isAIConfigured() ? 'Connected' : 'Local mode'}
              </p>
            </div>
          </div>
          <button onClick={handleNewConversation} className="lg:hidden btn-ghost px-3 py-2">
            <Plus size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {messages.length === 0 && !typingIndicator ? (
            <EmptyState
              icon={Bot}
              title="How can I help you?"
              description="Ask me to create reminders, check your tasks, or manage your to-do list. Try: 'Remind me to call Rahul tomorrow at 10.'"
            />
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {typingIndicator && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 md:px-6 py-4 border-t border-white/[0.04]">
          <div className="max-w-2xl mx-auto flex items-end gap-2.5">
            <div className="flex-1 glass rounded-2xl flex items-end gap-2 p-2.5 focus-within:border-ember-500/30 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message your assistant..."
                rows={1}
                className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm resize-none outline-none max-h-32 leading-relaxed"
                style={{ minHeight: '24px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl bg-ember-500 hover:bg-ember-400 disabled:bg-ink-600 disabled:text-slate-600 text-white flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete conversation?"
        message="This will permanently delete this conversation and all its messages."
        confirmLabel="Delete"
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="bg-ember-500/15 border border-ember-500/20 rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%]">
          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ember-500/20 to-frost-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={16} className="text-ember-400" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="glass rounded-2xl rounded-tl-md px-4 py-3">
          <MarkdownText text={message.content} />
        </div>
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.actions.map((action, i) => (
              <ActionBadge key={i} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: AIAction }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
        action.success
          ? 'bg-frost-500/10 border-frost-500/20 text-frost-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}
    >
      {action.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {action.label}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ember-500/20 to-frost-500/10 flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-ember-400" />
      </div>
      <div className="glass rounded-2xl rounded-tl-md px-4 py-3.5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-ember-400 animate-pulse-soft" />
        <span className="w-2 h-2 rounded-full bg-ember-400 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 rounded-full bg-ember-400 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    const boldMatch = line.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const parts = line.split(/\*\*(.+?)\*\*/);
      elements.push(
        <p key={i} className="text-sm text-slate-200 leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part
          )}
        </p>
      );
      return;
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <p key={i} className="text-sm text-slate-200 leading-relaxed flex gap-2">
          <span className="text-ember-400 font-mono">{numberedMatch[1]}.</span>
          <span>{numberedMatch[2]}</span>
        </p>
      );
      return;
    }

    const bulletMatch = line.match(/^•\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <p key={i} className="text-sm text-slate-200 leading-relaxed flex gap-2">
          <span className="text-ember-400">•</span>
          <span>{bulletMatch[1]}</span>
        </p>
      );
      return;
    }

    elements.push(
      <p key={i} className="text-sm text-slate-200 leading-relaxed">{line}</p>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}
