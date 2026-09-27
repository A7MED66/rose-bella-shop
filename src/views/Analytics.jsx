import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/helpers';

const DAY_NAMES = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function Analytics() {
  const { state } = useStore();

  const totalRevenue = state.orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = state.orders.length;
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
  const deliveredOrders = state.orders.filter((o) => o.status === 'تم التسليم').length;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const totals = days.map((d) => state.orders.filter((o) => o.date === d).reduce((s, o) => s + o.total, 0));
  const max = Math.max(1, ...totals);

  const soldMap = {};
  state.orders.forEach((o) =>
    o.items.forEach((it) => {
      if (!soldMap[it.name]) soldMap[it.name] = { qty: 0, revenue: 0 };
      soldMap[it.name].qty += it.qty;
      soldMap[it.name].revenue += it.qty * it.price;
    })
  );
  const top = Object.entries(soldMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  return (
    <section>
      <h2>التحليلات</h2>
      <p className="sub">نظرة سريعة على أداء المحل</p>
      <div className="grid">
        <div className="stat">
          <b>{money(totalRevenue)}</b>
          <span>إجمالي الإيرادات</span>
        </div>
        <div className="stat">
          <b>{totalOrders}</b>
          <span>إجمالي الطلبات</span>
        </div>
        <div className="stat">
          <b>{money(avgOrder)}</b>
          <span>متوسط قيمة الطلب</span>
        </div>
        <div className="stat">
          <b>{deliveredOrders}</b>
          <span>طلب اتسلم</span>
        </div>
      </div>

      <div className="card">
        <h2>المبيعات في آخر 7 أيام</h2>
        <div className="bar-chart">
          {days.map((d, i) => {
            const h = Math.round((totals[i] / max) * 120) + 2;
            const lbl = DAY_NAMES[new Date(d).getDay()];
            return (
              <div key={d} className="bar-col">
                <span className="val">{totals[i] ? money(totals[i]) : ''}</span>
                <div className="bar" style={{ height: `${h}px` }} />
                <span className="lbl">{lbl}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>الأكتر مبيعًا</h2>
        <div className="tblwrap">
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية المباعة</th>
                <th>الإيراد</th>
              </tr>
            </thead>
            <tbody>
              {top.map(([name, d]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{d.qty}</td>
                  <td>{money(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!top.length && <div className="empty">لسه مفيش مبيعات كفاية</div>}
      </div>
    </section>
  );
}
