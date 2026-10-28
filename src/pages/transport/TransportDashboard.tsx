import { useEffect, useMemo, useState } from 'react';
import type { Customer, DeliveryAddress, Order, Shipment, ShipmentStatus, Supplier, SupplierConfirmation } from '../../types';
import {
  advanceShipmentStatus,
  getAllOrders,
  getCustomers,
  getDeliveryAddresses,
  getShipments,
  getSupplierConfirmations,
  getSuppliers,
  subscribeDemoData,
} from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
import type { PortalSession } from '../../types/portalSession';
import './transport-dashboard.css';

type TransportData = {
  addresses: DeliveryAddress[];
  customers: Customer[];
  orders: Order[];
  shipments: Shipment[];
  suppliers: Supplier[];
  confirmations: SupplierConfirmation[];
};

const initialData: TransportData = { addresses: [], customers: [], orders: [], shipments: [], suppliers: [], confirmations: [] };
const slotLabel = (slot?: string) => slot === 'MORNING' ? 'Ca sáng · 05–07h' : slot === 'AFTERNOON' ? 'Ca chiều · 13–15h' : 'Lịch demo cũ';
const nextStatus: Partial<Record<ShipmentStatus, ShipmentStatus>> = { ASSIGNED: 'IN_TRANSIT', IN_TRANSIT: 'DELIVERED' };
type TransportStep = 'overview' | 'trips' | 'routes' | 'hub' | 'delivery' | 'complete';
const stepNavigation: { id: TransportStep; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'trips', label: 'Gom & Phân Loại Đơn' },
  { id: 'routes', label: 'Lộ Trình AI Lấy Hàng' },
  { id: 'hub', label: 'Lấy Hàng (QR/OTP)' },
  { id: 'delivery', label: 'Giao Hàng & Quét Đơn' },
  { id: 'complete', label: 'Đánh Giá & Đổi Trả 12h' },
];
const stepContent: Record<TransportStep, { title: string; description: string }> = {
  overview: { title: 'Tổng quan vận chuyển', description: 'Theo dõi chuyến được Admin phân công và cập nhật từng trạng thái giao nhận.' },
  trips: { title: 'Danh sách đơn hàng cần giao nhận B2B', description: 'Phân nhóm đơn theo khối lượng để minh họa cách tổ chức tuyến giao.' },
  routes: { title: 'Lộ trình lấy hàng từ Hub đến các nhà vườn', description: 'Sơ đồ tuyến đề xuất minh họa, chưa gọi dịch vụ tối ưu tuyến.' },
  hub: { title: 'Xác nhận đã nhận hàng từ nhà vườn', description: 'Mô phỏng xác nhận lấy hàng bằng QR hoặc mã OTP.' },
  delivery: { title: 'Giao hàng & quét đơn', description: 'Mô phỏng quét mã đơn và xác nhận giao tới các quán F&B.' },
  complete: { title: 'Đánh giá dịch vụ & đổi trả', description: 'Màn hình minh họa phản hồi chất lượng và yêu cầu hỗ trợ sau giao.' },
};
const statusLabel: Record<ShipmentStatus, string> = {
  PENDING: 'Chờ điều phối', ASSIGNED: 'Đã phân chuyến', IN_TRANSIT: 'Đang giao', DELIVERED: 'Đã giao',
};
type FeedbackTab = 'reviews' | 'returns';
type ScanMode = 'camera' | 'code';

