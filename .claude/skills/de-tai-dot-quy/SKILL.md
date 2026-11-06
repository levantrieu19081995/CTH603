---
name: de-tai-dot-quy
description: Quy trình thực hiện đồ án CT603 "Dự đoán nguy cơ đột quỵ, so sánh Decision Tree/kNN/SVM" trên dataset Stroke Prediction. BẮT BUỘC dùng skill này cho mọi bước code/phân tích của đồ án này — tiền xử lý dữ liệu, huấn luyện từng mô hình (Decision Tree, kNN, SVM), so sánh kết quả, xây API/giao diện demo. Dùng ngay khi người dùng nói "bước N", "bước tiếp theo", "làm tiếp đồ án", hoặc nhắc tới các file DE_TAI.md / doc/Nhatkythuchien.md / dataset stroke. Người dùng chưa rành Python và chưa rành nguyên lý ML — skill này quy định cách giải thích và cách ghi chép để phù hợp.
---

# Quy trình làm đồ án "Dự đoán nguy cơ đột quỵ"

## Bối cảnh

Người làm đồ án chưa rành Python và chưa rành nguyên lý các mô hình machine learning, nhưng cần đủ hiểu để:
- Tự giải thích được từng bước khi bảo vệ đồ án trước giảng viên.
- Dùng lại nội dung để viết báo cáo Word và làm slide thuyết trình.

Vì vậy, mục tiêu của mỗi bước không phải là "chạy ra code", mà là "chạy ra code VÀ người dùng hiểu được vì sao code đó đúng, dữ liệu nói gì". Luôn đọc [DE_TAI.md](../../../DE_TAI.md) trước khi bắt đầu để biết đã đi tới đâu trong 6 bước đã chốt (tiền xử lý → Decision Tree → kNN → SVM → so sánh → API/giao diện), tránh làm lại hoặc nhảy cóc.

## Khuôn mẫu bắt buộc cho mỗi bước nhỏ

Mỗi khi thực hiện một việc (một phần nhỏ trong 6 bước lớn), phải đi đủ 4 phần theo đúng thứ tự — không được gộp tắt hay bỏ qua phần nào:

### 1. Nói đang làm gì (trước khi code)
Một câu ngắn, bằng tiếng Việt thường, không thuật ngữ khó — nói việc sắp làm là gì và để làm gì. Ví dụ: "Giờ sẽ điền số liệu còn thiếu ở cột BMI, vì mô hình không chạy được nếu có ô trống."

### 2. Làm và lấy bằng chứng thật — không nói chung chung
Đây là phần quan trọng nhất của skill này. **Không được viết "dữ liệu có lỗi" hay "mô hình này tốt hơn" mà không có số liệu thật đi kèm.** Luôn chạy code trước, lấy kết quả thật (số dòng, số cột, % chính xác, giá trị cụ thể...), rồi mới kết luận dựa trên con số đó.

Ví dụ SAI: "Cột bmi có một số giá trị thiếu nên cần xử lý."
Ví dụ ĐÚNG: "Chạy `df.isnull().sum()` cho thấy cột bmi thiếu đúng 201/5110 dòng (3.9%) — đây là bằng chứng cụ thể, không phải ước đoán."

Khi so sánh mô hình cũng vậy: phải dẫn con số đo được (Accuracy, F1, AUC... từ lần chạy thật), không được nói "mô hình A thường tốt hơn" theo lý thuyết chung chung.

### 3. Giải thích ý nghĩa — cho người chưa rành ML
Sau khi có bằng chứng, giải thích nó nói lên điều gì, bằng ví dụ/so sánh đời thường thay vì định nghĩa hàn lâm. Nếu phải dùng thuật ngữ (overfitting, hyperplane, cross-validation...), giải thích ngay bằng 1 câu dễ hiểu ngay chỗ dùng lần đầu, không giả định người đọc đã biết.

Mức độ chi tiết: đủ để người dùng tự lặp lại được lời giải thích đó trước giảng viên bằng từ của họ, không phải học thuộc lòng câu chữ của model.

### 4. Ghi vào doc/Nhatkythuchien.md
Sau khi giải thích xong với người dùng trong hội thoại, LUÔN ghi lại ngay vào file `doc/Nhatkythuchien.md` (không hỏi lại có cần ghi không — đây là mặc định bắt buộc của đồ án này). Mỗi bước nhỏ là một mục `##`, theo đúng khuôn:

```markdown
## BƯỚC <số>: <tên bước ngắn gọn>

**Mục tiêu:** <1-2 câu, phần 1 ở trên>

**File code:** [<tên_file>.py](<đường dẫn tương đối tới file, nếu có>)

**Cách chạy:**
\`\`\`
<lệnh chạy thật, kèm PYTHONIOENCODING=utf-8 nếu cần — xem ghi chú kỹ thuật bên dưới>
\`\`\`

**Kết quả chạy:** <số liệu/kết quả thật lấy từ phần 2, gạch đầu dòng, ngắn gọn>

**Giải thích ý nghĩa (dùng cho báo cáo):** <nội dung phần 3, viết sẵn theo văn phong báo cáo để copy thẳng vào Word/slide>
```

Đánh số bước liên tục qua các lần làm việc (BƯỚC 1a, 1b, 2a, 2b...) — mở `doc/Nhatkythuchien.md` xem bước cuối cùng đã ghi là gì trước khi đặt số bước mới, để không trùng/nhảy số.

