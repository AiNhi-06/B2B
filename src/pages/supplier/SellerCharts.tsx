import { useState } from 'react';
import { money } from '../../components/shared/useCatalog';

type Sale = { id: string; placedAt: string; amount: number; cumulative: number };
type Slice = { name: string; amount: number };
const colors = ['#087951', '#218b86', '#b66c12', '#52667b'];
const date = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});
const axisNumber = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });

export function SellerSalesChart({ sales, total }: { sales: Sale[]; total: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : sales[selected];
  const displayed = active ?? (sales.length === 1 ? sales[0] : null);
  const times = sales.map(sale => Date.parse(sale.placedAt));
  const first = times[0];
  const duration = times[times.length - 1] - first;
  const x = (index: number) => sales.length === 1 ? 364
    : 56 + (duration > 0 ? (times[index] - first) / duration : index / (sales.length - 1)) * 616;
  const y = (value: number) => 212 - value / Math.max(total, 1) * 180;
  const points = sales.map((sale, index) => `${x(index)},${y(sale.cumulative)}`).join(' ');
  function selectPoint(clientX: number, chart: SVGSVGElement) {
    const bounds = chart.getBoundingClientRect();
    const position = (clientX - bounds.left) / bounds.width * 720;
    const nearest = times.reduce((best, _, index) => Math.abs(x(index) - position) <= Math.abs(x(best) - position) ? index : best, 0);
    setSelected(nearest);
  }

  return <section className="seller-panel">
    <h2>Tiền hàng lũy kế</h2>
    <p>Giá trị hàng đặt trong kỳ, trước hoàn tiền và phí sàn</p>
    {sales.length ? <>
      <svg className="seller-line-chart seller-interactive-line" viewBox="0 0 720 252" aria-hidden="true"
        onPointerMove={event => {
          if (event.pointerType === 'mouse') selectPoint(event.clientX, event.currentTarget);
        }}
        onPointerLeave={event => { if (event.pointerType === 'mouse') setSelected(null); }}
        onClick={event => selectPoint(event.clientX, event.currentTarget)}>
        <rect width="720" height="252" fill="transparent" />
        {[0, 1, 2, 3, 4].map(index => <g key={index}>
          <line x1="56" y1={32 + index * 45} x2="672" y2={32 + index * 45} stroke="#dce8e1" />
          <text x="48" y={37 + index * 45} textAnchor="end">{axisNumber.format(total * (4 - index) / 4)}</text>
        </g>)}
        {sales.length > 1 && <polygon points={`56,212 ${points} 672,212`} fill="#e3f4ea" />}
        <polyline points={points} fill="none" stroke="#087951" strokeWidth="3" strokeLinejoin="round" />
        {sales.map((sale, index) => <circle key={sale.id} cx={x(index)} cy={y(sale.cumulative)} r="4" fill="#087951" />)}
        {active && selected !== null && <g>
          <line x1={x(selected)} x2={x(selected)} y1="25" y2="212" stroke="#087951" strokeDasharray="5 4" />
          <circle cx={x(selected)} cy={y(active.cumulative)} r="8" fill="#087951" stroke="white" strokeWidth="3" />
        </g>}
        <text x="56" y="242">{date.format(new Date(sales[0].placedAt))}</text>
        {sales.length > 1 && <text x="672" y="242" textAnchor="end">{date.format(new Date(sales[sales.length - 1].placedAt))}</text>}
      </svg>
      <div className="seller-chart-control">
        {sales.length > 1 && <label>Chọn mốc đơn hàng
          <input type="range" min={0} max={sales.length - 1} value={active ? selected! : 0}
            aria-valuetext={`${(active || sales[0]).id}, ${money((active || sales[0]).cumulative)} lũy kế`}
            onFocus={() => setSelected(index => index ?? 0)}
            onChange={event => setSelected(event.currentTarget.valueAsNumber)} />
        </label>}
        <div className="seller-chart-readout">
          <strong>{active ? money(active.cumulative) : money(total)}</strong>
          <span>{displayed
            ? `${displayed.id} · ${date.format(new Date(displayed.placedAt))} · Tiền hàng ${money(displayed.amount)}`
            : `Tổng tiền hàng · ${sales.length} đơn`}</span>
        </div>
      </div>
    </> : <div className="seller-empty">Chưa có đơn hàng trong kỳ đã chọn.</div>}
  </section>;
}

export function SellerProductChart({ slices, total }: { slices: Slice[]; total: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = slices.find(slice => slice.name === selected);
  const percentage = (amount: number) => total ? amount / total * 100 : 0;

  return <section className="seller-panel">
    <h2>Tỷ trọng tiền hàng theo sản phẩm</h2>
    {total > 0 ? <>
      <div className="seller-product-chart">
        <svg viewBox="0 0 120 120" aria-hidden="true" onPointerLeave={() => setSelected(null)}>
          <circle cx="60" cy="60" r="48" fill="none" stroke="#e2ebe5" strokeWidth="17" />
          {slices.map((slice, index) => {
            const length = percentage(slice.amount);
            if (!length) return null;
            const offset = percentage(slices.slice(0, index).reduce((sum, item) => sum + item.amount, 0));
            return <circle key={slice.name} cx="60" cy="60" r="48" pathLength="100" fill="none"
              stroke={colors[index]} strokeWidth={selected === slice.name ? 20 : 17}
              strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
              onPointerEnter={() => setSelected(slice.name)} onClick={() => setSelected(slice.name)} />;
          })}
        </svg>
        <strong>{active ? `${Math.round(percentage(active.amount))}%` : '100%'}</strong>
      </div>
      <div className="seller-chart-readout">
        <strong>{money(active?.amount ?? total)}</strong>
        <span>{active?.name ?? 'Tổng tiền hàng'}</span>
      </div>
      <div className="seller-product-legend" role="group" aria-label="Chi tiết tỷ trọng theo sản phẩm">
        {slices.map((slice, index) => <button key={slice.name} type="button"
          aria-pressed={selected === slice.name}
          aria-label={`${slice.name}, ${money(slice.amount)}, ${Math.round(percentage(slice.amount))}%`}
          onPointerEnter={event => { if (event.pointerType === 'mouse') setSelected(slice.name); }}
          onPointerLeave={event => { if (event.pointerType === 'mouse') setSelected(null); }}
          onFocus={() => setSelected(slice.name)} onBlur={() => setSelected(null)} onClick={() => setSelected(slice.name)}>
          <i style={{ background: colors[index] }} />{slice.name}<b>{Math.round(percentage(slice.amount))}%</b>
        </button>)}
      </div>
    </> : <div className="seller-empty">Chưa có tiền hàng trong kỳ đã chọn.</div>}
  </section>;
}
