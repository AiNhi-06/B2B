export interface ReviewResponse {
  message: string;
  respondedAt: string;
  responderName: string;
}

export interface CustomerReview {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  customerName: string;
  customerBusiness: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  orderId?: string;
  tags?: string[];
  sellerResponse?: ReviewResponse;
}

const STORAGE_KEY = 'farmgo-customer-reviews-v1';

const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-001',
    productId: 'avocado-034',
    productName: 'Bơ 034 Lâm Đồng',
    supplierId: 'supplier-1',
    customerName: 'Chị Bích Vân',
    customerBusiness: 'Quán Sinh Tố Cát Tường (Quận 1)',
    rating: 5,
    comment: 'Bơ sáp 034 đợt này quả rất già, cơm dẻo quánh và béo ngậy. Quán mình xay sinh tố không bị xơ tí nào, khách quen khen nức nở. Đã đặt thêm 50kg cho tuần sau!',
    createdAt: '2026-10-29T15:20:00Z',
    orderId: 'showcase-order-102',
    tags: ['Cơm dẻo quánh', 'Trái già ngon', 'Không xơ'],
    // Chưa phản hồi -> Chờ nhà vườn trả lời
  },
  {
    id: 'rev-002',
    productId: 'mango-cat-hoa-loc',
    productName: 'Xoài Cát Hòa Lộc',
    supplierId: 'supplier-1',
    customerName: 'Anh Minh Trí',
    customerBusiness: 'Bếp Trung Tâm The Garden Coffee (Bình Thạnh)',
    rating: 5,
    comment: 'Xoài chín thơm nức mũi, độ ngọt đậm đà chuẩn cát Hòa Lộc Tiền Giang. Đóng sọt 20kg lót rơm cẩn thận nên không bị cấn giập quả nào.',
    createdAt: '2026-10-28T09:40:00Z',
    orderId: 'showcase-order-105',
    tags: ['Thơm ngọt đậm', 'Đóng sọt kỹ'],
    sellerResponse: {
      message: 'Cảm ơn anh Trí và The Garden Coffee đã tin dùng nguồn xoài của vườn! Vườn luôn chọn thu hái đúng độ già 9 tuổi để khi chín tới quán giữ trọn vẹn hương vị và độ ngọt tự nhiên nhất.',
      respondedAt: '2026-10-28T14:30:00Z',
      responderName: 'Nhà vườn Chú Sáu',
    },
  },
  {
    id: 'rev-003',
    productId: 'carrot-dalat',
    productName: 'Cà rốt Đà Lạt',
    supplierId: 'supplier-1',
    customerName: 'Bếp Trưởng Hoàng Long',
    customerBusiness: 'Nhà Hàng Chay Mộc Nhiên (Quận 3)',
    rating: 4,
    comment: 'Cà rốt tươi rói, ép nước ngọt thanh tự nhiên, bã rất ít. Có 1-2 củ kích thước hơi nhỏ hơn đợt trước một chút nhưng ruột củ vẫn rất chắc và đặc.',
    createdAt: '2026-10-27T11:15:00Z',
    tags: ['Nước ngọt thanh', 'Tươi giòn'],
    // Chưa phản hồi
  },
  {
    id: 'rev-004',
    productId: 'tomato-dalat',
    productName: 'Cà chua Đà Lạt',
    supplierId: 'supplier-1',
    customerName: 'Chị Thảo Mai',
    customerBusiness: 'Chuỗi Salad & Healthy Food Saigon (TP. Thủ Đức)',
    rating: 5,
    comment: 'Cà chua trái mọng, đỏ đều tự nhiên không bị xốp hay ủng nước. Làm salad và sốt salsa cực kỳ chuẩn vị.',
    createdAt: '2026-10-25T08:30:00Z',
    tags: ['Trái mọng', 'Đỏ tươi tự nhiên'],
    sellerResponse: {
      message: 'Nhà vườn Chú Sáu cảm ơn chị Mai ạ! Vườn luôn thu hoạch sáng sớm và chuyển ngay trong ngày để giữ độ tươi giòn tốt nhất cho các chuỗi món ăn healthy.',
      respondedAt: '2026-10-25T11:00:00Z',
      responderName: 'Nhà vườn Chú Sáu',
    },
  },
  {
    id: 'rev-005',
    productId: 'cabbage-dalat',
    productName: 'Bắp cải xanh',
    supplierId: 'supplier-1',
    customerName: 'Anh Quốc Tuấn',
    customerBusiness: 'Hệ Thống Cơm Niêu Việt (Quận 7)',
    rating: 5,
    comment: 'Bắp cải cuốn rất chặt tay, lá non giòn ngọt. Mua sỉ trực tiếp từ nhà vườn giá tốt hơn chợ đầu mối nhiều.',
    createdAt: '2026-10-24T16:45:00Z',
    tags: ['Cuộn chắc', 'Lá giòn ngọt'],
    // Chưa phản hồi
  },
  {
    id: 'rev-006',
    productId: 'avocado-034',
    productName: 'Bơ 034 Lâm Đồng',
    supplierId: 'supplier-1',
    customerName: 'Chị Lan Hương',
    customerBusiness: 'Trà Sữa & Đồ Uống Boba Tea (Tân Bình)',
    rating: 5,
    comment: 'Chất lượng đồng đều, giao hàng đúng giờ sáng sớm để quán kịp sơ chế trước giờ mở cửa. Ủng hộ nhà vườn dài lâu.',
    createdAt: '2026-10-22T10:10:00Z',
    tags: ['Giao đúng giờ', 'Chất lượng đều'],
    sellerResponse: {
      message: 'Dạ vườn cảm ơn chị Lan Hương nhiều ạ! Vườn cam kết luôn ưu tiên đóng sọt cẩn thận cho quán chuẩn bị nguyên liệu mỗi sáng.',
      respondedAt: '2026-10-22T13:20:00Z',
      responderName: 'Nhà vườn Chú Sáu',
    },
  },
];

const listeners = new Set<() => void>();

export function getStoredReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback to initial */
  }
  return INITIAL_REVIEWS;
}

export function saveAllReviews(reviews: CustomerReview[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    /* ignore storage errors */
  }
  listeners.forEach(cb => cb());
}

export function saveReviewResponse(
  reviewId: string,
  message: string,
  responderName = 'Nhà vườn Chú Sáu'
): CustomerReview | undefined {
  const reviews = getStoredReviews();
  const index = reviews.findIndex(r => r.id === reviewId);
  if (index === -1) return undefined;

  const updated: CustomerReview = {
    ...reviews[index],
    sellerResponse: {
      message: message.trim(),
      respondedAt: new Date().toISOString(),
      responderName,
    },
  };

  reviews[index] = updated;
  saveAllReviews(reviews);
  return updated;
}

export function removeReviewResponse(reviewId: string): void {
  const reviews = getStoredReviews();
  const index = reviews.findIndex(r => r.id === reviewId);
  if (index === -1) return;

  const { sellerResponse: _, ...rest } = reviews[index];
  reviews[index] = rest;
  saveAllReviews(reviews);
}

export function subscribeReviews(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
