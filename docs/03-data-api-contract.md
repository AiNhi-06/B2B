# 03 — Shared Data / Mock API Contract (v2)

**TRẠNG THÁI: Frontend Agent và Workflow Agent đã thống nhất; Integrator phê duyệt khi đưa bản này vào main.**

Tài liệu này thay thế toàn bộ contract v1 và các bản đề xuất bổ sung trước đó. Đây là hợp đồng kỹ thuật cho prototype giả lập, không phải chính sách vận hành thực tế.

## 1. Phạm vi và quyền sở hữu

- Stack: React + Vite + TypeScript.
- Chỉ sử dụng mock data, mock services và state trong trình duyệt.
- Không có backend, database, OTP, thanh toán, GPS hoặc API vận chuyển thật.
- Workflow Agent sở hữu `src/types/`, `src/services/`, `src/mocks/`, `src/store/`.
- Frontend Agent sở hữu UI và các hooks phục vụ UI; không tạo mock service hoặc types nghiệp vụ riêng.
- Integrator sở hữu App, router, dependencies, configs, tài liệu và tích hợp trên `main`.
- UI không đọc/ghi store nội bộ trực tiếp khi đã có service tương đương.

### Đường dẫn exports

- Toàn bộ types được export từ `src/types/index.ts`.
- Toàn bộ hàm trong mục 3, gồm `isServiceError`, được export từ `src/services/demoService.ts`.

## 2. Quy ước dữ liệu và Types

- Tiền dùng VND, kiểu `number` nguyên, hữu hạn và không âm.
- Khối lượng dùng kg nguyên trong MVP.
- Số lượng đặt phải lớn hơn 0; tồn kho có thể bằng 0.
- Thời gian dùng ISO 8601 string; UI hiển thị theo `Asia/Ho_Chi_Minh`.
- IDs là chuỗi ổn định; seed cố định để demo tái lập được.
- `CustomerProduct` không chứa `basePricePerKg`. UI khách không hiển thị giá gốc.
- Phân vai demo không phải cơ chế bảo mật production.
- Services trả dữ liệu tách khỏi state nội bộ; UI không thể sửa store bằng cách thay đổi object trả về.

```ts
export type Role = 'SUPPLIER' | 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PLACED'
  | 'AGGREGATED'
  | 'SUPPLIER_CONFIRMED'
  | 'AT_HUB'
  | 'DISPATCHED'
  | 'DELIVERED';

export type PaymentStatus = 'UNPAID' | 'PAID';

export type ShipmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export interface DemoSession {
  role: Role;
  activeSupplierId?: string;
  activeCustomerId?: string;
}

export type DemoEventType =
  | 'DATA_CHANGED'
  | 'SESSION_CHANGED'
  | 'RESET';

export interface DemoDataEvent {
  type: DemoEventType;
}

export type ServiceErrorCode =
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_STATUS_TRANSITION'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND';

export interface ServiceError extends Error {
  code: ServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

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
  basePricePerKg: number;
  imageUrl?: string;
  active: boolean;
}

export interface CustomerProduct {
  id: string;
  name: string;
  variety?: string;
  unit: 'kg';
  availableKg: number;
  sellingPricePerKg: number;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantityKg: number;
  unitPriceVnd: number;
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
  orderIds: string[];
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
  trackingLabel?: string;
}

export interface PricingRule {
  mode: 'PERCENT' | 'FIXED_VND_PER_KG';
  value: number;
}

export interface NewOrderInput {
  customerId: string;
  deliveryAddressId: string;
  items: {
    productId: string;
    quantityKg: number;
  }[];
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

## 3. Public Mock Service API

Các chữ ký dưới đây mô tả API; không phải mã triển khai. Các hàm bất đồng bộ trả `Promise`, không gọi HTTP thật.

```ts
// src/services/demoService.ts

