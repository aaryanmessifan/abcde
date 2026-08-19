export interface ParsedIntent {
  intent:
    | 'create_task'
    | 'query_tasks'
    | 'complete_task'
    | 'delete_task'
    | 'create_expense'
    | 'query_expenses'
    | 'create_event'
    | 'query_events'
    | 'greeting'
    | 'help'
    | 'unknown';
  entities: {
    taskTitle?: string;
    dueDate?: string;
    dueTime?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    recurring?: 'daily' | 'weekly' | 'monthly' | null;
    amount?: number;
    expenseCategory?: string;
    expenseDescription?: string;
    eventTitle?: string;
    eventDate?: string;
    eventTime?: string;
    eventType?: string;
  };
}

const GREETING_PATTERNS = [
  /\b(hi|hello|hey|namaste|namaskar|good morning|good afternoon|good evening)\b/i,
];

const HELP_PATTERNS = [
  /\b(what can you|help|how do you work|commands|what do you do)\b/i,
];

const CREATE_KEYWORDS = [
  'remind me to', 'remind me', 'add a task', 'add task', 'create a task', 'create task',
  'add a reminder', 'add reminder', 'set a reminder', 'set reminder', 'schedule',
  "don't let me forget", 'dont let me forget', 'make sure i', 'i need to', 'remember to',
];

const QUERY_KEYWORDS = [
  'what are my tasks', "what's on my", 'what do i have', 'show my tasks', 'show me my tasks',
  'my tasks', 'my reminders', 'what do i need to do', 'anything scheduled',
  "what's my schedule", 'what is my schedule', 'do i have anything', 'list my tasks',
  'what am i supposed to do',
];

const COMPLETE_KEYWORDS = [
  'mark as done', 'mark as complete', 'complete the', 'complete my', 'done with',
  'finished', 'i did', 'i finished', 'i completed', 'mark done', 'check off', 'tick off',
];

const DELETE_KEYWORDS = [
  'delete the task', 'delete task', 'remove the task', 'remove task',
  'cancel the task', 'cancel task', 'delete the reminder', 'remove the reminder',
];

const EXPENSE_KEYWORDS = [
  'add expense', 'add to expenses', 'spent', 'i spent', 'paid for', 'bought',
  'add money', 'record expense', 'track expense',
];

const EXPENSE_QUERY_KEYWORDS = [
  'how much did i spend', 'my expenses', 'my spending', 'show my expenses',
  'what did i spend', 'total spent', 'spending this',
];

const EVENT_KEYWORDS = [
  'add event', 'create event', 'schedule a meeting', 'schedule meeting',
  'add appointment', 'create appointment', 'add to calendar', 'meeting with',
  'appointment with', 'event on',
];

const EVENT_QUERY_KEYWORDS = [
  'what events', 'my events', 'my appointments', 'what appointments',
  'what do i have on', "what's on my calendar", 'calendar today', 'calendar this week',
];

const CATEGORY_MAP: Record<string, string> = {
  groceries: 'groceries', grocery: 'groceries', food: 'food', lunch: 'food', dinner: 'food',
  breakfast: 'food', travel: 'travel', cab: 'travel', taxi: 'travel', uber: 'travel',
  bill: 'bills', bills: 'bills', electricity: 'bills', water: 'bills', phone: 'bills',
  internet: 'bills', shopping: 'shopping', health: 'health', doctor: 'health',
  medicine: 'health', pharmacy: 'health', entertainment: 'entertainment', movie: 'entertainment',
};

