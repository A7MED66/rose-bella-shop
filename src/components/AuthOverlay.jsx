import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';

export default function AuthOverlay() {
  const { authSettings, setupAuth, login } = useStore();
  const [setupAdminPass, setSetupAdminPass] = useState('');
  const [setupCashierPass, setSetupCashierPass] = useState('');
  const [chosenRole, setChosenRole] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const { toast } = useStore();

  function handleSetup() {
    if (!setupAdminPass.trim() || !setupCashierPass.trim()) {
      toast('اكتب باسورد لكل من الأدمن والكاشير');
      return;
    }
    setupAuth(setupAdminPass.trim(), setupCashierPass.trim());
  }

  function handleLogin() {
    const ok = login(chosenRole, loginPass);
    if (!ok) {
      setLoginError(true);
      return;
    }
    setLoginError(false);
  }

  return (
    <div id="authOverlay">
      <div className="card" style={{ maxWidth: 360, width: '100%' }}>
        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="brand-mark">Rosa Bella</span>
          <span>نظام الإدارة الداخلي</span>
        </div>

        {!authSettings ? (
          <div>
            <h2>الإعداد الأول</h2>
            <p className="sub">حدد باسورد لكل من الأدمن والكاشير — تقدر تغيّرهم بعدين من الإعدادات</p>
            <div className="field">
              <label>باسورد الأدمن</label>
              <input type="password" value={setupAdminPass} onChange={(e) => setSetupAdminPass(e.target.value)} />
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>باسورد الكاشير</label>
              <input type="password" value={setupCashierPass} onChange={(e) => setSetupCashierPass(e.target.value)} />
            </div>
            <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={handleSetup}>
              حفظ والدخول كأدمن
            </button>
          </div>
        ) : (
          <div>
            <h2>تسجيل الدخول</h2>
            <div className="row" style={{ margin: '10px 0' }}>
              <button
                className={`btn ghost role-btn ${chosenRole === 'admin' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setChosenRole('admin')}
              >
                أدمن
              </button>
              <button
                className={`btn ghost role-btn ${chosenRole === 'cashier' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setChosenRole('cashier')}
              >
                كاشير
              </button>
            </div>
            <div className="field">
              <label>الباسورد</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
            </div>
            <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={handleLogin}>
              دخول
            </button>
            {loginError && (
              <div className="sub" style={{ color: 'var(--accent)', marginTop: 8 }}>
                باسورد غلط
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
