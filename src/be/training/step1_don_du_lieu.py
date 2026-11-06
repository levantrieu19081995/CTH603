"""
BƯỚC 1b: DỌN DỮ LIỆU
- Điền giá trị thiếu ở cột bmi (bằng trung vị, không dùng trung bình vì BMI dễ bị lệch bởi vài ca ngoại lệ)
- Đổi các cột chữ thành số (Label Encoding)
- Lưu ra file sạch: data/stroke_clean.csv
"""
import pandas as pd

df = pd.read_csv("data/healthcare-dataset-stroke-data.csv")

print("=" * 60)
print("TRƯỚC KHI DỌN")
print("=" * 60)
print("Số dòng thiếu bmi:", df['bmi'].isnull().sum())
print("Trung vị bmi (median):", df['bmi'].median())
print("Trung bình bmi (mean):", round(df['bmi'].mean(), 2))

# 1) Điền bmi thiếu bằng trung vị (median) của cột đó
median_bmi = df['bmi'].median()
df['bmi'] = df['bmi'].fillna(median_bmi)

# 2) Bỏ cột id (chỉ là mã số, không mang thông tin y khoa)
df = df.drop(columns=['id'])

# 3) Đổi các cột chữ thành số bằng Label Encoding
#    Ghi lại rõ ràng từng cột đổi thành số nào để còn giải thích được
mapping_log = {}

gender_map = {'Male': 0, 'Female': 1, 'Other': 2}
df['gender'] = df['gender'].map(gender_map)
mapping_log['gender'] = gender_map

married_map = {'No': 0, 'Yes': 1}
df['ever_married'] = df['ever_married'].map(married_map)
mapping_log['ever_married'] = married_map

work_map = {'Private': 0, 'Self-employed': 1, 'Govt_job': 2, 'children': 3, 'Never_worked': 4}
df['work_type'] = df['work_type'].map(work_map)
mapping_log['work_type'] = work_map

residence_map = {'Urban': 0, 'Rural': 1}
df['Residence_type'] = df['Residence_type'].map(residence_map)
mapping_log['Residence_type'] = residence_map

smoking_map = {'never smoked': 0, 'formerly smoked': 1, 'smokes': 2, 'Unknown': 3}
df['smoking_status'] = df['smoking_status'].map(smoking_map)
mapping_log['smoking_status'] = smoking_map

print("\n" + "=" * 60)
print("SAU KHI DỌN")
print("=" * 60)
print("Số dòng thiếu bmi còn lại:", df['bmi'].isnull().sum())
print("Số dòng, số cột:", df.shape)
print("\n5 dòng đầu sau khi dọn:")
print(df.head())

print("\n" + "=" * 60)
print("BẢNG QUY ĐỔI CHỮ -> SỐ (để giải thích/báo cáo)")
print("=" * 60)
for col, m in mapping_log.items():
    print(f"- {col}: {m}")

# Kiểm tra không còn cột nào là chữ (object/str) ngoại trừ đã xử lý hết
con_lai_chu = df.select_dtypes(include=['object']).columns.tolist()
print("\nCòn cột nào là chữ chưa xử lý:", con_lai_chu if con_lai_chu else "Không còn — toàn bộ đã là số")

df.to_csv("data/stroke_clean.csv", index=False)
print("\nĐã lưu file sạch: data/stroke_clean.csv")
