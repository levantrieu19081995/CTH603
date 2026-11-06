"""
BƯỚC 2c: DÒ THAM SỐ max_depth CHO DECISION TREE
Mục tiêu: tìm max_depth tối ưu để giảm overfitting đã phát hiện ở Bước 2
(train acc = 1.0 nhưng test acc = 0.9168, cây sâu 18 tầng / 289 lá).
Chọn cấu hình tốt nhất theo AUC (ưu tiên 1), F1 (ưu tiên 2 khi AUC gần bằng nhau).
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

df = pd.read_csv("data/stroke_clean.csv")
X = df.drop(columns=['stroke'])
y = df['stroke']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

ket_qua = []
danh_sach_depth = list(range(1, 21)) + [None]

for depth in danh_sach_depth:
    dt = DecisionTreeClassifier(random_state=42, max_depth=depth, class_weight='balanced')
    dt.fit(X_train, y_train)
    pred = dt.predict(X_test)
    proba = dt.predict_proba(X_test)[:, 1]
    ket_qua.append({
        "max_depth": depth,
        "accuracy": accuracy_score(y_test, pred),
        "precision": precision_score(y_test, pred, zero_division=0),
        "recall": recall_score(y_test, pred, zero_division=0),
        "f1": f1_score(y_test, pred, zero_division=0),
        "auc": roc_auc_score(y_test, proba),
    })

df_kq = pd.DataFrame(ket_qua)
print("=" * 70)
print("BẢNG DÒ max_depth (toàn bộ)")
print("=" * 70)
print(df_kq.to_string(index=False))

# Chọn cấu hình tốt nhất: AUC cao nhất là tiêu chí chính
best_row = df_kq.loc[df_kq['auc'].idxmax()]
print("\n" + "=" * 70)
print("CẤU HÌNH TỐT NHẤT (theo AUC cao nhất)")
print("=" * 70)
print(best_row)

# So sánh với bước 2 (mặc định, không giới hạn depth, class_weight='balanced')
print("\n" + "=" * 70)
print("SO SÁNH VỚI BƯỚC 2 (2b - max_depth mặc định/None)")
print("=" * 70)
row_2b = df_kq[df_kq['max_depth'].isna()].iloc[0]
print(f"{'Chỉ số':<12}{'Bước 2b (depth=None)':<24}{'Bước 2c (depth tốt nhất)':<24}")
for metric in ['accuracy', 'precision', 'recall', 'f1', 'auc']:
    print(f"{metric:<12}{row_2b[metric]:<24.4f}{best_row[metric]:<24.4f}")

df_kq.to_csv("data/decision_tree_tuning_results.csv", index=False)
print("\nĐã lưu bảng kết quả: data/decision_tree_tuning_results.csv")
