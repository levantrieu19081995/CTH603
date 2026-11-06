"use client";

import { useEffect, useState } from "react";
import TuningChart, { DiemDuLieu } from "@/components/TuningChart";

const LOCAL_STORAGE_KEY = "ct603_custom_params";

// Tự suy ra địa chỉ API từ địa chỉ đang mở trang (localhost hoặc IP LAN đều chạy được).
function layApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:8000`;
  return "http://127.0.0.1:8000";
}

type ConfigAPI = {
  models: {
    decision_tree: { label: string; params: { max_depth: number; class_weight: string }; threshold: number; metrics: Record<string, number> };
    knn: { label: string; params: { n_neighbors: number; weights: string }; threshold: number; metrics: Record<string, number> };
    svm: { label: string; params: { kernel: string; C: number; class_weight: string }; threshold: number; metrics: Record<string, number> };
  };
};

export default function TrangCauHinh() {
  const [config, setConfig] = useState<ConfigAPI | null>(null);
  const [dt, setDt] = useState({ max_depth: 4, class_weight: "balanced" as "balanced" | "none" });
  const [knn, setKnn] = useState({ n_neighbors: 16, weights: "uniform" as "uniform" | "distance", threshold: 0.06 });
  const [svm, setSvm] = useState({ kernel: "linear" as "linear" | "rbf", C: 0.01, class_weight: "balanced" as "balanced" | "none" });

  const [tuningDT, setTuningDT] = useState<DiemDuLieu[]>([]);
  const [tuningKNN, setTuningKNN] = useState<DiemDuLieu[]>([]);
  const [tuningKNNThreshold, setTuningKNNThreshold] = useState<DiemDuLieu[]>([]);
  const [tuningSVM, setTuningSVM] = useState<DiemDuLieu[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState(false);

  useEffect(() => {
    async function taiDuLieu() {
      try {
        const apiUrl = layApiUrl();
        const [cfgRes, dtRes, knnRes, knnThRes, svmRes] = await Promise.all([
          fetch(`${apiUrl}/config`),
          fetch(`${apiUrl}/tuning/decision_tree`),
          fetch(`${apiUrl}/tuning/knn`),
          fetch(`${apiUrl}/tuning/knn?aspect=threshold`),
          fetch(`${apiUrl}/tuning/svm`),
        ]);
        if (!cfgRes.ok) throw new Error("Không gọi được API /config");
        const cfg: ConfigAPI = await cfgRes.json();
        setConfig(cfg);
        setDt({ max_depth: cfg.models.decision_tree.params.max_depth, class_weight: cfg.models.decision_tree.params.class_weight as "balanced" | "none" });
        setKnn({ n_neighbors: cfg.models.knn.params.n_neighbors, weights: cfg.models.knn.params.weights as "uniform" | "distance", threshold: cfg.models.knn.threshold });
        setSvm({ kernel: cfg.models.svm.params.kernel as "linear" | "rbf", C: cfg.models.svm.params.C, class_weight: cfg.models.svm.params.class_weight as "balanced" | "none" });

        setTuningDT((await dtRes.json()).filter((r: DiemDuLieu) => r.max_depth != null));
        setTuningKNN((await knnRes.json()).filter((r: DiemDuLieu & { weights?: string }) => (r as { weights?: string }).weights === "uniform"));
        setTuningKNNThreshold(await knnThRes.json());
        setTuningSVM((await svmRes.json()).filter((r: DiemDuLieu & { kernel?: string }) => (r as { kernel?: string }).kernel === "linear"));

        const luuSan = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (luuSan) {
          const parsed = JSON.parse(luuSan);
          if (parsed.decision_tree) setDt(parsed.decision_tree);
          if (parsed.knn) setKnn(parsed.knn);
          if (parsed.svm) setSvm(parsed.svm);
        }
      } catch (e) {
        setLoi(e instanceof Error ? e.message : "Lỗi không xác định. Kiểm tra API đã chạy: python -m uvicorn src.be.main:app --reload --port 8000");
      }
    }
    taiDuLieu();
  }, []);

  function luuCauHinh() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ decision_tree: dt, knn, svm }));
    setDaLuu(true);
    setTimeout(() => setDaLuu(false), 2000);
  }

  function khoiPhucMacDinh() {
    if (!config) return;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setDt({ max_depth: config.models.decision_tree.params.max_depth, class_weight: config.models.decision_tree.params.class_weight as "balanced" | "none" });
    setKnn({ n_neighbors: config.models.knn.params.n_neighbors, weights: config.models.knn.params.weights as "uniform" | "distance", threshold: config.models.knn.threshold });
    setSvm({ kernel: config.models.svm.params.kernel as "linear" | "rbf", C: config.models.svm.params.C, class_weight: config.models.svm.params.class_weight as "balanced" | "none" });
  }

  return (
    <div className="px-6 pb-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <p className="text-sm text-neutral-500 dark:text-neutral-300">
          Giá trị mặc định là cấu hình tốt nhất tìm được qua quá trình thực nghiệm. Mỗi mô hình kèm biểu đồ minh chứng
          quá trình dò tham số — điểm đánh dấu ★ là cấu hình được chọn.
        </p>
        {config && (
          <div className="flex gap-3 items-center shrink-0">
            {daLuu && <span className="text-sm text-green-700 dark:text-green-400">Đã lưu ✓</span>}
            <button onClick={khoiPhucMacDinh} className="border rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 whitespace-nowrap">
              Khôi phục mặc định (tốt nhất)
            </button>
            <button onClick={luuCauHinh} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 whitespace-nowrap">
              Lưu cấu hình này để dùng ở trang dự đoán
            </button>
          </div>
        )}
      </div>

      {loi && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">{loi}</div>}

      {config && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ===== Decision Tree ===== */}
          <section className="border rounded-lg p-5">
            <h2 className="font-semibold mb-1">Decision Tree</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-300 mb-3">
              Mặc định tốt nhất: AUC={config.models.decision_tree.metrics.auc}, Recall={config.models.decision_tree.metrics.recall}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <TruongSo label="max_depth" value={dt.max_depth} onChange={(v) => setDt({ ...dt, max_depth: v })} min={1} max={20} />
              <TruongChon label="class_weight" value={dt.class_weight} onChange={(v) => setDt({ ...dt, class_weight: v as "balanced" | "none" })}
                options={[["balanced", "balanced"], ["none", "none"]]} />
            </div>
            {tuningDT.length > 0 && (
              <TuningChart
                title="AUC / Recall theo max_depth (class_weight='balanced')"
                data={tuningDT}
                xKey="max_depth"
                xLabel="max_depth"
                series={[{ key: "auc", label: "AUC", color: "#2a78d6" }, { key: "recall", label: "Recall", color: "#eb6834" }]}
                bestX={4}
              />
            )}
          </section>

          {/* ===== kNN ===== */}
          <section className="border rounded-lg p-5">
            <h2 className="font-semibold mb-1">kNN</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-300 mb-3">
              Mặc định tốt nhất: AUC={config.models.knn.metrics.auc}, Recall={config.models.knn.metrics.recall}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <TruongSo label="K (n_neighbors)" value={knn.n_neighbors} onChange={(v) => setKnn({ ...knn, n_neighbors: v })} min={1} max={30} />
              <TruongChon label="weights" value={knn.weights} onChange={(v) => setKnn({ ...knn, weights: v as "uniform" | "distance" })}
                options={[["uniform", "uniform"], ["distance", "distance"]]} />
              <TruongSo label="Ngưỡng quyết định" value={knn.threshold} onChange={(v) => setKnn({ ...knn, threshold: v })} min={0} max={1} step={0.01} />
            </div>
            {tuningKNN.length > 0 && (
              <TuningChart
                title="AUC / Recall theo K (weights='uniform')"
                data={tuningKNN}
                xKey="k"
                xLabel="K"
                series={[{ key: "auc", label: "AUC", color: "#2a78d6" }, { key: "recall", label: "Recall", color: "#eb6834" }]}
                bestX={16}
              />
            )}
            {tuningKNNThreshold.length > 0 && (
              <div className="mt-3">
                <TuningChart
                  title="Recall / F1 theo ngưỡng quyết định (K=16)"
                  data={tuningKNNThreshold}
                  xKey="threshold"
                  xLabel="ngưỡng"
                  series={[{ key: "recall", label: "Recall", color: "#eb6834" }, { key: "f1", label: "F1", color: "#1baf7a" }]}
                  bestX={0.06}
                />
              </div>
            )}
          </section>

          {/* ===== SVM ===== */}
          <section className="border rounded-lg p-5">
            <h2 className="font-semibold mb-1">SVM</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-300 mb-3">
              Mặc định tốt nhất: AUC={config.models.svm.metrics.auc}, Recall={config.models.svm.metrics.recall} — mô hình tối ưu nhất trong 3 mô hình
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <TruongChon label="kernel" value={svm.kernel} onChange={(v) => setSvm({ ...svm, kernel: v as "linear" | "rbf" })}
                options={[["linear", "linear"], ["rbf", "rbf"]]} />
              <TruongSo label="C" value={svm.C} onChange={(v) => setSvm({ ...svm, C: v })} min={0.001} max={10} step={0.01} />
              <TruongChon label="class_weight" value={svm.class_weight} onChange={(v) => setSvm({ ...svm, class_weight: v as "balanced" | "none" })}
                options={[["balanced", "balanced"], ["none", "none"]]} />
            </div>
            {tuningSVM.length > 0 && (
              <TuningChart
                title="AUC / Recall theo C (kernel='linear', class_weight='balanced')"
                data={tuningSVM}
                xKey="C"
                xLabel="C"
                series={[{ key: "auc", label: "AUC", color: "#2a78d6" }, { key: "recall", label: "Recall", color: "#eb6834" }]}
                bestX={0.01}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TruongChon({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-600 dark:text-neutral-200">{label}</span>
      <select className="border rounded-md px-2 py-1.5 bg-white text-neutral-900 [color-scheme:light]" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function TruongSo({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-600 dark:text-neutral-200">{label}</span>
      <input type="number" className="border rounded-md px-2 py-1.5 bg-white text-neutral-900 [color-scheme:light]" value={value} min={min} max={max} step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
