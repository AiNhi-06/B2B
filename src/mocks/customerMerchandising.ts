import type { DemoState } from './seed';
import type { ProductListing } from '../types';

// Editorial demo copy, not live harvest or QC information.
export const productConditions: Readonly<Record<string, string>> = {
  'mango-cat-hoa-loc': 'Vừa chín tới',
  'mango-mekong': 'Vừa chín tới',
  'dragon-fruit': 'Chín vừa, mọng nước',
  'banana-tieu': 'Chín đều, ăn ngay',
  'avocado-sap': 'Bơ già, khoảng 2–3 ngày nữa chín tới',
  'lettuce-dalat': 'Mới thu hoạch, dùng ngay',
  "pineapple-demo": "Chín vàng, thơm dịu",
  "watermelon-demo": "Chín tới, ruột đỏ",
  "pomelo-demo": "Già trái, mọng nước",
  "guava-demo": "Vừa già, giòn ngọt",
  "papaya-demo": "Chín vừa, thịt mềm",
  "passion-fruit-demo": "Già trái, thơm đậm",
  "strawberry-demo": "Chín đỏ, dùng ngay",
  "mandarin-demo": "Chín tới, mọng nước",
  "cucumber-demo": "Mới thu hoạch, giòn tươi",
  "broccoli-demo": "Búp xanh, còn chắc",
  "potato-demo": "Củ già, chắc thịt",
  "sweet-potato-demo": "Củ già, ruột vàng",
  "pumpkin-demo": "Già quả, thịt chắc",
  "bok-choy-demo": "Mới thu hoạch, lá xanh",
  "spinach-demo": "Lá non, dùng ngay",
  "lime-demo": "Vỏ xanh, nhiều nước",

};
export const featuredProductIds = ['mango-cat-hoa-loc', 'dragon-fruit', 'banana-tieu', 'avocado-sap', 'lettuce-dalat'];

