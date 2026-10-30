import { productConditions } from '../../mocks/customerMerchandising';

export function ProductCondition({ id }: { id: string }) {
  const condition = productConditions[id];
  return condition ? <p className="product-condition"><span aria-hidden="true">●</span> {condition}</p> : null;
}
