Dưới đây là **Bản nội dung hoàn chỉnh của các thỏa thuận cần cập nhật** để **Người Tích Hợp (Integrator)** đưa trực tiếp vào tài liệu [03-data-api-contract.md](file:///e:/PROJECT/B2B-Frontend/docs/03-data-api-contract.md) trên nhánh `main`:

---

# TỔNG HỢP NỘI DUNG CẬP NHẬT HỢP ĐỒNG TÍCH HỢP (v2 Proposal)

## 1. Cập nhật Type Definitions (`src/types/`)

### 1.1 Bổ sung Quản lý Session & Danh tính Demo
```ts
export interface DemoSession {
  role: Role;
  activeSupplierId?: string; // Mặc định trong seed: 'supplier-1'
  activeCustomerId?: string; // Mặc định trong seed: 'customer-1'
}
```

### 1.2 Bổ sung Chuẩn hóa Lỗi Service
```ts
export type ServiceErrorCode =
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_STATUS_TRANSITION'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND';

export interface ServiceError extends Error {
  code: ServiceErrorCode;
  message: string; // Thông báo tiếng Việt hiển thị cho người dùng
  details?: Record<string, unknown>; // vd: { productId, requestedKg, availableKg }
}

export function isServiceError(error: unknown): error is ServiceError;
```

### 1.3 Bổ sung Phản ứng Dữ liệu (Reactivity Event)
```ts
export type DemoEventType = 'DATA_CHANGED' | 'SESSION_CHANGED' | 'RESET';

export interface DemoDataEvent {
  type: DemoEventType;
}
```

### 1.4 Cập nhật `SupplierConfirmation` (Gắn kết với đơn đã gom)
```ts
export interface SupplierConfirmation {
  supplierId: string;
  orderIds: string[]; // Bổ sung: Danh sách orderIds thuộc đợt gom mà nhà vườn xác nhận
  confirmedAt: string;
  vehiclePlate?: string;
  estimatedArrivalAt?: string;
}
```

---

## 2. Cập nhật Danh mục Mock Services (`src/services/demoService.ts`)

```ts
// ==================== SESSION & TÀI KHOẢN ====================
export async function getDemoSession(): Promise<DemoSession>;
export async function setDemoSession(session: Partial<DemoSession>): Promise<void>;
export async function getSuppliers(): Promise<Supplier[]>;
export async function getCustomers(): Promise<Customer[]>;

// Giữ lại để tương thích ngược (đọc/ghi từ cùng DemoSession)
export async function getDemoRole(): Promise<Role>;
export async function setDemoRole(role: Role): Promise<void>;

// ==================== STORE REACTIVITY & RESET ====================
export function subscribeDemoData(listener: (event: DemoDataEvent) => void): () => void;
export async function resetDemoData(): Promise<void>;

// ==================== SUPPLIER ====================
export async function getSupplierListings(supplierId: string): Promise<ProductListing[]>;
export async function createProduct(input: NewProductInput): Promise<ProductListing>;
export async function getSupplierDemand(supplierId: string): Promise<DemandLine[]>;
export async function confirmSupplierDemand(input: {
  supplierId: string;
  orderIds: string[]; // Bổ sung: truyền tập orderIds đang xác nhận
  vehiclePlate?: string;
  estimatedArrivalAt?: string;
}): Promise<SupplierConfirmation>;

// ==================== CUSTOMER ====================
export async function getCustomerCatalog(): Promise<CustomerProduct[]>;
export async function getDeliveryAddresses(customerId: string): Promise<DeliveryAddress[]>;
export async function quoteCheckout(input: NewOrderInput): Promise<CheckoutQuote>;
export async function placeOrder(input: NewOrderInput): Promise<Order>;
export async function getCustomerOrders(customerId: string): Promise<Order[]>;
export async function getShipmentByOrderId(orderId: string): Promise<Shipment | null>; // Bổ sung

// ==================== ADMIN ====================
export async function getPricingRule(): Promise<PricingRule>;
export async function updatePricingRule(rule: PricingRule): Promise<PricingRule>;
export async function getAllOrders(): Promise<Order[]>;
export async function aggregateDemand(): Promise<DemandLine[]>;
export async function advanceOrderStatus(orderId: string, next: OrderStatus): Promise<Order>;
export async function getSupplierConfirmations(): Promise<SupplierConfirmation[]>; // Bổ sung
export async function getShipments(): Promise<Shipment[]>;
export async function assignDemoShipment(input: {
  orderIds: string[];
  routeLabel: string;
}): Promise<Shipment>;
export async function advanceShipmentStatus(id: string, next: ShipmentStatus): Promise<Shipment>;
```

---

## 3. Quy ước Nghiệp vụ & Hành vi Chi tiết (Invariants & Rules)

### 3.1 Về Session & Danh tính
- Seed ban đầu luôn có `activeSupplierId: 'supplier-1'` và `activeCustomerId: 'customer-1'` hợp lệ.
- Khi đổi `role`, hai ID trên được giữ nguyên trong session.
- `setDemoSession()` kiểm tra ID hợp lệ và cập nhật nguyên tử.
- UI lấy danh sách từ `getSuppliers()` và `getCustomers()`, không hardcode ID người dùng.

### 3.2 Về Store Reactivity & Quản lý State UI
- `subscribeDemoData` phát event sau mỗi cập nhật state thành công (không phát khi lỗi hoặc dữ liệu không đổi).
- Hành vi của UI theo từng event:
  - `RESET`: Xóa sạch giỏ hàng, form nhập, modal và local state; refetch dữ liệu seed.
  - `SESSION_CHANGED`: Phân tách/chuyển đổi giỏ hàng theo tài khoản khách mới; refetch view.
  - `DATA_CHANGED`: Giữ nguyên form/giỏ hàng đang soạn, refetch lại dữ liệu từ service.

### 3.3 Về Đặt hàng & Tính giá (`placeOrder`)
- `placeOrder()` **kiểm tra tồn kho khả dụng** trước khi ghi nhận đơn.
- Tính lại giá bán lẻ và phí vận chuyển tại thời điểm đặt, lưu snapshot giá/phí vào `Order` (không lưu snapshot tồn kho trong `Order`).
- Nếu tồn không đủ, reject với `INSUFFICIENT_STOCK`.
- UI hiển thị cảnh báo tại trang checkout: *"Giá và phí được tính lại khi xác nhận đặt hàng."*

### 3.4 Về Gom đơn (`aggregateDemand`)
- Chuyển toàn bộ đơn có trạng thái `PLACED` thành `AGGREGATED`.
- Trả về toàn bộ nhu cầu đang xử lý (tính từ các đơn: `AGGREGATED`, `SUPPLIER_CONFIRMED`, `AT_HUB`, `DISPATCHED`).
- Loại trừ đơn `DELIVERED`.
- Tính idempotent: Gọi nhiều lần khi không có đơn mới sẽ trả kết quả giống nhau, không ghi đè state và không nhân đôi số lượng.
- `getSupplierDemand(supplierId)` lọc nhu cầu theo nhà vườn từ cùng tập dữ liệu này.

### 3.5 Về Xác nhận Cung ứng (`confirmSupplierDemand`)
- Mỗi xác nhận gắn cố định với danh sách `orderIds` tại thời điểm xác nhận. Đơn gom mới phát sinh sau đó cần đợt xác nhận mới.
- Đơn hàng gồm sản phẩm từ nhiều nhà vườn chỉ chuyển sang `SUPPLIER_CONFIRMED` khi **tất cả** nhà vườn liên quan đã hoàn tất xác nhận.

### 3.6 Về Đồng bộ Chuyến xe (`Shipment`) và Đơn hàng (`Order`)
- Chỉ cho phép gán vào chuyến xe đối với các đơn đang ở trạng thái `AT_HUB` và chưa thuộc chuyến nào.
- Trạng thái khởi tạo của chuyến là `ASSIGNED`.
- Chuyển `Shipment` sang `IN_TRANSIT` $\rightarrow$ Tự động chuyển tất cả các đơn liên quan sang `DISPATCHED`.
- Chuyển `Shipment` sang `DELIVERED` $\rightarrow$ Tự động chuyển tất cả các đơn liên quan sang `DELIVERED`.
- Các cập nhật đồng bộ này là nguyên tử (atomic: thành công toàn bộ hoặc không đổi).
- Đơn đã gán chuyến bị khóa thao tác chuyển trạng thái lẻ từ Admin; bắt buộc điều khiển thông qua trạng thái của chuyến xe.
- `getShipmentByOrderId(orderId)`:
  - Trả về đối tượng `Shipment` nếu đơn đã được gán chuyến.
  - Trả về `null` nếu đơn tồn tại nhưng chưa gán chuyến.
  - Reject `NOT_FOUND` nếu mã `orderId` không tồn tại trong hệ thống.

### 3.7 Về Reset Dữ liệu (`resetDemoData`)
- Ghi đè toàn bộ state về seed ban đầu trên duy nhất key `b2b-demo-v1`. Không dùng `localStorage.clear()`.
- Phát thông báo `{ type: 'RESET' }` trước khi hoàn tất Promise.
- Không yêu cầu `window.location.reload()`.

---

## 4. Bảng Định Danh Hạt Giống (Seed Data Fixture) & Offline Ready

| Loại thực thể | ID cố định | Tên / Mô tả | Thuộc về |
|---|---|---|---|
| Nhà vườn 1 | `supplier-1` | Nhà vườn Chú Sáu | — |
| Nhà vườn 2 | `supplier-2` | Hợp tác xã Miền Tây | — |
| Khách B2B 1 | `customer-1` | Quán Cà phê The Bean | — |
| Khách B2B 2 | `customer-2` | Chuỗi Nước ép Fresh Garden | — |
| Địa chỉ 1 | `address-1` | 123 Nguyễn Huệ, Q.1 | `customer-1` |
| Địa chỉ 2 | `address-2` | 456 Lê Duẩn, Q.1 | `customer-2` |
| Mặt hàng 1 | `avocado-034` | Bơ 034 (Tồn 500kg, Gốc 20k, Bán 26k) | `supplier-1` |
| Mặt hàng 2 | `mango-cat-hoa-loc` | Xoài Cát Hòa Lộc | `supplier-1` |
| Mặt hàng 3 | `dragon-fruit` | Thanh long ruột đỏ | `supplier-2` |

- **Offline v1:** Toàn bộ `imageUrl` để `undefined`. Frontend sẽ dùng icon/ảnh SVG nội bộ, đảm bảo prototype chạy 100% không cần kết nối mạng.
- **Nhãn hiển thị demo:**
  - Tem QR / Nhãn thùng: Nhãn rõ ràng **"QR demo — không dùng để quét thực tế"**.
  - Phí vận chuyển: Ghi chú **"Phí vận chuyển ước tính (dữ liệu demo)"**.
  - Widget thời gian (Phase Advancer): Widget thuần UI điều khiển luồng kịch bản demo thuyết trình.