export function parseNaturalLanguage(input: string): ParsedIntent {
  const text = input.trim();
  const lower = text.toLowerCase();

  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(lower) && lower.length < 30) return { intent: 'greeting', entities: {} };
  }
  for (const pattern of HELP_PATTERNS) {
    if (pattern.test(lower)) return { intent: 'help', entities: {} };
  }

  // Expense queries
  for (const keyword of EXPENSE_QUERY_KEYWORDS) {
    if (lower.includes(keyword)) return { intent: 'query_expenses', entities: {} };
  }

  // Expense creation — check for currency amounts
  for (const keyword of EXPENSE_KEYWORDS) {
    if (lower.includes(keyword)) return parseExpenseIntent(text, keyword);
  }
  // Direct amount pattern: "₹500 groceries" or "$50 food"
  if (/[₹$]\s*\d+/.test(lower) || /\b\d+\s*(?:rs|rupees?|inr)\b/i.test(lower)) {
    return parseExpenseIntent(text, '');
  }

  // Event creation
  for (const keyword of EVENT_KEYWORDS) {
    if (lower.includes(keyword)) return parseEventIntent(text, keyword);
  }

  // Event queries
  for (const keyword of EVENT_QUERY_KEYWORDS) {
    if (lower.includes(keyword)) return { intent: 'query_events', entities: {} };
  }

  // Task deletion
  for (const keyword of DELETE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { intent: 'delete_task', entities: { taskTitle: extractTaskTitle(text, keyword) } };
    }
  }

  // Task completion
  for (const keyword of COMPLETE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { intent: 'complete_task', entities: { taskTitle: extractTaskTitle(text, keyword) } };
    }
  }

  // Task queries
  for (const keyword of QUERY_KEYWORDS) {
    if (lower.includes(keyword)) return { intent: 'query_tasks', entities: {} };
  }

  // Task creation
  for (const keyword of CREATE_KEYWORDS) {
    if (lower.includes(keyword)) return parseCreateIntent(text, keyword);
  }
  if (lower.startsWith('remind ') || lower.includes('reminder')) {
    return parseCreateIntent(text, 'remind');
  }

  return { intent: 'unknown', entities: {} };
}

function parseExpenseIntent(text: string, keyword: string): ParsedIntent {
  const amountMatch = text.match(/[₹$]?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;

  const lower = text.toLowerCase();
  let expenseCategory = 'other';
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(kw)) { expenseCategory = cat; break; }
  }

  let description = text.replace(amountMatch?.[0] ?? '', '').replace(keyword, '').trim();
  for (const kw of Object.keys(CATEGORY_MAP)) {
    description = description.replace(new RegExp(kw, 'gi'), '');
  }
  description = description.replace(/\b(spent|on|for|at|bought|paid|add|₹|rs\.?|inr)\b/gi, '').trim();
  if (!description) description = expenseCategory.charAt(0).toUpperCase() + expenseCategory.slice(1);

  return {
    intent: 'create_expense',
    entities: { amount, expenseCategory, expenseDescription: description },
  };
}

function parseEventIntent(text: string, keyword: string): ParsedIntent {
  let title = text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(keyword);
  if (idx >= 0) title = text.slice(idx + keyword.length).trim();

  const eventDate = extractDueDate(text);
  const eventTime = extractDueTime(text);

  title = title
    .replace(/\b(tomorrow|today|tonight|next week|next month)\b/gi, '')
    .replace(/\b(on|at|by|before|after|this)\b/gi, ' ')
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi, '')
    .replace(/\b(\d{1,2})\s*(am|pm)\b/gi, '')
    .replace(/\s+/g, ' ').trim();

  if (title.length < 2) title = 'New Event';

  let eventType = 'event';
  if (lower.includes('meeting')) eventType = 'event';
  else if (lower.includes('appointment') || lower.includes('doctor')) eventType = 'appointment';
  else if (lower.includes('birthday')) eventType = 'birthday';
  else if (lower.includes('anniversary')) eventType = 'anniversary';

  return {
    intent: 'create_event',
    entities: { eventTitle: capitalize(title), eventDate, eventTime, eventType },
  };
}

function parseCreateIntent(text: string, keyword: string): ParsedIntent {
  const title = extractTaskTitle(text, keyword);
  const entities: ParsedIntent['entities'] = { taskTitle: title };

  const dueDate = extractDueDate(text);
  if (dueDate) entities.dueDate = dueDate;
  const dueTime = extractDueTime(text);
  if (dueTime) entities.dueTime = dueTime;
  const priority = extractPriority(text);
  if (priority) entities.priority = priority;
  const category = extractCategory(text);
  if (category) entities.category = category;
  const recurring = extractRecurring(text);
  if (recurring) entities.recurring = recurring;

  return { intent: 'create_task', entities };
}

