"use client";

import { useMemo, useState } from "react";

/**
 * Biểu đồ đường nhỏ, dùng trong trang cấu hình: trục X là giá trị tham số
 * đã dò (max_depth / K / C...), trục Y là độ đo (AUC, Recall...), cùng
 * thang 0-1 nên dùng chung 1 trục (không vẽ 2 trục y). Điểm "tốt nhất"
 * được đánh dấu nổi bật + có nhãn trực tiếp, không chỉ dựa vào màu sắc.
 *
 * Màu theo bảng màu chuẩn (xem skill dataviz / references/palette.md):
 * slot 1 = xanh dương #2a78d6 (chế độ sáng), slot 2 = cam #eb6834,
 * màu "tốt nhất" = status good #0ca30c.
 */

export type DiemDuLieu = { x: number; [key: string]: number };

type Series = { key: string; label: string; color: string };

const MAU = {
  surface: "#fcfcfb",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  textMuted: "#898781",
  series1: "#2a78d6", // xanh dương - thường dùng cho AUC
  series2: "#eb6834", // cam - thường dùng cho Recall
  best: "#0ca30c", // status good - đánh dấu điểm tốt nhất
};

const RONG = 560;
const CAO = 220;
const LE = { trai: 36, phai: 16, tren: 16, duoi: 28 };

export default function TuningChart({
  data,
  xKey,
  xLabel,
  series,
  bestX,
  title,
}: {
  data: DiemDuLieu[];
  xKey: string;
  xLabel: string;
  series: Series[];
  bestX?: number;
  title: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { xs, scaleX, scaleY, duongVe } = useMemo(() => {
    const xs = data.map((d) => d[xKey]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const rongVe = RONG - LE.trai - LE.phai;
    const caoVe = CAO - LE.tren - LE.duoi;

    const scaleX = (x: number) =>
      LE.trai + (maxX === minX ? rongVe / 2 : ((x - minX) / (maxX - minX)) * rongVe);
    // Y luôn 0..1 vì AUC/Recall cùng thang, không cần tính min/max động
    const scaleY = (y: number) => LE.tren + (1 - y) * caoVe;

    const duongVe = series.map((s) => {
      const diem = data.map((d) => `${scaleX(d[xKey])},${scaleY(d[s.key])}`);
      return { key: s.key, path: "M" + diem.join(" L") };
    });

    return { xs, scaleX, scaleY, duongVe };
  }, [data, xKey, series]);

  const chiSoBest =
    bestX !== undefined ? data.findIndex((d) => d[xKey] === bestX) : -1;

  return (
    <div
      className="viz-root rounded-lg border p-4"
      style={{ background: MAU.surface, borderColor: MAU.gridline }}
    >
      <p className="text-sm font-medium mb-2" style={{ color: MAU.textPrimary }}>
        {title}
      </p>

      <svg
        viewBox={`0 0 ${RONG} ${CAO}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Gridline ngang: 0, 0.25, 0.5, 0.75, 1.0 */}
        {[0, 0.25, 0.5, 0.75, 1].map((y) => (
          <line
            key={y}
            x1={LE.trai}
            x2={RONG - LE.phai}
            y1={scaleY(y)}
            y2={scaleY(y)}
            stroke={MAU.gridline}
            strokeWidth={1}
          />
        ))}
        {/* Trục dưới cùng (baseline) */}
        <line
          x1={LE.trai}
          x2={RONG - LE.phai}
          y1={CAO - LE.duoi}
          y2={CAO - LE.duoi}
          stroke={MAU.baseline}
          strokeWidth={1}
        />

        {/* Nhãn trục Y: 0 và 1 */}
        <text x={4} y={scaleY(1) + 4} fontSize={10} fill={MAU.textMuted}>1.0</text>
        <text x={4} y={scaleY(0) + 4} fontSize={10} fill={MAU.textMuted}>0.0</text>

        {/* Đường dữ liệu */}
        {duongVe.map((d, i) => (
          <path
            key={d.key}
            d={d.path}
            fill="none"
            stroke={series[i].color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Marker từng điểm + vùng hover (vô hình, to hơn để dễ rê chuột) */}
        {data.map((d, idx) => (
          <g key={idx}>
            <rect
              x={scaleX(d[xKey]) - 10}
              y={LE.tren}
              width={20}
              height={CAO - LE.tren - LE.duoi}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(idx)}
            />
            {series.map((s) => (
              <circle
                key={s.key}
                cx={scaleX(d[xKey])}
                cy={scaleY(d[s.key])}
                r={idx === chiSoBest ? 5 : 3}
                fill={s.color}
                stroke={MAU.surface}
                strokeWidth={2}
              />
            ))}
          </g>
        ))}

        {/* Đánh dấu điểm tốt nhất: vòng tròn status-good + nhãn trực tiếp */}
        {chiSoBest >= 0 && (
          <g>
            <circle
              cx={scaleX(data[chiSoBest][xKey])}
              cy={LE.tren - 2}
              r={0}
            />
            <line
              x1={scaleX(data[chiSoBest][xKey])}
              x2={scaleX(data[chiSoBest][xKey])}
              y1={LE.tren}
              y2={CAO - LE.duoi}
              stroke={MAU.best}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <text
              x={scaleX(data[chiSoBest][xKey])}
              y={LE.tren - 4}
              fontSize={10}
              fontWeight={600}
              textAnchor="middle"
              fill={MAU.best}
            >
              ★ Tốt nhất
            </text>
          </g>
        )}

        {/* Nhãn trục X: min, giữa, max */}
        <text x={LE.trai} y={CAO - 8} fontSize={10} fill={MAU.textMuted}>
          {xLabel}={Math.min(...xs)}
        </text>
        <text x={RONG - LE.phai} y={CAO - 8} fontSize={10} fill={MAU.textMuted} textAnchor="end">
          {xLabel}={Math.max(...xs)}
        </text>

        {/* Crosshair khi hover */}
        {hoverIdx !== null && (
          <line
            x1={scaleX(data[hoverIdx][xKey])}
            x2={scaleX(data[hoverIdx][xKey])}
            y1={LE.tren}
            y2={CAO - LE.duoi}
            stroke={MAU.textMuted}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        )}
      </svg>

      {/* Chú giải (legend) - bắt buộc vì có >=2 series */}
      <div className="flex gap-4 mt-2 flex-wrap">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: MAU.textSecondary }}>
            <span className="inline-block w-3 h-[2px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Tooltip dạng bảng khi hover 1 điểm */}
      {hoverIdx !== null && (
        <div className="mt-2 text-xs rounded border px-2 py-1 inline-block" style={{ borderColor: MAU.gridline, color: MAU.textPrimary }}>
          <strong>{xLabel} = {data[hoverIdx][xKey]}</strong>
          {series.map((s) => (
            <span key={s.key} className="ml-3" style={{ color: MAU.textSecondary }}>
              {s.label}: <strong style={{ color: MAU.textPrimary }}>{data[hoverIdx][s.key].toFixed(4)}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