export function addCustomerProducts(state: DemoState): void {
  const fixtures: ProductListing[] = [
    { id: 'banana-tieu', commodityId: 'banana-tieu', supplierId: 'supplier-2', name: 'Chuối tiêu', unit: 'kg', availableKg: 200, publicPricePerKg: 18000, uses: ['FRESH', 'SMOOTHIE'], originLabel: 'Tiền Giang', active: true },
    { id: 'avocado-sap', commodityId: 'avocado-sap', supplierId: 'supplier-1', name: 'Bơ sáp', unit: 'kg', availableKg: 180, publicPricePerKg: 35000, uses: ['FRESH', 'SMOOTHIE'], originLabel: 'Lâm Đồng', active: true },
    { id: 'lettuce-dalat', commodityId: 'lettuce', supplierId: 'supplier-1', name: 'Rau xà lách', unit: 'kg', availableKg: 120, publicPricePerKg: 25000, uses: ['KITCHEN'], originLabel: 'Lâm Đồng', active: true },
    {"id": "pineapple-demo", "commodityId": "pineapple", "supplierId": "supplier-2", "name": "Dứa mật", "unit": "kg", "availableKg": 220, "publicPricePerKg": 16000, "uses": ["JUICE", "FRESH"], "originLabel": "Tiền Giang", "active": true},
    {"id": "watermelon-demo", "commodityId": "watermelon", "supplierId": "supplier-2", "name": "Dưa hấu", "unit": "kg", "availableKg": 400, "publicPricePerKg": 12000, "uses": ["JUICE", "FRESH"], "originLabel": "Long An", "active": true},
    {"id": "pomelo-demo", "commodityId": "pomelo", "supplierId": "supplier-2", "name": "Bưởi da xanh", "unit": "kg", "availableKg": 160, "publicPricePerKg": 42000, "uses": ["FRESH", "JUICE"], "originLabel": "Bến Tre", "active": true},
    {"id": "guava-demo", "commodityId": "guava", "supplierId": "supplier-2", "name": "Ổi lê", "unit": "kg", "availableKg": 240, "publicPricePerKg": 22000, "uses": ["FRESH", "JUICE"], "originLabel": "Tiền Giang", "active": true},
    {"id": "papaya-demo", "commodityId": "papaya", "supplierId": "supplier-2", "name": "Đu đủ", "unit": "kg", "availableKg": 180, "publicPricePerKg": 19000, "uses": ["FRESH", "SMOOTHIE"], "originLabel": "Tiền Giang", "active": true},
    {"id": "passion-fruit-demo", "commodityId": "passion-fruit", "supplierId": "supplier-1", "name": "Chanh dây", "unit": "kg", "availableKg": 200, "publicPricePerKg": 28000, "uses": ["JUICE"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "strawberry-demo", "commodityId": "strawberry", "supplierId": "supplier-1", "name": "Dâu tây Đà Lạt", "unit": "kg", "availableKg": 70, "publicPricePerKg": 95000, "uses": ["FRESH", "SMOOTHIE"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "mandarin-demo", "commodityId": "mandarin", "supplierId": "supplier-2", "name": "Quýt đường", "unit": "kg", "availableKg": 180, "publicPricePerKg": 32000, "uses": ["FRESH", "JUICE"], "originLabel": "Đồng Tháp", "active": true},
    {"id": "cucumber-demo", "commodityId": "cucumber", "supplierId": "supplier-1", "name": "Dưa leo", "unit": "kg", "availableKg": 300, "publicPricePerKg": 14000, "uses": ["KITCHEN", "JUICE"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "broccoli-demo", "commodityId": "broccoli", "supplierId": "supplier-1", "name": "Bông cải xanh", "unit": "kg", "availableKg": 160, "publicPricePerKg": 38000, "uses": ["KITCHEN"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "potato-demo", "commodityId": "potato", "supplierId": "supplier-1", "name": "Khoai tây", "unit": "kg", "availableKg": 350, "publicPricePerKg": 24000, "uses": ["KITCHEN"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "sweet-potato-demo", "commodityId": "sweet-potato", "supplierId": "supplier-1", "name": "Khoai lang mật", "unit": "kg", "availableKg": 280, "publicPricePerKg": 26000, "uses": ["KITCHEN"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "pumpkin-demo", "commodityId": "pumpkin", "supplierId": "supplier-1", "name": "Bí đỏ", "unit": "kg", "availableKg": 260, "publicPricePerKg": 18000, "uses": ["KITCHEN"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "bok-choy-demo", "commodityId": "bok-choy", "supplierId": "supplier-1", "name": "Cải thìa", "unit": "kg", "availableKg": 140, "publicPricePerKg": 20000, "uses": ["KITCHEN"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "spinach-demo", "commodityId": "spinach", "supplierId": "supplier-1", "name": "Cải bó xôi", "unit": "kg", "availableKg": 100, "publicPricePerKg": 30000, "uses": ["KITCHEN"], "originLabel": "Lâm Đồng", "active": true},
    {"id": "lime-demo", "commodityId": "lime", "supplierId": "supplier-2", "name": "Chanh không hạt", "unit": "kg", "availableKg": 190, "publicPricePerKg": 25000, "uses": ["JUICE", "KITCHEN"], "originLabel": "Long An", "active": true},
  ];
  for (const product of fixtures) {
    if (!state.suppliers.some(supplier => supplier.id === product.supplierId)) continue;
    if (!state.commodities.some(item => item.id === product.commodityId)) state.commodities.push({ id: product.commodityId!, name: product.name, category: ["lettuce-dalat", "cucumber-demo", "broccoli-demo", "potato-demo", "sweet-potato-demo", "pumpkin-demo", "bok-choy-demo", "spinach-demo"].includes(product.id) ? 'VEGETABLES' : 'FRESH_FRUIT' });
    if (state.products.some(item => item.id === product.id)) continue;
    state.products.push({ ...product, legacy: false });
    state.qualityReviews.push({ productId: product.id, supplierId: product.supplierId, grade: 'A', yieldPercent: 90, status: 'APPROVED', revision: 1, note: 'Thông số QC mẫu phục vụ demo cửa hàng.', submittedAt: state.demoNow, reviewedAt: state.demoNow });
  }
}
