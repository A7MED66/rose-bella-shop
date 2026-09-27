import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/helpers';

export default function Inventory() {
  const { state, addProduct, deleteProduct, quickAddStock, addMovement, addSupplier, deleteSupplier, toast } = useStore();

  // ---- add product form ----
  const [pName, setPName] = useState('');
  const [pType, setPType] = useState('ورد');
  const [pColor, setPColor] = useState('');
  const [pQty, setPQty] = useState(0);
  const [pPrice, setPPrice] = useState(0);
  const [pSupplier, setPSupplier] = useState('');
  const [pReorder, setPReorder] = useState(5);

  function handleAddProduct() {
    const name = pName.trim();
    if (!name) {
      toast('اكتب اسم المنتج');
      return;
    }
    addProduct({
      name,
      type: pType,
      color: pColor.trim(),
      qty: Number(pQty) || 0,
      price: Number(pPrice) || 0,
      supplierId: pSupplier,
      reorderLevel: Number(pReorder) || 5,
    });
    setPName('');
    setPColor('');
    setPQty(0);
    setPPrice(0);
    setPReorder(5);
    setPSupplier('');
  }

  // ---- restock quick inputs ----
  const [restockQty, setRestockQty] = useState({});

  function handleQuickRestock(product) {
    const qty = Number(restockQty[product.id] ?? 1);
    if (!qty || qty <= 0) {
      toast('اكتب رقم صحيح أكبر من صفر');
      return;
    }
    quickAddStock(product, qty);
    setRestockQty((r) => ({ ...r, [product.id]: 1 }));
  }

  // ---- movements form ----
  const [mProduct, setMProduct] = useState('');
  const [mType, setMType] = useState('وارد');
  const [mQty, setMQty] = useState(1);
  const [mReason, setMReason] = useState('');

  function handleAddMovement() {
    const pid = mProduct || state.products[0]?.id;
    const qty = Number(mQty) || 0;
    if (!pid || qty <= 0) {
      toast('اختار منتج واكتب كمية صحيحة');
      return;
    }
    addMovement(pid, mType, qty, mReason.trim());
    setMQty(1);
    setMReason('');
  }

  // ---- suppliers form ----
  const [sName, setSName] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sNotes, setSNotes] = useState('');

  function handleAddSupplier() {
    const name = sName.trim();
    if (!name) {
      toast('اكتب اسم المورد');
      return;
    }
    addSupplier({ name, phone: sPhone.trim(), notes: sNotes.trim() });
    setSName('');
    setSPhone('');
    setSNotes('');
  }

  const alerts = state.products.filter((p) => p.qty <= (p.reorderLevel ?? 5));

  return (
    <section>
      <h2>المخزون</h2>
      <p className="sub">الورد، الألوان، والمنتجات المتاحة في المحل</p>

      <div className="card">
        <div className="row">
          <div className="field">
            <label>اسم المنتج</label>
            <input placeholder="ورد جوري" value={pName} onChange={(e) => setPName(e.target.value)} />
          </div>
          <div className="field">
            <label>النوع</label>
            <select value={pType} onChange={(e) => setPType(e.target.value)}>
              <option>ورد</option>
              <option>بوكيه</option>
              <option>إكسسوار</option>
              <option>أخرى</option>
            </select>
          </div>
          <div className="field">
            <label>اللون</label>
            <input placeholder="أحمر" value={pColor} onChange={(e) => setPColor(e.target.value)} />
          </div>
          <div className="field">
            <label>الكمية</label>
            <input type="number" min="0" value={pQty} onChange={(e) => setPQty(e.target.value)} />
          </div>
          <div className="field">
            <label>سعر الوحدة</label>
            <input type="number" min="0" value={pPrice} onChange={(e) => setPPrice(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>المورد (اختياري)</label>
            <select value={pSupplier} onChange={(e) => setPSupplier(e.target.value)}>
              <option value="">بدون مورد</option>
              {state.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>حد إعادة الطلب</label>
            <input type="number" min="0" value={pReorder} onChange={(e) => setPReorder(e.target.value)} />
          </div>
          <button className="btn" onClick={handleAddProduct}>
            إضافة منتج
          </button>
        </div>
      </div>

      <div className="card">
        <div className="tblwrap">
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>النوع</th>
                <th>اللون</th>
                <th>الكمية</th>
                <th>المورد</th>
                <th>السعر</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.products.map((p) => {
                const level = p.reorderLevel ?? 5;
                const low = p.qty <= level;
                const supplier = state.suppliers.find((s) => s.id === p.supplierId);
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.type}</td>
                    <td>{p.color || '—'}</td>
                    <td>
                      <span className={`badge ${low ? 'low' : 'ok'}`}>{p.qty}</span>
                    </td>
                    <td>{supplier ? supplier.name : '—'}</td>
                    <td>{money(p.price)}</td>
                    <td>
                      <input
                        type="number"
                        className="mini-input"
                        min="1"
                        value={restockQty[p.id] ?? 1}
                        onChange={(e) => setRestockQty((r) => ({ ...r, [p.id]: e.target.value }))}
                      />
                      <button className="icon-btn" onClick={() => handleQuickRestock(p)}>
                        ➕ تزويد
                      </button>
                      <button className="icon-btn" onClick={() => deleteProduct(p.id)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!state.products.length && <div className="empty">لسه مفيش منتجات مضافة</div>}
      </div>

      <h2>تنبيهات المخزون</h2>
      <p className="sub">منتجات وصلت لحد إعادة الطلب أو أقل</p>
      <div className="card">
        {alerts.length ? (
          alerts.map((p) => {
            const supplier = state.suppliers.find((s) => s.id === p.supplierId);
            return (
              <div key={p.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--line)' }}>
                <span>
                  {p.name} — متبقي {p.qty} (حد الطلب {p.reorderLevel ?? 5})
                </span>
                <span className="badge low">
                  {supplier ? 'المورد: ' + supplier.name + (supplier.phone ? ' — ' + supplier.phone : '') : 'مفيش مورد محدد'}
                </span>
              </div>
            );
          })
        ) : (
          <div className="empty">مفيش منتجات محتاجة إعادة طلب دلوقتي</div>
        )}
      </div>

      <h2>حركة المخزون</h2>
      <p className="sub">سجّل وارد جديد، منصرف يدوي، أو تسوية للكمية</p>
      <div className="card">
        <div className="row">
          <div className="field" style={{ flex: 2 }}>
            <label>المنتج</label>
            <select value={mProduct} onChange={(e) => setMProduct(e.target.value)}>
              {state.products.length ? (
                state.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option value="">مفيش منتجات في المخزون</option>
              )}
            </select>
          </div>
          <div className="field">
            <label>نوع الحركة</label>
            <select value={mType} onChange={(e) => setMType(e.target.value)}>
              <option value="وارد">وارد (إضافة للمخزون)</option>
              <option value="منصرف">منصرف (خصم يدوي)</option>
              <option value="تسوية">تسوية (تحديد الكمية الفعلية)</option>
            </select>
          </div>
          <div className="field">
            <label>الكمية</label>
            <input type="number" min="1" value={mQty} onChange={(e) => setMQty(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label>السبب (اختياري)</label>
            <input placeholder="توريد جديد / تالف / جرد" value={mReason} onChange={(e) => setMReason(e.target.value)} />
          </div>
          <button className="btn sage" onClick={handleAddMovement}>
            تسجيل الحركة
          </button>
        </div>
      </div>
      <div className="card">
        <div className="tblwrap">
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>النوع</th>
                <th>الكمية</th>
                <th>السبب</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {state.movements.map((m) => (
                <tr key={m.id}>
                  <td>{m.productName}</td>
                  <td>{m.type}</td>
                  <td>{m.qty}</td>
                  <td>{m.reason || '—'}</td>
                  <td>{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!state.movements.length && <div className="empty">لسه مفيش حركة مخزون متسجلة</div>}
      </div>

      <h2>الموردين</h2>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>اسم المورد</label>
            <input placeholder="مثلاً: مزرعة النيل للورد" value={sName} onChange={(e) => setSName(e.target.value)} />
          </div>
          <div className="field">
            <label>التليفون</label>
            <input placeholder="01xxxxxxxxx" value={sPhone} onChange={(e) => setSPhone(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label>ملاحظات</label>
            <input placeholder="نوع البضاعة، مواعيد التوريد..." value={sNotes} onChange={(e) => setSNotes(e.target.value)} />
          </div>
          <button className="btn ghost" onClick={handleAddSupplier}>
            إضافة مورد
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
                <th>ملاحظات</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.notes || '—'}</td>
                  <td>
                    <button className="icon-btn" onClick={() => deleteSupplier(s.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!state.suppliers.length && <div className="empty">لسه مفيش موردين مضافين</div>}
      </div>
    </section>
  );
}
