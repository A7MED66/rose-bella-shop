import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';

const NAV_ITEMS = [
  { view: 'dashboard', icon: '🏠', label: 'لوحة التحكم', adminOnly: false },
  { view: 'inventory', icon: '📦', label: 'المخزون', adminOnly: true },
  { view: 'orders', icon: '🧾', label: 'الطلبات والفواتير', adminOnly: false },
  { view: 'calendar', icon: '📅', label: 'تقويم التسليم', adminOnly: false },
  { view: 'analytics', icon: '📊', label: 'التحليلات', adminOnly: true },
  { view: 'customers', icon: '👥', label: 'العملاء والمناسبات', adminOnly: false },
  { view: 'invoiceLog', icon: '🗄️', label: 'سجل الفواتير', adminOnly: true },
  { view: 'shiftLog', icon: '🕒', label: 'سجل الورديات', adminOnly: true },
  { view: 'settings', icon: '⚙️', label: 'الإعدادات', adminOnly: true },
];

export default function Sidebar({ activeView, setActiveView }) {
  const { session, logout, syncStatus } = useStore();
  const isAdmin = session?.role === 'admin';
  const [menuOpen, setMenuOpen] = useState(false);

  function selectView(view) {
    setActiveView(view);
    setMenuOpen(false);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-bar">
        <div className="brand">
          <span className="brand-mark">Rosa Bella</span>
          <span>نظام الإدارة الداخلي</span>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'قفل القائمة' : 'فتح القائمة'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
      <nav className={menuOpen ? 'nav-menu open' : 'nav-menu'}>
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <button
            key={item.view}
            className={activeView === item.view ? 'active' : ''}
            onClick={() => selectView(item.view)}
            title={item.label}
          >
            <span className="ic">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span
          id="syncStatus"
          style={{ fontSize: 11, color: syncStatus === 'البيانات متزامنة مع الفريق' ? '#8FBF8A' : '#D9C9C5' }}
        >
          {syncStatus}
        </span>
        <button className="btn ghost" style={{ fontSize: 12, padding: '7px 10px' }} onClick={logout}>
          تسجيل خروج
        </button>
      </div>
    </aside>
  );
}
