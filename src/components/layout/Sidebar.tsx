import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid3X3,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Globe,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'tileFormats', href: '/tile-formats', icon: Grid3X3 },
  { key: 'customers', href: '/customers', icon: Users },
  { key: 'deals', href: '/deals', icon: FileText },
  { key: 'payments', href: '/payments', icon: CreditCard },
  { key: 'reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { key: 'users', href: '/users', icon: UserCog, roles: ['ADMIN'] },
  { key: 'settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();

  const filteredNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('tiletrade-lang', next);
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-primary">TileTrade Pro</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {filteredNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Language Toggle + User info & logout */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className={cn('w-full justify-start gap-3 mb-1', collapsed && 'justify-center px-2')}
          onClick={toggleLang}
        >
          <Globe className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{i18n.language === 'en' ? 'Русский' : 'English'}</span>}
        </Button>
        {!collapsed && user && (
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn('w-full justify-start gap-3', collapsed && 'justify-center px-2')}
          onClick={logout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </Button>
      </div>
    </aside>
  );
}
