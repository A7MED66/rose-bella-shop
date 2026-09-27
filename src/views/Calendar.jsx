import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money, statusClass } from '../utils/helpers';

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const DOW = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Calendar() {
  const { state } = useStore();
  const [calDate, setCalDate] = useState(new Date());
  const [calSelected, setCalSelected] = useState(null);

  function ordersOn(dateStr) {
    return state.orders.filter((o) => o.deliveryDate === dateStr);
  }

  function shiftMonth(n) {
    setCalDate((d) => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() + n);
      return nd;
    });
    setCalSelected(null);
  }

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedOrders = calSelected ? ordersOn(calSelected) : [];

  return (
    <section>
      <h2>تقويم التسليم</h2>
      <p className="sub">كل يوم فيه طلبات هيظهر عليه عدد الطلبات المستحقة</p>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn ghost" onClick={() => shiftMonth(-1)}>
            الشهر السابق
          </button>
          <h2 style={{ margin: 0 }}>
            {MONTH_NAMES[month]} {year}
          </h2>
          <button className="btn ghost" onClick={() => shiftMonth(1)}>
            الشهر التالي
          </button>
        </div>
        <div className="cal-grid">
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="cal-day empty" />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            const count = ordersOn(dateStr).length;
            const cls = ['cal-day'];
            if (dateStr === todayStr) cls.push('today');
            if (dateStr === calSelected) cls.push('selected');
            return (
              <div key={i} className={cls.join(' ')} onClick={() => setCalSelected(dateStr)}>
                {d}
                {count ? <span className="dot">{count}</span> : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="card">
        <h2>{calSelected ? `طلبات يوم ${calSelected} (${selectedOrders.length})` : 'اختر يوم من التقويم'}</h2>
        {calSelected ? (
          selectedOrders.length ? (
            selectedOrders.map((o) => (
              <div key={o.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--line)' }}>
                <span>
                  {o.customerName} — {money(o.total)}
                </span>
                <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
              </div>
            ))
          ) : (
            <div className="empty">مفيش طلبات متحددلها تسليم في اليوم ده</div>
          )
        ) : null}
      </div>
    </section>
  );
}
