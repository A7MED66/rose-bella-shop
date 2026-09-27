import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function Customers() {
  const { state, addCustomer, deleteCustomer, toast } = useStore();

  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cOccType, setCOccType] = useState('');
  const [cOccDate, setCOccDate] = useState('');
  const [cNotes, setCNotes] = useState('');

  function handleAdd() {
    const name = cName.trim();
    if (!name) {
      toast('اكتب اسم العميل');
      return;
    }
    addCustomer({ name, phone: cPhone.trim(), occType: cOccType, occDate: cOccDate, notes: cNotes.trim() });
    setCName('');
    setCPhone('');
    setCOccType('');
    setCOccDate('');
    setCNotes('');
  }

  return (
    <section>
      <h2>العملاء</h2>
      <p className="sub">بيانات العملاء والمناسبات الخاصة بيهم</p>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>الاسم</label>
            <input placeholder="اسم العميل" value={cName} onChange={(e) => setCName(e.target.value)} />
          </div>
          <div className="field">
            <label>التليفون</label>
            <input placeholder="01xxxxxxxxx" value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>نوع المناسبة</label>
            <select value={cOccType} onChange={(e) => setCOccType(e.target.value)}>
              <option value="">بدون مناسبة</option>
              <option>عيد ميلاد</option>
              <option>خطوبة</option>
              <option>جواز</option>
              <option>ذكرى</option>
              <option>أخرى</option>
            </select>
          </div>
          <div className="field">
            <label>تاريخ المناسبة</label>
            <input type="date" value={cOccDate} onChange={(e) => setCOccDate(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="field" style={{ flex: 3 }}>
            <label>ملاحظات</label>
            <textarea placeholder="أي تفاصيل تانية" value={cNotes} onChange={(e) => setCNotes(e.target.value)} />
          </div>
          <button className="btn" onClick={handleAdd}>
            إضافة عميل
          </button>
        </div>
      </div>
      <div className="card">
        <div className="tblwrap">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>التليفون</th>
                <th>المناسبة</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.occType || '—'}</td>
                  <td>{c.occDate || '—'}</td>
                  <td>
                    <button className="icon-btn" onClick={() => deleteCustomer(c.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!state.customers.length && <div className="empty">لسه مفيش عملاء مضافين</div>}
      </div>
    </section>
  );
}
