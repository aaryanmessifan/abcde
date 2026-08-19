import { useState, useEffect } from 'react';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { LockScreen } from '@/components/auth/LockScreen';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { AppLockProvider, useAppLock } from '@/lib/auth/AppLockContext';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { AssistantPage } from '@/pages/AssistantPage';
import { TasksPage } from '@/pages/TasksPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { BirthdayPage } from '@/pages/BirthdayPage';
import { CreatorModePage } from '@/pages/CreatorModePage';
import { MoneyPage } from '@/pages/MoneyPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { FamilyPage } from '@/pages/FamilyPage';
import { InsightsPage } from '@/pages/InsightsPage';
import type { PageId } from '@/config/navigation';

function AppContent() {
  const { user, loading } = useAuth();
  const { hasPin, locked, loading: lockLoading } = useAppLock();
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [collapsed, setCollapsed] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setTransitionKey((k) => k + 1);
  }, [currentPage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || lockLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="w-10 h-10 rounded-full border-2 border-ember-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (hasPin && locked) {
    return <LockScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage key={transitionKey} onNavigate={handleNavigate} />;
      case 'assistant': return <AssistantPage key={transitionKey} />;
      case 'tasks': return <TasksPage key={transitionKey} />;
      case 'documents': return <DocumentsPage key={transitionKey} />;
      case 'money': return <MoneyPage key={transitionKey} />;
      case 'calendar': return <CalendarPage key={transitionKey} />;
      case 'family': return <FamilyPage key={transitionKey} />;
      case 'insights': return <InsightsPage key={transitionKey} />;
      case 'settings': return <SettingsPage key={transitionKey} onNavigate={handleNavigate} />;
      case 'birthday': return <BirthdayPage key={transitionKey} />;
      case 'creator': return <CreatorModePage key={transitionKey} />;
      default: return <HomePage key={transitionKey} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex relative">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.4] pointer-events-none" />
      <div className="fixed inset-0 bg-radial-ember opacity-60 pointer-events-none" />

      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onSearch={() => setSearchOpen(true)}
        onLock={() => { /* lock handled by useAppLock */ }}
      />

      <main className="flex-1 min-w-0 relative">
        <div key={transitionKey} className="animate-fade-in">
          {renderPage()}
        </div>
      </main>

      <MobileNav currentPage={currentPage} onNavigate={handleNavigate} onSearch={() => setSearchOpen(true)} />

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleNavigate} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppLockProvider>
        <AppContent />
      </AppLockProvider>
    </AuthProvider>
  );
}

export default App;
