"use client";

import { useCallback, useState } from "react";
import TuningChart, { DiemDuLieu } from "@/components/TuningChart";

function layApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:8000`;
  return "http://127.0.0.1:8000";
}

type DiemCoChuoi = DiemDuLieu & { weights?: string; kernel?: string };

type KetQuaMoHinh = {
  dangChay: boolean;
  loi: string | null;
  elapsed: number | null;
  soCauHinh: number | null;
  rows: DiemCoChuoi[];
};

const RONG: KetQuaMoHinh = { dangChay: false, loi: null, elapsed: null, soCauHinh: null, rows: [] };

type KetQuaCV = {
  dangChay: boolean;
  loi: string | null;
  elapsed: number | null;
  aucMean: number | null;
  aucStd: number | null;
  recallMean: number | null;
  recallStd: number | null;
};

const CV_RONG: KetQuaCV = {
  dangChay: false, loi: null, elapsed: null, aucMean: null, aucStd: null, recallMean: null, recallStd: null,
};

const MO_HINH = [
  {
    key: "decision_tree",
    ten: "Decision Tree",
    xKey: "max_depth",
    xLabel: "max_depth",
    bestX: 4,
    loc: () => true,
  },
  {
    key: "knn",
    ten: "kNN",
    xKey: "k",
    xLabel: "K",
    bestX: 16,
    loc: (r: DiemCoChuoi) => r.weights === "uniform",
  },
  {
    key: "svm",
    ten: "SVM",
    xKey: "C",
    xLabel: "C",
    bestX: 0.01,
    loc: (r: DiemCoChuoi) => r.kernel === "linear",
  },
] as const;

export default function TrangDoTrucTiep() {
  const [ketQua, setKetQua] = useState<Record<string, KetQuaMoHinh>>({
    decision_tree: RONG,
    knn: RONG,
    svm: RONG,
  });
  const [chayCV, setChayCV] = useState(false);
  const [ketQuaCV, setKetQuaCV] = useState<Record<string, KetQuaCV>>({
    decision_tree: CV_RONG,
    knn: CV_RONG,
    svm: CV_RONG,
  });

  const chay = useCallback(async () => {
    const apiUrl = layApiUrl();
    setKetQua({
      decision_tree: { ...RONG, dangChay: true },
      knn: { ...RONG, dangChay: true },
      svm: { ...RONG, dangChay: true },
    });
    if (chayCV) {
      setKetQuaCV({
        decision_tree: { ...CV_RONG, dangChay: true },
        knn: { ...CV_RONG, dangChay: true },
        svm: { ...CV_RONG, dangChay: true },
      });
    } else {
      setKetQuaCV({ decision_tree: CV_RONG, knn: CV_RONG, svm: CV_RONG });
    }

    await Promise.all(
      MO_HINH.map(async (mh) => {
        try {
          const res = await fetch(`${apiUrl}/tuning-live/${mh.key}`);
          if (!res.ok) throw new Error(`API lỗi (${res.status})`);
          const data = await res.json();
          const rows = (data.results as DiemCoChuoi[]).filter(mh.loc);
          setKetQua((prev) => ({
            ...prev,
            [mh.key]: {
              dangChay: false,
              loi: null,
              elapsed: data.elapsed_seconds,
              soCauHinh: data.so_cau_hinh_da_thu,
              rows,
            },
          }));
        } catch (e) {
          setKetQua((prev) => ({
            ...prev,
            [mh.key]: {
              dangChay: false,
              loi: e instanceof Error ? e.message : "Lỗi không xác định",
              elapsed: null,
              soCauHinh: null,
              rows: [],
            },
          }));
        }
      })
    );

    if (chayCV) {
      await Promise.all(
        MO_HINH.map(async (mh) => {
          try {
            const res = await fetch(`${apiUrl}/cv-live/${mh.key}`);
            if (!res.ok) throw new Error(`API lỗi (${res.status})`);
            const data = await res.json();
            setKetQuaCV((prev) => ({
              ...prev,
              [mh.key]: {
                dangChay: false,
                loi: null,
                elapsed: data.elapsed_seconds,
                aucMean: data.auc_mean,
                aucStd: data.auc_std,
                recallMean: data.recall_mean,
                recallStd: data.recall_std,
              },
            }));
          } catch (e) {
            setKetQuaCV((prev) => ({
              ...prev,
              [mh.key]: {
                ...CV_RONG,
                loi: e instanceof Error ? e.message : "Lỗi không xác định",
              },
            }));
          }
        })
      );
    }
  }, [chayCV]);

  const dangChayBat_Ky = MO_HINH.some((mh) => ketQua[mh.key].dangChay || ketQuaCV[mh.key].dangChay);
  const soHangBang = Math.max(0, ...MO_HINH.map((mh) => ketQua[mh.key].rows.length));

  return (
    <div className="px-6 pb-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <p className="text-sm text-neutral-500 dark:text-neutral-300">
          Bấm &quot;Chạy&quot; để hệ thống tính lại toàn bộ bảng dò tham số ngay lúc đó (không đọc file kết quả đã
          lưu sẵn) — cùng cách chia dữ liệu train/test như lúc làm đồ án (random_state=42), để chứng minh cấu hình
          tốt nhất không phải số liệu cố định mà tính lại lúc nào cũng ra cùng kết quả.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
            <input
              type="checkbox"
              checked={chayCV}
              onChange={(e) => setChayCV(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            Kiểm chứng bằng 5-fold Cross-Validation
          </label>
          <button
            onClick={chay}
            disabled={dangChayBat_Ky}
            className="w-28 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {dangChayBat_Ky ? "Đang chạy..." : "Chạy"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-8">
        {MO_HINH.map((mh) => {
          const kq = ketQua[mh.key];
          return (
            <section key={mh.key} className="border rounded-lg p-5">
              <h3 className="font-semibold mb-1">{mh.ten}</h3>
              {kq.dangChay && (
                <p className="text-sm text-neutral-500 dark:text-neutral-300 flex items-center gap-2 py-6">
                  <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Đang dò tham số...
                </p>
              )}
              {kq.loi && <p className="text-sm text-red-600">{kq.loi}</p>}
              {!kq.dangChay && !kq.loi && kq.rows.length > 0 && (
                <>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300 mb-3">
                    Vừa thử {kq.soCauHinh} cấu hình trong {kq.elapsed}s
                  </p>
                  <TuningChart
                    title={`AUC / Recall theo ${mh.xLabel}`}
                    data={kq.rows}
                    xKey={mh.xKey}
                    xLabel={mh.xLabel}
                    series={[
                      { key: "auc", label: "AUC", color: "#2a78d6" },
                      { key: "recall", label: "Recall", color: "#eb6834" },
                    ]}
                    bestX={mh.bestX}
                  />
                </>
              )}

              {chayCV && <KetQuaCVKhoi kq={ketQuaCV[mh.key]} />}
            </section>
          );
        })}
      </div>

      {soHangBang > 0 && (
        <div className="border rounded-lg p-5 overflow-x-auto">
          <h3 className="font-semibold mb-3">Bảng tổng hợp kết quả vừa chạy (3 mô hình)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-200 dark:border-neutral-700">
                <th className="py-2 pr-4 text-neutral-500 dark:text-neutral-300 font-medium">#</th>
                {MO_HINH.map((mh) => (
                  <th key={mh.key} className="py-2 pr-4 text-neutral-500 dark:text-neutral-300 font-medium">
                    {mh.ten}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: soHangBang }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-1.5 pr-4 text-neutral-400">{i + 1}</td>
                  {MO_HINH.map((mh) => {
                    const row = ketQua[mh.key].rows[i];
                    if (!row) {
                      return (
                        <td key={mh.key} className="py-1.5 pr-4 text-neutral-300 dark:text-neutral-600">—</td>
                      );
                    }
                    const laTotNhat = row[mh.xKey] === mh.bestX;
                    return (
                      <td
                        key={mh.key}
                        className={`py-1.5 pr-4 ${laTotNhat ? "font-semibold text-green-700 dark:text-green-400" : ""}`}
                      >
                        {mh.xLabel}={String(row[mh.xKey])} · AUC {Number(row.auc).toFixed(4)} · Recall{" "}
                        {Number(row.recall).toFixed(4)}
                        {laTotNhat && " ★"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KetQuaCVKhoi({ kq }: { kq: KetQuaCV }) {
  return (
    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-300 mb-2">5-fold Cross-Validation</p>
      {kq.dangChay && (
        <p className="text-sm text-neutral-500 dark:text-neutral-300 flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Đang chạy 5 fold...
        </p>
      )}
      {kq.loi && <p className="text-sm text-red-600">{kq.loi}</p>}
      {!kq.dangChay && !kq.loi && kq.aucMean !== null && (
        <div className="text-sm space-y-1">
          <p>
            AUC: <strong className="text-black dark:text-white">{kq.aucMean!.toFixed(4)}</strong>{" "}
            <span className="text-neutral-400">± {kq.aucStd!.toFixed(4)}</span>
          </p>
          <p>
            Recall: <strong className="text-black dark:text-white">{kq.recallMean!.toFixed(4)}</strong>{" "}
            <span className="text-neutral-400">± {kq.recallStd!.toFixed(4)}</span>
          </p>
          <p className="text-xs text-neutral-400">Chạy trong {kq.elapsed}s</p>
        </div>
      )}
    </div>
  );
}
