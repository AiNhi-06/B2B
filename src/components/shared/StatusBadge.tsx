import type { OrderStatus, ShipmentStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | ShipmentStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<string, { label: string; className: string }> = {
    PLACED: { label: 'Đã đặt hàng', className: 'badge-placed' },
    AGGREGATED: { label: 'Đã gom đơn', className: 'badge-aggregated' },
    SUPPLIER_CONFIRMED: { label: 'Vườn đã xác nhận', className: 'badge-supplier_confirmed' },
    AT_HUB: { label: 'Đã nhập kho', className: 'badge-at_hub' },
    DISPATCHED: { label: 'Đang giao hàng', className: 'badge-dispatched' },
    DELIVERED: { label: 'Đã giao thành công', className: 'badge-delivered' },
    
    // Shipment status
    PENDING: { label: 'Chờ gán tuyến', className: 'badge-placed' },
    ASSIGNED: { label: 'Đã tạo chuyến', className: 'badge-aggregated' },
    IN_TRANSIT: { label: 'Tài xế đang chạy', className: 'badge-dispatched' },
  };

  const item = map[status] || { label: status, className: 'badge-placed' };

  return <span className={`badge ${item.className}`}>{item.label}</span>;
}
