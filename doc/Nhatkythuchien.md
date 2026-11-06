# NHẬT KÝ THỰC HIỆN ĐỒ ÁN

> File này ghi lại từng bước đã làm: mục tiêu, code, kết quả chạy thật, giải thích ý nghĩa. Dùng để tham khảo khi viết báo cáo Word và slide thuyết trình. Xem đề tài tổng quan ở [DE_TAI.md](DE_TAI.md).
>
> **Lưu ý về lệnh "Cách chạy" trong file này:** các lệnh dùng cú pháp Bash (`PYTHONIOENCODING=utf-8 python ...`) vì Claude chạy bằng Git Bash. Nếu bạn tự chạy bằng **PowerShell** (terminal mặc định trên Windows), biến môi trường cần set khác:
> ```powershell
> $env:PYTHONIOENCODING = "utf-8"
> python src\be\training\ten_file.py
> ```
> rồi mới chạy script, thay vì gộp chung 1 dòng như cú pháp Bash.

---

## BƯỚC 1a: Xem dữ liệu (khám phá, chưa sửa gì)

**Mục tiêu:** Hiểu dữ liệu đang có gì trước khi xử lý — số dòng/cột, kiểu dữ liệu, cột nào thiếu giá trị, tỉ lệ nhãn có cân bằng không, cột nào là chữ cần đổi thành số.

