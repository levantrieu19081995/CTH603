# src/be — Backend (Python)

```
be/
├── training/       # Bước 1-5: tiền xử lý dữ liệu, huấn luyện + dò tham số từng mô hình,
│                   # so sánh tổng hợp. ĐÃ LÀM XONG — xem chi tiết từng bước ở ../../doc/Nhatkythuchien.md
├── models/         # Mô hình đã train (.pkl) + scaler.pkl + config.json — do save_models.py tạo ra
├── save_models.py  # Train lại 3 mô hình với cấu hình tốt nhất đã chốt, lưu ra models/ (Bước 6a)
└── main.py         # FastAPI app: POST /predict, GET /config, GET /tuning/{model} (Bước 6b)
```

**Chạy API (từ thư mục gốc CT603):**

PowerShell (terminal mặc định trên Windows):
```powershell
$env:PYTHONIOENCODING = "utf-8"
python -m uvicorn src.be.main:app --reload --port 8000 --host 0.0.0.0
```

Bash (Git Bash):
```bash
PYTHONIOENCODING=utf-8 python -m uvicorn src.be.main:app --reload --port 8000 --host 0.0.0.0
```

**Vì sao có `--host 0.0.0.0`:** mặc định uvicorn chỉ nghe ở `127.0.0.1` (localhost) —
nếu mở trang demo bằng địa chỉ IP LAN của máy (ví dụ `172.16.1.229:3000`) thay vì
`localhost:3000`, trình duyệt gọi API ở địa chỉ IP đó chứ không phải `127.0.0.1`,
nên API phải lắng nghe trên mọi địa chỉ mạng (`0.0.0.0`) mới nhận được request.

Xem tài liệu API tự sinh tại `http://127.0.0.1:8000/docs`. Nếu đổi cấu hình tốt nhất ở `training/`, chạy lại `python src/be/save_models.py` (cùng cách set biến môi trường ở trên) để cập nhật file `.pkl`/`config.json` trước khi khởi động lại API.

**Luôn chạy script từ thư mục gốc dự án (CT603)**, ví dụ:
```
PYTHONIOENCODING=utf-8 python src/be/training/step5_so_sanh_3_mohinh.py
```
vì các đường dẫn đọc/ghi dữ liệu trong code đều viết tương đối tính từ thư mục gốc (`data/...`), không tính từ vị trí file script.

Xem kế hoạch tổng và cấu hình tốt nhất đã chốt cho từng mô hình ở [`../../DE_TAI.md`](../../DE_TAI.md) mục 7.
