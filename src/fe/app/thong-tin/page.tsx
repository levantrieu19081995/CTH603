"use client";

import { useState } from "react";

const BANG_CAU_HINH = [
  {
    mo_hinh: "Decision Tree",
    tham_so: "max_depth=4, class_weight='balanced'",
    auc: "0.8305",
    recall: "0.8400",
  },
  {
    mo_hinh: "kNN",
    tham_so: "K=16, weights='uniform', threshold=0.06",
    auc: "0.7831",
    recall: "0.8400",
  },
  {
    mo_hinh: "SVM",
    tham_so: "kernel='linear', C=0.01, class_weight='balanced'",
    auc: "0.8404",
    recall: "0.8400",
  },
];

const CAC_COT_DU_LIEU = [
  ["gender", "Giới tính"],
  ["age", "Tuổi"],
  ["hypertension", "Tăng huyết áp (0/1)"],
  ["heart_disease", "Bệnh tim (0/1)"],
  ["ever_married", "Tình trạng hôn nhân"],
  ["work_type", "Loại công việc"],
  ["Residence_type", "Nơi ở (thành thị/nông thôn)"],
  ["avg_glucose_level", "Mức glucose trung bình trong máu"],
  ["bmi", "Chỉ số khối cơ thể (có giá trị thiếu N/A)"],
  ["smoking_status", "Tình trạng hút thuốc"],
  ["stroke", "Nhãn mục tiêu — 1 = có đột quỵ, 0 = không"],
];

export default function TrangThongTin() {
  const [tab, setTab] = useState<
    "de-tai" | "ky-thuat" | "chuc-nang" | "bao-cao"
  >("de-tai");

  return (
    <div className="px-6 pb-10">
      <div className="max-w-4xl mx-auto">
        <div className="sticky top-0 z-10 bg-[var(--background)] pt-2 pb-3 mb-3 flex gap-2">
          <NutTab active={tab === "de-tai"} onClick={() => setTab("de-tai")}>
            Thông tin đề tài
          </NutTab>
          <NutTab
            active={tab === "chuc-nang"}
            onClick={() => setTab("chuc-nang")}
          >
            Chức năng
          </NutTab>
          <NutTab
            active={tab === "ky-thuat"}
            onClick={() => setTab("ky-thuat")}
          >
            Mô tả kỹ thuật
          </NutTab>
          <NutTab active={tab === "bao-cao"} onClick={() => setTab("bao-cao")}>
            Bài báo cáo
          </NutTab>
        </div>

        {tab === "de-tai" && <NoiDungDeTai />}
        {tab === "chuc-nang" && <NoiDungChucNang />}
        {tab === "ky-thuat" && <NoiDungKyThuat />}
        {tab === "bao-cao" && <NoiDungBaoCao />}
      </div>
    </div>
  );
}

function NutTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function KhoiNoiDung({
  tieuDe,
  children,
}: {
  tieuDe: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{tieuDe}</h2>
      <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
        {children}
      </div>
    </section>
  );
}

