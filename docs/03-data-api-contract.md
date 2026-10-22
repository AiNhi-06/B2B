# 03 — Shared Data / Mock API Contract (v1)

**TRẠNG THÁI: [PROPOSAL] — cần cả hai agent đồng ý trước khi triển khai.** Đây là hợp đồng đề xuất cho demo, không phải cấu trúc dữ liệu bắt buộc từ tài liệu gốc.

## 1. Nguyên tắc thiết kế
- Codex **sở hữu** `src/types/`, `src/services/`, `src/mocks/`, `src/store/`.
- Antigravity import types/services; không định nghĩa lại interface riêng trùng chức năng.
- Không có endpoint HTTP thật; UI gọi hàm async trả `Promise` (mock services).
- Tất cả tiền ở đơn vị VND dưới dạng `number` nguyên; khối lượng ở đơn vị `kg`.
- Thời gian ISO 8601 string; display timezone `Asia/Ho_Chi_Minh`.
- IDs là chuỗi ổn định; seed cố định để quay demo tái lập được.
- **Bảo mật UI:** không truyền `basePricePerKg` trong `CustomerProduct` và không ghi số đó ra màn hình khách; đây không phải cách bảo mật dữ liệu production.

## 2. TypeScript contract đề xuất

```ts
export type Role = 'SUPPLIER' | 'CUSTOMER' | 'ADMIN';
export type OrderStatus =
  | 'PLACED' | 'AGGREGATED' | 'SUPPLIER_CONFIRMED'
  | 'AT_HUB' | 'DISPATCHED' | 'DELIVERED';
export type PaymentStatus = 'UNPAID' | 'PAID';
export type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  gardenAddress: string;
}
export interface Customer {
  id: string;
  businessName: string;
  phone: string;
  taxCode?: string;
  deliveryAddressIds: string[];
}
export interface DeliveryAddress {
  id: string;
  customerId: string;
  label: string;
  address: string;
  deliveryZone: string;
}
export interface ProductListing {
  id: string;
  supplierId: string;
  name: string;
  variety?: string;
  unit: 'kg';
  availableKg: number;
  basePricePerKg: number; // PRIVATE: supplier + admin only
  imageUrl?: string;
  active: boolean;
}
export interface CustomerProduct {
  id: string;
  name: string;
  variety?: string;
  unit: 'kg';
  availableKg: number;
  sellingPricePerKg: number; // no basePricePerKg
  imageUrl?: string;
}
export interface OrderItem {
  productId: string;
  productName: string;
  quantityKg: number;
  unitPriceVnd: number; // snapshot public selling price
  lineTotalVnd: number;
}
export interface Order {
  id: string;
  customerId: string;
  deliveryAddressId: string;
  items: OrderItem[];
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  placedAt: string;
}
export interface CheckoutQuote {
  items: OrderItem[];
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
}
export interface DemandLine {
  productId: string;
  productName: string;
  supplierId: string;
  quantityKg: number;
  orderIds: string[];
}
export interface SupplierConfirmation {
  supplierId: string;
  confirmedAt: string;
  vehiclePlate?: string;
  estimatedArrivalAt?: string;
}
export interface Shipment {
  id: string;
  orderIds: string[];
  routeLabel: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  status: ShipmentStatus;
  trackingLabel?: string; // demo text, NOT real GPS URL
}
export interface PricingRule {
  mode: 'PERCENT' | 'FIXED_VND_PER_KG';
  value: number;
}
export interface NewOrderInput {
  customerId: string;
  deliveryAddressId: string;
  items: { productId: string; quantityKg: number }[];
}
export interface NewProductInput {
  supplierId: string;
  name: string;
  variety?: string;
  availableKg: number;
  basePricePerKg: number;
  imageUrl?: string;
}
```

## 3. Mock service API — tên hàm không tự ý đổi

```ts
// src/services/demoService.ts
export async function getDemoRole(): Promise<Role>;
export async function setDemoRole(role: Role): Promise<void>;
export async function resetDemoData(): Promise<void>;

// Supplier
export async function getSupplierListings(supplierId: string): Promise<ProductListing[]>;
export async function createProduct(input: NewProductInput): Promise<ProductListing>;
export async function getSupplierDemand(supplierId: string): Promise<DemandLine[]>;
export async function confirmSupplierDemand(input: {
  supplierId: string;
  vehiclePlate?: string;
  estimatedArrivalAt?: string;
}): Promise<SupplierConfirmation>;

// Customer
export async function getCustomerCatalog(): Promise<CustomerProduct[]>;
export async function getDeliveryAddresses(customerId: string): Promise<DeliveryAddress[]>;
export async function quoteCheckout(input: NewOrderInput): Promise<CheckoutQuote>;
export async function placeOrder(input: NewOrderInput): Promise<Order>;
export async function getCustomerOrders(customerId: string): Promise<Order[]>;

// Admin
export async function getPricingRule(): Promise<PricingRule>;
export async function updatePricingRule(rule: PricingRule): Promise<PricingRule>;
export async function getAllOrders(): Promise<Order[]>;
export async function aggregateDemand(): Promise<DemandLine[]>;
export async function advanceOrderStatus(orderId: string, next: OrderStatus): Promise<Order>;
export async function getShipments(): Promise<Shipment[]>;
export async function assignDemoShipment(input: {
  orderIds: string[];
  routeLabel: string;
}): Promise<Shipment>;
export async function advanceShipmentStatus(id: string, next: ShipmentStatus): Promise<Shipment>;
```

`aggregateDemand()` cần làm rõ side effect: **[PROPOSAL]** lần đầu gọi sẽ đánh dấu các order `PLACED` thành `AGGREGATED`; những lần gọi tiếp phải idempotent, không nhân đôi demand.

## 4. Seed demo dùng xuyên suốt
**[PROPOSAL]** Ít nhất 2 nhà vườn, 2 quán, 3 mặt hàng và 2 địa chỉ giao; ví dụ bơ 034, xoài, thanh long. Có sản phẩm giá sỉ và tồn kho cụ thể để chứng minh giá bán != giá gốc. Không hardcode dashboard count độc lập với orders.

Ví dụ minh họa từ nguồn: Bơ 034 tồn 500kg, giá gốc 20.000đ/kg; giá công khai 26.000đ/kg. **[SOURCE: dữ liệu ví dụ, không phải giá thực tế/markup chính sách]**.

## 5. Đồng bộ, lưu trữ và giới hạn
**[PROPOSAL]** Codex tạo một store duy nhất với localStorage version key `b2b-demo-v1`; các hàm service đều đọc/ghi từ state chung và phát thông báo cập nhật để React tự refresh view trong cùng tab. Nếu dùng Zustand, thiết lập persist và selectors; nếu không, dùng React context + subscribe cơ bản. Không phụ thuộc 2 dev server riêng để chia sẻ localStorage: mỗi origin/port có storage khác nhau. Chỉ test luồng 3 vai trò trên **bản tích hợp `main` chạy một origin**.

## 6. Quy định bảo trì contract
- Nếu cần đổi tên type, trường hoặc hàm: tạo đề nghị thay đổi trong PR/commit và báo agent còn lại; cập nhật contract trên main trước, rồi mới sync.
- Không import nội bộ store trực tiếp từ UI khi đã có service tương đương.
- API trả lỗi có message rõ để FE hiện validation; không bắt UI đoán cấu trúc lỗi.