function extractTaskTitle(text: string, keyword: string): string {
  let title = text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(keyword);
  if (idx >= 0) title = text.slice(idx + keyword.length).trim();

  title = title
    .replace(/\b(tomorrow|today|tonight|next week|next month)\b/gi, '')
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\b(on|at|by|before|after|this|every|each|daily|weekly|monthly)\b/gi, ' ')
    .replace(/\b(\d{1,2})(st|nd|rd|th)?\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/gi, '')
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s*(\d{1,2})(st|nd|rd|th)?\b/gi, '')
    .replace(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi, '')
    .replace(/\b(\d{1,2})\s*(am|pm)\b/gi, '')
    .replace(/\b(high|medium|low)\s+priority\b/gi, '')
    .replace(/\b(urgent|important)\b/gi, '')
    .replace(/\b(daily|weekly|monthly|every day|every week|every month)\b/gi, '')
    .replace(/\s+/g, ' ').trim();

  title = title.replace(/^to\s+/i, '').replace(/^me\s+/i, '').replace(/^that\s+/i, '');

  if (title.length < 2) return text.replace(new RegExp(keyword, 'i'), '').trim() || text;
  return capitalize(title);
}

function extractDueDate(text: string): string | undefined {
  const now = new Date();
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) return toDateString(now);
  if (/\btonight\b/.test(lower)) return toDateString(now);
  if (/\btomorrow\b/.test(lower)) { const t = new Date(now); t.setDate(t.getDate() + 1); return toDateString(t); }
  if (/\bnext week\b/.test(lower)) { const t = new Date(now); t.setDate(t.getDate() + 7); return toDateString(t); }
  if (/\bnext month\b/.test(lower)) { const t = new Date(now); t.setMonth(t.getMonth() + 1); return toDateString(t); }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (new RegExp(`\\b${dayNames[i]}\\b`, 'i').test(lower)) {
      const currentDay = now.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      const t = new Date(now); t.setDate(t.getDate() + diff);
      return toDateString(t);
    }
  }

  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthAbbrev = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  for (let i = 0; i < months.length; i++) {
    const patterns = [
      new RegExp(`\\b(\\d{1,2})(st|nd|rd|th)?\\s+${months[i]}\\b`, 'i'),
      new RegExp(`\\b(\\d{1,2})(st|nd|rd|th)?\\s+${monthAbbrev[i]}\\b`, 'i'),
      new RegExp(`\\b${months[i]}\\s+(\\d{1,2})(st|nd|rd|th)?\\b`, 'i'),
      new RegExp(`\\b${monthAbbrev[i]}\\s+(\\d{1,2})(st|nd|rd|th)?\\b`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (match) {
        const day = parseInt(match[1], 10);
        if (day >= 1 && day <= 31) {
          const t = new Date(now.getFullYear(), i, day);
          if (t < now) t.setFullYear(t.getFullYear() + 1);
          return toDateString(t);
        }
      }
    }
  }

  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDaysMatch) { const t = new Date(now); t.setDate(t.getDate() + parseInt(inDaysMatch[1], 10)); return toDateString(t); }

  return undefined;
}

function extractDueTime(text: string): string | undefined {
  const lower = text.toLowerCase();
  const timeMatch = lower.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10); const m = parseInt(timeMatch[2], 10); const ampm = timeMatch[3];
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const hourMatch = lower.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (hourMatch) {
    let h = parseInt(hourMatch[1], 10); const ampm = hourMatch[2];
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:00`;
  }
  if (/\bnoon\b/.test(lower)) return '12:00';
  if (/\bmidnight\b/.test(lower)) return '00:00';
  if (/\bmorning\b/.test(lower)) return '09:00';
  if (/\bafternoon\b/.test(lower)) return '14:00';
  if (/\bevening\b/.test(lower)) return '18:00';
  return undefined;
}

function extractPriority(text: string): 'low' | 'medium' | 'high' | undefined {
  const lower = text.toLowerCase();
  if (/\b(urgent|critical|asap|immediately|high priority)\b/.test(lower)) return 'high';
  if (/\b(low priority|not urgent|whenever|when you can)\b/.test(lower)) return 'low';
  if (/\b(important|high)\b/.test(lower)) return 'high';
  return undefined;
}

function extractCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return undefined;
}

function extractRecurring(text: string): 'daily' | 'weekly' | 'monthly' | null {
  const lower = text.toLowerCase();
  if (/\b(every day|daily)\b/.test(lower)) return 'daily';
  if (/\b(every week|weekly|every monday|every tuesday|every wednesday|every thursday|every friday|every saturday|every sunday)\b/.test(lower)) return 'weekly';
  if (/\b(every month|monthly)\b/.test(lower)) return 'monthly';
  return null;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