// Session và tài khoản
export async function getDemoSession(): Promise<DemoSession>;
export async function setDemoSession(
  session: Partial<DemoSession>
): Promise<void>;
export async function getSuppliers(): Promise<Supplier[]>;
export async function getCustomers(): Promise<Customer[]>;

// Tương thích API v1; dùng cùng DemoSession
export async function getDemoRole(): Promise<Role>;
export async function setDemoRole(role: Role): Promise<void>;

// Reactivity, reset và lỗi
export function subscribeDemoData(
  listener: (event: DemoDataEvent) => void
): () => void;

export function isServiceError(
  error: unknown
): error is ServiceError;

export async function resetDemoData(): Promise<void>;

// Nhà vườn
export async function getSupplierListings(
  supplierId: string
): Promise<ProductListing[]>;

export async function createProduct(
  input: NewProductInput
): Promise<ProductListing>;

export async function getSupplierDemand(
  supplierId: string
): Promise<DemandLine[]>;

export async function confirmSupplierDemand(input: {
  supplierId: string;
  orderIds: string[];
  vehiclePlate?: string;
  estimatedArrivalAt?: string;
}): Promise<SupplierConfirmation>;

// Khách B2B
export async function getCustomerCatalog(): Promise<CustomerProduct[]>;

export async function getDeliveryAddresses(
  customerId: string
): Promise<DeliveryAddress[]>;

export async function quoteCheckout(
  input: NewOrderInput
): Promise<CheckoutQuote>;

export async function placeOrder(
  input: NewOrderInput
): Promise<Order>;

export async function getCustomerOrders(
  customerId: string
): Promise<Order[]>;

export async function getShipmentByOrderId(
  orderId: string
): Promise<Shipment | null>;

// Admin / Hub
export async function getPricingRule(): Promise<PricingRule>;

export async function updatePricingRule(
  rule: PricingRule
): Promise<PricingRule>;

export async function getAllOrders(): Promise<Order[]>;

export async function aggregateDemand(): Promise<DemandLine[]>;

export async function advanceOrderStatus(
  orderId: string,
  next: OrderStatus
): Promise<Order>;

export async function getSupplierConfirmations():
  Promise<SupplierConfirmation[]>;

export async function getShipments(): Promise<Shipment[]>;

export async function assignDemoShipment(input: {
  orderIds: string[];
  routeLabel: string;
}): Promise<Shipment>;

