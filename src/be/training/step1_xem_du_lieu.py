"""
BƯỚC 1a: XEM DỮ LIỆU (chưa sửa gì, chỉ đọc và thống kê)
"""
import pandas as pd

# Đọc file CSV vào một bảng dữ liệu (DataFrame)
df = pd.read_csv("data/healthcare-dataset-stroke-data.csv")

print("=" * 60)
print("1. KÍCH THƯỚC DỮ LIỆU")
print("=" * 60)
print(f"Số dòng (số bệnh nhân): {df.shape[0]}")
print(f"Số cột (số thuộc tính): {df.shape[1]}")

print("\n" + "=" * 60)
print("2. XEM THỬ 5 DÒNG ĐẦU")
print("=" * 60)
print(df.head())

print("\n" + "=" * 60)
print("3. KIỂU DỮ LIỆU TỪNG CỘT")
print("=" * 60)
print(df.dtypes)

print("\n" + "=" * 60)
print("4. CỘT NÀO BỊ THIẾU GIÁ TRỊ (missing)")
print("=" * 60)
missing = df.isnull().sum()
print(missing[missing > 0] if missing.sum() > 0 else "Không có cột nào missing kiểu NaN chuẩn.")

print("\n" + "=" * 60)
print("5. KIỂM TRA RIÊNG CỘT 'bmi' (nghi có giá trị lạ 'N/A')")
print("=" * 60)
print("Số dòng bmi = 'N/A' (chữ):", (df['bmi'] == 'N/A').sum())
print("Kiểu dữ liệu cột bmi hiện tại:", df['bmi'].dtype)

print("\n" + "=" * 60)
print("6. TỈ LỆ NHÃN STROKE (mất cân bằng lớp hay không)")
print("=" * 60)
counts = df['stroke'].value_counts()
pct = df['stroke'].value_counts(normalize=True) * 100
for label in counts.index:
    print(f"stroke = {label}: {counts[label]} người ({pct[label]:.2f}%)")

print("\n" + "=" * 60)
print("7. CÁC CỘT DẠNG CHỮ (cần đổi thành số sau này)")
print("=" * 60)
text_cols = df.select_dtypes(include='object').columns.tolist()
for c in text_cols:
    print(f"- {c}: các giá trị = {df[c].unique()}")
