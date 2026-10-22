import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PhaseStep {
  time: string;
  title: string;
  role: string;
  targetRoute: string;
  desc: string;
}

const PHASES: PhaseStep[] = [
  {
    time: '12:00–15:00',
    title: 'Nhà vườn đăng bán',
    role: 'Nhà vườn',
    targetRoute: '/supplier',
    desc: 'Cập nhật tồn kho & định giá sỉ gốc bảo mật.',
  },
  {
    time: '16:00–22:00',
    title: 'Khách B2B đặt đơn',
    role: 'Khách B2B',
    targetRoute: '/customer',
    desc: 'Xem giá công khai (đã cộng markup), ước tính cước & checkout.',
  },
  {
    time: 'Sau 22:00',
    title: 'Gom đơn tự động',
    role: 'Admin Hub',
    targetRoute: '/admin/aggregate',
    desc: 'Gom toàn bộ nhu cầu của các quán, báo tổng kg cho nhà vườn.',
  },
  {
    time: '03:00–04:00',
    title: 'Giao hàng về Hub',
    role: 'Nhà vườn',
    targetRoute: '/supplier/demand',
    desc: 'Nhà vườn xác nhận số kg, biển số xe & giờ dự kiến tới kho Hub.',
  },
  {
    time: 'Từ 04:00',
    title: 'Tem QR & Gom tuyến',
    role: 'Admin Hub',
    targetRoute: '/admin/shipments',
    desc: 'In tem dán sọt, gom cụm chuyến Multi-stop & điều phối.',
  },
  {
    time: 'Sáng sớm',
    title: 'Giao hàng & Theo dõi',
    role: 'Khách B2B',
    targetRoute: '/customer/orders',
    desc: 'Khách theo dõi tài xế và nhận hàng đúng chất lượng.',
  },
];

export function PhaseAdvancer() {
  const navigate = useNavigate();
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSelectPhase = (index: number, route: string) => {
    setCurrentPhaseIndex(index);
    navigate(route);
  };

  const handleNextPhase = () => {
    const nextIdx = (currentPhaseIndex + 1) % PHASES.length;
    setCurrentPhaseIndex(nextIdx);
    navigate(PHASES[nextIdx].targetRoute);
  };

  const currentPhase = PHASES[currentPhaseIndex];

  return (
    <aside className="phase-advancer-dock" aria-label="Widget điều khiển khung giờ demo">
      <div className="phase-advancer-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⏱️ Kịch bản Demo</span>
          <span className="demo-chip">{currentPhase.time}</span>
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Mở rộng bảng giai đoạn' : 'Thu gọn'}
          >
            {isCollapsed ? '🔼 Mở' : '🔽 Thu gọn'}
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <>
          <div className="phase-chips">
            {PHASES.map((p, idx) => {
              const isCurrent = idx === currentPhaseIndex;
              return (
                <button
                  type="button"
                  key={p.time}
                  className={`phase-chip ${isCurrent ? 'current' : ''}`}
                  onClick={() => handleSelectPhase(idx, p.targetRoute)}
                >
                  <div>
                    <strong>{p.time}:</strong> {p.title}
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.desc}</div>
                  </div>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>{p.role}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              onClick={handleNextPhase}
            >
              Chuyển mốc tiếp theo ⏭️
            </button>
          </div>
        </>
      ) : (
        <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{currentPhase.title} ({currentPhase.role})</span>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
            onClick={handleNextPhase}
          >
            Tiếp ⏭️
          </button>
        </div>
      )}
    </aside>
  );
}
