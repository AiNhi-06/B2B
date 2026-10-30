import { productRatings } from '../../mocks/productRatings';

export function ProductRating({ id }: { id: string }) {
  const rating = productRatings[id];
  if (!rating) return <p className="purchase-rating-empty">Chưa có đánh giá</p>;
  return <div className="purchase-rating" aria-label={`${rating.score.toFixed(1)} trên 5 sao, ${rating.count} đánh giá mẫu`}>
    <strong>{rating.score.toFixed(1)}</strong>
    <span className="purchase-stars" aria-hidden="true"><span>★★★★★</span><span className="purchase-stars-fill" style={{ width: `${rating.score / 5 * 100}%` }}>★★★★★</span></span>
    <span className="purchase-review-count">({rating.count.toLocaleString('vi-VN')} đánh giá)</span>
    <small>Đánh giá mẫu</small>
  </div>;
}
