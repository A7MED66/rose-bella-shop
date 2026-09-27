import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money, todayStr, statusClass } from '../utils/helpers';

function deliveryBadge(o) {
  if (!o.deliveryDate) return null;
  const days = Math.ceil((new Date(o.deliveryDate) - new Date(new Date().toDateString())) / 86400000);
  let label = o.deliveryDate;
  let cls = 'ok';
  if (days < 0) {
    label = 'متأخر — ' + o.deliveryDate;
    cls = 'low';
  } else if (days === 0) {
    label = 'التسليم النهارده';
    cls = 'low';
  } else if (days <= 2) {
    label = 'التسليم بعد ' + days + ' يوم';
    cls = 'low';
  } else {
    label = 'التسليم يوم ' + o.deliveryDate;
  }
  return <span className={`badge ${cls}`}>{label}</span>;
}

function deliveryInfoTag(o) {
  if (!o.isDelivery) return null;
  return <span className="occasion-tag">🚚 دليفري — {o.deliveryPhone || 'بدون رقم'}</span>;
}

export default function Orders({ onPrint }) {
  const { state, addCustomer, saveOrder, setOrderStatus, deleteOrder, toast } = useStore();

  const [customerId, setCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState([]);

  function addOrderItem() {
    const pid = productId || state.products[0]?.id;
    const product = state.products.find((p) => p.id === pid);
    if (!product) {
      toast('ضيف منتجات للمخزون الأول');
      return;
    }
    const q = Number(qty) || 1;
    if (q > product.qty) {
      toast('الكمية المطلوبة أكبر من المتاح في المخزون');
      return;
    }
    setDraft((d) => [...d, { productId: pid, name: product.name, qty: q, price: product.price }]);
  }

  function removeDraftItem(i) {
    setDraft((d) => d.filter((_, idx) => idx !== i));
  }

  function clearDraft() {
    setDraft([]);
    setNewCustomer('');
  }

  function handleSaveOrder() {
    if (!draft.length) {
      toast('ضيف منتجات للفاتورة الأول');
      return;
    }
    if (isDelivery && !deliveryPhone.trim()) {
      toast('اكتب رقم تليفون التسليم');
      return;
    }
    let customerName = '';
    const trimmedNew = newCustomer.trim();
    if (trimmedNew) {
      addCustomer({ name: trimmedNew, phone: '', occType: '', occDate: '', notes: '' });
      customerName = trimmedNew;
    } else if (customerId) {
      customerName = state.customers.find((c) => c.id === customerId)?.name || '';
    } else {
      customerName = 'عميل بدون اسم';
    }
    const total = draft.reduce((s, it) => s + it.qty * it.price, 0);
    saveOrder({
      date: todayStr(),
      createdAt: new Date().toISOString(),
      deliveryDate,
      customerName,
      items: draft,
      total,
      status: 'قيد التنفيذ',
      isDelivery,
      deliveryPhone: isDelivery ? deliveryPhone.trim() : '',
    });
    setDraft([]);
    setNewCustomer('');
    setDeliveryDate('');
    setIsDelivery(false);
    setDeliveryPhone('');
    setCustomerId('');
  }

  const total = draft.reduce((s, it) => s + it.qty * it.price, 0);
  const activeOrders = state.orders.filter((o) => o.status !== 'تم التسليم');

  return (
    <section>
      <h2>طلب جديد / فاتورة</h2>
      <div className="card">
        <div className="row">
          <div className="field" style={{ flex: 2 }}>
            <label>العميل</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— اختر عميل أو اكتب اسم —</option>
              {state.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>اسم عميل جديد (اختياري)</label>
            <input placeholder="لو مش موجود بالأعلى" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />
          </div>
          <div className="field">
            <label>تاريخ التسليم</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={isDelivery} onChange={(e) => setIsDelivery(e.target.checked)} />
              دليفري؟
            </label>
          </div>
          {isDelivery && (
            <div className="field">
              <label>رقم تليفون التسليم</label>
              <input placeholder="01xxxxxxxxx" value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} />
            </div>
          )}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <div className="field" style={{ flex: 2 }}>
            <label>المنتج</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {state.products.length ? (
                state.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.qty} متاح)
                  </option>
                ))
              ) : (
                <option value="">مفيش منتجات في المخزون</option>
              )}
            </select>
          </div>
          <div className="field">
            <label>الكمية</label>
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <button className="btn ghost" onClick={addOrderItem}>
            أضف للفاتورة
          </button>
        </div>
        <ul className="order-items">
          {draft.map((it, i) => (
            <li key={i}>
              {it.name} × {it.qty} — {money(it.qty * it.price)}
              <button className="icon-btn" onClick={() => removeDraftItem(i)}>
                حذف
              </button>
            </li>
          ))}
        </ul>
        <div className="total-line">
          <span>الإجمالي</span>
          <span>{money(total)}</span>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={handleSaveOrder}>
            حفظ الطلب
          </button>
          <button className="btn ghost" onClick={clearDraft}>
            إلغاء
          </button>
        </div>
      </div>

      <h2>الطلبات السابقة</h2>
      <div>
        {activeOrders.length ? (
          activeOrders.map((o) => (
            <div key={o.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{o.customerName}</b>{' '}
                  <span className="sub" style={{ margin: '0 0 0 8px', display: 'inline' }}>
                    اتحجز يوم {o.date}
                  </span>
                </div>
                <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
              </div>
              <div style={{ margin: '6px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {deliveryBadge(o)}
                {deliveryInfoTag(o)}
              </div>
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
                <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)}>
                  <option>قيد التنفيذ</option>
                  <option>جاهز</option>
                  <option>تم التسليم</option>
                </select>
                <button className="btn ghost" onClick={() => onPrint(o.id)}>
                  طباعة الفاتورة
                </button>
                <button className="icon-btn" onClick={() => deleteOrder(o.id)}>
                  حذف
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">لسه مفيش طلبات محفوظة</div>
        )}
      </div>
    </section>
  );
}
