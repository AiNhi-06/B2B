import type * as T from '../types/index';
import { createSeed, shippingFees, type DemoState } from '../mocks/seed';
import { mutate, readState, subscribe } from '../store/demoStore';

function fail(code: T.ServiceErrorCode, message: string, details?: Record<string, unknown>): never {
  throw Object.assign(new Error(message), { code, details });
}
export function isServiceError(error: unknown): error is T.ServiceError {
  return error instanceof Error && 'code' in error &&
    ['INSUFFICIENT_STOCK', 'INVALID_STATUS_TRANSITION', 'VALIDATION_ERROR', 'NOT_FOUND'].includes(String(error.code));
}
function requireValue(condition: unknown, message: string, field?: string): asserts condition {
  if (!condition) fail('VALIDATION_ERROR', message, field ? { field } : undefined);
}
function find<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find(value => value.id === id);
  if (!item) fail('NOT_FOUND', 'Không tìm thấy dữ liệu yêu cầu.', { entityId: id });
  return item;
}
function integer(value: number, field: string, min = 0) {
  requireValue(Number.isSafeInteger(value) && value >= min, `${field} phải là số nguyên từ ${min}.`, field);
}
function text(value: string, field: string): string {
  requireValue(typeof value === 'string' && value.trim().length > 0, `Vui lòng nhập ${field}.`, field);
  return value.trim();
}
function publicProduct(product: T.ProductListing, rule: T.PricingRule): T.CustomerProduct {
  const price = rule.mode === 'PERCENT' ? Math.round(product.basePricePerKg * (1 + rule.value / 100)) : product.basePricePerKg + rule.value;
  integer(price, 'Giá bán');
  return { id: product.id, name: product.name, variety: product.variety, unit: 'kg', availableKg: product.availableKg, sellingPricePerKg: price, imageUrl: product.imageUrl };
}
function quote(state: DemoState, input: T.NewOrderInput): T.CheckoutQuote {
  find(state.customers, input.customerId);
  const address = find(state.addresses, input.deliveryAddressId);
  requireValue(address.customerId === input.customerId, 'Địa chỉ không thuộc khách hàng.', 'deliveryAddressId');
  requireValue(Array.isArray(input.items) && input.items.length > 0, 'Giỏ hàng đang trống.', 'items');
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    integer(item.quantityKg, 'Số kg', 1);
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantityKg;
    integer(quantity, 'Số kg', 1);
    quantities.set(item.productId, quantity);
  }
  const items = [...quantities].map(([productId, quantityKg]) => {
    const product = find(state.products, productId);
    requireValue(product.active, 'Sản phẩm đã ngừng bán.', 'productId');
    if (quantityKg > product.availableKg) fail('INSUFFICIENT_STOCK', 'Số lượng đặt vượt tồn kho khả dụng.', { productId, requestedKg: quantityKg, availableKg: product.availableKg });
    const unitPriceVnd = publicProduct(product, state.pricing).sellingPricePerKg;
    const lineTotalVnd = quantityKg * unitPriceVnd;
    integer(lineTotalVnd, 'Tiền hàng');
    return { productId, productName: product.name, quantityKg, unitPriceVnd, lineTotalVnd };
  });
  const shippingFeeVnd = shippingFees[address.id];
  requireValue(shippingFeeVnd !== undefined, 'Chưa có phí vận chuyển demo cho địa chỉ này.', 'deliveryAddressId');
  const subtotalVnd = items.reduce((sum, item) => sum + item.lineTotalVnd, 0);
  const totalVnd = subtotalVnd + shippingFeeVnd;
  integer(totalVnd, 'Tổng tiền');
  return { items, subtotalVnd, shippingFeeVnd, totalVnd };
}
function demand(state: DemoState): T.DemandLine[] {
  const lines = new Map<string, T.DemandLine>();
  for (const order of state.orders.filter(order => ['AGGREGATED', 'SUPPLIER_CONFIRMED', 'AT_HUB', 'DISPATCHED'].includes(order.status))) {
    for (const item of order.items) {
      const product = find(state.products, item.productId);
      const line = lines.get(product.id) ?? { productId: product.id, productName: product.name, supplierId: product.supplierId, quantityKg: 0, orderIds: [] };
      line.quantityKg += item.quantityKg;
      if (!line.orderIds.includes(order.id)) line.orderIds.push(order.id);
      lines.set(product.id, line);
    }
  }
  return [...lines.values()];
}
function invalidTransition(id: string, current: string, next: string): never {
  return fail('INVALID_STATUS_TRANSITION', 'Không thể chuyển trạng thái hoặc chưa đủ điều kiện.', { entityId: id, currentStatus: current, requestedStatus: next });
}