export function TransportDashboard({ session, onSignOut }: { session: PortalSession; onSignOut: () => void }) {
  const [data, setData] = useState<TransportData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [activeStep, setActiveStep] = useState<TransportStep>('overview');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [scanCode, setScanCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [feedbackTab, setFeedbackTab] = useState<FeedbackTab>('reviews');
  const [returnNote, setReturnNote] = useState('');
  const [demoFeedbackMessage, setDemoFeedbackMessage] = useState('');
  const [confirmedPickupIds, setConfirmedPickupIds] = useState<string[]>([]);
  const [deliveredOrderIds, setDeliveredOrderIds] = useState<string[]>([]);
  const [routeRecalculated, setRouteRecalculated] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState('A');
  const [acceptedOrderIds, setAcceptedOrderIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setError('');
      const [orders, shipments, customers, suppliers, confirmations] = await Promise.all([getAllOrders(), getShipments(), getCustomers(), getSuppliers(), getSupplierConfirmations()]);
      const addressLists = await Promise.all(customers.map(customer => getDeliveryAddresses(customer.id)));
      setData({ orders, shipments, customers, addresses: addressLists.flat(), suppliers, confirmations });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được chuyến giao demo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    return subscribeDemoData(event => {
      if (event.type === 'DATA_CHANGED' || event.type === 'RESET') void loadData();
    });
  }, []);

  const visibleShipments = useMemo(() => data.shipments.filter(shipment => {
    if (activeStep === 'hub') return shipment.status === 'ASSIGNED';
    if (activeStep === 'delivery') return shipment.status === 'IN_TRANSIT';
    if (activeStep === 'complete') return shipment.status === 'DELIVERED';
    if (activeStep === 'routes') return shipment.status === 'ASSIGNED' || shipment.status === 'IN_TRANSIT';
    if (activeStep === 'overview') return shipment.status !== 'DELIVERED';
    return true;
  }), [data.shipments, activeStep]);
  const activeCount = data.shipments.filter(shipment => shipment.status !== 'DELIVERED').length;
  const totalStops = data.shipments.filter(shipment => shipment.status !== 'DELIVERED').reduce((sum, shipment) => sum + shipment.orderIds.length, 0);
  const kgForOrder = (order: Order) => order.items.reduce((sum, item) => sum + item.quantityKg, 0);
  const availableOrders = data.orders.filter(order => order.status !== 'DELIVERED');
  const availableWeight = availableOrders.reduce((sum, order) => sum + kgForOrder(order), 0);
  const estimatedDeliveryFees = availableOrders.reduce((sum, order) => sum + order.shippingFeeVnd, 0);
  const orderGroups = [
    { key: 'A', title: 'Đơn ghép nhóm (< 50kg)', note: 'Gom nhiều quán trên cùng tuyến để tiết kiệm phí vận chuyển.', orders: data.orders.filter(order => kgForOrder(order) < 50), detail: 'Phí cước tối ưu theo tuyến' },
    { key: 'B', title: 'Đơn độc lập / hỏa tốc', note: 'Đơn ưu tiên giao riêng theo lịch demo đã chọn.', orders: data.orders.filter(order => kgForOrder(order) >= 50 && kgForOrder(order) < 100), detail: 'Ưu tiên giao riêng' },
    { key: 'C', title: 'Đơn số lượng lớn (≥ 100kg)', note: 'Đơn hàng lớn cần xe tải phù hợp và xác nhận riêng.', orders: data.orders.filter(order => kgForOrder(order) >= 100), detail: 'Điều phối xe tải demo' },
  ];
  const activeOrderGroup = orderGroups.find(group => group.key === selectedOrderGroup) ?? orderGroups[0];
  const supplierLoads = data.suppliers.map(supplier => {
    const orders = data.orders.filter(order => order.items.some(item => item.supplierId === supplier.id));
    const orderIds = [...new Set(orders.map(order => order.id))];
    const totalKg = orders.reduce((sum, order) => sum + order.items.filter(item => item.supplierId === supplier.id).reduce((lineKg, item) => lineKg + item.quantityKg, 0), 0);
    const confirmation = [...data.confirmations].reverse().find(item => item.supplierId === supplier.id);
    return { supplier, orders, orderIds, totalKg, confirmation };
  }).filter(load => load.totalKg > 0 || load.confirmation);
  const activeSupplierLoad = supplierLoads.find(load => load.supplier.id === selectedSupplierId) ?? supplierLoads[0];
  const stageCount = activeStep === 'trips' ? `${data.orders.length} đơn` : activeStep === 'routes' ? `${supplierLoads.length} vựa` : activeStep === 'hub' ? `${supplierLoads.length} điểm lấy` : activeStep === 'delivery' ? `${visibleShipments.reduce((sum, shipment) => sum + shipment.orderIds.length, 0)} đơn` : `${data.orders.filter(order => order.status === 'DELIVERED').length} đơn đã giao`;

  const updateStatus = async (shipment: Shipment, next: ShipmentStatus) => {
    try {
      setUpdatingId(shipment.id);
      setError('');
      await advanceShipmentStatus(shipment.id, next);
      setNotice(next === 'IN_TRANSIT' ? 'Đã ghi nhận chuyến bắt đầu giao trong dữ liệu demo.' : 'Đã ghi nhận hoàn tất giao hàng trong dữ liệu demo.');
      setActiveStep(next === 'IN_TRANSIT' ? 'delivery' : 'complete');
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không cập nhật được trạng thái chuyến.');
    } finally {
      setUpdatingId('');
      window.setTimeout(() => setNotice(''), 3500);
    }
  };

  function findOrder(id: string) { return data.orders.find(order => order.id === id); }
  const customerName = (id: string) => data.customers.find(customer => customer.id === id)?.businessName ?? id;
  const addressLabel = (id: string) => data.addresses.find(address => address.id === id)?.label ?? id;
  const addressText = (id: string) => data.addresses.find(address => address.id === id)?.address ?? 'Địa chỉ demo chưa có mô tả';
  const totalKg = (order: Order) => order.items.reduce((sum, item) => sum + item.quantityKg, 0);
  const formatVnd = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;

  return <div className="transport-portal">
    <header className="transport-masthead">
      <div className="transport-brand">
        <img className="transport-brand-logo" src="/farmgo-logo.png" alt="FARMGO"/>
        <div><strong>Express LogiHub</strong><small>HỆ THỐNG VẬN CHUYỂN NÔNG SẢN B2B</small></div>
      </div>
      <div className="transport-masthead-actions"><div className="transport-demo-chip"><span/> Chế độ demo · dữ liệu giả lập</div><div className="transport-signed-in">{session.displayName}<small>Tài khoản giao nhận demo</small></div><button className="transport-signout" onClick={onSignOut}>Thoát</button></div>
    </header>

    <nav className="transport-step-nav" aria-label="Các bước giao nhận">
      {stepNavigation.map((step, index) => <button key={step.id} className={activeStep === step.id ? 'active' : ''} aria-current={activeStep === step.id ? 'step' : undefined} onClick={() => setActiveStep(step.id)}>
        <span>{index === 0 ? '◷' : index + 1}</span><strong>{step.label}</strong><i aria-hidden="true">›</i>
      </button>)}
    </nav>

    <main className={`transport-content transport-step-${activeStep}`}>
      {activeStep === 'overview' ? <section className="transport-welcome-banner"><div><span className="transport-welcome-pill">● TÀI KHOẢN GIAO NHẬN DEMO</span><h1>Chào mừng, {session.displayName}</h1><p>Chuyến giao qua Hub · Trạng thái được cập nhật trong dữ liệu mô phỏng</p></div><button onClick={() => setActiveStep('trips')}>Xem chuyến được giao <span>→</span></button></section> : <section className="transport-stage-banner"><div><span className="transport-eyebrow">BƯỚC {stepNavigation.findIndex(step => step.id === activeStep) + 1} · QUY TRÌNH GIAO NHẬN</span><h1>{stepContent[activeStep].title}</h1><p>{stepContent[activeStep].description}</p></div><span className="transport-count-label">{stageCount}</span></section>}

      {activeStep === 'overview' && <div className="transport-metrics transport-metrics-four">
        <div><span>Tổng đơn khả dụng</span><strong>{availableOrders.length.toLocaleString('vi-VN')}</strong><small>↗ Đã sẵn sàng gom · demo</small></div>
        <div><span>Tổng trọng lượng</span><strong>{availableWeight.toLocaleString('vi-VN')}<small className="metric-unit"> kg</small></strong><small>▣ {activeCount} chuyến đang xử lý</small></div>
        <div><span>Tổng ước tính cước</span><strong>{formatVnd(estimatedDeliveryFees)}</strong><small>▤ Phí giao hàng mô phỏng</small></div>
        <div><span>Đánh giá uy tín</span><strong>4.9<small className="metric-unit"> /5</small></strong><small>★ Hạng vận chuyển demo</small></div>
      </div>}

      {error && <ErrorMessage message={error} onRetry={() => void loadData()}/>}
      {notice && <div className="transport-notice" role="status">{notice}</div>}

      {activeStep === 'overview' && <div className="transport-overview-grid">
        <section className="transport-route-summary"><header><h2>◈ Khu vực & tuyến đường vận chuyển</h2><span className="transport-demo-status">TUYẾN DEMO</span></header><div className="transport-summary-stops"><article><small>VÙNG THU MUA 1</small><strong>{supplierLoads[0]?.supplier.regionLabel || supplierLoads[0]?.supplier.name || 'Chưa có vùng'}</strong><span>{supplierLoads[0]?.supplier.name || 'Chưa có điểm lấy hàng'}</span></article><i>→</i><article><small>VÙNG THU MUA 2</small><strong>{supplierLoads[1]?.supplier.regionLabel || supplierLoads[1]?.supplier.name || 'Đang chờ phân tuyến'}</strong><span>{supplierLoads[1]?.supplier.name || 'Dữ liệu nhà vườn demo'}</span></article><i>→</i><article><small>ĐIỂM GIAO CUỐI</small><strong>{data.addresses[0]?.deliveryZone || 'Các quán F&B'}</strong><span>{data.addresses[0]?.address || `${totalStops} điểm giao trong tuyến`}</span></article></div><div className="transport-overview-callout"><TruckIcon/><div><strong>Sẵn sàng nhận đơn giao hàng hôm nay?</strong><span>Phân nhóm đơn theo khối lượng và tuyến giao mô phỏng.</span></div><button onClick={() => setActiveStep('trips')}>Gom đơn ngay <b>→</b></button></div></section>
        <aside className="transport-quick-panel"><header><h2>Truy cập nhanh các bước</h2></header>{(['trips', 'routes', 'hub', 'delivery', 'complete'] as TransportStep[]).map((step, index) => <button key={step} onClick={() => setActiveStep(step)}><span>{index + 2}</span><div><strong>{stepNavigation.find(item => item.id === step)?.label}</strong><small>{stepContent[step].description}</small></div><b>›</b></button>)}</aside>
      </div>}

      {activeStep === 'trips' && <>
        <div className="transport-classification-grid">{orderGroups.map(group => <button type="button" key={group.key} className={`transport-order-type-card type-${group.key.toLowerCase()}${selectedOrderGroup === group.key ? ' selected' : ''}`} onClick={() => setSelectedOrderGroup(group.key)}><span>LOẠI {group.key}{group.key === 'C' ? ' · MỚI' : ''}</span><strong>{group.title}</strong><small>{group.note}</small><footer><b>{group.orders.length} đơn demo</b><b>{group.detail}</b></footer></button>)}</div>
        <section className="transport-order-board"><header><div><h2>Danh sách đơn · {activeOrderGroup.title}</h2><span>{activeOrderGroup.orders.length} đơn trong nhóm mô phỏng</span></div><button disabled={!activeOrderGroup.orders.length} onClick={() => { setAcceptedOrderIds(ids => [...new Set([...ids, ...activeOrderGroup.orders.map(order => order.id)])]); setDemoFeedbackMessage(`Đã mô phỏng xác nhận ${activeOrderGroup.orders.length} đơn.`); }}>{activeOrderGroup.orders.every(order => acceptedOrderIds.includes(order.id)) && activeOrderGroup.orders.length ? '✓ Đã xác nhận nhóm này' : '✓ Nhận tất cả đơn trong nhóm'}</button></header>
          {activeOrderGroup.orders.length ? activeOrderGroup.orders.map(order => <article className="transport-order-row" key={order.id}><div className="transport-order-main"><span className="transport-order-id">{order.id}</span><strong>{customerName(order.customerId)}</strong><small>⌖ {addressText(order.deliveryAddressId)}</small><small>▰ {order.items.map(item => `${item.quantityKg}kg ${item.productName}`).join(' · ')} ({kgForOrder(order)}kg)</small></div><div className="transport-order-money"><span>Phí vận chuyển <b>{formatVnd(order.shippingFeeVnd)}</b></span><span>Thu hộ COD <strong>{formatVnd(order.totalVnd)}</strong></span></div><button className={acceptedOrderIds.includes(order.id) ? 'is-confirmed' : ''} onClick={() => setAcceptedOrderIds(ids => ids.includes(order.id) ? ids : [...ids, order.id])}>{acceptedOrderIds.includes(order.id) ? '✓ Đã nhận demo' : '✓ Xác nhận nhận đơn'}</button></article>) : <p className="transport-order-empty">Nhóm này chưa có đơn. Dữ liệu hiển thị hoàn toàn là mô phỏng.</p>}
        </section>
      </>}

      {activeStep === 'routes' && activeSupplierLoad && <section className="transport-route-planner"><div className="transport-route-planner-head"><div><span className="transport-eyebrow">BƯỚC 3: AI ROUTE OPTIMIZATION · MÔ PHỎNG</span><h2>Lộ trình lấy hàng từ trụ sở đến các nhà vườn</h2><p>{routeRecalculated ? 'Đã cập nhật thứ tự dừng minh họa.' : 'Tối ưu minh họa theo danh sách điểm nhận, chưa tính khoảng cách thực.'}</p></div><button className="route-recalculate" onClick={() => setRouteRecalculated(true)}>⟳ Tính lại bằng AI (demo)</button><button className="route-next-action" onClick={() => setActiveStep('hub')}>Chuyển sang bước 4: Lấy hàng →</button></div><div className="transport-route-planner-body"><div className="transport-route-timeline"><strong>THỨ TỰ ĐIỂM DỪNG ĐỀ XUẤT</strong><div className="route-stop-row"><span>⌂</span><div><b>Điểm xuất phát · FARMGO Hub</b><small>Trụ sở trung chuyển demo</small></div></div>{supplierLoads.map((load, index) => <button type="button" className={`route-stop-row route-supplier-stop${activeSupplierLoad.supplier.id === load.supplier.id ? ' selected' : ''}`} key={load.supplier.id} onClick={() => setSelectedSupplierId(load.supplier.id)}><span>{index + 1}</span><div><b>{load.supplier.name}</b><small>{load.supplier.regionLabel || load.supplier.gardenAddress}</small><small>Lấy: {load.totalKg.toLocaleString('vi-VN')}kg · {load.orderIds.length} đơn liên quan</small></div></button>)}<div className="route-stop-row"><span>H</span><div><b>Điểm tập kết FARMGO Hub</b><small>Hàng về Hub trước khi giao cho quán</small></div></div></div><div className="transport-route-map"><span className="route-art-label">SƠ ĐỒ TUYẾN LẤY HÀNG · CHỈ MÔ PHỎNG</span><div className="route-map-nodes"><span>Hub</span>{supplierLoads.map((load,index)=><i key={load.supplier.id} className={load.supplier.id===activeSupplierLoad.supplier.id?'selected':''}>{index+1}</i>)}<span>Hub</span></div><div className="route-map-labels"><strong>Trụ sở FARMGO</strong><strong>{supplierLoads.length} vựa · {supplierLoads.reduce((sum,load)=>sum+load.totalKg,0).toLocaleString('vi-VN')}kg</strong></div><p>Không có bản đồ/GPS hoặc AI kết nối. Điểm dừng và thứ tự chỉ dùng trình diễn.</p></div></div></section>}

      {activeStep === 'hub' && <section className="transport-scan-panel"><header className="transport-scan-heading"><span>▦ BƯỚC 4: XÁC NHẬN ĐÃ LẤY HÀNG TẠI VỰA · DEMO</span><h2>Xác nhận đã nhận hàng từ chủ vựa / nông dân</h2><p>Giao diện mô phỏng quét QR hoặc nhập OTP; chưa kết nối camera hay xác thực thật.</p></header><label className="pickup-supplier-select">Chọn điểm vựa đang lấy hàng<select value={activeSupplierLoad?.supplier.id ?? ''} onChange={event => setSelectedSupplierId(event.target.value)}>{supplierLoads.map(load => <option key={load.supplier.id} value={load.supplier.id}>{load.supplier.name} ({load.totalKg}kg)</option>)}</select></label><div className="transport-scan-tabs"><button className={scanMode==='camera'?'active':''} onClick={()=>setScanMode('camera')}>▦ Quét mã QR bằng camera (demo)</button><button className={scanMode==='code'?'active':''} onClick={()=>setScanMode('code')}>⚿ Nhập mã OTP xác nhận</button></div>{scanMode==='camera'?<div className="transport-camera-mock"><span className="camera-glyph">▣</span><strong>Khung quét QR mô phỏng</strong><small>Camera không được bật. Nhấn nút dưới để xem trạng thái demo.</small><span className="camera-scan-pill">SẴN SÀNG QUÉT DEMO</span></div>:<div className="transport-otp-mock"><label>Mã OTP demo<input inputMode="numeric" maxLength={4} value={otpCode} onChange={event=>setOtpCode(event.target.value.replace(/\D/g,'').slice(0,4))} placeholder="Nhập 4 chữ số"/></label><small>Mã minh họa: 1234</small></div>}{activeSupplierLoad&&<button className="transport-scan-confirm" disabled={scanMode==='code'&&otpCode.length!==4} onClick={()=>{if(scanMode==='code'&&otpCode!=='1234'){setDemoFeedbackMessage('Mã OTP demo chưa đúng. Hãy nhập 1234 để tiếp tục.');return;}setConfirmedPickupIds(ids=>ids.includes(activeSupplierLoad.supplier.id)?ids:[...ids,activeSupplierLoad.supplier.id]);setDemoFeedbackMessage(`Đã mô phỏng xác nhận lấy hàng từ ${activeSupplierLoad.supplier.name}.`);}}>✓ Mô phỏng xác nhận đã lấy hàng</button>}{activeSupplierLoad&&confirmedPickupIds.includes(activeSupplierLoad.supplier.id)&&<p className="transport-scan-success">✓ Đã xác nhận lấy hàng demo · {activeSupplierLoad.totalKg}kg</p>}<span className="transport-demo-disclaimer">Mọi thao tác trên màn hình này chỉ là mô phỏng, không xác minh QR/OTP thật.</span></section>}
      {activeStep === 'delivery' && <><section className="transport-barcode-panel"><div><span>▥ BƯỚC 5: QUÉT MÃ ĐƠN HÀNG · DEMO</span><h2>Quét mã đơn để xác nhận giao</h2><p>Nhập mã đơn từ danh sách dưới đây để mô phỏng thao tác quét barcode. Không dùng camera thật.</p></div><form onSubmit={event=>{event.preventDefault();const order=data.orders.find(item=>item.id.toLowerCase()===scanCode.trim().toLowerCase());const shipment=order&&data.shipments.find(item=>item.status==='IN_TRANSIT'&&item.orderIds.includes(order.id));if(!order||!shipment){setDemoFeedbackMessage('Không tìm thấy mã đơn đang giao trong dữ liệu demo.');return;}const next=[...new Set([...deliveredOrderIds,order.id])];setDeliveredOrderIds(next);setScanCode('');setDemoFeedbackMessage(`Đã mô phỏng quét đơn ${order.id}.`);if(shipment.orderIds.every(id=>next.includes(id)))void updateStatus(shipment,'DELIVERED');}}><input value={scanCode} onChange={event=>setScanCode(event.target.value)} placeholder={`Nhập mã đơn (VD: ${visibleShipments[0]?.orderIds[0] ?? 'FSC-8801'})`}/><button type="submit">Quét ngay</button></form></section><section className="transport-delivery-intro"><div><span className="transport-eyebrow">CẬP NHẬT GIAO HÀNG</span><h2>Danh sách điểm giao hàng chi tiết cho các quán F&B</h2><p>Đơn sẽ chuyển sang đã giao khi hoàn tất mô phỏng toàn bộ chuyến.</p></div><span>● ĐANG GIAO</span></section></>}
      {activeStep === 'complete' && <section className="transport-feedback-panel"><div className="transport-feedback-tabs"><button className={feedbackTab==='reviews'?'active':''} onClick={()=>setFeedbackTab('reviews')}>★ Đánh giá dịch vụ giao hàng từ các quán</button><button className={feedbackTab==='returns'?'active':''} onClick={()=>setFeedbackTab('returns')}>↶ Xử lý đổi / trả hàng · mẫu 12h</button></div><span className="transport-demo-disclaimer">Nội dung minh họa theo ảnh tham khảo · chưa nối nghiệp vụ backend</span>{feedbackTab==='reviews'?<><section className="transport-rating-summary"><div><strong>Tổng hợp đánh giá chất lượng vận chuyển</strong><p>Ý kiến phản hồi demo từ các quán F&B</p></div><b>4.9 <small>/ 5.0</small><span>★★★★★</span></b></section><div className="transport-review-grid">{[{name:'Tiệm Trà Lọt Lẻ',address:'Phường 3, Quận 5, TP.HCM',time:'10 phút trước',comment:'Bác tài giao nhanh cực kỳ, xoài tươi nguyên không bị dập xước vỏ. Sẽ tiếp tục gom đơn FARMGO B2B.'},{name:'Highlands Coffee',address:'Bến Thành, Quận 1, TP.HCM',time:'35 phút trước',comment:'Bưởi da xanh nhận lúc sáng rất tươi mát, thùng đóng gói cẩn thận. Rất hài lòng với dịch vụ giao hàng.'},{name:'Chuỗi Buffet Hoàng Yến',address:'Phường Đa Kao, Quận 1, TP.HCM',time:'1 giờ trước',comment:'Giao đơn sỉ đúng giờ khai trương nhà hàng. Bác tài hỗ trợ bốc dỡ nhiệt tình!'},{name:'Tiệm Bánh ABC Bakery',address:'Phường 13, Quận Phú Nhuận, TP.HCM',time:'2 giờ trước',comment:'Dâu tây giữ lạnh tốt, FARMGO hỗ trợ nhanh khi cần phản hồi.'}].map(review=><article className="transport-review-card" key={review.name}><header><strong>♟ {review.name}</strong><small>{review.time}</small></header><p>⌖ {review.address}</p><span>★★★★★ <b>5.0 / 5</b></span><blockquote>“{review.comment}”</blockquote></article>)}</div></>:<section className="transport-return-panel"><div><span className="transport-eyebrow">YÊU CẦU HỖ TRỢ SAU GIAO</span><h2>Đổi / trả hàng trong 12 giờ</h2><p>Giao diện minh họa theo ảnh tham khảo. Chính sách và API cần được chốt lại trước khi tích hợp backend.</p></div><form onSubmit={event=>{event.preventDefault();setDemoFeedbackMessage('Đã ghi nhận yêu cầu đổi / trả ở giao diện demo.');setReturnNote('');}}><label>Mã đơn<select><option>Chọn đơn cần hỗ trợ</option>{data.orders.filter(order=>order.status==='DELIVERED').map(order=><option key={order.id}>{order.id} · {customerName(order.customerId)}</option>)}</select></label><label>Thông tin yêu cầu<textarea value={returnNote} onChange={event=>setReturnNote(event.target.value)} placeholder="Mô tả tình trạng đơn hàng"/></label><button disabled={!returnNote.trim()}>Gửi yêu cầu demo</button></form></section>}</section>}
      {demoFeedbackMessage&&<div className="transport-notice" role="status">{demoFeedbackMessage}</div>}

      {loading ? <LoadingSpinner/> : activeStep === 'overview' || activeStep === 'trips' || activeStep === 'hub' || activeStep === 'complete' ? null : activeStep === 'routes' && !activeSupplierLoad ? <section className="transport-empty"><div className="transport-empty-icon"><TruckIcon/></div><h3>Chưa có lộ trình lấy hàng</h3><p>Khi có nhu cầu đã gom cho nhà vườn, danh sách điểm lấy hàng demo sẽ xuất hiện ở đây.</p></section> : activeStep === 'routes' ? null : visibleShipments.length === 0 ? <section className="transport-empty">
        <div className="transport-empty-icon"><TruckIcon/></div>
        <h3>Chưa có chuyến đang giao</h3>
        <p>Khi có chuyến được cập nhật đang giao, danh sách đơn mô phỏng sẽ xuất hiện tại đây.</p>
      </section> : <div className="transport-trip-list">
        {visibleShipments.map((shipment, index) => {
          const next = nextStatus[shipment.status];
          const completed = shipment.status === 'DELIVERED';
          const orders = shipment.orderIds.map(findOrder).filter((order): order is Order => Boolean(order));
          return <article className={`transport-trip${completed ? ' is-complete' : ''}`} key={shipment.id}>
            <div className="trip-index"><span>{String(index + 1).padStart(2, '0')}</span><i/></div>
            <div className="trip-main">
              <div className="trip-topline">
                <div><p className="trip-kicker">{shipment.deliveryDate || 'Lịch demo cũ'} <span>·</span> {slotLabel(shipment.deliverySlot)}</p><h3>{shipment.routeLabel}</h3></div>
                <span className={`trip-status status-${shipment.status.toLowerCase()}`}><i/>{statusLabel[shipment.status]}</span>
              </div>
              <div className="trip-vehicle">
                <span><b>Xe</b>{shipment.vehiclePlate || 'Chưa gán'}</span>
                <span><b>Tài xế demo</b>{shipment.driverName || 'Chưa gán'}</span>
                <span><b>Liên hệ</b>{shipment.driverPhone || 'Chưa có'}</span>
              </div>
              <div className="trip-stops">
                <div className="trip-stops-heading"><span>Điểm giao</span><span>{orders.length} đơn <i>·</i> {orders.reduce((sum, order) => sum + totalKg(order), 0)} kg</span></div>
                {orders.map((order, stopIndex) => <div className="trip-stop" key={order.id}>
                  <span className="stop-number">{String(stopIndex + 1).padStart(2, '0')}</span>
                  <div className="stop-details"><strong>{customerName(order.customerId)}</strong><span>{addressLabel(order.deliveryAddressId)} · {addressText(order.deliveryAddressId)}</span><small>{order.items.map(item => `${item.productName} ${item.quantityKg}kg`).join(' / ')}</small></div>
                  <span className="stop-order">#{order.id}</span>
                </div>)}
              </div>
              <div className="trip-bottomline">
                <p>{completed ? 'Chuyến đã hoàn tất trong bản demo.' : shipment.trackingLabel || 'Trạng thái đồng bộ từ chuyến giao demo.'}</p>
                {next ? <button className="trip-action" disabled={updatingId === shipment.id} onClick={() => void updateStatus(shipment, next)}>
                  {updatingId === shipment.id ? 'Đang cập nhật…' : next === 'IN_TRANSIT' ? 'Xác nhận rời Hub' : 'Xác nhận hoàn tất chuyến'}
                  <span aria-hidden="true">↗</span>
                </button> : <span className="trip-done">Đã hoàn tất</span>}
              </div>
            </div>
          </article>;
        })}
      </div>}
      <footer className="transport-footnote"><span>FARMGO · giao nhận qua Hub</span><span>Các thao tác trên trang chỉ cập nhật trạng thái demo, không xác nhận GPS hoặc quét QR thật.</span></footer>
    </main>
  </div>;
}

function TruckIcon() {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 8.5h16v14H3zM19 13h5.2l4.3 4.6v4.9H19z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="9" cy="24" r="2.5" fill="currentColor"/><circle cx="24" cy="24" r="2.5" fill="currentColor"/><path d="M6 12.5h9M6 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
