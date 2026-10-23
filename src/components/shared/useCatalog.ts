import { useEffect, useState } from 'react';
import { getCustomerCatalog, subscribeDemoData } from '../../services/demoService';
import type { CustomerProduct } from '../../types';
export function useCatalog() {
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let disposed = false, request = 0;
    const load = async () => {
      const current = ++request;
      try { const data = await getCustomerCatalog(); if (!disposed && current === request) { setProducts(data); setError(undefined); } }
      catch (err) { if (!disposed && current === request) setError(err instanceof Error ? err.message : 'Không thể tải sản phẩm.'); }
      finally { if (!disposed && current === request) setLoading(false); }
    };
    const unsubscribe = subscribeDemoData(() => { void load(); });
    void load(); return () => { disposed = true; unsubscribe(); };
  }, [reload]);
  return { products, loading, error, retry: () => { setLoading(true); setReload(value => value + 1); } };
}
export const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
export const categoryLabels = { FRESH_FRUIT: 'Trái cây tươi', VEGETABLES: 'Rau củ quả' };
export const useLabels = { JUICE: 'Nước ép', SMOOTHIE: 'Sinh tố', KITCHEN: 'Bếp & salad', FRESH: 'Ăn tươi' };
