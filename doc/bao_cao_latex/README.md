# Báo cáo LaTeX — Đồ án CT603

File `main.tex` là toàn bộ nội dung báo cáo (trang bìa, tóm tắt, 5 chương, tài liệu tham khảo),
viết theo khuôn mẫu Trường Công nghệ thông tin và Truyền thông — Đại học Cần Thơ. Thư mục `images/`
chứa 8 ảnh chụp màn hình thật của hệ thống demo, đã được chèn sẵn vào đúng vị trí trong báo cáo.

## Cách ra file PDF (dùng Overleaf — không cần cài gì)

1. Vào [overleaf.com](https://www.overleaf.com), tạo tài khoản miễn phí (nếu chưa có).
2. Bấm **New Project → Upload Project**.
3. Nén cả thư mục `bao_cao_latex` này (gồm `main.tex` và thư mục `images/`) thành 1 file `.zip`,
   rồi upload file zip đó lên Overleaf.
4. Overleaf tự mở `main.tex`. Vào menu **Menu** (góc trên trái) → mục **Compiler** → chọn
   **XeLaTeX** (không phải pdfLaTeX mặc định — XeLaTeX mới hiển thị đúng tiếng Việt với font
   Times New Roman đã khai báo trong file).
5. Bấm **Recompile** — PDF hiện ra bên phải. Xong, tải PDF về (nút Download PDF) là nộp được.

## Trước khi nộp, cần tự điền/chỉnh:

- **MSSV** của 2 thành viên (Lê Văn Triệu, La Quỳnh Như) — hiện đang để trống (gạch dưới) ở trang
  bìa, tìm dòng `\newcommand{\sinhvienmot}` và `\newcommand{\sinhvienhai}` gần đầu `main.tex`.
- Kiểm tra lại tên/học hàm giảng viên hướng dẫn (`\newcommand{\giangvien}`) — tôi suy ra từ 1 báo
  cáo mẫu cùng thầy hướng dẫn trong thư mục tham khảo bạn đưa, nên xác nhận lại cho chắc.
- Nếu thầy có khuôn mẫu LaTeX riêng của trường (file `.tex`/`.cls` chính thức), nói tôi để chỉnh
  lại đúng khuôn, thay vì khuôn tôi tự dựng theo 2 báo cáo tham khảo.

## Nếu muốn biên dịch trên máy (không bắt buộc)

Cần cài MiKTeX hoặc TeX Live (phần mềm miễn phí), rồi dùng lệnh:
```
xelatex main.tex
```
chạy 2 lần liên tiếp (lần đầu tạo mục lục, lần 2 mới điền đúng số trang vào mục lục).