function NoiDungDeTai() {
  return (
    <div>
      <KhoiNoiDung tieuDe="Tên đề tài">
        <p className="font-medium text-black dark:text-white">
          Xây dựng mô hình dự đoán nguy cơ đột quỵ dựa trên các yếu tố lâm sàng
          và nhân khẩu học, so sánh hiệu quả giữa Decision Tree, k-NN và SVM.
        </p>
        <p>Môn: Kho dữ liệu và khai phá dữ liệu (CTH603).</p>
        <p>Giảng viên hướng dẫn: PGS.TS. Nguyễn Thái Nghe.</p>
        <p>
          Thành viên thực hiện đồ án: Lê Văn Triệu (MSSV: M2526034), La Quỳnh
          Như (MSSV: M2526026).
        </p>
      </KhoiNoiDung>

      <KhoiNoiDung tieuDe="Dữ liệu">
        <p>
          <strong className="text-black dark:text-white">Nguồn:</strong> Stroke
          Prediction Dataset — tác giả fedesoriano, đăng trên Kaggle. Tác giả
          ghi xuất xứ là &quot;Confidential Source&quot; — đây{" "}
          <strong>không phải</strong> dữ liệu từ một cơ quan y tế chính thống,
          mà là dataset công khai phổ biến trong học thuật/khóa học khai phá dữ
          liệu y tế.
        </p>
        <p>
          <strong className="text-black dark:text-white">Quy mô:</strong> 5.110
          dòng, 12 cột.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-neutral-200 dark:border-neutral-700">
                <th className="py-1.5 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Cột
                </th>
                <th className="py-1.5 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Ý nghĩa
                </th>
              </tr>
            </thead>
            <tbody>
              {CAC_COT_DU_LIEU.map(([cot, yNghia]) => (
                <tr
                  key={cot}
                  className="border-b border-neutral-100 dark:border-neutral-800"
                >
                  <td className="py-1.5 pr-4 font-mono text-xs text-blue-600 dark:text-blue-400">
                    {cot}
                  </td>
                  <td className="py-1.5 pr-4">{yNghia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          <strong className="text-black dark:text-white">
            Lưu ý quan trọng:
          </strong>{" "}
          dữ liệu mất cân bằng lớp nặng (chỉ ~5% bản ghi có stroke=1) nên không
          thể chỉ báo cáo Accuracy — cần báo cáo thêm Precision, Recall, F1,
          AUC/ROC, Confusion Matrix. Cột bmi có giá trị thiếu (N/A), các cột
          phân loại cần mã hóa trước khi train.
        </p>
      </KhoiNoiDung>

      <KhoiNoiDung tieuDe="Mô hình áp dụng & cấu hình tốt nhất">
        <p>
          3 mô hình đã học trong môn, được dò tham số và chọn cấu hình tối ưu
          trên cùng 1 tập train/test:
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-neutral-200 dark:border-neutral-700">
                <th className="py-1.5 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Mô hình
                </th>
                <th className="py-1.5 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Tham số tốt nhất
                </th>
                <th className="py-1.5 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                  AUC
                </th>
                <th className="py-1.5 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                  Recall
                </th>
              </tr>
            </thead>
            <tbody>
              {BANG_CAU_HINH.map((r) => (
                <tr
                  key={r.mo_hinh}
                  className="border-b border-neutral-100 dark:border-neutral-800"
                >
                  <td className="py-1.5 pr-4 font-medium text-black dark:text-white">
                    {r.mo_hinh}
                  </td>
                  <td className="py-1.5 pr-4 font-mono text-xs">{r.tham_so}</td>
                  <td
                    className={`py-1.5 pr-4 ${r.mo_hinh === "SVM" ? "font-semibold text-green-700 dark:text-green-400" : ""}`}
                  >
                    {r.auc}
                  </td>
                  <td className="py-1.5 pr-4">{r.recall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          <strong className="text-black dark:text-white">Kết luận:</strong> SVM
          (kernel linear, C=0.01) cho AUC cao nhất (0.8404), là mô hình tối ưu
          nhất trong 3 mô hình trên dữ liệu này. Xem tab &quot;Chạy dò thông
          số&quot; để chạy lại trực tiếp và kiểm chứng kết quả này.
        </p>
      </KhoiNoiDung>
    </div>
  );
}

const CAC_CHUC_NANG = [
  {
    ten: "Trang Dự đoán",
    duong_dan: "/du-doan",
    mo_ta:
      "Nhập thông tin 1 bệnh nhân (giới tính, tuổi, huyết áp, bệnh tim, hôn nhân, nơi ở, công việc, hút thuốc, glucose, BMI) — hệ thống chạy đồng thời cả 3 mô hình đã train sẵn và trả về kết quả dự đoán (có/không nguy cơ đột quỵ) kèm xác suất của từng mô hình, hiển thị cạnh nhau để so sánh.",
  },
  {
    ten: "Trang Cấu hình mô hình",
    duong_dan: "/",
    mo_ta:
      "Xem và chỉnh tham số của cả 3 mô hình ngay trên giao diện (max_depth, K + ngưỡng quyết định, kernel + C...). Giá trị mặc định luôn là cấu hình tốt nhất đã dò được. Mỗi mô hình có biểu đồ minh chứng quá trình dò tham số (điểm tốt nhất đánh dấu ★). Có thể lưu cấu hình tùy chỉnh để trang Dự đoán dùng thử, hoặc khôi phục lại mặc định bất cứ lúc nào.",
  },
  {
    ten: "Trang Chạy dò thông số",
    duong_dan: "/do-truc-tiep",
    mo_ta:
      'Bấm nút "Chạy" để backend tính lại toàn bộ việc dò tham số ngay lúc đó (không đọc kết quả đã lưu sẵn từ trước) — chứng minh trực tiếp cấu hình tốt nhất không phải số liệu cố định. Có thêm ô tùy chọn "Kiểm chứng bằng 5-fold Cross-Validation": bật lên sẽ chạy thêm kiểm định chéo 5 lần cho cấu hình tốt nhất của mỗi mô hình, hiện AUC/Recall trung bình kèm độ lệch chuẩn.',
  },
  {
    ten: "Trang Thông tin đồ án",
    duong_dan: "/thong-tin",
    mo_ta:
      "Trang đang xem — gồm 3 mục: thông tin đề tài/dữ liệu/mô hình, danh sách chức năng của demo, và mô tả kỹ thuật (công nghệ sử dụng, phương pháp đánh giá, cách xử lý mất cân bằng lớp).",
  },
];

function NoiDungChucNang() {
  return (
    <div>
      <KhoiNoiDung tieuDe="Các chức năng đã làm trong demo">
        <p>Demo gồm 4 trang, mỗi trang phục vụ 1 mục đích riêng:</p>
      </KhoiNoiDung>
      <div className="space-y-4 mb-8">
        {CAC_CHUC_NANG.map((cn) => (
          <div
            key={cn.duong_dan}
            className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
          >
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-semibold text-black dark:text-white">
                {cn.ten}
              </h3>
              <code className="text-xs text-blue-600 dark:text-blue-400">
                {cn.duong_dan}
              </code>
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {cn.mo_ta}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoiDungKyThuat() {
  return (
    <div>
      <KhoiNoiDung tieuDe="Công nghệ sử dụng">
        <p>
          <strong className="text-black dark:text-white">
            Backend / Model — Python (scikit-learn, FastAPI):
          </strong>{" "}
          tiền xử lý dữ liệu, huấn luyện Decision Tree / kNN / SVM, đóng gói 3
          model đã train thành 1 API nhận input 1 bệnh nhân, trả JSON kết quả dự
          đoán + xác suất của cả 3 model.
        </p>
        <p>
          <strong className="text-black dark:text-white">
            Frontend — Next.js:
          </strong>{" "}
          form nhập liệu, gọi API Python, hiển thị kết quả và biểu đồ minh chứng
          dò tham số.
        </p>
        <p className="mt-2 font-mono text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
          Next.js (form nhập liệu) → gọi API (FastAPI, chạy model .pkl đã train
          sẵn) → trả JSON kết quả 3 model → Next.js render kết quả
        </p>
      </KhoiNoiDung>

      <KhoiNoiDung tieuDe="Phương pháp đánh giá">
        <p>
          Chia dữ liệu train/test theo tỉ lệ 80/20 (
          <code>random_state=42, stratify=y</code>), giữ{" "}
          <strong className="text-black dark:text-white">giống hệt</strong> cho
          cả 3 mô hình để so sánh công bằng.
        </p>
        <p>
          Độ đo: Accuracy, Precision, Recall, F1, AUC/ROC, Confusion Matrix. Do
          dữ liệu mất cân bằng lớp (~5% dương tính), Accuracy một mình dễ gây
          hiểu lầm (một model luôn đoán &quot;không đột quỵ&quot; vẫn đạt
          Accuracy ~95%) — nên AUC và Recall được dùng làm tiêu chí chính khi
          chọn cấu hình tốt nhất.
        </p>
      </KhoiNoiDung>

      <KhoiNoiDung tieuDe="Xử lý mất cân bằng lớp">
        <p>
          Decision Tree và SVM dùng trực tiếp{" "}
          <code>class_weight=&apos;balanced&apos;</code> (học thẳng vào ranh
          giới quyết định). kNN không có cơ chế class_weight (vì đây là thuật
          toán &quot;ghi nhớ&quot; dữ liệu, không học tham số) — nên được bù
          bằng cách{" "}
          <strong className="text-black dark:text-white">
            hạ ngưỡng quyết định
          </strong>{" "}
          (threshold=0.06 thay vì 0.5 mặc định) để đạt Recall tương đương 2 mô
          hình kia.
        </p>
      </KhoiNoiDung>

      <KhoiNoiDung tieuDe="Trang cấu hình & minh chứng dò tham số">
        <p>
          Trang &quot;Cấu hình mô hình&quot; cho phép chỉnh tham số của cả 3 mô
          hình, giá trị mặc định luôn là cấu hình tốt nhất đã dò được. Mỗi mô
          hình kèm biểu đồ AUC/Recall theo từng giá trị tham số đã thử, điểm tốt
          nhất được đánh dấu ★ — để chứng minh trực quan cấu hình mặc định không
          phải chọn tùy tiện.
        </p>
      </KhoiNoiDung>

      <KhoiNoiDung tieuDe="Trang chạy dò trực tiếp">
        <p>
          Trang &quot;Chạy dò thông số&quot; gọi một API riêng (
          <code>GET /tuning-live/&#123;model&#125;</code>) tính lại toàn bộ bảng
          dò tham số{" "}
          <strong className="text-black dark:text-white">ngay lúc bấm</strong>{" "}
          (không đọc file kết quả đã lưu sẵn), dùng đúng cách chia train/test
          như lúc làm đồ án — để chứng minh kết quả tốt nhất không phải số liệu
          cố định, tính lại lúc nào cũng ra cùng kết quả.
        </p>
      </KhoiNoiDung>
    </div>
  );
}

function NoiDungBaoCao() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-300">
          Bản báo cáo đầy đủ của đồ án (biên soạn bằng LaTeX, xem mã nguồn ở{" "}
          <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
            doc/bao_cao_latex/
          </code>
          ).
        </p>
        <a
          href="/CT603.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0 whitespace-nowrap ml-4"
        >
          Mở trong tab mới
        </a>
      </div>
      <iframe
        src="/CT603.pdf"
        title="Báo cáo đồ án CT603"
        className="w-full h-[85vh] rounded-lg border border-neutral-200 dark:border-neutral-700"
      />
    </div>
  );
}
