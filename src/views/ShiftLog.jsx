import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money, fmtDateTime } from '../utils/helpers';

export default function ShiftLog() {
  const { state, deleteShift, bulkDeleteShifts, toast } = useStore();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pendingIds, setPendingIds] = useState(null);

  const sorted = [...state.shifts].sort((a, b) => (b.endedAt || '').localeCompare(a.endedAt || ''));

  function handleBulkDelete() {
    if (!fromDate || !toDate) {
      toast('حدد الفترة من تاريخ وإلى تاريخ الأول');
      return;
    }
    const matches = state.shifts.filter((s) => {
      const d = s.endedAt ? s.endedAt.slice(0, 10) : null;
      return d && d >= fromDate && d <= toDate;
    });
    if (!matches.length) {
      toast('مفيش ورديات مقفولة في الفترة دي');
      return;
    }
    setPendingIds(matches.map((s) => s.id));
  }

  function confirmDelete() {
    bulkDeleteShifts(pendingIds);
    toast(`اتحذفت ${pendingIds.length} وردية`);
    setPendingIds(null);
  }

  return (
    <section>
      <h2>سجل الورديات</h2>
      <p className="sub">كل وردية اتقفلت وإيراداتها</p>
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
            حذف الورديات في الفترة دي
          </button>
        </div>
        {pendingIds && (
          <div style={{ marginTop: 12 }}>
            <p className="sub" style={{ marginBottom: 10 }}>
              هيتم حذف {pendingIds.length} وردية نهائيًا من {fromDate} لغاية {toDate}. متأكد؟
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
        {sorted.length ? (
          sorted.map((s) => (
            <div key={s.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span>
                  من {fmtDateTime(s.startedAt)} لحد {fmtDateTime(s.endedAt)}
                </span>
                <span className="badge ok">{s.orderCount} طلب</span>
              </div>
              <div className="total-line">
                <span>الإيرادات</span>
                <span>{money(s.totalRevenue)}</span>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="icon-btn" onClick={() => deleteShift(s.id)}>
                  حذف
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">لسه مفيش ورديات مقفولة</div>
        )}
      </div>
    </section>
  );
}
