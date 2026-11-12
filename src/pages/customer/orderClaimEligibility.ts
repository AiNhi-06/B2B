import type { Claim, Order } from '../../types';

export function canClaim(order: Order, claims: Claim[], now: string) {
  if (order.status !== 'DELIVERED' || !order.deliveredAt) return false;
  const elapsed = Date.parse(now) - Date.parse(order.deliveredAt);
  if (!(elapsed >= 0 && elapsed < 7_200_000)) return false;

  const orderClaims = claims.filter(claim => claim.orderId === order.id);
  return order.items.some(item => {
    if (!item.supplierId || orderClaims.some(claim =>
      claim.supplierId === item.supplierId && (claim.status === 'OPEN' || claim.status === 'RESPONDED')
    )) return false;
    const reservedKg = orderClaims.flatMap(claim => {
      if (claim.status === 'APPROVED') return claim.approvedLines ?? [];
      if (claim.status === 'OPEN' || claim.status === 'RESPONDED') return claim.lines;
      return [];
    }).reduce((kg, line) => kg + (line.productId === item.productId ? line.quantityKg : 0), 0);
    return item.quantityKg - reservedKg >= 1;
  });
}
