# ĐỀ TÀI ĐỒ ÁN — Môn Kho dữ liệu và khai phá dữ liệu (CTH603)

**Giảng viên hướng dẫn:** PGS.TS. Nguyễn Thái Nghe
**Sinh viên thực hiện:** Lê Văn Triệu (MSSV: M2526034), La Quỳnh Như (MSSV: M2526026)
**Hạn báo cáo final (Word + Demo):** 8h ngày 26/12/26

## 1. Tên đề tài
Xây dựng mô hình dự đoán nguy cơ đột quỵ dựa trên các yếu tố lâm sàng và nhân khẩu học, so sánh hiệu quả giữa Decision Tree, k-NN và SVM

## 2. Dữ liệu

- **Nguồn:** Stroke Prediction Dataset — tác giả fedesoriano, đăng trên Kaggle
- **Link:** https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset
- **Bản đã tải về máy:** `data/healthcare-dataset-stroke-data.csv` (5.110 dòng, 310 KB)
- **Ghi chú nguồn:** tác giả ghi xuất xứ là "Confidential Source" (không công bố bệnh viện/tổ chức cụ thể cung cấp) — đây KHÔNG phải dữ liệu từ một cơ quan y tế chính thống, mà là dataset công khai rất phổ biến trong học thuật/khóa học khai phá dữ liệu y tế. Khi viết báo cáo, ghi nguồn là "Kaggle — fedesoriano, Confidential Source", tránh nói "dữ liệu bệnh viện chính thống".

### Cấu trúc dữ liệu (12 cột)
| Cột | Ý nghĩa |
|---|---|
| id | Mã bệnh nhân |
| gender | Giới tính |
| age | Tuổi |
| hypertension | Tăng huyết áp (0/1) |
| heart_disease | Bệnh tim (0/1) |
| ever_married | Tình trạng hôn nhân |
| work_type | Loại công việc |
| Residence_type | Nơi ở (thành thị/nông thôn) |
| avg_glucose_level | Mức glucose trung bình trong máu |
| bmi | Chỉ số khối cơ thể (có giá trị thiếu "N/A") |
| smoking_status | Tình trạng hút thuốc |
| **stroke** | **Nhãn mục tiêu** — 1 = có đột quỵ, 0 = không |

### Lưu ý quan trọng về dữ liệu
- **Mất cân bằng lớp nặng:** chỉ khoảng ~5% bản ghi có stroke = 1. Không nên chỉ báo cáo Accuracy (dễ đạt ~95% dù mô hình dự đoán dở) — bắt buộc báo cáo thêm F1, Recall, AUC/ROC, Confusion Matrix.
- Cột `bmi` có giá trị thiếu (N/A) — cần xử lý (loại bỏ hoặc điền giá trị trung bình/trung vị) trước khi train.
- Các cột phân loại (gender, ever_married, work_type, Residence_type, smoking_status) cần mã hóa (Label Encoding/One-Hot) trước khi đưa vào mô hình.

## 3. Công nghệ sử dụng

**Backend / Model: Python (scikit-learn)**
- Tiền xử lý dữ liệu, train Decision Tree / kNN / SVM, đánh giá cross-validation
- Đóng gói 3 model đã train thành 1 API nhỏ bằng **FastAPI** (hoặc Flask) — nhận input 1 bệnh nhân, trả JSON kết quả dự đoán + xác suất của cả 3 model

**Frontend: Next.js**
- Form nhập liệu đơn giản (tuổi, huyết áp, glucose, BMI, hút thuốc...) → gọi API Python → hiển thị bảng/card so sánh kết quả 3 model
- Dùng chung stack với dự án EMR thật của nhóm (`dktw.cusc.vn`)

**Luồng tổng thể:**
```
Next.js (form nhập liệu)
   → gọi API (FastAPI, Python, chạy model .pkl đã train sẵn)
   → trả JSON kết quả 3 model
   → Next.js render bảng so sánh
```

**Lý do tách riêng:** các thư viện ML chuẩn (scikit-learn, cross-validation, xử lý mất cân bằng lớp...) ở Python mạnh và quen thuộc hơn (đã dùng xuyên suốt các bài tập môn này). Next.js chỉ lo giao diện, không gánh phần huấn luyện mô hình.

