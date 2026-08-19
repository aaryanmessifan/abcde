import type { AIAction, ChatMessage, Task } from '@/types';
import { createTask, fetchTodayTasks, toggleTaskComplete, deleteTask } from '../services/taskService';
import { createExpense, fetchAllExpenses } from '../services/expenseService';
import { createEvent, fetchAllEvents } from '../services/calendarService';
import { toDateString } from '../date';
import { parseNaturalLanguage, type ParsedIntent } from './nlu';

export interface AIResponse {
  content: string;
  actions: AIAction[];
}

export interface AIContext {
  conversationId: string;
  history: ChatMessage[];
}

export async function processUserMessage(message: string, context: AIContext): Promise<AIResponse> {
  const useRemoteAI = Boolean(import.meta.env.VITE_AI_PROVIDER);
  if (useRemoteAI) {
    try { return await callRemoteAI(message, context); } catch (err) { console.warn('Remote AI failed:', err); }
  }
  return await processLocally(message);
}

async function callRemoteAI(message: string, context: AIContext): Promise<AIResponse> {
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ message, history: context.history.slice(-10) }),
  });
  if (!response.ok) throw new Error(`AI service returned ${response.status}`);
  const data = await response.json();
  const actions: AIAction[] = [];
  if (data.intent && data.intent !== 'unknown') {
    const execResult = await executeIntent(data.intent, data.entities ?? {});
    if (execResult) { actions.push(execResult.action); return { content: execResult.response, actions }; }
  }
  return { content: data.content ?? data.response ?? 'I could not process that request.', actions };
}

async function processLocally(message: string): Promise<AIResponse> {
  const parsed = parseNaturalLanguage(message);
  const result = await executeIntent(parsed.intent, parsed.entities);
  if (result) return { content: result.response, actions: [result.action] };
  return { content: generateFallbackResponse(message, parsed), actions: [] };
}

interface ExecutionResult { response: string; action: AIAction; }

async function executeIntent(intent: ParsedIntent['intent'], entities: ParsedIntent['entities']): Promise<ExecutionResult | null> {
  switch (intent) {
    case 'create_task': return await handleCreateTask(entities);
    case 'query_tasks': return await handleQueryTasks(entities);
    case 'complete_task': return await handleCompleteTask(entities);
    case 'delete_task': return await handleDeleteTask(entities);
    case 'create_expense': return await handleCreateExpense(entities);
    case 'query_expenses': return await handleQueryExpenses(entities);
    case 'create_event': return await handleCreateEvent(entities);
    case 'query_events': return await handleQueryEvents(entities);
    case 'greeting': return { response: "Hello Bade Papa. I'm here to help you stay organized. You can ask me to set reminders, track expenses, schedule events, or check your schedule.", action: { type: 'answer', label: 'Greeting', success: true } };
    case 'help': return { response: "I can help you with:\n\n• **Create tasks** — \"Remind me to call Rahul tomorrow at 10\"\n• **Check tasks** — \"What are my tasks today?\"\n• **Track expenses** — \"Add ₹500 groceries\" or \"Spent 200 on lunch\"\n• **Check spending** — \"How much did I spend?\"\n• **Schedule events** — \"Meeting with Rahul Friday at 4 PM\"\n• **Check calendar** — \"What events do I have?\"\n\nJust tell me what you need in your own words.", action: { type: 'answer', label: 'Help', success: true } };
    default: return null;
  }
}

