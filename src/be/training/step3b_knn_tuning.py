"""
BƯỚC 3b: DÒ K CHO kNN (trên dữ liệu đã chuẩn hóa)
Thử K = 1..30, với 2 cách tính trọng số hàng xóm: 'uniform' và 'distance'.
Chọn cấu hình tốt nhất theo AUC (tiêu chí nhất quán với Bước 2c).
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

ket_qua = []
for weight_mode in ['uniform', 'distance']:
    for k in range(1, 31):
        knn = KNeighborsClassifier(n_neighbors=k, weights=weight_mode)
        knn.fit(X_train_s, y_train)
        pred = knn.predict(X_test_s)
        proba = knn.predict_proba(X_test_s)[:, 1]
        ket_qua.append({
            "k": k,
            "weights": weight_mode,
            "accuracy": accuracy_score(y_test, pred),
            "precision": precision_score(y_test, pred, zero_division=0),
            "recall": recall_score(y_test, pred, zero_division=0),
            "f1": f1_score(y_test, pred, zero_division=0),
            "auc": roc_auc_score(y_test, proba),
        })

df_kq = pd.DataFrame(ket_qua)

print("=" * 70)
print("10 CẤU HÌNH CÓ AUC CAO NHẤT")
print("=" * 70)
print(df_kq.sort_values("auc", ascending=False).head(10).to_string(index=False))

best_row = df_kq.loc[df_kq['auc'].idxmax()]
print("\n" + "=" * 70)
print("CẤU HÌNH TỐT NHẤT (theo AUC cao nhất)")
print("=" * 70)
print(best_row)

# So với K=5 uniform mặc định (bước 3a) để thấy mức cải thiện
row_k5 = df_kq[(df_kq['k'] == 5) & (df_kq['weights'] == 'uniform')].iloc[0]
print("\n" + "=" * 70)
print("SO SÁNH VỚI K=5 uniform (Bước 3a)")
print("=" * 70)
print(f"{'Chỉ số':<12}{'K=5 uniform (3a)':<20}{'Cấu hình tốt nhất (3b)':<24}")
for metric in ['accuracy', 'precision', 'recall', 'f1', 'auc']:
    print(f"{metric:<12}{row_k5[metric]:<20.4f}{best_row[metric]:<24.4f}")

df_kq.to_csv("data/knn_tuning_results.csv", index=False)
print("\nĐã lưu bảng kết quả: data/knn_tuning_results.csv")
