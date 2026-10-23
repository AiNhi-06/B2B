# FARMGO — Đề xuất contract v3 cho luồng mua bán chính

**Trạng thái: [PROPOSAL] bản nháp để review. Chưa thay thế `03-data-api-contract.md` và chưa được triển khai.**

Phạm vi bản nháp là đợt 2 của [kế hoạch đã thống nhất](06-farmgo-approved-scope.md). Tên type/API dưới đây là đề xuất thay đổi được công bố rõ, không phải export đã tồn tại.

## 1. Thay đổi so với v2

| V2 | Đề xuất v3 |
|---|---|
| Giá gốc bảo mật + `PricingRule` | Một `publicPricePerKg` do NCC khai báo, công khai cho cả ba vai trò |
| `CustomerProduct` không có NCC | Trả thông tin NCC công khai, không kèm dữ liệu hồ sơ nội bộ |
| Nhóm hàng chưa có | Thêm nhóm hàng và công dụng độc lập |
| Listing là sản phẩm theo NCC | Giữ listing; thêm `commodityId` để nhóm cùng mặt hàng từ nhiều NCC |
| Chỉ tạo sản phẩm | Thêm cập nhật giá, ảnh, tồn và `active`; không hard-delete |
| Đơn lưu giá và tên sản phẩm | Bổ sung snapshot NCC để không phụ thuộc catalog đang active |

Không thêm thuế, Escrow, ví, khiếu nại, SQS, QC approval hoặc luồng giao thẳng trong bản này.

## 2. Mô hình dữ liệu đề xuất

Giữ các quy ước VND nguyên, kg nguyên, ISO 8601 và ID ổn định của v2. Giữ `Role`, `DemoSession`, `ServiceError`, event, status order/shipment hiện tại.

```ts
export type ProductCategory = 'VEGETABLES' | 'FRESH_FRUIT';
export type ProductUse = 'JUICE' | 'SMOOTHIE' | 'KITCHEN' | 'FRESH';

export interface Commodity {
  id: string;
  name: string; // Ví dụ “Xoài Cát Hòa Lộc”; không gộp mọi giống xoài mặc định
  category: ProductCategory;
}

export interface SupplierPublicProfile {
  id: string;
  name: string;
  regionLabel?: string;
}

export interface FarmgoProductListing {
  id: string; // listing ID riêng cho từng NCC; được dùng trong order.items.productId
  supplierId: string;
  commodityId: string;
  name: string;
  variety?: string;
  unit: 'kg';
  availableKg: number;
  publicPricePerKg: number;
  imageUrl?: string;
  uses: ProductUse[];
  originLabel?: string;
  packagingLabel?: string; // Mô tả, chưa là quy tắc bội số đặt hàng
  active: boolean;
}

export interface FarmgoCustomerProduct extends FarmgoProductListing {
  category: ProductCategory; // Lấy từ Commodity, không lưu giá trị mâu thuẫn
  supplier: SupplierPublicProfile;
}

export interface NewFarmgoProductInput {
  supplierId: string;
  commodityId: string;
  name: string;
  variety?: string;
  availableKg: number;
  publicPricePerKg: number;
  imageUrl?: string;
  uses: ProductUse[];
  originLabel?: string;
  packagingLabel?: string;
}

export interface UpdateFarmgoProductInput {
  supplierId: string;
  productId: string;
  changes: Partial<Pick<FarmgoProductListing,
    'name' | 'variety' | 'availableKg' | 'publicPricePerKg' |
    'imageUrl' | 'uses' | 'originLabel' | 'packagingLabel' | 'active'>>;
}
```

Các tên `Farmgo*` trong nháp giúp phân biệt với types đang chạy. Khi review cần quyết định thay thế type cũ hay giữ adapter; không triển khai đồng thời hai store/business model.

Không dùng thông tin chứng nhận, địa chỉ cá nhân, điện thoại hay MST từ `Supplier` để tự tạo dấu “đã xác minh”. Hồ sơ doanh nghiệp và dữ liệu công khai cần được định nghĩa ở đợt 3.

## 3. API đề xuất

Các chữ ký sau bổ sung/thay thế API sản phẩm; các API order, session và shipment giữ nguyên tên v2 trừ dữ liệu snapshot bổ sung.

```ts
export async function getCommodities(): Promise<Commodity[]>;
export async function getSupplierPublicProfiles(): Promise<SupplierPublicProfile[]>;
export async function getSupplierListings(supplierId: string): Promise<FarmgoProductListing[]>;
export async function getCustomerCatalog(): Promise<FarmgoCustomerProduct[]>;
export async function getCustomerProduct(productId: string): Promise<FarmgoCustomerProduct>;
export async function createProduct(input: NewFarmgoProductInput): Promise<FarmgoProductListing>;
export async function updateProduct(input: UpdateFarmgoProductInput): Promise<FarmgoProductListing>;
```

