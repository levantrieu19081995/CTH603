"""
BƯỚC 3c: DÒ NGƯỠNG QUYẾT ĐỊNH (DECISION THRESHOLD) CHO kNN
kNN không có class_weight như Decision Tree. Thay vào đó, hạ ngưỡng xác suất
để quyết định "có đột quỵ" (mặc định 0.5) xuống thấp hơn, trên cấu hình
K=16, weights='uniform' đã có AUC cao nhất ở Bước 3b.
Lưu ý: AUC KHÔNG đổi theo ngưỡng (vì AUC đo trên toàn bộ các ngưỡng),
chỉ Accuracy/Precision/Recall/F1 thay đổi theo ngưỡng cụ thể.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

df = pd.read_csv("data/stroke_clean.csv")
X = df.drop(columns=['stroke'])
y = df['stroke']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

knn = KNeighborsClassifier(n_neighbors=16, weights='uniform')
knn.fit(X_train_s, y_train)
proba = knn.predict_proba(X_test_s)[:, 1]
auc_co_dinh = roc_auc_score(y_test, proba)  # không đổi theo ngưỡng

ket_qua = []
for threshold in [0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.08, 0.06, 0.05, 0.049]:
    pred = (proba >= threshold).astype(int)
    ket_qua.append({
        "threshold": threshold,
        "accuracy": accuracy_score(y_test, pred),
        "precision": precision_score(y_test, pred, zero_division=0),
        "recall": recall_score(y_test, pred, zero_division=0),
        "f1": f1_score(y_test, pred, zero_division=0),
        "auc": auc_co_dinh,
    })

df_kq = pd.DataFrame(ket_qua)
print("AUC cố định (không đổi theo ngưỡng):", round(auc_co_dinh, 4))
print("\n" + "=" * 70)
print("KẾT QUẢ THEO TỪNG NGƯỠNG")
print("=" * 70)
print(df_kq.to_string(index=False))

best_row = df_kq.loc[df_kq['f1'].idxmax()]
print("\n" + "=" * 70)
print("NGƯỠNG TỐT NHẤT (theo F1 cao nhất)")
print("=" * 70)
print(best_row)

df_kq.to_csv("data/knn_threshold_tuning_results.csv", index=False)
print("\nĐã lưu: data/knn_threshold_tuning_results.csv")
