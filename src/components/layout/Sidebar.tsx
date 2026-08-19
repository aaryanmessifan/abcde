import { navItems, birthdayNavItem, creatorNavItem, type PageId } from '@/config/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ChevronLeft, ChevronRight, Search, Lock } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSearch: () => void;
  onLock: () => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse, onSearch, onLock }: SidebarProps) {
  const { profile } = useAuth();

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 border-r border-white/[0.04] bg-ink-900/40 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/[0.04]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ember-500 to-ember-700 flex items-center justify-center flex-shrink-0 shadow-ember">
          <span className="font-display font-bold text-white text-sm">BP</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="font-display font-semibold text-white text-sm leading-tight">BADE PAPA</p>
            <p className="text-[10px] text-ember-400/80 font-mono tracking-wider">OS · v2.0</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 py-2 border-b border-white/[0.04]">
          <button onClick={onSearch} className="nav-item w-full text-slate-500 text-sm">
            <Search size={16} /> <span>Search...</span>
            <kbd className="ml-auto text-[9px] font-mono bg-white/[0.04] px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="px-2 py-2 border-b border-white/[0.04]">
          <button onClick={onSearch} className="nav-item w-full justify-center px-2 text-slate-500">
            <Search size={18} />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-none py-3 px-2.5">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full ${currentPage === item.id ? 'nav-item-active' : ''} ${
                collapsed ? 'justify-center px-2' : ''
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={19} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-[10px] font-mono text-ember-400 bg-ember-500/10 px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-2.5 py-3 border-t border-white/[0.04] space-y-0.5">
        {!collapsed && profile && (
          <div className="px-3 py-1.5 mb-1">
            <p className="text-[10px] text-slate-600 font-mono">Signed in as</p>
            <p className="text-xs text-slate-400 truncate">{profile.display_name}</p>
          </div>
        )}
        <button
          onClick={() => onNavigate('creator')}
          className={`nav-item w-full ${currentPage === 'creator' ? 'nav-item-active' : ''} ${
            collapsed ? 'justify-center px-2' : ''
          } group`}
          title={collapsed ? creatorNavItem.label : undefined}
        >
          <creatorNavItem.icon size={19} className="flex-shrink-0 text-slate-500 group-hover:text-ember-400/70 transition-colors" />
          {!collapsed && <span className="text-sm font-medium text-slate-500 group-hover:text-ember-400/70 transition-colors">{creatorNavItem.label}</span>}
        </button>
        <button
          onClick={() => onNavigate('birthday')}
          className={`nav-item w-full ${currentPage === 'birthday' ? 'nav-item-active' : ''} ${
            collapsed ? 'justify-center px-2' : ''
          } group`}
          title={collapsed ? birthdayNavItem.label : undefined}
        >
          <birthdayNavItem.icon size={19} className="flex-shrink-0 text-slate-600 group-hover:text-ember-400/70 transition-colors" />
          {!collapsed && <span className="text-sm font-medium text-slate-600 group-hover:text-ember-400/70 transition-colors">{birthdayNavItem.label}</span>}
        </button>
        <button
          onClick={onLock}
          className={`nav-item w-full ${collapsed ? 'justify-center px-2' : ''} text-slate-500 hover:text-ember-400`}
          title={collapsed ? 'Lock' : undefined}
        >
          <Lock size={19} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Lock</span>}
        </button>
        <button
          onClick={onToggleCollapse}
          className="nav-item w-full justify-center px-2 text-slate-500 hover:text-slate-300"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}

interface MobileNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onSearch: () => void;
}

export function MobileNav({ currentPage, onNavigate, onSearch }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/[0.06]">
        <div className="flex items-center justify-around px-2 py-1.5 safe-bottom">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                currentPage === item.id ? 'text-ember-400' : 'text-slate-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button onClick={onSearch} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-slate-500">
            <Search size={20} />
            <span className="text-[10px] font-medium">Search</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-slate-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="5" cy="12" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
            </svg>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 animate-fade-in" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-3xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-2">
              {navItems.slice(4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
                    currentPage === item.id ? 'bg-ember-500/10 text-ember-400' : 'bg-white/[0.03] text-slate-400'
                  }`}
                >
                  <item.icon size={22} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => { onNavigate('creator'); setMenuOpen(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
                  currentPage === 'creator' ? 'bg-ember-500/10 text-ember-400' : 'bg-white/[0.03] text-slate-400'
                }`}
              >
                <creatorNavItem.icon size={22} />
                <span className="text-xs font-medium">Creator</span>
              </button>
              <button
                onClick={() => { onNavigate('birthday'); setMenuOpen(false); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.03] text-slate-600"
              >
                <birthdayNavItem.icon size={22} />
                <span className="text-xs font-medium">Birthday</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
