import { useEffect, useState } from 'react';
import { subscribeDemoData } from '../../services/demoService';
import { useNavigate } from 'react-router-dom';

interface PhaseStep {
  time: string;
  title: string;
  targetRoute: string;
  role: string;
}

const PHASES: PhaseStep[] = [
  {
    time: '12:00–15:00',
    title: 'Nhà vườn cập nhật nguồn cung',
    targetRoute: '/supplier/products',
    role: 'Nhà vườn',
  },
  {
    time: '16:00–22:00',
    title: 'Quán chốt đơn & xem giá công khai',
    targetRoute: '/customer',
    role: 'Khách B2B',
  },
  {
    time: 'Sau 22:00',
    title: 'Tổng hợp nhu cầu toàn hệ thống',
    targetRoute: '/admin/aggregate',
    role: 'Quản trị hệ thống',
  },
  {
    time: '03:00–04:00',
    title: 'Xuất hàng từ vườn theo đơn',
    targetRoute: '/supplier/demand',
    role: 'Nhà vườn',
  },
  {
    time: 'Từ 04:00',
    title: 'Dán nhãn sọt & phân tuyến giao',
    targetRoute: '/admin/shipments',
    role: 'Vận chuyển',
  },
  {
    time: 'Sáng sớm',
    title: 'Giao hàng đa điểm & theo dõi',
    targetRoute: '/customer/orders',
    role: 'Khách B2B',
  },
];

export function PhaseAdvancer() {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => subscribeDemoData(event => {
    if (event.type === 'RESET') { setCurrentIdx(0); setIsOpen(false); }
  }), []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const current = PHASES[currentIdx];

  const handleSelect = (idx: number, route: string) => {
    setCurrentIdx(idx);
    navigate(route);
    setIsOpen(false);
  };

  return (
    <div className="demo-control-widget">
      {isOpen && (
        <div className="demo-control-panel">
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>KỊCH BẢN THEO MỐC GIỜ</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Bấm để chuyển</span>
          </div>

          <div>
            {PHASES.map((p, idx) => (
              <button
                type="button"
                key={p.time}
                className={`demo-step-btn ${idx === currentIdx ? 'active' : ''}`}
                onClick={() => handleSelect(idx, p.targetRoute)}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '0.72rem' }}>{p.time}</strong>
                  <span>{p.title}</span>
                </div>
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{p.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="demo-control-trigger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        title="Bấm để chọn khung giờ demo"
      >
        <span>⏱️ {current.time}</span>
        <span style={{ opacity: 0.7 }}>•</span>
        <span>{current.role}</span>
        <span>{isOpen ? '✕' : '▲'}</span>
      </button>
    </div>
  );
}