## Khi chốt được cấu hình tốt nhất của 1 mô hình

Khi dò xong tham số và chọn được cấu hình tốt nhất cho 1 mô hình (ví dụ K tối ưu cho kNN, kernel/C tối ưu cho SVM — như đã làm với `max_depth` của Decision Tree ở Bước 2c), phải làm đủ 3 việc:

1. Ghi vào `doc/Nhatkythuchien.md` theo khuôn 4 phần như bình thường.
2. Cập nhật dòng tương ứng của mô hình đó trong bảng ở mục 7 "Cấu hình tốt nhất đã tìm được" của `DE_TAI.md` — đừng để bảng đó bị lạc hậu so với nhật ký.
3. Lưu toàn bộ bảng kết quả dò tham số (mọi giá trị đã thử, không chỉ giá trị tốt nhất) ra file `data/<ten_mo_hinh>_tuning_results.csv` — giống `data/decision_tree_tuning_results.csv` đã có cho Decision Tree. File này sẽ được giao diện demo đọc để vẽ biểu đồ "Minh chứng dò tham số" ở Bước 6 (xem mục 6.3 trong DE_TAI.md), nên bắt buộc phải có cho cả kNN và SVM, không chỉ in ra màn hình rồi bỏ.

## Ghi chú kỹ thuật riêng của máy này

- Terminal Windows ở đây mặc định không hiển thị được tiếng Việt khi chạy script Python in ra `print()`. Luôn chạy bằng `PYTHONIOENCODING=utf-8 python <file>.py`, không chạy `python <file>.py` suông — tránh phải tốn một lượt sửa lỗi UnicodeEncodeError mỗi lần.
- **Quan trọng:** cú pháp `PYTHONIOENCODING=utf-8 python ...` (gộp 1 dòng) chỉ chạy được trong **Bash** (Git Bash) — đây là shell Claude dùng khi tự chạy lệnh qua tool. Người dùng thực tế thao tác bằng **PowerShell** (thấy dấu nhắc `PS C:\...>`), ở đó cú pháp này báo lỗi `CommandNotFoundException`. Nên **mỗi khi đưa lệnh cho người dùng tự chạy** (trong chat, trong README, trong nhật ký), phải ghi cả 2 phiên bản:
  ```powershell
  $env:PYTHONIOENCODING = "utf-8"
  python duong\dan\file.py
  ```
  ```bash
  PYTHONIOENCODING=utf-8 python duong/dan/file.py
  ```
  Tương tự, `lệnh1 && lệnh2` không chạy được trong PowerShell 5.1 — đưa 2 dòng lệnh riêng hoặc dùng `;`.
- Thư viện cần cho đồ án: `pandas`, `scikit-learn` (đã cài). Khi cần thêm thư viện mới (ví dụ `imbalanced-learn` cho SMOTE, `fastapi` cho API), cài bằng `python -m pip install --quiet <tên>` và báo ngắn gọn cho người dùng biết vừa cài gì, để làm gì.
- Dataset chính thức: `data/healthcare-dataset-stroke-data.csv` — không đổi sang dataset khác, không quay lại dùng dữ liệu nội bộ `badt_badt` (đã xác nhận là dữ liệu test, xem lý do trong memory `de-tai-ct603-dot-quy`).
- Cấu trúc `src/` đã chuẩn hóa thành `src/be/` (Python/API) và `src/fe/` (Next.js). Script của các bước tiền xử lý/huấn luyện/tuning (Bước 1-5) đặt trong `src/be/training/` (`src/be/training/stepXx_<mô_tả>.py`). Code API (FastAPI, Bước 6) đặt trực tiếp trong `src/be/` (`src/be/main.py`), model đã train (.pkl) lưu ở `src/be/models/`. Xem [src/be/README.md](../../src/be/README.md) và [src/fe/README.md](../../src/fe/README.md) để biết chi tiết cấu trúc. Luôn chạy script bằng lệnh xuất phát từ thư mục gốc CT603 (ví dụ `python src/be/training/stepXx_...py`), vì các đường dẫn đọc dữ liệu trong code đều viết kiểu tương đối (`data/...`) tính từ thư mục gốc, không tính từ vị trí file script.
- **Frontend `npm run dev` không ổn định khi mở bằng địa chỉ IP LAN** (ví dụ `172.16.1.x:3000`) — có thể mất 1-2 phút mới tải xong JS (dev mode tải nhiều file nhỏ chưa nén), khiến bấm nút không phản hồi dù không có lỗi gì trong Console. `npm run dev` chỉ nên mở bằng `http://localhost:3000`. Khi cần mở bằng IP LAN (demo cho người khác/giảng viên xem từ máy khác, hoặc kiểm tra qua IP), luôn dùng bản production: `npm run build` rồi `npm run start`, không dùng `npm run dev`. API backend (uvicorn) cần thêm `--host 0.0.0.0` để nhận được kết nối qua IP LAN (mặc định chỉ nghe `127.0.0.1`). Xem chi tiết ở [src/fe/README.md](../../src/fe/README.md).

## Khi nào KHÔNG áp dụng khuôn mẫu đầy đủ

Nếu người dùng chỉ hỏi nhanh một câu lý thuyết không gắn với việc chạy code mới (ví dụ "kNN nghĩa là gì nhỉ"), trả lời ngắn gọn bình thường, không bắt buộc phải ghi vào nhật ký — chỉ ghi khi có một việc/kết quả mới thực sự được thực hiện.
