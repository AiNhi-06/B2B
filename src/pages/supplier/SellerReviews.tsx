import { useState, useEffect } from 'react';
import {
  getStoredReviews,
  saveReviewResponse,
  removeReviewResponse,
  subscribeReviews,
  type CustomerReview,
} from '../../mocks/productReviews';
import { useDemoData } from '../../components/shared/useDemoData';
import * as api from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';

const QUICK_TEMPLATES = [
  'Dạ nhà vườn cảm ơn quán đã tin tưởng ủng hộ nông sản của vườn! Chúc quán luôn đông khách ạ.',
  'Cảm ơn quý khách đã phản hồi. Vườn cam kết luôn tuyển chọn những sọt quả già ngon nhất cho quán.',
  'Dạ vườn xin ghi nhận góp ý và sẽ kiểm tra phân loại kỹ hơn trong đợt thu hái tới ạ!',
];

export function SellerReviews() {
  const sessionData = useDemoData(async () => {
    const session = await api.getDemoSession();
    const suppliers = await api.getSuppliers();
    return { session, suppliers };
  });

  const [reviews, setReviews] = useState<CustomerReview[]>(getStoredReviews);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNANSWERED' | 'ANSWERED'>('ALL');
  const [filterRating, setFilterRating] = useState<number | 'ALL'>('ALL');
  const [filterProduct, setFilterProduct] = useState<string>('ALL');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [editingMap, setEditingMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeReviews(() => {
      setReviews(getStoredReviews());
    });
    return () => unsub();
  }, []);

  if (!sessionData.data) {
    return sessionData.error ? <ErrorMessage message={sessionData.error} /> : <LoadingSpinner />;
  }

  const supplierId = sessionData.data.session.activeSupplierId || 'supplier-1';
  const supplier = sessionData.data.suppliers.find(s => s.id === supplierId);
  const sellerName = supplier?.name || 'Nhà vườn Chú Sáu';

  // Filter for this seller
  const sellerReviews = reviews.filter(r => r.supplierId === supplierId);

  // Compute metrics
  const totalReviews = sellerReviews.length;
  const avgScore = totalReviews
    ? (sellerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';
  const answeredCount = sellerReviews.filter(r => !!r.sellerResponse).length;
  const unansweredCount = totalReviews - answeredCount;
  const answeredPercent = totalReviews ? Math.round((answeredCount / totalReviews) * 100) : 100;
  const fiveStarPercent = totalReviews
    ? Math.round((sellerReviews.filter(r => r.rating === 5).length / totalReviews) * 100)
    : 100;

  // Filtered list
  const filtered = sellerReviews.filter(r => {
    if (filterStatus === 'UNANSWERED' && r.sellerResponse) return false;
    if (filterStatus === 'ANSWERED' && !r.sellerResponse) return false;
    if (filterRating !== 'ALL' && r.rating !== filterRating) return false;
    if (filterProduct !== 'ALL' && r.productId !== filterProduct) return false;
    return true;
  });

  const uniqueProducts = Array.from(
    new Map(sellerReviews.map(r => [r.productId, r.productName])).entries()
  );

  const handleSendResponse = (reviewId: string) => {
    const text = replyTextMap[reviewId]?.trim();
    if (!text) return;
    saveReviewResponse(reviewId, text, sellerName);
    setReplyTextMap(prev => ({ ...prev, [reviewId]: '' }));
    setEditingMap(prev => ({ ...prev, [reviewId]: false }));
    setToastMessage('Đã gửi phản hồi thành công đến khách hàng!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleStartEdit = (review: CustomerReview) => {
    setEditingMap(prev => ({ ...prev, [review.id]: true }));
    setReplyTextMap(prev => ({ ...prev, [review.id]: review.sellerResponse?.message || '' }));
  };

  const handleDeleteResponse = (reviewId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa phản hồi này?')) {
      removeReviewResponse(reviewId);
      setToastMessage('Đã thu hồi phản hồi.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <div className="seller-reviews-page">
      <div className="page-heading">
        <div>
          <h1>Đọc & Phản Hồi Đánh Giá Khách Hàng</h1>
          <p>
            Theo dõi ý kiến phản hồi từ các Quán F&B, Bếp Trưởng và gửi câu trả lời để nâng cao uy tín cho nhà vườn.
          </p>
        </div>
        <span className="seller-chip">★ Đánh giá thực tế từ đơn mua</span>
      </div>

      {toastMessage && (
        <div className="seller-toast-success" role="status">
          ✓ {toastMessage}
        </div>
      )}

      {/* --- Metrics Grid --- */}
      <div className="seller-metrics review-metrics-grid">
        <article>
          <span>Điểm đánh giá trung bình</span>
          <strong className="green">{avgScore} ★</strong>
          <small>Dựa trên {totalReviews} lượt đánh giá từ quán</small>
        </article>

        <article>
          <span>Tỷ lệ đã phản hồi</span>
          <strong>{answeredPercent}%</strong>
          <small>{answeredCount} / {totalReviews} đánh giá đã trả lời</small>
        </article>

        <article>
          <span>Đánh giá 5 sao</span>
          <strong>{fiveStarPercent}%</strong>
          <small>Độ hài lòng về chất lượng nông sản</small>
        </article>

        <article>
          <span>Cần phản hồi ngay</span>
          <strong className={unansweredCount > 0 ? 'orange' : 'green'}>
            {unansweredCount}
          </strong>
          <small>{unansweredCount > 0 ? 'Khách đang chờ nhà vườn trả lời' : 'Đã phản hồi toàn bộ'}</small>
        </article>
      </div>

      {/* --- Filter Tabs & Bar --- */}
      <div className="seller-panel review-filter-panel">
        <div className="review-tabs">
          <button
            type="button"
            className={filterStatus === 'ALL' ? 'active' : ''}
            onClick={() => setFilterStatus('ALL')}
          >
            Tất cả ({totalReviews})
          </button>
          <button
            type="button"
            className={filterStatus === 'UNANSWERED' ? 'active' : ''}
            onClick={() => setFilterStatus('UNANSWERED')}
          >
            Chưa phản hồi ({unansweredCount})
          </button>
          <button
            type="button"
            className={filterStatus === 'ANSWERED' ? 'active' : ''}
            onClick={() => setFilterStatus('ANSWERED')}
          >
            Đã phản hồi ({answeredCount})
          </button>
        </div>

        <div className="review-dropdowns">
          <select
            value={filterRating}
            onChange={e => setFilterRating(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            aria-label="Lọc theo số sao"
          >
            <option value="ALL">Tất cả số sao</option>
            <option value={5}>5 sao ★★★★★</option>
            <option value={4}>4 sao ★★★★☆</option>
            <option value={3}>3 sao ★★★☆☆</option>
          </select>

          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            aria-label="Lọc theo sản phẩm"
          >
            <option value="ALL">Tất cả sản phẩm</option>
            {uniqueProducts.map(([pid, name]) => (
              <option key={pid} value={pid}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Reviews List --- */}
      <div className="review-list">
        {filtered.length === 0 ? (
          <div className="seller-panel seller-empty">
            <p>Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          filtered.map(review => {
            const isEditing = editingMap[review.id];
            const hasResponse = !!review.sellerResponse;
            const currentReplyText = replyTextMap[review.id] ?? '';

            return (
              <article key={review.id} className="seller-panel review-card">
                <div className="review-card-header">
                  <div className="review-user-info">
                    <span className="review-avatar">{review.customerName.charAt(0)}</span>
                    <div>
                      <strong>{review.customerName}</strong>
                      <span className="review-business">{review.customerBusiness}</span>
                    </div>
                    <span className="review-verified-badge">✓ Đã mua hàng B2B</span>
                  </div>

                  <div className="review-rating-block">
                    <div className="review-stars" aria-label={`${review.rating} sao`}>
                      {'★'.repeat(review.rating)}
                      <span className="empty-stars">{'★'.repeat(5 - review.rating)}</span>
                    </div>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="review-product-line">
                  <span className="product-badge">Mặt hàng:</span>
                  <strong>{review.productName}</strong>
                </div>

                <p className="review-comment">{review.comment}</p>

                {review.tags && review.tags.length > 0 && (
                  <div className="review-tags">
                    {review.tags.map(t => (
                      <span key={t} className="review-tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* --- Seller Response Display --- */}
                {hasResponse && !isEditing && (
                  <div className="seller-response-box">
                    <div className="seller-response-header">
                      <div className="responder-badge">
                        <span className="responder-icon">💬</span>
                        <strong>Phản hồi từ {review.sellerResponse?.responderName}</strong>
                        <small>
                          {review.sellerResponse?.respondedAt
                            ? new Date(review.sellerResponse.respondedAt).toLocaleDateString('vi-VN')
                            : ''}
                        </small>
                      </div>
                      <div className="response-actions">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => handleStartEdit(review)}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          className="btn-link danger"
                          onClick={() => handleDeleteResponse(review.id)}
                        >
                          Thu hồi
                        </button>
                      </div>
                    </div>
                    <p className="seller-response-text">{review.sellerResponse?.message}</p>
                  </div>
                )}

                {/* --- Reply Box (when answering or editing) --- */}
                {(!hasResponse || isEditing) && (
                  <div className="seller-reply-form">
                    <label className="reply-form-label">
                      <span>Phản hồi tới {review.customerName} ({review.customerBusiness}):</span>
                    </label>

                    {/* Quick templates */}
                    <div className="quick-templates">
                      <span>Mẫu trả lời nhanh:</span>
                      {QUICK_TEMPLATES.map((tmpl, idx) => (
                        <button
                          type="button"
                          key={idx}
                          className="template-pill"
                          onClick={() =>
                            setReplyTextMap(prev => ({
                              ...prev,
                              [review.id]: tmpl,
                            }))
                          }
                        >
                          {idx === 0
                            ? 'Cảm ơn ủng hộ'
                            : idx === 1
                            ? 'Cam kết già ngon'
                            : 'Ghi nhận phân loại'}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Nhập nội dung phản hồi chân thành, lịch sự tới quán..."
                      value={currentReplyText}
                      onChange={e =>
                        setReplyTextMap(prev => ({
                          ...prev,
                          [review.id]: e.target.value,
                        }))
                      }
                    />

                    <div className="reply-form-actions">
                      {isEditing && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setEditingMap(prev => ({ ...prev, [review.id]: false }))}
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!currentReplyText.trim()}
                        onClick={() => handleSendResponse(review.id)}
                      >
                        {isEditing ? 'Lưu thay đổi phản hồi' : 'Gửi phản hồi cho quán'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
