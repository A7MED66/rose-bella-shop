import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function Settings() {
  const { changePasswords, toast } = useStore();
  const [newAdmin, setNewAdmin] = useState('');
  const [newCashier, setNewCashier] = useState('');

  function handleSave() {
    if (!newAdmin.trim() && !newCashier.trim()) {
      toast('اكتب باسورد جديد واحد على الأقل');
      return;
    }
    changePasswords(newAdmin.trim(), newCashier.trim());
    setNewAdmin('');
    setNewCashier('');
  }

  return (
    <section>
      <h2>الإعدادات</h2>
      <p className="sub">تغيير باسوردات دخول الأدمن والكاشير</p>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>باسورد الأدمن الجديد</label>
            <input
              type="password"
              placeholder="اسيبه فاضي لو مش هتغيره"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
            />
          </div>
          <div className="field">
            <label>باسورد الكاشير الجديد</label>
            <input
              type="password"
              placeholder="اسيبه فاضي لو مش هتغيره"
              value={newCashier}
              onChange={(e) => setNewCashier(e.target.value)}
            />
          </div>
          <button className="btn" onClick={handleSave}>
            حفظ
          </button>
        </div>
      </div>
    </section>
  );
}