export async function advanceShipmentStatus(
  id: string,
  next: ShipmentStatus
): Promise<Shipment>;
```

## 4. Session và Reactivity

### Session

- Seed có `role: 'SUPPLIER'`, `activeSupplierId: 'supplier-1'` và `activeCustomerId: 'customer-1'`.
- Đổi role giữ nguyên hai ID đang chọn.
- `setDemoSession()` chỉ cập nhật các trường được cung cấp, kiểm tra role/ID hợp lệ và cập nhật nguyên tử.
- Không chấp nhận xóa ID đang chọn bằng giá trị `undefined` được truyền tường minh.
- `getDemoRole()` và `setDemoRole()` đọc/ghi cùng session.
- UI lấy danh sách tài khoản qua `getSuppliers()` và `getCustomers()`.

### Events

- Phát event sau khi state đã cập nhật thành công và trước khi Promise của thao tác hoàn tất.
- Không phát event khi thao tác thất bại hoặc không thay đổi dữ liệu.
- Ngoại lệ: reset thành công luôn phát `RESET`.
- Đổi session phát `SESSION_CHANGED`; cập nhật nghiệp vụ phát `DATA_CHANGED`.
- `subscribeDemoData()` trả hàm unsubscribe, không gọi listener ngay lúc đăng ký.
- Listener không nhận state nội bộ; UI gọi lại service để lấy dữ liệu.

| Event | Hành vi UI |
|---|---|
| `RESET` | Xóa giỏ, form, modal và state cục bộ; tải lại seed |
| `SESSION_CHANGED` | Chuyển/xóa giỏ theo tài khoản; tải lại view |
| `DATA_CHANGED` | Giữ giỏ/form đang soạn; tải lại dữ liệu service |

UI đăng ký listener trước lần tải đầu, cleanup khi unmount và bỏ qua kết quả request cũ khi tài khoản đã đổi.

## 5. Giá, tồn kho và checkout

### Giá và phí

- Chỉ áp dụng một chế độ markup:
  - `PERCENT`: `Math.round(basePricePerKg * (1 + value / 100))`.
  - `FIXED_VND_PER_KG`: `basePricePerKg + value`.
- `value` hữu hạn, không âm; chế độ cộng VND yêu cầu số nguyên.
- Catalog chỉ trả listing đang `active`; có thể trả sản phẩm hết tồn để UI hiển thị hết hàng.
- Phí giao lấy từ fixture theo địa chỉ/zone, không tính GPS hoặc gọi hãng vận chuyển.
- Không có fixture phù hợp thì trả lỗi, không tự mặc định miễn phí.

### Tồn kho

- `availableKg` là tồn còn có thể đặt.
- Giỏ hàng và `quoteCheckout()` không giữ/trừ tồn.
- `placeOrder()` kiểm tra tồn, trừ tồn và tạo đơn trong một cập nhật nguyên tử.
- Chuyển trạng thái, gom đơn, xác nhận cung ứng hoặc giao hàng không trừ tồn thêm.
- Không có luồng hủy/hoàn tồn ở v2.

### Validation và tạo đơn

- Giỏ phải có ít nhất một dòng.
- Các dòng cùng `productId` được gộp trước khi kiểm tra tồn và tính tiền.
- Số lượng là kg nguyên dương; sản phẩm phải tồn tại và đang active.
- Khách phải tồn tại; địa chỉ phải thuộc khách đặt.
- `placeOrder()` tính lại giá và phí hiện tại; không bảo đảm giữ nguyên quote trước đó.
- Tạo đơn ở `PLACED`, thanh toán ở `UNPAID`.
- Snapshot tên sản phẩm, đơn giá bán, tiền dòng và phí vào đơn.
- Đơn cũ không thay đổi khi sửa markup.
- Không lưu snapshot tồn kho trong `Order`.

Công thức:

- `lineTotalVnd = quantityKg * unitPriceVnd`.
- `subtotalVnd = tổng lineTotalVnd`.
- `totalVnd = subtotalVnd + shippingFeeVnd`.

UI checkout hiển thị: **“Giá và phí được tính lại khi xác nhận đặt hàng.”** Kết quả đặt thành công hiển thị tổng từ `Order` trả về.

## 6. Gom đơn và xác nhận cung ứng

### Gom nhu cầu

- `aggregateDemand()` chuyển toàn bộ đơn `PLACED` hiện có sang `AGGREGATED`.
- Trả toàn bộ nhu cầu đang xử lý từ các trạng thái:
  `AGGREGATED`, `SUPPLIER_CONFIRMED`, `AT_HUB`, `DISPATCHED`.
- Không tính đơn `DELIVERED`.
- Gom theo `productId`; `quantityKg` bằng tổng số kg tương ứng; `orderIds` không trùng.
- Gọi lại khi dữ liệu không đổi không nhân đôi demand, không ghi state và không phát event.
- `getSupplierDemand()` đọc cùng tập nhu cầu, lọc theo nhà vườn và không tự gom đơn mới.

### Xác nhận

- Frontend truyền `orderIds` không rỗng, không trùng từ bảng demand.
- Mỗi đơn phải tồn tại, đã gom và có sản phẩm của nhà vườn xác nhận.
- Xác nhận chỉ áp dụng cho sản phẩm của nhà vườn đó trong các đơn được chọn.
- Xác nhận lưu cố định `orderIds`, thời gian và thông tin xe.
- Đơn mới không hưởng xác nhận cũ.
- Đơn nhiều nhà vườn chỉ sang `SUPPLIER_CONFIRMED` khi tất cả nhà vườn liên quan đã xác nhận.
- Gửi lại cùng tập đơn và cùng thông tin xác nhận trả kết quả đã lưu, không tạo bản sao.
- Không ghi đè hoặc xóa xác nhận của đợt trước.
- `getSupplierConfirmations()` trả các xác nhận đã lưu để Admin xem.

## 7. Trạng thái đơn và chuyến giao

### Đơn hàng

Chuỗi trạng thái:

`PLACED → AGGREGATED → SUPPLIER_CONFIRMED → AT_HUB → DISPATCHED → DELIVERED`

- Không chuyển lùi hoặc bỏ bước.
- `PLACED → AGGREGATED` thực hiện bằng `aggregateDemand()`.
- `AGGREGATED → SUPPLIER_CONFIRMED` thực hiện qua xác nhận nhà vườn.
- Admin dùng `advanceOrderStatus()` để xác nhận `SUPPLIER_CONFIRMED → AT_HUB`.
- Hai bước giao hàng thực hiện qua shipment.
- `advanceOrderStatus()` không được bỏ qua các điều kiện nghiệp vụ trên.

### Chuyến giao

- `assignDemoShipment()` yêu cầu danh sách đơn không rỗng, không trùng và `routeLabel` không rỗng.
- Chỉ nhận đơn `AT_HUB`, chưa thuộc chuyến nào.
- Chuyến tạo mới ở `ASSIGNED`; `PENDING` được giữ trong type nhưng chưa có flow tạo ở v2.
- Chuyển tuần tự: `ASSIGNED → IN_TRANSIT → DELIVERED`.
- `IN_TRANSIT` đồng thời chuyển toàn bộ đơn sang `DISPATCHED`.
- `DELIVERED` đồng thời chuyển toàn bộ đơn sang `DELIVERED`.
- Cập nhật chuyến và đơn nguyên tử: thành công toàn bộ hoặc không đổi.
- Đơn đã gán chuyến bị khóa chuyển trạng thái riêng.
- Không có flow tách chuyến, gán lại hoặc giao từng phần ở v2.
- Yêu cầu lại trạng thái hiện tại trả dữ liệu hiện tại, không ghi state hay phát event.

`getShipmentByOrderId()`:

- Trả shipment nếu đơn đã được gán.
- Trả `null` nếu đơn tồn tại nhưng chưa có chuyến.
- Reject `NOT_FOUND` nếu đơn không tồn tại.

Thông tin tài xế và `trackingLabel` chỉ là dữ liệu demo. Không dùng link GPS thật.

## 8. Lỗi service

Lỗi nghiệp vụ dự kiến reject bằng `ServiceError`, có thông báo tiếng Việt.

| Code | Trường hợp |
|---|---|
| `VALIDATION_ERROR` | Input sai, địa chỉ không thuộc khách, sản phẩm không active |
| `NOT_FOUND` | ID được tham chiếu không tồn tại |
| `INSUFFICIENT_STOCK` | Tổng kg yêu cầu vượt tồn |
| `INVALID_STATUS_TRANSITION` | Sai bước hoặc chưa đủ điều kiện chuyển trạng thái |

`details` có thể chứa:

- Tồn kho: `productId`, `requestedKg`, `availableKg`.
- Trạng thái: `entityId`, `currentStatus`, `requestedStatus`.
- Form: `field`.

UI dùng `isServiceError()` và `code`, không phân tích chuỗi message; có thông báo dự phòng cho lỗi không xác định.

## 9. Lưu trữ và reset

- Một store chung, persistence bằng key `b2b-demo-v1`.
- Bao gồm session, tài khoản, địa chỉ, listings, markup, orders, confirmations và shipments.
- Refresh trên cùng origin giữ dữ liệu.
- Các dev server khác origin/port không chia sẻ localStorage.
- Kiểm thử xuyên ba vai trò trên bản tích hợp chạy một origin.
- Không hardcode dashboard count độc lập với state.

`resetDemoData()`:

- Khôi phục toàn bộ seed và session ban đầu.
- Ghi đè riêng `b2b-demo-v1`, không gọi `localStorage.clear()`.
- Phát `RESET` trước khi Promise hoàn tất.
- Không cần reload trang.

## 10. Seed và hiển thị demo

| Đối tượng | ID | Liên kết |
|---|---|---|
| Nhà vườn Chú Sáu | `supplier-1` | — |
| Hợp tác xã Miền Tây | `supplier-2` | — |
| Quán Cà phê The Bean | `customer-1` | — |
| Nước ép Fresh Garden | `customer-2` | — |
| 123 Nguyễn Huệ, Q.1 | `address-1` | `customer-1` |
| 456 Lê Duẩn, Q.1 | `address-2` | `customer-2` |
| Bơ 034 | `avocado-034` | `supplier-1` |
| Xoài Cát Hòa Lộc | `mango-cat-hoa-loc` | `supplier-1` |
| Thanh long ruột đỏ | `dragon-fruit` | `supplier-2` |

- Seed ban đầu chưa có orders, confirmations hoặc shipments.
- Bơ có tồn 500kg, giá gốc 20.000đ/kg.
- Markup ban đầu 30%, cho giá bán bơ 26.000đ/kg.
- Đây là số liệu demo, không phải giá hoặc chính sách kinh doanh thực tế.
- Các fixture còn lại cố định và được công bố khi bàn giao.
- `imageUrl` để `undefined`; Frontend dùng SVG/ảnh local.
- Không phát sinh request mạng để vận hành luồng demo.

Nhãn bắt buộc:

- Toàn ứng dụng: **“Demo mode — dữ liệu giả lập”**.
- Phí giao: **“Phí vận chuyển ước tính (dữ liệu demo)”**.
- QR/tem: **“QR demo — không dùng để quét thực tế”**.
- Theo dõi giao: ghi rõ hành trình và tài xế mô phỏng.

QR/tem là visual UI từ dữ liệu đơn, không có API quét/in thật. Widget giai đoạn là state UI phục vụ thuyết trình, không đổi trạng thái nghiệp vụ hoặc khóa chức năng theo giờ; reset đưa widget về giai đoạn đầu.

## 11. Giới hạn v2

- Không triển khai hủy, hoàn tiền, thiếu hàng, giao lỗi, giao từng phần hoặc tối ưu tuyến.
- `PaymentStatus` được giữ trong model; chưa có API mô phỏng thanh toán, đơn mới ở `UNPAID`.
- Khiếu nại, chỉnh sửa hồ sơ, video và thông tin ngân hàng chưa có API trong contract này.
- Không tự diễn giải tiền đơn thành doanh thu đã thu hoặc lợi nhuận.
- Thay đổi type, field, chữ ký hoặc quy tắc nghiệp vụ phải cập nhật contract và thông báo hai agent trước khi triển khai.

## 12. Kiểm tra nghiệm thu

- Hai quán đặt bơ 30kg và 20kg tạo demand 50kg; gom lại không nhân đôi.
- Tồn bơ còn 450kg; chuyển trạng thái không trừ thêm.
- Sửa markup cập nhật catalog nhưng không đổi đơn cũ.
- Không có giá gốc trong `CustomerProduct`.
- Chặn kg không hợp lệ, sai địa chỉ, vượt tồn và chuyển trạng thái sai.
- Đơn nhiều nhà vườn cần đủ xác nhận trước khi nhập Hub.
- Chuyến giao đồng bộ trạng thái đơn và hiển thị đúng trong lịch sử khách.
- Refresh giữ dữ liệu; reset khôi phục seed và xóa state UI cục bộ.
- Build thành công và smoke test ba vai trò trên một origin tại `main`.