export const subscribeDemoData = subscribe;
export async function getDemoSession(): Promise<T.DemoSession> { return readState().session; }
export async function getDemoRole(): Promise<T.Role> { return readState().session.role; }
export async function getSuppliers(): Promise<T.Supplier[]> { return readState().suppliers; }
export async function getCustomers(): Promise<T.Customer[]> { return readState().customers; }
export async function setDemoSession(session: Partial<T.DemoSession>): Promise<void> {
  mutate('SESSION_CHANGED', state => {
    if ('role' in session) requireValue(['SUPPLIER', 'CUSTOMER', 'ADMIN'].includes(session.role!), 'Vai trò không hợp lệ.', 'role');
    if ('activeSupplierId' in session) { requireValue(typeof session.activeSupplierId === 'string', 'Nhà vườn không hợp lệ.'); find(state.suppliers, session.activeSupplierId); }
    if ('activeCustomerId' in session) { requireValue(typeof session.activeCustomerId === 'string', 'Khách hàng không hợp lệ.'); find(state.customers, session.activeCustomerId); }
    state.session = { role: session.role ?? state.session.role, activeSupplierId: session.activeSupplierId ?? state.session.activeSupplierId, activeCustomerId: session.activeCustomerId ?? state.session.activeCustomerId };
  });
}
export async function setDemoRole(role: T.Role): Promise<void> { await setDemoSession({ role }); }
export async function resetDemoData(): Promise<void> { mutate('RESET', state => { Object.assign(state, createSeed()); }); }
export async function getSupplierListings(supplierId: string): Promise<T.ProductListing[]> {
  const state = readState(); find(state.suppliers, supplierId); return state.products.filter(product => product.supplierId === supplierId);
}
export async function createProduct(input: T.NewProductInput): Promise<T.ProductListing> {
  return mutate('DATA_CHANGED', state => {
    find(state.suppliers, input.supplierId);
    integer(input.availableKg, 'Tồn kho'); integer(input.basePricePerKg, 'Giá gốc');
    const product: T.ProductListing = { id: `product-${state.nextId++}`, supplierId: input.supplierId, name: text(input.name, 'Tên sản phẩm'), variety: input.variety, unit: 'kg', availableKg: input.availableKg, basePricePerKg: input.basePricePerKg, imageUrl: input.imageUrl, active: true };
    publicProduct(product, state.pricing);
    state.products.push(product); return product;
  });
}
export async function getCustomerCatalog(): Promise<T.CustomerProduct[]> {
  const state = readState(); return state.products.filter(product => product.active).map(product => publicProduct(product, state.pricing));
}
export async function getDeliveryAddresses(customerId: string): Promise<T.DeliveryAddress[]> {
  const state = readState(); find(state.customers, customerId); return state.addresses.filter(address => address.customerId === customerId);
}
export async function quoteCheckout(input: T.NewOrderInput): Promise<T.CheckoutQuote> { return quote(readState(), input); }
export async function placeOrder(input: T.NewOrderInput): Promise<T.Order> {
  return mutate('DATA_CHANGED', state => {
    const result = quote(state, input);
    for (const item of result.items) find(state.products, item.productId).availableKg -= item.quantityKg;
    const order: T.Order = { id: `order-${state.nextId++}`, customerId: input.customerId, deliveryAddressId: input.deliveryAddressId, ...result, status: 'PLACED', paymentStatus: 'UNPAID', placedAt: new Date().toISOString() };
    state.orders.push(order); return order;
  });
}
export async function getCustomerOrders(customerId: string): Promise<T.Order[]> {
  const state = readState(); find(state.customers, customerId); return state.orders.filter(order => order.customerId === customerId);
}
export async function getAllOrders(): Promise<T.Order[]> { return readState().orders; }
export async function getPricingRule(): Promise<T.PricingRule> { return readState().pricing; }
export async function updatePricingRule(rule: T.PricingRule): Promise<T.PricingRule> {
  requireValue(['PERCENT', 'FIXED_VND_PER_KG'].includes(rule.mode) && Number.isFinite(rule.value) && rule.value >= 0, 'Markup không hợp lệ.');
  if (rule.mode === 'FIXED_VND_PER_KG') integer(rule.value, 'Markup');
  return mutate('DATA_CHANGED', state => {
    const pricing = { mode: rule.mode, value: rule.value };
    for (const product of state.products) publicProduct(product, pricing);
    state.pricing = pricing; return pricing;
  });
}
export async function aggregateDemand(): Promise<T.DemandLine[]> {
  return mutate('DATA_CHANGED', state => {
    for (const order of state.orders) if (order.status === 'PLACED') order.status = 'AGGREGATED';
    return demand(state);
  });
}
export async function getSupplierDemand(supplierId: string): Promise<T.DemandLine[]> {
  const state = readState(); find(state.suppliers, supplierId); return demand(state).filter(line => line.supplierId === supplierId);
}
export async function getSupplierConfirmations(): Promise<T.SupplierConfirmation[]> { return readState().confirmations; }
export async function confirmSupplierDemand(input: { supplierId: string; orderIds: string[]; vehiclePlate?: string; estimatedArrivalAt?: string }): Promise<T.SupplierConfirmation> {
  return mutate('DATA_CHANGED', state => {
    find(state.suppliers, input.supplierId);
    requireValue(Array.isArray(input.orderIds) && input.orderIds.length > 0 && new Set(input.orderIds).size === input.orderIds.length, 'Danh sách đơn phải có dữ liệu và không trùng.');
    if (input.estimatedArrivalAt !== undefined) requireValue(/^\d{4}-\d{2}-\d{2}T/.test(input.estimatedArrivalAt) && Number.isFinite(Date.parse(input.estimatedArrivalAt)), 'Giờ dự kiến không hợp lệ.', 'estimatedArrivalAt');
    const ids = [...input.orderIds].sort();
    const existing = state.confirmations.find(value => value.supplierId === input.supplierId && JSON.stringify([...value.orderIds].sort()) === JSON.stringify(ids) && value.vehiclePlate === input.vehiclePlate && value.estimatedArrivalAt === input.estimatedArrivalAt);
    if (existing) return existing;
    const orders = ids.map(id => find(state.orders, id));
    for (const order of orders) {
      requireValue(order.items.some(item => find(state.products, item.productId).supplierId === input.supplierId), 'Đơn không có sản phẩm của nhà vườn.');
      if (order.status !== 'AGGREGATED') invalidTransition(order.id, order.status, 'SUPPLIER_CONFIRMED');
      requireValue(!state.confirmations.some(value => value.supplierId === input.supplierId && value.orderIds.includes(order.id)), 'Đơn đã được nhà vườn xác nhận; vui lòng chọn các đơn chưa xác nhận.');
    }
    const confirmation = { supplierId: input.supplierId, orderIds: ids, confirmedAt: new Date().toISOString(), vehiclePlate: input.vehiclePlate, estimatedArrivalAt: input.estimatedArrivalAt };
    state.confirmations.push(confirmation);
    for (const order of orders) {
      const suppliers = new Set(order.items.map(item => find(state.products, item.productId).supplierId));
      if ([...suppliers].every(id => state.confirmations.some(value => value.supplierId === id && value.orderIds.includes(order.id)))) order.status = 'SUPPLIER_CONFIRMED';
    }
    return confirmation;
  });
}
export async function advanceOrderStatus(orderId: string, next: T.OrderStatus): Promise<T.Order> {
  return mutate('DATA_CHANGED', state => {
    const order = find(state.orders, orderId);
    if (order.status === next) return order;
    if (state.shipments.some(shipment => shipment.orderIds.includes(orderId)) || order.status !== 'SUPPLIER_CONFIRMED' || next !== 'AT_HUB') invalidTransition(orderId, order.status, next);
    order.status = next; return order;
  });
}
export async function getShipments(): Promise<T.Shipment[]> { return readState().shipments; }
export async function getShipmentByOrderId(orderId: string): Promise<T.Shipment | null> {
  const state = readState(); find(state.orders, orderId); return state.shipments.find(shipment => shipment.orderIds.includes(orderId)) ?? null;
}
export async function assignDemoShipment(input: { orderIds: string[]; routeLabel: string }): Promise<T.Shipment> {
  return mutate('DATA_CHANGED', state => {
    requireValue(Array.isArray(input.orderIds) && input.orderIds.length > 0 && new Set(input.orderIds).size === input.orderIds.length, 'Danh sách đơn phải có dữ liệu và không trùng.');
    const routeLabel = text(input.routeLabel, 'Tên tuyến');
    for (const id of input.orderIds) {
      const order = find(state.orders, id);
      if (order.status !== 'AT_HUB' || state.shipments.some(shipment => shipment.orderIds.includes(id))) invalidTransition(id, order.status, 'ASSIGNED');
    }
    const shipment: T.Shipment = { id: `shipment-${state.nextId++}`, orderIds: [...input.orderIds], routeLabel, status: 'ASSIGNED', driverName: 'Tài xế demo', driverPhone: '0900000099', vehiclePlate: 'DEMO-001', trackingLabel: 'Chuyến giao mô phỏng — chưa xuất phát' };
    state.shipments.push(shipment); return shipment;
  });
}
export async function advanceShipmentStatus(id: string, next: T.ShipmentStatus): Promise<T.Shipment> {
  return mutate('DATA_CHANGED', state => {
    const shipment = find(state.shipments, id);
    if (shipment.status === next) return shipment;
    if (!((shipment.status === 'ASSIGNED' && next === 'IN_TRANSIT') || (shipment.status === 'IN_TRANSIT' && next === 'DELIVERED'))) invalidTransition(id, shipment.status, next);
    const orders = shipment.orderIds.map(orderId => find(state.orders, orderId));
    const expected = next === 'IN_TRANSIT' ? 'AT_HUB' : 'DISPATCHED';
    for (const order of orders) if (order.status !== expected) invalidTransition(order.id, order.status, next);
    for (const order of orders) order.status = next === 'IN_TRANSIT' ? 'DISPATCHED' : 'DELIVERED';
    shipment.status = next;
    shipment.trackingLabel = next === 'IN_TRANSIT' ? 'Đang giao — hành trình mô phỏng, không GPS thật' : 'Đã giao — xác nhận mô phỏng';
    return shipment;
  });
}