## 4. Mô hình áp dụng (2-3 model đã học trong môn)

1. **Decision Tree** (J48/ID3) — phân lớp dựa trên luật cây quyết định
2. **k-Nearest Neighbors (kNN)** — thử nhiều giá trị K (ví dụ K=1,3,5,7,9...) để tìm K cho sai số nhỏ nhất
3. **Support Vector Machine (SVM)** — phân lớp bằng siêu phẳng tối ưu

## 5. Phương pháp đánh giá
- Cross-validation (5-fold) — **Đã làm (Bước 7)**, xem [Nhatkythuchien.md § Bước 7](doc/Nhatkythuchien.md). Kết quả: thứ hạng 3 mô hình (SVM > Decision Tree > kNN) giữ nguyên so với cách đánh giá 1 lần chia train/test, std AUC nhỏ (0.02-0.025) — xác nhận kết quả ổn định, không phải ngẫu nhiên.
- Độ đo: Accuracy, Precision, Recall, F1, AUC/ROC Area, Confusion Matrix
- So sánh 3 mô hình để kết luận mô hình nào tối ưu hơn trên tập dữ liệu này

## 6. Sản phẩm demo

Gồm 2 trang:

1. **Trang dự đoán:** nhập thông tin 1 bệnh nhân (tuổi, huyết áp, bệnh tim, glucose, BMI, hút thuốc...) → hệ thống chạy cả 3 mô hình → hiển thị kết quả dự đoán (có/không nguy cơ đột quỵ) và so sánh độ tin cậy của từng mô hình.
2. **Trang cấu hình mô hình:** cho phép chỉnh tham số của cả 3 mô hình (Decision Tree: max_depth...; kNN: số K; SVM: kernel, C...). **Giá trị mặc định = cấu hình tốt nhất đã tìm được trong quá trình thực nghiệm** (ví dụ: Decision Tree dùng max_depth đã dò ra tối ưu ở Bước 2c, kNN dùng K tối ưu ở Bước 3, SVM dùng tham số tối ưu ở Bước 4) — người xem demo có thể chỉnh lại để tự thử nghiệm, nhưng mặc định luôn là cấu hình tốt nhất nhóm đã chọn.
3. **Mục "Minh chứng dò tham số" trong trang cấu hình (mỗi mô hình 1 biểu đồ):** hiển thị lại quá trình dò tham số đã làm trong đồ án — trục ngang là giá trị tham số đã thử (max_depth, K, C...), trục dọc là AUC/Recall đo được ở từng giá trị, điểm được chọn làm mặc định được đánh dấu nổi bật (ví dụ chấm màu khác + chú thích "tốt nhất"). Mục đích: chứng minh trực quan cho giảng viên thấy cấu hình mặc định không phải chọn tùy tiện, mà có thực nghiệm dò nhiều giá trị đứng sau — đúng tinh thần yêu cầu "tăng/giảm K để chọn độ sai nhỏ nhất" của đề tài.

**Lưu ý khi làm API/dữ liệu (Bước 6):**
- Vì giao diện cho chỉnh tham số trực tiếp, API không chỉ load model `.pkl` đã train sẵn 1 lần — cần hỗ trợ train lại nhanh (hoặc load nhiều phiên bản model đã lưu sẵn ứng với các cấu hình phổ biến) khi người dùng đổi tham số trên trang cấu hình.
- Để vẽ được biểu đồ "Minh chứng dò tham số", mỗi mô hình (Decision Tree, kNN, SVM) khi dò tham số đều phải lưu kết quả dò ra 1 file CSV/JSON (đã làm cho Decision Tree: `data/decision_tree_tuning_results.csv`) — API đọc các file này để trả dữ liệu cho FE vẽ biểu đồ, không cần dò lại realtime mỗi lần tải trang.
- Khi dựng các biểu đồ này trong Next.js, dùng skill `dataviz` để đảm bảo màu sắc/trục/chú thích nhất quán, dễ đọc.

## 7. Cấu hình tốt nhất đã tìm được (cập nhật liên tục — dùng làm mặc định cho trang cấu hình ở Bước 6)

