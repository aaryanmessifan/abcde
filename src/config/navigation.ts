import { Home, Bot, CheckSquare, FileText, Wallet, Calendar, Users, Brain, Settings, Cake, Palette } from 'lucide-react';

export type PageId =
  | 'home'
  | 'assistant'
  | 'tasks'
  | 'documents'
  | 'money'
  | 'calendar'
  | 'family'
  | 'insights'
  | 'settings'
  | 'birthday'
  | 'creator';

export interface NavItem {
  id: PageId;
  label: string;
  icon: typeof Home;
  badge?: string;
}

export const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'money', label: 'Money', icon: Wallet },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'insights', label: 'Insights', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const birthdayNavItem: NavItem = {
  id: 'birthday',
  label: 'Birthday Protocol',
  icon: Cake,
};

export const creatorNavItem: NavItem = {
  id: 'creator',
  label: 'Creator Mode',
  icon: Palette,
};
