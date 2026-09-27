# Rosa Bella — نظام إدارة محل ورد (React)

نسخة React من نظام إدارة محل الورد، مقسّمة لمكوّنات منفصلة بدل الملف الواحد.

## التشغيل
```bash
npm install
npm run dev
```

## البنية
```
src/
  context/StoreContext.jsx   # الحالة العامة وكل عمليات الإضافة/الحذف/التعديل
  hooks/useLocalStorage.js   # حفظ الحالة في localStorage تلقائيًا
  utils/helpers.js           # دوال مساعدة (تنسيق تاريخ، عملة، id عشوائي...)
  components/                # مكوّنات مشتركة (تسجيل الدخول، الشريط الجانبي، الطباعة، التنبيه)
  views/                     # كل قسم من النظام في ملف مستقل
    Dashboard.jsx
    Inventory.jsx
    Orders.jsx
    Calendar.jsx
    Analytics.jsx
    Customers.jsx
    InvoiceLog.jsx
    ShiftLog.jsx
    Settings.jsx
  App.jsx                    # التنقل بين الأقسام وصلاحيات الأدمن/الكاشير
```

## ملاحظات
- البيانات بتتحفظ محليًا على المتصفح (localStorage) بنفس منطق النسخة الأصلية.
- المزامنة اللحظية بين أكتر من جهاز (اللي كانت بتعتمد على خدمة داخلية في بيئة Claude) اتشالت لأن المشروع بقى مستقل — لو محتاجها تقدر تضيف باكيند زي Firebase أو Supabase بعدين.
- تسجيل الدخول (أدمن/كاشير) وتقسيم الصلاحيات وبيانات الشفت والفواتير والمخزون والتحليلات والتقويم كلها موجودة زي الأصل.
# rose-bella-shop
