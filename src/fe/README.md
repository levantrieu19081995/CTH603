# src/fe — Frontend (Next.js)

Giao diện demo của đồ án CT603, dựng ở **Bước 6c**. Xem chi tiết quá trình làm + kết quả kiểm tra ở [`../../doc/Nhatkythuchien.md`](../../doc/Nhatkythuchien.md) § Bước 6c.

```
fe/
├── app/
│   ├── page.tsx         # Trang dự đoán (/): nhập 1 bệnh nhân → POST /predict → 3 thẻ kết quả
│   └── config/page.tsx  # Trang cấu hình (/config): chỉnh tham số 3 mô hình, mặc định = tốt nhất,
│                         # kèm biểu đồ minh chứng dò tham số (GET /tuning/{model})
├── components/
│   └── TuningChart.tsx  # Biểu đồ đường dùng chung cho trang cấu hình
└── .env.local            # NEXT_PUBLIC_API_URL trỏ tới backend FastAPI
```

**Chạy (cần Backend đã chạy ở cổng 8000 trước — xem `../be/README.md`):**

Có 2 cách chạy, chọn theo mục đích:

### Cách 1 — `npm run dev` (lúc đang code, sửa đổi liên tục)
PowerShell:
```powershell
cd src/fe
npm run dev
```
Bash (Git Bash):
```bash
cd src/fe && npm run dev
```
Chỉ mở bằng **`http://localhost:3000`** (không dùng địa chỉ IP LAN như `172.16.1.x:3000`) —
`next dev` tải rất nhiều file nhỏ chưa nén (phục vụ hot-reload), qua `localhost` thì nhanh,
nhưng qua IP LAN có thể mất 1-2 phút mới tải xong, khiến bấm nút không phản hồi (tưởng bị lỗi
nhưng thực ra là chưa tải kịp).

### Cách 2 — build bản production (để demo/trình bày, hoặc mở bằng IP LAN cho máy khác xem)
PowerShell:
```powershell
npm run build
npm run start
```
Bash (Git Bash):
```bash
npm run build && npm run start
```
Bản này gọn nhẹ hơn nhiều (đã nén, gộp file, không có cơ chế hot-reload), tải nhanh và **chạy
ổn định cả khi mở bằng `http://localhost:3000` lẫn bằng địa chỉ IP LAN của máy**
(ví dụ `http://172.16.1.229:3000`) — dùng cách này khi demo trước giảng viên hoặc cho người
khác trong mạng LAN xem. Mỗi khi sửa code lại phải `npm run build` lại rồi mới `npm run start`.

Luồng tổng thể:
```
Next.js (form nhập liệu + trang cấu hình)
   → gọi API (src/be/main.py, FastAPI, cổng 8000)
   → trả JSON kết quả 3 mô hình
   → Next.js render 3 thẻ kết quả + biểu đồ minh chứng dò tham số
```

---
*(Dự án này bootstrap bằng `create-next-app`; phần hướng dẫn chung của Next.js có thể xem thêm tại [nextjs.org/docs](https://nextjs.org/docs).)*
