import { useEffect, useRef, useState } from 'react';
import { getDemoSession, getCustomers, subscribeDemoData } from '../../services/demoService';

export interface CartLine { productId: string; quantityKg: number; }
const CHANGED = 'farmgo-cart-changed';
const cartKey = (id: string) => `farmgo-cart-${id}`;
export async function resetCartStorage() {
  const customers = await getCustomers();
  customers.forEach(customer => localStorage.removeItem(cartKey(customer.id)));
  localStorage.removeItem('demo-cart-items');
}
export function useBuyerCart() {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const active = useRef('');
  useEffect(() => {
    let disposed = false;
    let version = 0;
    const load = async (reset = false) => {
      const current = ++version;
      try {
        const session = await getDemoSession();
        if (disposed || current !== version) return;
        if (reset) {
          const customers = await getCustomers();
          if (disposed || current !== version) return;
          customers.forEach(customer => localStorage.removeItem(cartKey(customer.id)));
          localStorage.removeItem('demo-cart-items');
        }
        const id = session.activeCustomerId!;
        const key = cartKey(id);
        // Adopt the pre-v3 cart once for the active account; service reprices all items.
        if (!localStorage.getItem(key) && localStorage.getItem('demo-cart-items')) {
          localStorage.setItem(key, localStorage.getItem('demo-cart-items')!);
          localStorage.removeItem('demo-cart-items');
        }
        const saved: unknown = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(saved)) throw new Error('Giỏ hàng không hợp lệ.');
        const lines = saved.filter((line): line is CartLine => typeof line?.productId === 'string' && Number.isSafeInteger(line.quantityKg) && line.quantityKg > 0)
          .map(({ productId, quantityKg }) => ({ productId, quantityKg }));
        if (!disposed && current === version) { active.current = id; setCustomerId(id); setItems(lines); setReady(true); setError(undefined); }
      } catch (err) { if (!disposed && current === version) { setError(err instanceof Error ? err.message : 'Không tải được giỏ hàng.'); setReady(false); } }
    };
    const unsubscribe = subscribeDemoData(event => { if (event.type === 'RESET') { setReady(false); void load(true); } else if (event.type === 'SESSION_CHANGED') { setReady(false); void load(); } });
    const onCart = () => { void load(); };
    window.addEventListener(CHANGED, onCart);
    window.addEventListener('storage', onCart);
    void load();
    return () => { disposed = true; unsubscribe(); window.removeEventListener(CHANGED, onCart); window.removeEventListener('storage', onCart); };
  }, []);
  const write = (next: CartLine[]) => {
    if (!ready || !active.current) return false;
    try { localStorage.setItem(cartKey(active.current), JSON.stringify(next)); setItems(next); setError(undefined); window.dispatchEvent(new Event(CHANGED)); return true; }
    catch { setError('Không thể lưu giỏ hàng trên trình duyệt.'); return false; }
  };
  return { customerId, items, ready, error,
    add: (productId: string, quantityKg: number) => write([...items.filter(item => item.productId !== productId), { productId, quantityKg }]),
    quantity: (productId: string, quantityKg: number) => Number.isSafeInteger(quantityKg) && quantityKg > 0 ? write(items.map(item => item.productId === productId ? { ...item, quantityKg } : item)) : false,
    remove: (productId: string) => write(items.filter(item => item.productId !== productId)), clear: () => write([]),
  };
}
