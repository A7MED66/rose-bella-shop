import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money, statusClass, fmtDateTime } from '../utils/helpers';

function deliveryInfoTag(o) {
  if (!o.isDelivery) return null;
  return <span className="occasion-tag">🚚 دليفري — {o.deliveryPhone || 'بدون رقم'}</span>;
}

function orderRelevantDate(o) {
  return o.deliveredAt ? o.deliveredAt.slice(0, 10) : o.deliveryDate || o.date;
}

export default function InvoiceLog({ onPrint }) {
  const { state, deleteOrder, bulkDeleteOrders, toast } = useStore();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pendingIds, setPendingIds] = useState(null);

  const delivered = state.orders
    .filter((o) => o.status === 'تم التسليم')
    .sort((a, b) => (b.deliveredAt || b.deliveryDate || b.date || '').localeCompare(a.deliveredAt || a.deliveryDate || a.date || ''));

  function handleBulkDelete() {
    if (!fromDate || !toDate) {
      toast('حدد الفترة من تاريخ وإلى تاريخ الأول');
      return;
    }
    const matches = delivered.filter((o) => {
      const d = orderRelevantDate(o);
      return d && d >= fromDate && d <= toDate;
    });
    if (!matches.length) {
      toast('مفيش فواتير متسلمة في الفترة دي');
      return;
    }
    setPendingIds(matches.map((o) => o.id));
  }

  function confirmDelete() {
    bulkDeleteOrders(pendingIds);
    toast(`اتحذفت ${pendingIds.length} فاتورة`);
    setPendingIds(null);
  }

  return (
    <section>
      <h2>سجل الفواتير</h2>
      <p className="sub">الفواتير اللي اتسلمت — اختفت من قائمة الطلبات الأساسية وبقت هنا بس</p>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>من تاريخ</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="field">
            <label>إلى تاريخ</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <button className="btn ghost" onClick={handleBulkDelete}>
            حذف الفواتير في الفترة دي
          </button>
        </div>
        {pendingIds && (
          <div style={{ marginTop: 12 }}>
            <p className="sub" style={{ marginBottom: 10 }}>
              هيتم حذف {pendingIds.length} فاتورة نهائيًا من {fromDate} لغاية {toDate}. متأكد؟
            </p>
            <button className="btn" onClick={confirmDelete}>
              تأكيد الحذف
            </button>
            <button className="btn ghost" onClick={() => setPendingIds(null)}>
              إلغاء
            </button>
          </div>
        )}
      </div>
      <div>
        {delivered.length ? (
          delivered.map((o) => {
            const deliveredLabel = o.deliveredAt ? fmtDateTime(o.deliveredAt) : o.deliveryDate || o.date;
            return (
              <div key={o.id} className="card">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b>{o.customerName}</b>{' '}
                    <span className="sub" style={{ margin: '0 0 0 8px', display: 'inline' }}>
                      {deliveredLabel ? 'اتسلمت في ' + deliveredLabel : 'من غير وقت تسليم مسجل'}
                    </span>
                  </div>
                  <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
                </div>
                <div style={{ margin: '6px 0' }}>{deliveryInfoTag(o)}</div>
                <ul className="order-items">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.name} × {it.qty}
                      <span>{money(it.qty * it.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="total-line">
                  <span>الإجمالي</span>
                  <span>{money(o.total)}</span>
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn ghost" onClick={() => onPrint(o.id)}>
                    طباعة الفاتورة
                  </button>
                  <button className="icon-btn" onClick={() => deleteOrder(o.id)}>
                    حذف
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">لسه مفيش فواتير متسلمة</div>
        )}
      </div>
    </section>
  );
}
