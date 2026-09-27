import { useEffect, useState } from 'react';
import { useStore } from './context/StoreContext.jsx';
import AuthOverlay from './components/AuthOverlay.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import PrintInvoice from './components/PrintInvoice.jsx';
import Dashboard from './views/Dashboard.jsx';
import Inventory from './views/Inventory.jsx';
import Orders from './views/Orders.jsx';
import Calendar from './views/Calendar.jsx';
import Analytics from './views/Analytics.jsx';
import Customers from './views/Customers.jsx';
import InvoiceLog from './views/InvoiceLog.jsx';
import ShiftLog from './views/ShiftLog.jsx';
import Settings from './views/Settings.jsx';

const ADMIN_ONLY_VIEWS = ['inventory', 'analytics', 'invoiceLog', 'shiftLog', 'settings'];

export default function App() {
  const { state, session } = useStore();
  const [activeView, setActiveView] = useState('dashboard');
  const [printOrderId, setPrintOrderId] = useState(null);

  const isAdmin = session?.role === 'admin';

  // Non-admins can never land on an admin-only view.
  useEffect(() => {
    if (session && !isAdmin && ADMIN_ONLY_VIEWS.includes(activeView)) {
      setActiveView('dashboard');
    }
  }, [session, isAdmin, activeView]);

  // Trigger the browser print dialog once the printable invoice is rendered.
  useEffect(() => {
    if (printOrderId) {
      const t = setTimeout(() => {
        window.print();
        setPrintOrderId(null);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [printOrderId]);

  if (!session) {
    return (
      <>
        <AuthOverlay />
        <Toast />
      </>
    );
  }

  const printOrder = printOrderId ? state.orders.find((o) => o.id === printOrderId) : null;

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main>
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'inventory' && isAdmin && <Inventory />}
        {activeView === 'orders' && <Orders onPrint={setPrintOrderId} />}
        {activeView === 'calendar' && <Calendar />}
        {activeView === 'analytics' && isAdmin && <Analytics />}
        {activeView === 'customers' && <Customers />}
        {activeView === 'invoiceLog' && isAdmin && <InvoiceLog onPrint={setPrintOrderId} />}
        {activeView === 'shiftLog' && isAdmin && <ShiftLog />}
        {activeView === 'settings' && isAdmin && <Settings />}
      </main>
      <Toast />
      <PrintInvoice order={printOrder} />
    </div>
  );
}
