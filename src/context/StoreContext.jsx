import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uid, todayStr } from '../utils/helpers';
import { db, isFirebaseConfigured } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy, limit,
} from 'firebase/firestore';

const StoreContext = createContext(null);

const emptyState = { products: [], orders: [], customers: [], suppliers: [], movements: [], shifts: [] };

function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('db timeout')), ms)),
  ]);
}

function getDeviceId() {
  try {
    let id = localStorage.getItem('flowershop_device_id');
    if (!id) { id = uid(); localStorage.setItem('flowershop_device_id', id); }
    return id;
  } catch (e) { return 'unknown-device'; }
}

export function StoreProvider({ children }) {
  const [state, setState] = useLocalStorage('flowershop_data', emptyState);
  const [session, setSession] = useLocalStorage('flowershop_session', null);
  const [authSettings, setAuthSettingsLocal] = useLocalStorage('flowershop_auth', null);
  const [shiftData, setShiftDataLocal] = useLocalStorage('flowershop_shift', null);
  const [toastMsg, setToastMsg] = useState('');
  const [syncStatus, setSyncStatus] = useState(
    isFirebaseConfigured ? 'جاري الاتصال بالمزامنة...' : 'بيانات محلية على الجهاز ده بس'
  );
  const [dbOk, setDbOk] = useState(false);
  const dbOkRef = useRef(false);
  const toastTimer = useRef(null);
  const deviceIdRef = useRef(getDeviceId());
  const audioCtxRef = useRef(null);
  const ordersSeenRef = useRef(false);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { dbOkRef.current = dbOk; }, [dbOk]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  }, []);

  // ---------- notification sound (unlocked by the first tap/click, per browser autoplay rules) ----------
  useEffect(() => {
    function unlockAudio() {
      if (audioCtxRef.current) return;
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current.resume();
      } catch (e) { /* Web Audio unavailable — sound simply won't play */ }
    }
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  function playNewOrderSound() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const pattern = [880, 660, 880, 660, 880, 660, 880, 660, 880, 660]; // ~3s
      pattern.forEach((freq, i) => {
        const t = now + i * 0.3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.27);
      });
    } catch (e) { console.error('تعذر تشغيل صوت التنبيه', e); }
  }

  // ---------- firestore live subscriptions (falls back to local storage on any failure) ----------
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return undefined;
    let failed = false;
    const unsubs = [];

    function onFail(label) {
      return (err) => {
        console.error(label + ' sync failed', err);
        if (failed) return;
        failed = true;
        setDbOk(false);
        setSyncStatus('بيانات محلية على الجهاز ده بس');
        toast('تعذرت المزامنة مع الفريق، بيتم الحفظ على الجهاز ده دلوقتي');
      };
    }

    ['products', 'customers', 'suppliers'].forEach((name) => {
      unsubs.push(onSnapshot(collection(db, name), (snap) => {
        setState((s) => ({ ...s, [name]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
      }, onFail(name)));
    });

    unsubs.push(onSnapshot(query(collection(db, 'movements'), orderBy('date', 'desc'), limit(30)), (snap) => {
      setState((s) => ({ ...s, movements: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
    }, onFail('movements')));

    unsubs.push(onSnapshot(query(collection(db, 'shifts'), orderBy('endedAt', 'desc'), limit(50)), (snap) => {
      setState((s) => ({ ...s, shifts: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
    }, onFail('shifts')));

    unsubs.push(onSnapshot(query(collection(db, 'orders'), orderBy('date', 'desc')), (snap) => {
      if (ordersSeenRef.current && sessionRef.current) {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.data().createdByDevice !== deviceIdRef.current) {
            playNewOrderSound();
          }
        });
      }
      ordersSeenRef.current = true;
      setState((s) => ({ ...s, orders: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
    }, onFail('orders')));

    unsubs.push(onSnapshot(doc(db, 'settings', 'auth'), (snap) => {
      if (snap.exists()) setAuthSettingsLocal(snap.data());
    }, onFail('auth-settings')));

    unsubs.push(onSnapshot(doc(db, 'settings', 'shift'), (snap) => {
      if (snap.exists() && snap.data().currentShiftStart) {
        setShiftDataLocal({ currentShiftStart: snap.data().currentShiftStart });
      }
    }, onFail('shift-settings')));

    setDbOk(true);
    setSyncStatus('البيانات متزامنة مع الفريق');

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Make sure a shift is always running once the app has loaded.
  useEffect(() => {
    if (!shiftData || !shiftData.currentShiftStart) {
      const start = new Date().toISOString();
      setShiftDataLocal({ currentShiftStart: start });
      if (dbOk) setDoc(doc(db, 'settings', 'shift'), { currentShiftStart: start }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftData, dbOk]);

  const dbWrite = useCallback(async (fn) => {
    if (!dbOkRef.current) return false;
    try {
      await withTimeout(fn());
      return true;
    } catch (e) {
      console.error('db write failed, switching to local storage', e);
      setDbOk(false);
      setSyncStatus('بيانات محلية على الجهاز ده بس');
      toast('حصلت مشكلة في المزامنة، بيتم الحفظ على الجهاز ده دلوقتي');
      return false;
    }
  }, [toast]);

  // ---------- products ----------
  const addProduct = useCallback(async (data) => {
    const ok = await dbWrite(() => addDoc(collection(db, 'products'), data));
    if (!ok) setState((s) => ({ ...s, products: [...s.products, { ...data, id: uid() }] }));
  }, [dbWrite, setState]);

  const deleteProduct = useCallback(async (id) => {
    const ok = await dbWrite(() => deleteDoc(doc(db, 'products', id)));
    if (!ok) setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  }, [dbWrite, setState]);

  const quickAddStock = useCallback(async (product, qty) => {
    const movement = { productId: product.id, productName: product.name, type: 'وارد', qty, reason: 'تزويد سريع', date: todayStr() };
    const newQty = product.qty + qty;
    const ok = await dbWrite(async () => {
      await updateDoc(doc(db, 'products', product.id), { qty: newQty });
      await addDoc(collection(db, 'movements'), movement);
    });
    if (!ok) {
      setState((s) => ({
        ...s,
        products: s.products.map((p) => (p.id === product.id ? { ...p, qty: newQty } : p)),
        movements: [{ ...movement, id: uid() }, ...s.movements],
      }));
    }
  }, [dbWrite, setState]);

  // ---------- suppliers ----------
  const addSupplier = useCallback(async (data) => {
    const ok = await dbWrite(() => addDoc(collection(db, 'suppliers'), data));
    if (!ok) setState((s) => ({ ...s, suppliers: [...s.suppliers, { ...data, id: uid() }] }));
  }, [dbWrite, setState]);

  const deleteSupplier = useCallback(async (id) => {
    const ok = await dbWrite(() => deleteDoc(doc(db, 'suppliers', id)));
    if (!ok) setState((s) => ({ ...s, suppliers: s.suppliers.filter((sup) => sup.id !== id) }));
  }, [dbWrite, setState]);

  // ---------- stock movements ----------
  const addMovement = useCallback(async (pid, type, qty, reason) => {
    const product = state.products.find((p) => p.id === pid);
    if (!product || qty <= 0) return;
    let newQty = product.qty;
    if (type === 'وارد') newQty = product.qty + qty;
    else if (type === 'منصرف') newQty = Math.max(0, product.qty - qty);
    else newQty = qty;
    const movement = { productId: pid, productName: product.name, type, qty, reason, date: todayStr() };
    const ok = await dbWrite(async () => {
      await updateDoc(doc(db, 'products', pid), { qty: newQty });
      await addDoc(collection(db, 'movements'), movement);
    });
    if (!ok) {
      setState((s) => ({
        ...s,
        products: s.products.map((p) => (p.id === pid ? { ...p, qty: newQty } : p)),
        movements: [{ ...movement, id: uid() }, ...s.movements],
      }));
    }
  }, [state.products, dbWrite, setState]);

  // ---------- customers ----------
  const addCustomer = useCallback(async (data) => {
    const ok = await dbWrite(() => addDoc(collection(db, 'customers'), data));
    if (!ok) setState((s) => ({ ...s, customers: [...s.customers, { ...data, id: uid() }] }));
  }, [dbWrite, setState]);

  const deleteCustomer = useCallback(async (id) => {
    const ok = await dbWrite(() => deleteDoc(doc(db, 'customers', id)));
    if (!ok) setState((s) => ({ ...s, customers: s.customers.filter((c) => c.id !== id) }));
  }, [dbWrite, setState]);

  // ---------- orders ----------
  const saveOrder = useCallback(async (orderInput) => {
    const orderData = { ...orderInput, createdByDevice: deviceIdRef.current };
    const ok = await dbWrite(async () => {
      for (const item of orderInput.items) {
        const p = state.products.find((pp) => pp.id === item.productId);
        if (p) await updateDoc(doc(db, 'products', item.productId), { qty: Math.max(0, p.qty - item.qty) });
      }
      await addDoc(collection(db, 'orders'), orderData);
    });
    if (!ok) {
      setState((s) => {
        const products = s.products.map((p) => {
          const item = orderInput.items.find((it) => it.productId === p.id);
          return item ? { ...p, qty: Math.max(0, p.qty - item.qty) } : p;
        });
        const order = { ...orderData, id: uid() };
        return { ...s, products, orders: [order, ...s.orders] };
      });
    }
  }, [state.products, dbWrite, setState]);

  const setOrderStatus = useCallback(async (id, status) => {
    const patch = { status, ...(status === 'تم التسليم' ? { deliveredAt: new Date().toISOString() } : {}) };
    const ok = await dbWrite(() => updateDoc(doc(db, 'orders', id), patch));
    if (!ok) setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  }, [dbWrite, setState]);

  const deleteOrder = useCallback(async (id) => {
    const ok = await dbWrite(() => deleteDoc(doc(db, 'orders', id)));
    if (!ok) setState((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));
  }, [dbWrite, setState]);

  const bulkDeleteOrders = useCallback(async (ids) => {
    for (const id of ids) await deleteOrder(id);
  }, [deleteOrder]);

  // ---------- shifts ----------
  const currentShiftOrders = useCallback(() => {
    const start = shiftData?.currentShiftStart;
    if (!start) return [];
    return state.orders.filter((o) => o.createdAt && o.createdAt >= start);
  }, [shiftData, state.orders]);

  const endShift = useCallback(async () => {
    const start = shiftData?.currentShiftStart;
    const shiftOrders = start ? state.orders.filter((o) => o.createdAt && o.createdAt >= start) : [];
    const totalRevenue = shiftOrders.reduce((sum, o) => sum + o.total, 0);
    const endedAt = new Date().toISOString();
    const record = { startedAt: start, endedAt, totalRevenue, orderCount: shiftOrders.length };
    const ok = await dbWrite(() => addDoc(collection(db, 'shifts'), record));
    if (!ok) setState((s) => ({ ...s, shifts: [{ ...record, id: uid() }, ...s.shifts] }));
    setShiftDataLocal({ currentShiftStart: endedAt });
    if (dbOkRef.current) setDoc(doc(db, 'settings', 'shift'), { currentShiftStart: endedAt }).catch(() => {});
    toast(`اتقفل الشفت — الإيرادات: ${totalRevenue.toLocaleString('ar-EG')} ج.م`);
  }, [shiftData, state.orders, dbWrite, setState, setShiftDataLocal, toast]);

  const deleteShift = useCallback(async (id) => {
    const ok = await dbWrite(() => deleteDoc(doc(db, 'shifts', id)));
    if (!ok) setState((s) => ({ ...s, shifts: s.shifts.filter((sh) => sh.id !== id) }));
  }, [dbWrite, setState]);

  const bulkDeleteShifts = useCallback(async (ids) => {
    for (const id of ids) await deleteShift(id);
  }, [deleteShift]);

  // ---------- auth ----------
  const setupAuth = useCallback(async (adminPassword, cashierPassword) => {
    const settings = { adminPassword, cashierPassword };
    await dbWrite(() => setDoc(doc(db, 'settings', 'auth'), settings));
    setAuthSettingsLocal(settings);
    setSession({ role: 'admin' });
  }, [dbWrite, setAuthSettingsLocal, setSession]);

  const login = useCallback((role, pass) => {
    if (!authSettings) return false;
    const expected = role === 'admin' ? authSettings.adminPassword : authSettings.cashierPassword;
    if (pass !== expected) return false;
    setSession({ role });
    return true;
  }, [authSettings, setSession]);

  const logout = useCallback(() => setSession(null), [setSession]);

  const changePasswords = useCallback(async (newAdmin, newCashier) => {
    const updated = {
      ...(authSettings || {}),
      ...(newAdmin ? { adminPassword: newAdmin } : {}),
      ...(newCashier ? { cashierPassword: newCashier } : {}),
    };
    await dbWrite(() => setDoc(doc(db, 'settings', 'auth'), updated));
    setAuthSettingsLocal(updated);
    toast('اتحفظ');
  }, [authSettings, dbWrite, setAuthSettingsLocal, toast]);

  const value = {
    state,
    session,
    authSettings,
    shiftStart: shiftData?.currentShiftStart || null,
    toastMsg,
    syncStatus,
    toast,
    addProduct,
    deleteProduct,
    quickAddStock,
    addSupplier,
    deleteSupplier,
    addMovement,
    addCustomer,
    deleteCustomer,
    saveOrder,
    setOrderStatus,
    deleteOrder,
    bulkDeleteOrders,
    currentShiftOrders,
    endShift,
    deleteShift,
    bulkDeleteShifts,
    setupAuth,
    login,
    logout,
    changePasswords,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