- Tìm/lọc/sắp xếp thực hiện ở UI với catalog nhỏ; không cần API tìm kiếm riêng cho demo.
- Trang chi tiết và so sánh lọc bằng `commodityId`; mua bằng listing ID, không dùng commodity ID làm product ID của order.
- `getCustomerProduct` chỉ trả hàng đang active; hàng ẩn trả `NOT_FOUND`. Lịch sử đơn luôn dùng snapshot.
- `updateProduct` kiểm tra NCC sở hữu listing; không được đổi `supplierId` hoặc `commodityId` sau tạo.
- `changes` không rỗng; chỉ chấp nhận trường đã định nghĩa. Trường tùy chọn có thể xóa bằng chuỗi rỗng; không dùng `undefined` làm lệnh xóa.
- Giá và tồn hữu hạn, nguyên, không âm. `availableKg` là lượng còn có thể đặt tại thời điểm cập nhật, không phải tổng lượng nhập. Giá 0 giữ quy tắc v2; UI và service phải thống nhất, không tự áp giá tối thiểu khác nhau.
- `imageUrl` giữ hỗ trợ ảnh demo data URL đã nén và URL tham khảo; không upload ra dịch vụ ngoài. Không cho `javascript:` hoặc HTML data URL.
- Thành công phát `DATA_CHANGED`; thao tác không đổi dữ liệu không phát event. Trả bản sao tách state.

## 4. Quy tắc giá, giỏ và tồn

- `quoteCheckout` và `placeOrder` lấy trực tiếp `publicPricePerKg` của listing; không nhân markup.
- Tạm giữ nguyên phí vận chuyển fixture theo địa chỉ/zone. Không suy diễn bỏ markup thành miễn phí vận chuyển.
- Không cộng VAT/phí nền tảng và không ghi “đã gồm VAT” khi chưa có quy tắc được duyệt.
- Giá trong `OrderItem.unitPriceVnd` và tổng tiền snapshot như v2. Bổ sung `supplierId` và `supplierName` vào `OrderItem` khi tạo đơn; không lưu chứng nhận giả.
- Quote không giữ tồn; place kiểm tra lại giá/tồn rồi cập nhật nguyên tử. Chọn cùng mặt hàng từ hai NCC tạo hai dòng khác listing ID.
- Cập nhật tồn là đặt lại phần tồn còn bán được; không tác động lượng của đơn cũ, không trừ lại tồn khi chuyển trạng thái.
- Ẩn listing ngăn đơn mới; không xóa listing, không xóa nhu cầu và không chặn xác nhận/giao đơn đã có.
- Giỏ hàng không chứa giá gốc/markup hoặc coi giá UI là nguồn tính tiền; quote/place luôn tính lại bằng service.

## 5. API giá v2 và migration

- `getPricingRule` / `updatePricingRule` không còn vai trò trong v3; chỉ gỡ sau khi các màn hình không còn import chúng. Không âm thầm thay nghĩa API thành phí sàn.
- Màn hình cấu hình markup được thay bằng danh mục công khai của Hub; không để nút lưu không còn tác dụng.
- Cần schema version trong persistence. Chưa đổi key hoặc xóa `b2b-demo-v1` trong bản nháp này.
- [PROPOSAL] Migration một lần từ v2: `publicPricePerKg` khởi tạo bằng giá catalog v2 tại thời điểm nâng cấp để giữ giá người mua đang thấy. Đây là giá chuyển đổi dữ liệu, không phải tiếp tục markup sau nâng cấp. Cần review lựa chọn này vì có thể khác ý muốn giữ giá NCC gốc.
- Không đổi ID, tồn, orders, confirmations, shipments hoặc session. Giữ nguyên snapshot giá đơn cũ.
- Snapshot NCC của đơn cũ có thể bổ sung từ listing còn lưu; nếu không xác định được, hiển thị “Thông tin NCC chưa có”, không bịa tên.
- Bảng mapping commodity cho seed cố định; lô do người dùng tạo chưa có nhóm được giữ trong danh sách NCC và cần bổ sung thông tin trước khi đưa vào catalog v3. Không tự phân loại bằng suy đoán tên.
- Lưu version mới chỉ sau khi migration và ghi storage thành công; lỗi không ghi đè bản cũ. Không chạy migration lặp lại ở mỗi refresh.
- Reset khôi phục seed v3 trên schema đã thống nhất và phát `RESET`; không gọi `localStorage.clear()`.

## 6. Yêu cầu để chuyển nháp thành contract chạy

1. Review tên types/exports và cách thay thế v2.
2. Quyết định giá chuyển đổi: giữ giá khách đang thấy hay giữ giá NCC gốc. Cả hai không thể mặc định đồng thời khi v2 có markup.
3. Duyệt schema persistence và mapping dữ liệu cũ.
4. Integrator cập nhật contract dùng chung và tích hợp theo quy trình trước khi FE/mock logic đổi chữ ký.
5. Chốt API/model riêng cho hồ sơ, QC và khiếu nại trước đợt 3; không gắn model chưa có vào UI như dữ liệu thật.

## 7. Kiểm thử bắt buộc

- Hai listing cùng commodity từ hai NCC: so sánh đúng, chọn đúng NCC, tồn độc lập.
- Giá ba vai trò giống nhau; sửa giá chỉ đổi quote/catalog tương lai, không đổi đơn cũ.
- Sửa tồn/ẩn sản phẩm không làm biến mất đơn hoặc demand đang xử lý.
- Chặn chỉnh listing của NCC khác, dữ liệu số không hợp lệ và commodity không tồn tại.
- Ảnh hiển thị xuyên ba vai trò và sau refresh; link lỗi có fallback.
- Migration giữ số đơn/tồn/session và snapshot; chạy lần hai không đổi giá lần nữa; lỗi ghi không mất dữ liệu cũ.
- Các test session, rollback, nhiều NCC và shipment cascade v2 vẫn đạt sau khi cập nhật kỳ vọng giá.