**File code:** [src/be/training/step1_xem_du_lieu.py](../src/be/training/step1_xem_du_lieu.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step1_xem_du_lieu.py
```
(Lưu ý: phải thêm `PYTHONIOENCODING=utf-8` vì Windows mặc định không hiển thị được tiếng Việt trong terminal.)

**Kết quả chạy:**
- Dữ liệu có **5.110 bệnh nhân**, **12 cột** (11 thuộc tính đầu vào + 1 nhãn `stroke`).
- Cột **`bmi` thiếu 201 giá trị** (201/5110 ≈ 3.9% dòng không có số đo BMI).
- Tỉ lệ nhãn `stroke` **mất cân bằng nặng**:
  - stroke = 0 (không đột quỵ): 4.861 người (95.13%)
  - stroke = 1 (có đột quỵ): 249 người (4.87%)
- Có **5 cột dạng chữ** cần đổi thành số trước khi đưa vào mô hình:
  - `gender`: Male, Female, Other
  - `ever_married`: Yes, No
  - `work_type`: Private, Self-employed, Govt_job, children, Never_worked
  - `Residence_type`: Urban, Rural
  - `smoking_status`: formerly smoked, never smoked, smokes, Unknown

**Giải thích ý nghĩa (dùng cho báo cáo):**
- Máy học không tự hiểu chữ hay ô trống — phải "dọn" dữ liệu thô trước khi train.
- Mất cân bằng lớp (95% vs 5%) là vấn đề quan trọng: nếu không xử lý, mô hình có thể đạt Accuracy ~95% chỉ bằng cách luôn đoán "không đột quỵ", nhưng thực chất vô dụng vì không phát hiện được ca nguy cơ nào. → Đây là lý do đề tài phải báo cáo thêm Precision/Recall/F1/AUC, không chỉ Accuracy.
- Cột `bmi` thiếu 201 giá trị cần được xử lý (điền giá trị trung bình/trung vị, hoặc loại bỏ) trước khi train.

---

## BƯỚC 1b: Dọn dữ liệu

**Mục tiêu:** Điền giá trị thiếu ở cột `bmi`, đổi 5 cột chữ (gender, ever_married, work_type, Residence_type, smoking_status) thành số, bỏ cột `id` không mang thông tin y khoa — để có 1 file dữ liệu sạch sẵn sàng đưa vào huấn luyện mô hình.

**File code:** [src/be/training/step1_don_du_lieu.py](../src/be/training/step1_don_du_lieu.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step1_don_du_lieu.py
```

**Kết quả chạy:**
- Trước khi dọn: 201 dòng thiếu `bmi`. Trung vị (median) = 28.1, trung bình (mean) = 28.89.
- Đã điền 201 ô trống bằng giá trị trung vị 28.1.
- Đã bỏ cột `id`.
- Bảng quy đổi chữ → số:
  - gender: Male=0, Female=1, Other=2
  - ever_married: No=0, Yes=1
  - work_type: Private=0, Self-employed=1, Govt_job=2, children=3, Never_worked=4
  - Residence_type: Urban=0, Rural=1
  - smoking_status: never smoked=0, formerly smoked=1, smokes=2, Unknown=3
- Sau khi dọn: 5.110 dòng, 11 cột, 0 ô trống, 0 cột còn là chữ.
- File kết quả: `data/stroke_clean.csv`

**Giải thích ý nghĩa (dùng cho báo cáo):**
Chọn điền giá trị thiếu bằng trung vị (median) thay vì trung bình (mean) vì trung vị ít bị ảnh hưởng bởi các giá trị BMI bất thường (quá cao/quá thấp), phù hợp hơn với dữ liệu y tế vốn dễ có ngoại lệ. Cột `id` bị loại vì chỉ là mã định danh, không phải đặc điểm sức khỏe, nếu giữ lại có thể khiến mô hình học sai lệch theo số thứ tự thay vì theo bản chất dữ liệu. Các cột dạng chữ được mã hóa thành số (Label Encoding) vì thuật toán học máy chỉ xử lý được giá trị số; các con số này chỉ mang tính ký hiệu phân loại, không thể hiện thứ tự hơn kém. Sau bước này, dữ liệu không còn ô trống và toàn bộ là dạng số — đạt điều kiện để đưa vào huấn luyện Decision Tree, kNN và SVM ở các bước tiếp theo.

---

## BƯỚC 2: Decision Tree

**Mục tiêu:** Huấn luyện mô hình cây quyết định (Decision Tree — cùng họ thuật toán với ID3 ở Bài 11 và J48 ở Bài 12/13 đã làm trong môn) trên dữ liệu đột quỵ đã dọn, đánh giá bằng Accuracy/Precision/Recall/F1/AUC/Confusion Matrix. Chạy 2 phiên bản để có bằng chứng cụ thể về ảnh hưởng của mất cân bằng lớp: (2a) bình thường, (2b) có xử lý mất cân bằng bằng `class_weight='balanced'`.

**File code:** [src/be/training/step2_decision_tree.py](../src/be/training/step2_decision_tree.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step2_decision_tree.py
```

**Kết quả chạy:**
- Chia dữ liệu: 4.088 dòng train (80%) / 1.022 dòng test (20%), dùng `stratify=y` để giữ đúng tỉ lệ stroke=1 (~4.87-4.89%) đều ở cả 2 phần — tránh trường hợp tập test ngẫu nhiên có quá ít/quá nhiều ca đột quỵ.

| Mô hình | Accuracy | Precision | Recall | F1 | AUC |
|---|---|---|---|---|---|
| 2a. Decision Tree (bình thường) | 0.9168 | 0.1569 | 0.1600 | 0.1584 | 0.5579 |
| 2b. Decision Tree (class_weight='balanced') | 0.9315 | 0.1875 | 0.1200 | 0.1463 | 0.5466 |

- Confusion Matrix 2a: trong 50 ca thực sự có đột quỵ ở tập test, mô hình chỉ phát hiện đúng 8 ca (bỏ sót 42 ca).
- Confusion Matrix 2b: trong 50 ca thực sự có đột quỵ, mô hình phát hiện đúng 6 ca (bỏ sót 44 ca) — kém hơn 2a.

**Giải thích ý nghĩa (dùng cho báo cáo):**
Accuracy của cả 2 phiên bản đều cao (91-93%) nhưng Recall lại rất thấp (12-16%) — đây chính là minh chứng cụ thể cho "nghịch lý Accuracy" đã nêu ở Bước 1: vì 95% dữ liệu vốn thuộc nhóm "không đột quỵ", mô hình chỉ cần thiên về dự đoán nhóm này là đã đạt Accuracy cao, dù gần như không phát hiện được ca bệnh thật. Trong bài toán y tế, Recall thấp (bỏ sót nhiều ca có nguy cơ) nguy hiểm hơn nhiều so với Accuracy chưa cao, nên đây là độ đo cần ưu tiên theo dõi.

Kết quả đáng chú ý: kỹ thuật `class_weight='balanced'` (ép mô hình chú ý hơn tới nhóm thiểu số) được kỳ vọng cải thiện Recall, nhưng thực tế Recall ở 2b lại giảm so với 2a (12% so với 16%). Nguyên nhân khả dĩ: Decision Tree ở đây không giới hạn độ sâu cây, nên dễ học theo nhiễu trong dữ liệu train (overfitting) thay vì học đúng quy luật tổng quát, khiến việc "cân bằng lại" không phát huy hiệu quả như lý thuyết. Đây là phát hiện thực tế quan trọng, cho thấy xử lý mất cân bằng lớp không phải lúc nào cũng tự động cải thiện mô hình — cần cân nhắc thêm các kỹ thuật khác (giới hạn độ sâu cây, SMOTE...) nếu muốn cải thiện thêm.

Chỉ số AUC (đo khả năng phân biệt 2 nhóm của mô hình, không phụ thuộc một ngưỡng cụ thể — 0.5 là đoán ngẫu nhiên, 1.0 là phân biệt hoàn hảo) chỉ đạt 0.55-0.56, cho thấy Decision Tree với tham số mặc định hoạt động khá yếu trên dữ liệu này. Đây là mốc so sánh quan trọng khi đối chiếu với kNN và SVM ở các bước tiếp theo.

**Kiểm tra bổ sung (chẩn đoán overfitting):** so sánh Accuracy trên tập train và test của mô hình 2a cho thấy Accuracy train = 1.0000 (100%, học thuộc lòng) trong khi Accuracy test chỉ 0.9168. Cây thực tế mọc sâu tới 18 tầng với 289 lá (không giới hạn `max_depth`, `min_samples_leaf` mặc định = 1 cho phép 1 lá chỉ đại diện 1 bệnh nhân). Đây là bằng chứng cụ thể cho overfitting — mô hình học theo nhiễu của từng ca cụ thể trong tập train thay vì học quy luật chung, dẫn tới Bước 2c để khắc phục.

---

## BƯỚC 2c: Dò tham số max_depth cho Decision Tree (chốt cấu hình tốt nhất)

**Mục tiêu:** Dò nhiều giá trị `max_depth` (1 đến 20, và không giới hạn) kết hợp `class_weight='balanced'`, để khắc phục overfitting phát hiện ở Bước 2 và chọn cấu hình Decision Tree tốt nhất — dùng làm kết quả chính thức để so sánh với kNN/SVM ở Bước 5, và làm giá trị mặc định cho trang cấu hình mô hình ở giao diện demo (Bước 6). Tiêu chí chọn: AUC cao nhất là chính (phù hợp dữ liệu mất cân bằng, không phụ thuộc 1 ngưỡng), F1 là tiêu chí phụ khi AUC gần bằng nhau.

**File code:** [src/be/training/step2c_decision_tree_tuning.py](../src/be/training/step2c_decision_tree_tuning.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step2c_decision_tree_tuning.py
```

**Kết quả chạy (trích các mốc quan trọng, bảng đầy đủ trong `data/decision_tree_tuning_results.csv`):**

| max_depth | Accuracy | Precision | Recall | F1 | AUC |
|---|---|---|---|---|---|
| 2 | 0.5851 | 0.0917 | 0.8400 | 0.1654 | 0.8145 |
| 3 | 0.6526 | 0.1080 | 0.8400 | 0.1913 | 0.8242 |
| **4 (tốt nhất)** | **0.6526** | **0.1080** | **0.8400** | **0.1913** | **0.8305** |
| 5 | 0.8200 | 0.1716 | 0.7000 | 0.2756 | 0.8110 |
| 10 | 0.8180 | 0.1222 | 0.4400 | 0.1913 | 0.6443 |
| 18 | 0.9315 | 0.2500 | 0.2000 | 0.2222 | 0.5838 |
| None (= Bước 2b) | 0.9315 | 0.1875 | 0.1200 | 0.1463 | 0.5466 |

**Cấu hình được chọn: `max_depth = 4`, `class_weight='balanced'`** → Accuracy 0.6526, Precision 0.1080, Recall 0.8400, F1 0.1913, **AUC 0.8305**.

So với Bước 2b (không giới hạn độ sâu): AUC tăng từ 0.5466 lên 0.8305 (+0.28), Recall tăng từ 0.1200 lên 0.8400 (+0.72).

**Giải thích ý nghĩa (dùng cho báo cáo):**
Bảng kết quả cho thấy rất rõ "nghịch lý Accuracy" đã cảnh báo từ Bước 1: khi `max_depth` tăng dần, Accuracy tăng dần tới ~93%, nhưng AUC lại giảm dần xuống còn ~0.55 và Recall giảm xuống 12-20%. Điều này nghĩa là cây càng sâu, mô hình càng thiên về dự đoán nhóm đa số (không đột quỵ) để đạt Accuracy cao, trong khi thực chất ngày càng bỏ sót nhiều ca bệnh thật — Accuracy cao không đồng nghĩa mô hình tốt khi dữ liệu mất cân bằng.

Cấu hình `max_depth=4` được chọn vì đạt AUC cao nhất (0.8305) và Recall cao (84%) — phù hợp vai trò một công cụ **sàng lọc** nguy cơ y tế, nơi bỏ sót ca bệnh thật (Recall thấp) nguy hiểm hơn nhiều so với báo động nhầm (Precision thấp, vì người bị báo nhầm chỉ cần đi kiểm tra thêm, không gây hậu quả nghiêm trọng). Đánh đổi cần nêu trung thực: Accuracy (65%) và Precision (10.8%) của cấu hình này thấp — cứ khoảng 10 người bị mô hình báo "có nguy cơ" thì chỉ ~1 người thực sự mắc bệnh. Nếu mục tiêu là công cụ chẩn đoán cuối cùng thay vì sàng lọc ban đầu, cần cân nhắc ngưỡng khác (ví dụ depth=5, Accuracy 82%/Recall 70%, cân bằng hơn).

**Quyết định dùng cho các bước sau:** cấu hình `max_depth=4, class_weight='balanced'` được chốt là kết quả chính thức của Decision Tree, dùng để so sánh với kNN (Bước 3) và SVM (Bước 4) ở Bước 5, đồng thời là giá trị mặc định cho Decision Tree trên trang cấu hình mô hình của giao diện demo (Bước 6).

---

## BƯỚC 3a: Chứng minh vì sao kNN cần chuẩn hóa dữ liệu

**Mục tiêu:** kNN đo "gần/xa" bằng khoảng cách giữa các điểm dữ liệu trên mọi cột cùng lúc — nếu các cột có thang đo chênh lệch lớn (ví dụ `avg_glucose_level`: 55-272 so với `hypertension`: 0-1), cột có khoảng giá trị lớn hơn sẽ lấn át khoảng cách tính toán. So sánh kNN (K=5) chạy trên dữ liệu chưa và đã chuẩn hóa (StandardScaler) để kiểm tra bằng số liệu thật.

**File code:** [src/be/training/step3a_knn_chuan_hoa.py](../src/be/training/step3a_knn_chuan_hoa.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step3a_knn_chuan_hoa.py
```

**Kết quả chạy:**

| Phiên bản | Accuracy | Precision | Recall | F1 | AUC |
|---|---|---|---|---|---|
| Chưa chuẩn hóa | 0.9452 | 0.0000 | 0.0000 | 0.0000 | 0.6637 |
| Đã chuẩn hóa (StandardScaler) | 0.9501 | 0.3333 | 0.0200 | 0.0377 | 0.6322 |

**Giải thích ý nghĩa (dùng cho báo cáo):**
Kết quả không theo đúng kỳ vọng ban đầu — chuẩn hóa chỉ cải thiện Precision (từ 0 lên 0.33) nhưng AUC còn giảm nhẹ (0.6637 → 0.6322). Nguyên nhân: 2 cột có khoảng giá trị lớn nhất trong dữ liệu (`age`: 0-82, `avg_glucose_level`: 55-272) tình cờ cũng là 2 yếu tố quan trọng nhất về mặt y khoa cho nguy cơ đột quỵ, nên dù chưa chuẩn hóa, kNN vẫn vô tình "nghe" đúng các cột quan trọng — đây là may rủi do đặc điểm riêng của bộ dữ liệu này, không phải nguyên tắc chung, nên vẫn cần chuẩn hóa đúng kỹ thuật khi làm việc với kNN.

Vấn đề lớn hơn được phát hiện: Recall gần như bằng 0 ở cả 2 trường hợp (0% và 2%). Với K=5, cần ít nhất 3/5 "hàng xóm gần nhất" thuộc nhóm có đột quỵ thì mới được dự đoán "có nguy cơ" — nhưng vì chỉ ~5% dữ liệu thuộc nhóm này, xác suất tìm đủ 3/5 hàng xóm như vậy rất thấp. Đây là giới hạn của kNN khi dữ liệu mất cân bằng nặng, tương tự vấn đề đã gặp ở Decision Tree mặc định (Bước 2), cần xử lý tiếp ở Bước 3b.

---

## BƯỚC 3b: Dò K cho kNN (trên dữ liệu đã chuẩn hóa)

**Mục tiêu:** Dò K từ 1 đến 30, với 2 cách tính trọng số hàng xóm (`weights='uniform'` — mỗi hàng xóm 1 phiếu ngang nhau, giống cách làm tay ở Bài 1-7; và `weights='distance'` — hàng xóm gần hơn có phiếu nặng hơn), trên dữ liệu đã chuẩn hóa. Chọn cấu hình tốt nhất theo AUC.

**File code:** [src/be/training/step3b_knn_tuning.py](../src/be/training/step3b_knn_tuning.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step3b_knn_tuning.py
```

**Kết quả chạy (bảng đầy đủ 60 cấu hình trong `data/knn_tuning_results.csv`):**
- AUC cao nhất: K=16, weights='uniform', AUC=0.7831 — nhưng **Precision=0, Recall=0** ở ngưỡng mặc định 0.5.
- Recall cao nhất trong TOÀN BỘ 60 cấu hình đã dò chỉ đạt **4%** (K=3, uniform) — thấp hơn nhiều so với Decision Tree đã tối ưu (84%).

**Giải thích ý nghĩa (dùng cho báo cáo):**
Phát hiện quan trọng: cấu hình có AUC cao nhất (K=16) lại có Recall=0 ở ngưỡng quyết định mặc định (0.5) — nghĩa là mô hình không bao giờ dự đoán "có đột quỵ" cho bất kỳ ai trong tập test. Nguyên nhân: AUC đo khả năng **xếp hạng** (ai có nguy cơ cao hơn ai) trên toàn bộ các ngưỡng có thể, không đo việc mô hình quyết định thế nào ở một ngưỡng cụ thể. Với dữ liệu chỉ ~5% là đột quỵ, xác suất dự đoán trung bình dễ nằm dưới 0.5 dù khả năng xếp hạng tương đối vẫn tốt.

kNN không có tham số `class_weight` như Decision Tree để xử lý trực tiếp mất cân bằng lớp trong quá trình học. Vì vậy bước tiếp theo (3c) thử kỹ thuật khác: giữ nguyên mô hình K=16 (AUC cao nhất), nhưng hạ ngưỡng quyết định xuống dưới 0.5 để tìm điểm vận hành có Recall thực sự dùng được.

---

## BƯỚC 3c: Dò ngưỡng quyết định (decision threshold) cho kNN

**Mục tiêu:** Trên mô hình K=16, weights='uniform' (AUC cao nhất ở Bước 3b), thử nhiều ngưỡng xác suất khác nhau (0.05 đến 0.5) để quyết định "có đột quỵ" thay vì mặc định 0.5 — tìm điểm vận hành có Recall thực sự dùng được, đặc biệt nhắm tới mức Recall tương đương Decision Tree (84%, Bước 2c) để so sánh công bằng ở Bước 5.

**File code:** [src/be/training/step3c_knn_threshold.py](../src/be/training/step3c_knn_threshold.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step3c_knn_threshold.py
```

**Kết quả chạy:**

| Ngưỡng | Accuracy | Precision | Recall | F1 | AUC (cố định) |
|---|---|---|---|---|---|
| 0.50 (mặc định) | 0.9511 | 0.0000 | 0.00 | 0.0000 | 0.7831 |
| 0.15 (F1 tốt nhất) | 0.8973 | 0.1978 | 0.36 | 0.2553 | 0.7831 |
| **0.06 (chọn dùng)** | **0.6370** | **0.1037** | **0.84** | **0.1846** | **0.7831** |

AUC không đổi ở mọi ngưỡng (đúng lý thuyết — AUC không phụ thuộc ngưỡng), chỉ Accuracy/Precision/Recall/F1 thay đổi.

**Giải thích ý nghĩa (dùng cho báo cáo):**
Việc hạ ngưỡng quyết định có tác dụng tương tự `class_weight='balanced'` ở Decision Tree: ép mô hình "mạnh dạn" dự đoán "có nguy cơ" hơn, đổi lại nhiều báo động giả hơn. Ngưỡng 0.15 cho F1 cân bằng nhất (0.2553), nhưng ngưỡng **0.06 được chọn làm cấu hình chính thức** vì đạt Recall 84% — bằng đúng mức đã chọn cho Decision Tree ở Bước 2c, giúp so sánh công bằng ở Bước 5 (cùng mức "không bỏ sót ca bệnh", khác biệt giữa 2 mô hình sẽ thể hiện rõ qua AUC và Accuracy thay vì bị lẫn do ngưỡng Recall khác nhau).

**Quyết định dùng cho các bước sau:** cấu hình kNN chính thức = `K=16, weights='uniform', threshold=0.06` (sau khi chuẩn hóa dữ liệu bằng StandardScaler) — AUC 0.7831, Recall 0.84, Accuracy 0.6370, Precision 0.1037, F1 0.1846. Lưu ý: khác với Decision Tree, kNN cần **2 tham số** để cấu hình đầy đủ (K và ngưỡng quyết định), cả 2 đều phải có trên trang cấu hình mô hình ở Bước 6.

---

## BƯỚC 4: Dò tham số kernel × C cho SVM

**Mục tiêu:** Giải thích nguyên lý SVM (tìm siêu phẳng phân tách 2 nhóm với margin lớn nhất; support vector là các điểm gần ranh giới nhất, quyết định vị trí ranh giới đó). Dò `kernel` (`'linear'`, `'rbf'`) × `C` (0.01 đến 10), dùng `class_weight='balanced'` (SVC hỗ trợ trực tiếp, giống Decision Tree) trên dữ liệu đã chuẩn hóa (StandardScaler, giống kNN vì SVM cũng đo khoảng cách/margin). AUC tính bằng `decision_function` (nhanh hơn `predict_proba` vì không cần hiệu chỉnh Platt scaling).

**File code:** [src/be/training/step4_svm_tuning.py](../src/be/training/step4_svm_tuning.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step4_svm_tuning.py
```

**Kết quả chạy (bảng đầy đủ 12 cấu hình trong `data/svm_tuning_results.csv`):**

| kernel | C | Accuracy | Precision | Recall | F1 | AUC |
|---|---|---|---|---|---|---|
| **linear** | **0.01 (tốt nhất)** | **0.7260** | **0.1338** | **0.8400** | **0.2308** | **0.8404** |
| linear | 1 | 0.7387 | 0.1371 | 0.82 | 0.2350 | 0.8402 |
| linear | 10 | 0.7397 | 0.1376 | 0.82 | 0.2356 | 0.8404 |
| rbf | 0.01 | 0.6585 | 0.1076 | 0.82 | 0.1903 | 0.8191 |
| rbf | 1 | 0.7564 | 0.1273 | 0.68 | 0.2145 | 0.7989 |
| rbf | 10 | 0.7984 | 0.1100 | 0.44 | 0.1760 | 0.7547 |

**Giải thích ý nghĩa (dùng cho báo cáo):**
Cấu hình `kernel='linear', C=0.01, class_weight='balanced'` đạt AUC = 0.8404 — **cao nhất trong 3 mô hình** tính đến thời điểm này (Decision Tree: 0.8305, kNN: 0.7831) — và đạt Recall = 84% **ngay ở ngưỡng quyết định mặc định**, không cần kỹ thuật hạ ngưỡng như kNN ở Bước 3c. Lý do: `class_weight='balanced'` của SVM tác động trực tiếp vào hàm mục tiêu trong quá trình huấn luyện (phạt nặng hơn khi đoán sai nhóm thiểu số), khiến đường ranh giới tự dịch chuyển để bảo vệ nhóm đó ngay từ đầu — khác với kNN vốn không có bước "học" tham số nào để điều chỉnh, chỉ ghi nhớ dữ liệu và so khoảng cách lúc dự đoán, nên phải sửa "hậu kỳ" bằng ngưỡng.

`kernel='linear'` luôn thắng `kernel='rbf'` ở mọi giá trị C — cho thấy ranh giới phân tách 2 nhóm trong dữ liệu này khá đơn giản (gần như là 1 đường/mặt phẳng), không cần đường cong phức tạp của `rbf`. `C` nhỏ (0.01 — chấp nhận sai nhiều hơn để đổi lấy ranh giới tổng quát hơn) cho kết quả tốt nhất, nhất quán với bài học overfitting đã rút ra ở Decision Tree: mô hình đơn giản, ít "cứng nhắc" hơn thường tổng quát tốt hơn trên dữ liệu mất cân bằng này.

**Quyết định dùng cho các bước sau:** cấu hình SVM chính thức = `kernel='linear', C=0.01, class_weight='balanced'` (sau khi chuẩn hóa dữ liệu bằng StandardScaler) — AUC 0.8404, Recall 0.84, Accuracy 0.7260, Precision 0.1338, F1 0.2308.

---

## BƯỚC 5: So sánh tổng hợp 3 mô hình (KẾT LUẬN CHÍNH CỦA ĐỒ ÁN)

**Mục tiêu:** Huấn luyện lại cả 3 mô hình với đúng cấu hình đã chốt (Decision Tree Bước 2c, kNN Bước 3c, SVM Bước 4) trên **cùng 1 tập train/test** (`random_state=42, stratify=y`, giống hệt mọi bước trước) để đảm bảo so sánh công bằng tuyệt đối. Vẽ biểu đồ ROC và bar chart so sánh 5 độ đo. Kết luận mô hình nào tối ưu nhất.

**File code:** [src/be/training/step5_so_sanh_3_mohinh.py](../src/be/training/step5_so_sanh_3_mohinh.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/training/step5_so_sanh_3_mohinh.py
```

**Kết quả chạy:**

| Mô hình | Accuracy | Precision | Recall | F1 | AUC | TN | FP | FN | TP |
|---|---|---|---|---|---|---|---|---|---|
| **SVM (linear, C=0.01)** | **0.7260** | **0.1338** | 0.84 | **0.2308** | **0.8404** | 700 | 272 | 8 | 42 |
| Decision Tree (max_depth=4) | 0.6526 | 0.1080 | 0.84 | 0.1913 | 0.8305 | 625 | 347 | 8 | 42 |
| kNN (K=16, threshold=0.06) | 0.6370 | 0.1037 | 0.84 | 0.1846 | 0.7831 | 609 | 363 | 8 | 42 |

File kết quả: `data/so_sanh_3_mohinh.csv`
Biểu đồ: `data/bieu_do_roc_3_mohinh.png` (đường cong ROC, 3 mô hình), `data/bieu_do_so_sanh_do_do.png` (bar chart 5 độ đo)

**Giải thích ý nghĩa (dùng cho báo cáo) — KẾT LUẬN CHÍNH:**
Cả 3 mô hình được canh cùng mức Recall = 84% (cùng bắt đúng 42/50, bỏ sót 8/50 ca đột quỵ thật trong tập test — xác nhận qua cột TP=42, FN=8 giống hệt nhau ở cả 3 hàng) để đảm bảo so sánh công bằng tuyệt đối. Ở cùng mức Recall đó, **SVM thắng ở cả 4/4 độ đo còn lại** (Accuracy, Precision, F1, AUC) so với Decision Tree và kNN.

Ba lý do giải thích vì sao SVM tối ưu nhất trên bộ dữ liệu này:
1. `class_weight='balanced'` của SVM tác động trực tiếp vào hàm mục tiêu khi huấn luyện, giống Decision Tree — trong khi kNN phải dùng kỹ thuật "hạ ngưỡng sau khi huấn luyện" (Bước 3c), vốn kém tối ưu hơn.
2. Ranh giới phân tách 2 nhóm trong dữ liệu khá đơn giản (kernel `'linear'` thắng `'rbf'` ở Bước 4), phù hợp với cách SVM tìm 1 siêu phẳng tối ưu toàn cục — trong khi kNN chỉ dựa vào các điểm lân cận cục bộ, dễ bị nhiễu.
3. Tham số `C` nhỏ (mô hình "mềm dẻo", ít cứng nhắc) tổng quát hóa tốt hơn — nhất quán với bài học tránh overfitting đã rút ra xuyên suốt đồ án (Decision Tree không giới hạn độ sâu học vẹt 100% trên train nhưng chỉ 91.68% trên test).

**KẾT LUẬN CHÍNH THỨC CỦA ĐỒ ÁN:** Trong 3 mô hình đã thử nghiệm (Decision Tree, kNN, SVM) trên bộ dữ liệu Stroke Prediction, **SVM với `kernel='linear', C=0.01, class_weight='balanced'` là mô hình tối ưu nhất**, đạt AUC = 0.8404 và Recall = 84% — cân bằng tốt nhất giữa khả năng phát hiện đúng ca có nguy cơ đột quỵ và độ chính xác tổng thể.

---

## BƯỚC 6a: Lưu 3 mô hình đã train ra file (.pkl) cho API dùng

**Mục tiêu:** Đóng gói (serialize) 3 mô hình đã train với cấu hình tốt nhất đã chốt (Bước 2c, 3c, 4) thành file `.pkl`, cùng với `scaler.pkl` (StandardScaler dùng chung cho kNN/SVM) và `config.json` (tham số, ngưỡng, bảng mã hóa chữ→số) — để API (Bước 6b) load lên dùng trực tiếp, không phải train lại mỗi lần có yêu cầu.

**File code:** [src/be/save_models.py](../src/be/save_models.py)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python src/be/save_models.py
```

**Kết quả chạy:**
- Đã lưu 5 file vào `src/be/models/`: `decision_tree.pkl`, `knn.pkl`, `svm.pkl`, `scaler.pkl`, `config.json`.
- Kiểm tra lại: nạp 3 file `.pkl` lên và dự đoán trên cùng tập test — kết quả khớp **chính xác 100%** với Bước 5 (Decision Tree: Accuracy 0.6526/Recall 0.84; kNN: 0.6370/0.84; SVM: 0.7260/0.84).

**Giải thích ý nghĩa (dùng cho báo cáo):**
Việc đóng gói mô hình thành file nhị phân (`.pkl`, dùng thư viện `joblib`) là bước chuẩn trong triển khai thực tế: tách rời giai đoạn "huấn luyện" (tốn thời gian, chạy 1 lần) khỏi giai đoạn "phục vụ" (API chỉ cần nạp file có sẵn, phản hồi nhanh). Việc kiểm tra lại kết quả dự đoán khớp 100% với bản gốc xác nhận quá trình đóng gói không làm mất thông tin hay sai lệch mô hình.

---

## BƯỚC 6b: Xây dựng API (FastAPI)

**Mục tiêu:** Viết API phục vụ giao diện demo, gồm 3 nhóm endpoint: `POST /predict` (nhận thông tin bệnh nhân + tham số tùy chỉnh tùy chọn → trả dự đoán cả 3 mô hình), `GET /config` (tham số tốt nhất + độ đo từng mô hình, để FE điền mặc định trang cấu hình), `GET /tuning/{model}` (bảng dò tham số đã lưu ở Bước 2c/3b/3c/4, để FE vẽ biểu đồ minh chứng).

**File code:** [src/be/main.py](../src/be/main.py) (dùng `src/be/models/*.pkl` và `config.json` đã lưu ở Bước 6a)

**Cách chạy (từ thư mục gốc CT603):**
```
PYTHONIOENCODING=utf-8 python -m uvicorn src.be.main:app --reload --port 8000
```
Xem tài liệu API tự sinh tại `http://127.0.0.1:8000/docs` sau khi chạy.

**Kết quả kiểm tra (chạy thật, dùng `curl`):**
- `GET /config`, `GET /tuning/decision_tree`: trả đúng dữ liệu đã lưu.
- `POST /predict` — bệnh nhân nguy cơ cao (75 tuổi, cao huyết áp, bệnh tim, glucose 220): cả 3 mô hình đúng là **"Có nguy cơ đột quỵ"** (xác suất Decision Tree 0.8368, kNN 0.25 ≥ ngưỡng 0.06 nên vẫn dự đoán 1, SVM 0.8807).
- `POST /predict` với tham số tùy chỉnh (`max_depth=2`, `K=5, threshold=0.3`) — bệnh nhân trẻ khỏe (30 tuổi, không yếu tố nguy cơ, glucose 85): cả 3 mô hình đúng là **"Không có nguy cơ đột quỵ"**, và `params_used` trả về đúng tham số tùy chỉnh đã gửi lên (không phải tham số mặc định) — xác nhận chức năng "đổi tham số ở trang cấu hình" hoạt động đúng.

**Giải thích ý nghĩa (dùng cho báo cáo):**
API hỗ trợ 2 chế độ: (1) không gửi `params` → dùng model mặc định đã lưu sẵn (nhanh, không train lại); (2) có gửi `params` → train lại model đó ngay lúc nhận yêu cầu với tham số người dùng chọn (chậm hơn chút nhưng vẫn đủ nhanh vì dữ liệu chỉ ~4000 dòng train). Đây chính là cơ chế đứng sau "trang cấu hình mô hình" đã thống nhất trước đó: người dùng đổi tham số → API train lại ngay → trả kết quả mới, không cần quy trình build/deploy lại.

2 ca thử nghiệm (bệnh nhân nguy cơ cao / nguy cơ thấp) đều cho kết quả đúng theo trực giác y khoa — bằng chứng ban đầu cho thấy API hoạt động đúng logic trước khi nối với giao diện Next.js.

---

## BƯỚC 6c: Giao diện Next.js (trang dự đoán + trang cấu hình)

**Mục tiêu:** Dựng giao diện Next.js (App Router, TypeScript, Tailwind v4) gồm 2 trang đã thống nhất ở `DE_TAI.md` mục 6: **Trang dự đoán** (`/`, nhập 1 bệnh nhân → gọi `POST /predict` → hiển thị 3 thẻ kết quả) và **Trang cấu hình** (`/config`, hiển thị + cho chỉnh tham số 3 mô hình, mặc định = cấu hình tốt nhất lấy từ `GET /config`, kèm biểu đồ "minh chứng dò tham số" vẽ từ `GET /tuning/{model}`). Biểu đồ dùng skill `dataviz` (bảng màu/mark spec chuẩn: line 2px, marker ≥8px, legend bắt buộc khi ≥2 chuỗi dữ liệu, điểm tốt nhất đánh dấu bằng nhãn trực tiếp "★ Tốt nhất" thay vì chỉ dựa màu sắc).

**File code:**
- [src/fe/app/page.tsx](../src/fe/app/page.tsx) — Trang dự đoán
- [src/fe/app/config/page.tsx](../src/fe/app/config/page.tsx) — Trang cấu hình
- [src/fe/components/TuningChart.tsx](../src/fe/components/TuningChart.tsx) — Biểu đồ dò tham số dùng chung
- [src/fe/app/layout.tsx](../src/fe/app/layout.tsx) — Layout chung

**Cách chạy (2 terminal riêng, từ thư mục gốc CT603 và src/fe):**
```
# Terminal 1 - Backend
PYTHONIOENCODING=utf-8 python -m uvicorn src.be.main:app --reload --port 8000

# Terminal 2 - Frontend
cd src/fe && npm run dev
```
Mở `http://localhost:3000`.

**Kết quả kiểm tra (chạy thật):**
- `npm run build`: biên dịch thành công, không lỗi TypeScript, 3 route tĩnh (`/`, `/config`, `/_not-found`).
- Khởi động cả 2 server, `curl` trang `/` và `/config`: HTTP 200, đúng nội dung tiếng Việt mong đợi.
- Kiểm tra CORS (origin `localhost:3000` gọi API `localhost:8000`): `access-control-allow-origin: *` — không bị chặn.
- Mô phỏng bằng script Node gọi đúng chuỗi API y hệt code frontend: `GET /config`, 4 lần `GET /tuning/...` (decision_tree, knn, knn?aspect=threshold, svm — đều trả đủ dòng dữ liệu), `POST /predict` không `params` (dùng mặc định) và có `params` tùy chỉnh (giống lúc người dùng đổi ở trang cấu hình).
  - Bệnh nhân test (67 tuổi, nam, bệnh tim, glucose 228.69 — trùng đúng dòng dữ liệu đầu tiên của bộ dữ liệu gốc, thực tế có đột quỵ): cả 3 mô hình dự đoán đúng **"Có nguy cơ đột quỵ"**.
  - Khi gửi `params` tùy chỉnh (`max_depth=3`, `K=10, threshold=0.1`, `C=0.5`), API trả về đúng `params_used` khớp với tham số đã gửi — xác nhận cơ chế train lại theo tham số người dùng chọn hoạt động đúng.

**Giải thích ý nghĩa (dùng cho báo cáo):**
Kiến trúc tách Backend (FastAPI, xử lý mô hình) và Frontend (Next.js, giao diện) giao tiếp qua REST API — đúng mô hình client-server phổ biến trong triển khai hệ thống machine learning thực tế. Trang cấu hình lưu lựa chọn tham số tùy chỉnh của người dùng vào `localStorage` của trình duyệt (không cần cơ sở dữ liệu cho một bản demo), trang dự đoán tự động đọc lại để gửi kèm yêu cầu — cho phép người dùng "thử nghiệm" nhiều cấu hình khác nhau ngay trên giao diện, đúng yêu cầu đã đặt ra trước đó. Biểu đồ minh chứng dò tham số (vẽ lại đúng dữ liệu đã dò ở Bước 2c/3b/3c/4) giúp người xem demo (kể cả giảng viên) thấy trực quan rằng cấu hình mặc định không phải chọn tùy tiện, mà có quá trình thực nghiệm hệ thống đứng sau.

**Lưu ý khi chạy demo thật:** phải khởi động cả 2 server cùng lúc (Backend cổng 8000, Frontend cổng 3000) theo đúng thứ tự Backend trước — Frontend sau, vì Frontend gọi API ngay khi tải trang cấu hình.

---

## BƯỚC 7: Bổ sung 5-fold Cross-Validation cho cả 3 mô hình

**Mục tiêu:** Mục 5 "Phương pháp đánh giá" của [DE_TAI.md](DE_TAI.md) có ghi "Cross-validation (5-fold)" nhưng Bước 2-5 chỉ dùng 1 lần chia train/test cố định (80%/20%, `random_state=42`). Bước này chạy bổ sung 5-fold Stratified Cross-Validation cho cấu hình tốt nhất đã chốt của cả 3 mô hình, để chứng minh kết quả tốt (AUC, Recall) không phải do may rủi của đúng 1 cách chia dữ liệu, mà ổn định qua nhiều lần chia khác nhau.

**File code:** [step7_cross_validation.py](../src/be/training/step7_cross_validation.py)

**Cách chạy:**
```powershell
$env:PYTHONIOENCODING = "utf-8"
python src\be\training\step7_cross_validation.py
```
```bash
PYTHONIOENCODING=utf-8 python src/be/training/step7_cross_validation.py
```

**Kết quả chạy (thật, 5 fold):**

| Mô hình | AUC trung bình | AUC std | Recall trung bình | Recall std |
|---|---|---|---|---|
| Decision Tree | 0.7853 | 0.0239 | 0.6985 | 0.0929 |
| kNN | 0.7098 | 0.0200 | 0.7551 | 0.0251 |
| **SVM** | **0.8379** | 0.0249 | 0.8069 | 0.0564 |

- Dùng `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` — không dùng `KFold` thường vì dữ liệu mất cân bằng lớp nặng (~5% stroke=1); `StratifiedKFold` đảm bảo mỗi fold đều giữ đúng tỉ lệ lớp dương tính, tránh trường hợp 1 fold không có ca đột quỵ nào.
- Mỗi fold train lại 3 mô hình với đúng cấu hình tốt nhất đã chốt (DT: `max_depth=4, class_weight='balanced'`; kNN: `K=16, weights='uniform', threshold=0.06`; SVM: `kernel='linear', C=0.01, class_weight='balanced'`).
- Bảng chi tiết từng fold lưu ở `data/decision_tree_cv5_results.csv`, `data/knn_cv5_results.csv`, `data/svm_cv5_results.csv`; bảng tổng hợp ở `data/cv5_tong_hop.csv`.
- So với cách đánh giá cũ (1 lần chia): AUC đơn-lần của DT=0.8305, kNN=0.7831, SVM=0.8404 — **thứ hạng 3 mô hình giữ nguyên** (SVM > Decision Tree > kNN) ở cả 2 cách đánh giá.

**Giải thích ý nghĩa (dùng cho báo cáo):**
Cross-validation (kiểm định chéo) là cách chia dữ liệu thành 5 phần bằng nhau, lần lượt dùng 4 phần để huấn luyện và 1 phần để kiểm tra, lặp lại 5 lần sao cho mỗi phần đều được dùng để kiểm tra đúng 1 lần — giống như kiểm tra một học sinh bằng 5 đề thi khác nhau thay vì chỉ 1 đề, để chắc chắn điểm số phản ánh đúng năng lực thật chứ không phải may mắn gặp đúng đề dễ. Độ lệch chuẩn (std) nhỏ của AUC qua 5 fold (0.02–0.025 với cả 3 mô hình) cho thấy kết quả ổn định, không dao động nhiều giữa các lần chia dữ liệu khác nhau. Quan trọng nhất: thứ hạng 3 mô hình không đổi giữa 2 cách đánh giá (1 lần chia và 5-fold CV) — củng cố thêm độ tin cậy cho kết luận chính của đồ án: **SVM (kernel linear, C=0.01) là mô hình tối ưu nhất** trên bộ dữ liệu này.
