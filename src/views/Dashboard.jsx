import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money, todayStr, fmtDateTime } from '../utils/helpers';

export default function Dashboard() {
  const { state, session, shiftStart, currentShiftOrders, endShift } = useStore();
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const lowStock = state.products.filter((p) => p.qty <= (p.reorderLevel ?? 5)).length;
  const openOrders = state.orders.filter((o) => o.status !== 'تم التسليم').length;
  const today = todayStr();
  const dueToday = state.orders.filter((o) => o.deliveryDate === today && o.status !== 'تم التسليم').length;
  const shiftOrders = currentShiftOrders();
  const shiftTotal = shiftOrders.reduce((s, o) => s + o.total, 0);

  const now = new Date();
  const in30 = new Date();
  in30.setDate(now.getDate() + 30);
  const upcoming = state.customers.filter((c) => {
    if (!c.occDate) return false;
    const d = new Date(c.occDate);
    d.setFullYear(now.getFullYear());
    if (d < now) d.setFullYear(now.getFullYear() + 1);
    return d <= in30;
  });

  return (
    <section>
      <div className="grid">
        <div className="stat">
          <b>{lowStock}</b>
          <span>منتج على وشك النفاد</span>
        </div>
        <div className="stat">
          <b>{openOrders}</b>
          <span>طلب لسه مش متسلم</span>
        </div>
        <div className="stat">
          <b>{dueToday}</b>
          <span>تسليم مستحق النهارده</span>
        </div>
        <div className="stat">
          <b>{money(shiftTotal)}</b>
          <span>مبيعات الشفت الحالي</span>
        </div>
      </div>

      {session && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>الشفت الحالي</h2>
              <p className="sub" style={{ margin: '4px 0 0' }}>
                بدأ الشفت: {shiftStart ? fmtDateTime(shiftStart) : '—'} — {shiftOrders.length} طلب — الإيرادات لحد دلوقتي: {money(shiftTotal)}
              </p>
            </div>
            <button className="btn" onClick={() => setConfirmingEnd(true)}>
              إنهاء الشفت
            </button>
          </div>
          {confirmingEnd && (
            <div style={{ marginTop: 12 }}>
              <p className="sub" style={{ marginBottom: 10 }}>
                متأكد إنك عايز تقفل الشفت الحالي؟
              </p>
              <button
                className="btn"
                onClick={() => {
                  setConfirmingEnd(false);
                  endShift();
                }}
              >
                موافق
              </button>
              <button className="btn ghost" onClick={() => setConfirmingEnd(false)}>
                لا
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>مناسبات قريبة</h2>
        <p className="sub">خلال الثلاثين يوم الجايين</p>
        {upcoming.length ? (
          upcoming.map((c) => (
            <div key={c.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--line)' }}>
              <span>
                {c.name} — {c.phone || 'بدون رقم'}
              </span>
              <span className="occasion-tag">
                {c.occType} · {c.occDate}
              </span>
            </div>
          ))
        ) : (
          <div className="empty">مفيش مناسبات قريبة دلوقتي</div>
        )}
      </div>
    </section>
  );
}
