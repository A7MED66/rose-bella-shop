import { money } from '../utils/helpers';

export default function PrintInvoice({ order }) {
  if (!order) return <div id="printArea" />;
  return (
    <div id="printArea">
      <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: "'Tajawal',sans-serif" }}>
        <h1 style={{ fontFamily: "'Archivo Black',sans-serif", color: '#A62A24', margin: '0 0 2px' }}>Rosa Bella</h1>
        <p style={{ margin: '0 0 16px', color: '#555' }}>فاتورة</p>
        <p style={{ margin: '4px 0' }}>
          <b>العميل:</b> {order.customerName}
        </p>
        <p style={{ margin: '4px 0' }}>
          <b>تاريخ الطلب:</b> {order.date}
        </p>
        {order.deliveryDate && (
          <p style={{ margin: '4px 0' }}>
            <b>تاريخ التسليم:</b> {order.deliveryDate}
          </p>
        )}
        {order.isDelivery && (
          <p style={{ margin: '4px 0' }}>
            <b>دليفري:</b> {order.deliveryPhone || 'بدون رقم'}
          </p>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 6 }}>الصنف</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 6 }}>الكمية</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 6 }}>السعر</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{it.name}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{it.qty}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{money(it.qty * it.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ textAlign: 'left', fontSize: 18, fontWeight: 700, marginTop: 14 }}>الإجمالي: {money(order.total)}</p>
      </div>
    </div>
  );
}
