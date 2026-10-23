import * as api from '../../services/demoService';
import { useDemoData } from './useDemoData';
export function DemoClock() {
  const s = useDemoData(async () => ({ now: await api.getDemoClock(), session: await api.getDemoSession() }));
  return <div className="demo-clock"><span>Đồng hồ demo: <strong>{s.data ? new Date(s.data.now).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Đang tải…'}</strong> (UTC+7, chỉ tiến khi tua)</span>{s.data?.session.role === 'ADMIN' && <div className="action-row">{[30, 120, 1440].map(minutes => <button key={minutes} disabled={s.busy} onClick={() => void s.run(() => api.advanceDemoClock(minutes))}>+{minutes === 1440 ? '1 ngày' : `${minutes} phút`}</button>)}</div>}{s.error && <span role="alert">{s.error}</span>}</div>;
}