| Mô hình | Tham số tốt nhất | AUC (1 lần chia) | AUC (5-fold CV, TB±std) | Recall | Ghi chú | Chi tiết |
|---|---|---|---|---|---|---|
| Decision Tree | `max_depth=4, class_weight='balanced'` | 0.8305 | 0.7853 ± 0.0239 | 0.8400 | Đã chốt (Bước 2c) | [Nhatkythuchien.md § Bước 2c](doc/Nhatkythuchien.md) |
| kNN | `K=16, weights='uniform', threshold=0.06` (cần chuẩn hóa StandardScaler trước) | 0.7831 | 0.7098 ± 0.0200 | 0.8400 | Đã chốt (Bước 3b+3c) | [Nhatkythuchien.md § Bước 3c](doc/Nhatkythuchien.md) |
| SVM | `kernel='linear', C=0.01, class_weight='balanced'` (cần chuẩn hóa StandardScaler trước) | **0.8404** | **0.8379 ± 0.0249** | 0.8400 | Đã chốt (Bước 4) | [Nhatkythuchien.md § Bước 4](doc/Nhatkythuchien.md) |

Cột "AUC (5-fold CV)" lấy từ Bước 7 — xác nhận SVM vẫn tối ưu nhất khi đánh giá bằng 5-fold Cross-Validation, không chỉ 1 lần chia train/test.

## 8. Cách làm việc (quan trọng — đọc trước khi bắt đầu)

Người làm đồ án chưa rành Python và chưa rành nguyên lý các mô hình → **làm từng bước nhỏ, không dồn code một lượt rồi giải thích sau.** Mỗi bước: giải thích ngắn gọn → viết code → chạy xem kết quả thật → giải thích kết quả nói lên điều gì. Lý do: cần hiểu đủ để bảo vệ đồ án trước thầy, và khớp với cách đã học suốt môn (tính tay/hiểu nguyên lý trước, đối chiếu thư viện sau).

**Trình tự 6 bước:**
1. Xem & tiền xử lý dữ liệu (hiểu dữ liệu có gì, vì sao xử lý N/A, mã hóa, mất cân bằng lớp)
2. Decision Tree — nguyên lý + code + kết quả
3. kNN — nguyên lý + code + dò K + kết quả
4. SVM — nguyên lý + code + kết quả
5. So sánh 3 model (bảng so sánh, kết luận)
6. API (FastAPI) + giao diện Next.js — ghép thành demo hoàn chỉnh

## 9. Việc cần làm tiếp theo
- [x] Thống kê mô tả + tiền xử lý dữ liệu (xử lý N/A ở bmi, mã hóa biến phân loại, xử lý mất cân bằng lớp) — Bước 1
- [x] Cài đặt và huấn luyện 3 mô hình (Python/sklearn) — Bước 2, 3, 4
- [x] Dò tham số tối ưu cho cả 3 mô hình (max_depth, K+threshold, kernel×C) — Bước 2c, 3b-3c, 4
- [x] Đánh giá, lập bảng so sánh Accuracy/Precision/Recall/F1/AUC giữa 3 mô hình, vẽ biểu đồ ROC — Bước 5. **Kết luận: SVM (linear, C=0.01) tối ưu nhất, AUC=0.8404**
- [x] Viết giao diện demo: trang dự đoán (nhập 1 bệnh nhân → chạy 3 model) + trang cấu hình (chỉnh tham số, mặc định = cấu hình tốt nhất, có biểu đồ minh chứng dò tham số) + trang chạy dò trực tiếp + trang thông tin đồ án — Bước 6 (6a: lưu model .pkl, 6b: API FastAPI, 6c: giao diện Next.js). **Đã chạy thử thành công end-to-end.**
- [x] 5-fold Cross-Validation cho cấu hình tốt nhất của cả 3 mô hình — Bước 7. **Xác nhận SVM vẫn tối ưu nhất (AUC CV = 0.8379), kết quả ổn định qua 5 lần chia dữ liệu khác nhau.**
- [ ] Viết báo cáo Word + chuẩn bị demo (nội dung đã có sẵn trong doc/Nhatkythuchien.md, chỉ cần biên tập lại)
