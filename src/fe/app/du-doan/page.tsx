"use client";

import { useEffect, useState } from "react";

const LOCAL_STORAGE_KEY = "ct603_custom_params";

// Tự suy ra địa chỉ API từ địa chỉ đang mở trang (localhost hoặc IP LAN đều chạy được,
// không cần sửa .env.local mỗi khi đổi cách truy cập). NEXT_PUBLIC_API_URL vẫn được
// ưu tiên nếu có set, để còn tùy chỉnh khi cần (ví dụ API ở máy khác với FE).
function layApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return `http://${window.location.hostname}:8000`;
  return "http://127.0.0.1:8000";
}

type KetQuaMoHinh = {
  prediction: 0 | 1;
  probability: number;
  label: string;
  params_used: Record<string, unknown>;
};

type KetQuaDuDoan = {
  decision_tree: KetQuaMoHinh;
  knn: KetQuaMoHinh;
  svm: KetQuaMoHinh;
};

const GIA_TRI_MAC_DINH = {
  gender: "Male",
  age: 45,
  hypertension: 0,
  heart_disease: 0,
  ever_married: "Yes",
  work_type: "Private",
  Residence_type: "Urban",
  avg_glucose_level: 100,
  bmi: 25,
  smoking_status: "never smoked",
};

export default function TrangDuDoan() {
  const [benhNhan, setBenhNhan] = useState(GIA_TRI_MAC_DINH);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [ketQua, setKetQua] = useState<KetQuaDuDoan | null>(null);
  const [coCauHinhTuyChinh, setCoCauHinhTuyChinh] = useState(false);

  useEffect(() => {
    setCoCauHinhTuyChinh(!!localStorage.getItem(LOCAL_STORAGE_KEY));
  }, []);

  function xoaCauHinhTuyChinh() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCoCauHinhTuyChinh(false);
  }

  function capNhat<K extends keyof typeof GIA_TRI_MAC_DINH>(key: K, value: (typeof GIA_TRI_MAC_DINH)[K]) {
    setBenhNhan((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDuDoan() {
    setDangTai(true);
    setLoi(null);
    setKetQua(null);
    try {
      const luuSan = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
      const params = luuSan ? JSON.parse(luuSan) : undefined;
      const res = await fetch(`${layApiUrl()}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient: benhNhan, params }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API lỗi (${res.status}): ${text}`);
      }
      setKetQua(await res.json());
    } catch (e) {
      setLoi(
        e instanceof Error
          ? `${e.message}\n\nKiểm tra API đã chạy chưa: python -m uvicorn src.be.main:app --reload --port 8000`
          : "Lỗi không xác định"
      );
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="px-6 pb-10">
      <div className="max-w-3xl mx-auto">
      <p className="text-sm text-neutral-500 dark:text-neutral-300 mb-6">
        Nhập thông tin bệnh nhân, hệ thống sẽ chạy 3 mô hình (Decision Tree, kNN, SVM) đã được tối ưu và so sánh kết quả.
      </p>

      {coCauHinhTuyChinh && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 flex items-center justify-between">
          <span>Đang dùng cấu hình tùy chỉnh (không phải mặc định tốt nhất) từ trang cấu hình.</span>
          <button onClick={xoaCauHinhTuyChinh} className="underline hover:no-underline">Dùng lại mặc định</button>
        </div>
      )}

      <div className="relative grid grid-cols-2 gap-x-[60px] gap-y-4 bg-white rounded-xl shadow-sm p-5">
        <div className="absolute left-1/2 top-5 bottom-5 w-px bg-neutral-200 -translate-x-1/2" />
        <TruongChon label="Giới tính" value={benhNhan.gender} onChange={(v) => capNhat("gender", v)}
          options={[["Male", "Nam"], ["Female", "Nữ"], ["Other", "Khác"]]} />
        <TruongSo label="Tuổi" value={benhNhan.age} onChange={(v) => capNhat("age", v)} min={0} max={120} />

        <TruongChon label="Tăng huyết áp" value={String(benhNhan.hypertension)}
          onChange={(v) => capNhat("hypertension", Number(v) as 0 | 1)}
          options={[["0", "Không"], ["1", "Có"]]} />
        <TruongChon label="Bệnh tim" value={String(benhNhan.heart_disease)}
          onChange={(v) => capNhat("heart_disease", Number(v) as 0 | 1)}
          options={[["0", "Không"], ["1", "Có"]]} />

        <TruongChon label="Tình trạng hôn nhân" value={benhNhan.ever_married} onChange={(v) => capNhat("ever_married", v)}
          options={[["Yes", "Đã kết hôn"], ["No", "Chưa kết hôn"]]} />
        <TruongChon label="Nơi ở" value={benhNhan.Residence_type} onChange={(v) => capNhat("Residence_type", v)}
          options={[["Urban", "Thành thị"], ["Rural", "Nông thôn"]]} />

        <TruongChon label="Loại công việc" value={benhNhan.work_type} onChange={(v) => capNhat("work_type", v)}
          options={[
            ["Private", "Tư nhân"], ["Self-employed", "Tự kinh doanh"],
            ["Govt_job", "Nhà nước"], ["children", "Trẻ em"], ["Never_worked", "Chưa từng làm việc"],
          ]} />
        <TruongChon label="Tình trạng hút thuốc" value={benhNhan.smoking_status} onChange={(v) => capNhat("smoking_status", v)}
          options={[
            ["never smoked", "Chưa từng hút"], ["formerly smoked", "Đã từng hút"],
            ["smokes", "Đang hút"], ["Unknown", "Không rõ"],
          ]} />

        <TruongSo label="Glucose trung bình (mg/dL)" value={benhNhan.avg_glucose_level}
          onChange={(v) => capNhat("avg_glucose_level", v)} min={0} max={400} />
        <TruongSo label="BMI" value={benhNhan.bmi} onChange={(v) => capNhat("bmi", v)} min={0} max={80} />
      </div>

      <button
        onClick={handleDuDoan}
        disabled={dangTai}
        className="mt-5 w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {dangTai ? "Đang dự đoán..." : "Dự đoán"}
      </button>

      {loi && (
        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 whitespace-pre-line">
          {loi}
        </div>
      )}

      {ketQua && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TheKetQua ten="Decision Tree" ketQua={ketQua.decision_tree} />
          <TheKetQua ten="kNN" ketQua={ketQua.knn} />
          <TheKetQua ten="SVM" ketQua={ketQua.svm} />
        </div>
      )}
      </div>
    </div>
  );
}

function TruongChon({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-black">{label}</span>
      <select
        className="border-0 rounded-lg px-3 py-2 bg-neutral-100 text-blue-600 font-medium [color-scheme:light] outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function TruongSo({
  label, value, onChange, min, max,
}: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-black">{label}</span>
      <input
        type="number"
        className="border-0 rounded-lg px-3 py-2 bg-neutral-100 text-blue-600 font-medium [color-scheme:light] outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function TheKetQua({ ten, ketQua }: { ten: string; ketQua: KetQuaMoHinh }) {
  const coNguyCo = ketQua.prediction === 1;
  return (
    <div className={`rounded-lg border p-4 ${coNguyCo ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-300">{ten}</p>
      <p className={`text-lg font-semibold mt-1 ${coNguyCo ? "text-red-700" : "text-green-700"}`}>
        {ketQua.label}
      </p>
      <p className="text-sm text-neutral-600 dark:text-neutral-200 mt-1">Xác suất: {(ketQua.probability * 100).toFixed(1)}%</p>
    </div>
  );
}