async function handleCreateTask(entities: ParsedIntent['entities']): Promise<ExecutionResult> {
  if (!entities.taskTitle) return { response: "I'd like to create that reminder, but I'm not sure what the task is. Could you tell me what you'd like to be reminded about?", action: { type: 'create_task', label: 'Create task', success: false, message: 'No task title detected' } };
  const task = await createTask({ title: entities.taskTitle, description: null, due_date: entities.dueDate ?? null, due_time: entities.dueTime ?? null, priority: entities.priority ?? 'medium', category: entities.category ?? 'general', completed: false, recurring: entities.recurring ?? null });
  const dateLabel = entities.dueDate ? new Date(entities.dueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : 'No specific date';
  const timeLabel = entities.dueTime ? ` at ${formatTimeFromString(entities.dueTime)}` : '';
  return { response: `Done. I created a reminder: **${task.title}** — ${dateLabel}${timeLabel}.`, action: { type: 'create_task', label: `Created: ${task.title}`, success: true, data: { taskId: task.id, title: task.title, dueDate: entities.dueDate } } };
}

async function handleQueryTasks(): Promise<ExecutionResult> {
  const tasks = await fetchTodayTasks();
  if (tasks.length === 0) return { response: "You have no tasks due today. Your day is clear.", action: { type: 'query_tasks', label: "Queried today's tasks", success: true, data: { count: 0 } } };
  const taskList = tasks.map((t, i) => { const time = t.due_time ? ` — ${formatTimeFromString(t.due_time)}` : ''; const priority = t.priority === 'high' ? ' ⚡' : ''; return `${i + 1}. ${t.title}${time}${priority}`; }).join('\n');
  return { response: `You have **${tasks.length} task${tasks.length > 1 ? 's' : ''}** today:\n\n${taskList}`, action: { type: 'query_tasks', label: `Found ${tasks.length} tasks`, success: true, data: { count: tasks.length } } };
}

async function handleCompleteTask(entities: ParsedIntent['entities']): Promise<ExecutionResult> {
  if (!entities.taskTitle) return { response: "Which task would you like to mark as complete? Try: \"Mark the groceries task as done.\"", action: { type: 'complete_task', label: 'Complete task', success: false, message: 'No task specified' } };
  const allTasks = await fetchTodayTasks();
  const match = findTaskByTitle(allTasks, entities.taskTitle);
  if (!match) return { response: `I couldn't find a task matching "${entities.taskTitle}" in today's tasks.`, action: { type: 'complete_task', label: 'Complete task', success: false, message: 'Task not found' } };
  await toggleTaskComplete(match);
  return { response: `Marked **${match.title}** as complete. Well done, Bade Papa.`, action: { type: 'complete_task', label: `Completed: ${match.title}`, success: true, data: { taskId: match.id } } };
}

async function handleDeleteTask(entities: ParsedIntent['entities']): Promise<ExecutionResult> {
  if (!entities.taskTitle) return { response: "Which task should I delete? Tell me the task name.", action: { type: 'delete_task', label: 'Delete task', success: false, message: 'No task specified' } };
  const allTasks = await fetchTodayTasks();
  const match = findTaskByTitle(allTasks, entities.taskTitle);
  if (!match) return { response: `I couldn't find a task called "${entities.taskTitle}" to delete.`, action: { type: 'delete_task', label: 'Delete task', success: false, message: 'Task not found' } };
  await deleteTask(match.id);
  return { response: `Deleted the task **${match.title}**.`, action: { type: 'delete_task', label: `Deleted: ${match.title}`, success: true, data: { taskId: match.id } } };
}

async function handleCreateExpense(entities: ParsedIntent['entities']): Promise<ExecutionResult> {
  if (!entities.amount || entities.amount <= 0) return { response: "I'd like to add that expense, but I need an amount. Try: \"Add ₹500 for groceries.\"", action: { type: 'create_expense', label: 'Create expense', success: false, message: 'No amount detected' } };
  const expense = await createExpense({ amount: entities.amount, category: (entities.expenseCategory ?? 'other') as never, description: entities.expenseDescription ?? '', expense_date: toDateString(new Date()) });
  return { response: `Added **₹${expense.amount}** to ${expense.category}.`, action: { type: 'create_expense', label: `Added ₹${expense.amount} to ${expense.category}`, success: true, data: { expenseId: expense.id } } };
}

async function handleQueryExpenses(): Promise<ExecutionResult> {
  const now = new Date();
  const expenses = await fetchAllExpenses();
  const thisMonth = expenses.filter(e => { const d = new Date(e.expense_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const total = thisMonth.reduce((sum, e) => sum + e.amount, 0);
  if (thisMonth.length === 0) return { response: "You haven't recorded any expenses this month.", action: { type: 'query_expenses', label: 'Queried expenses', success: true, data: { total: 0 } } };
  const byCategory: Record<string, number> = {};
  thisMonth.forEach(e => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount; });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  return { response: `You've spent **₹${total.toFixed(0)}** this month across ${thisMonth.length} transactions. Your largest category is ${topCategory[0]} at ₹${topCategory[1].toFixed(0)}.`, action: { type: 'query_expenses', label: `Total: ₹${total.toFixed(0)}`, success: true, data: { total, count: thisMonth.length } } };
}

async function handleCreateEvent(entities: ParsedIntent['entities']): Promise<ExecutionResult> {
  if (!entities.eventTitle) return { response: "I'd like to add that event, but I need a title. Try: \"Meeting with Rahul Friday at 4 PM.\"", action: { type: 'create_event', label: 'Create event', success: false, message: 'No event title' } };
  const event = await createEvent({ title: entities.eventTitle, description: null, event_date: entities.eventDate ?? toDateString(new Date()), event_time: entities.eventTime ?? null, type: (entities.eventType ?? 'event') as never, location: null });
  const dateLabel = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  const timeLabel = event.event_time ? ` at ${formatTimeFromString(event.event_time)}` : '';
  return { response: `Done. I scheduled **${event.title}** on ${dateLabel}${timeLabel}.`, action: { type: 'create_event', label: `Scheduled: ${event.title}`, success: true, data: { eventId: event.id } } };
}

async function handleQueryEvents(): Promise<ExecutionResult> {
  const events = await fetchAllEvents();
  const today = toDateString(new Date());
  const upcoming = events.filter(e => e.event_date >= today).slice(0, 5);
  if (upcoming.length === 0) return { response: "You have no upcoming events on your calendar.", action: { type: 'query_events', label: 'Queried events', success: true, data: { count: 0 } } };
  const eventList = upcoming.map((e, i) => { const d = new Date(e.event_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); const time = e.event_time ? ` at ${formatTimeFromString(e.event_time)}` : ''; return `${i + 1}. ${e.title} — ${d}${time}`; }).join('\n');
  return { response: `You have **${upcoming.length} upcoming event${upcoming.length > 1 ? 's' : ''}**:\n\n${eventList}`, action: { type: 'query_events', label: `Found ${upcoming.length} events`, success: true, data: { count: upcoming.length } } };
}

function findTaskByTitle(tasks: Task[], query: string): Task | null {
  const q = query.toLowerCase().trim();
  let match = tasks.find(t => t.title.toLowerCase() === q);
  if (match) return match;
  match = tasks.find(t => t.title.toLowerCase().includes(q));
  if (match) return match;
  match = tasks.find(t => q.includes(t.title.toLowerCase()));
  return match ?? null;
}

function formatTimeFromString(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function generateFallbackResponse(message: string, parsed: ParsedIntent): string {
  const lower = message.toLowerCase().trim();
  if (parsed.intent === 'unknown') {
    if (lower.includes('thank')) return "You're welcome, Bade Papa. Anything else I can help with?";
    if (lower.includes('how are you') || lower.includes('how you')) return "I'm running smoothly and ready to help. What would you like to do?";
    if (lower.includes('what can you') || lower.includes('who are you')) return "I'm your personal AI assistant, Bade Papa. I can create reminders, track expenses, schedule events, and help you stay organized. Try saying: \"Remind me to call Rahul tomorrow at 10.\"";
  }
  return "I'm not quite sure how to help with that yet. For now, I can create reminders, track expenses, and schedule events. Try: \"Add ₹500 groceries\" or \"Meeting with Rahul Friday at 4 PM.\"";
}

export function isAIConfigured(): boolean {
  return Boolean(import.meta.env.VITE_AI_PROVIDER);
}

export { toDateString };
