import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeDemoData } from '../../services/demoService';
export function useDemoData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const loader = useRef(load); loader.current = load;
  useEffect(() => { let live = true; let request = 0; const refresh = async () => { const id = ++request; try { const next = await loader.current(); if (live && request === id) { setData(next); setError(''); } } catch (e) { if (live && request === id) setError(e instanceof Error ? e.message : 'Không tải được dữ liệu demo.'); } }; void refresh(); const off = subscribeDemoData(() => { void refresh(); }); return () => { live = false; off(); }; }, []);
  const run = useCallback(async (action: () => Promise<unknown>) => { setBusy(true); setError(''); try { await action(); return true; } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được dữ liệu demo.'); return false; } finally { setBusy(false); } }, []);
  return { data, error, busy, run, setError };
}
