"""
BƯỚC 3a: CHỨNG MINH VÌ SAO kNN CẦN CHUẨN HÓA DỮ LIỆU
So sánh kNN (K=5 mặc định) chạy trên dữ liệu CHƯA chuẩn hóa và ĐÃ chuẩn hóa.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

df = pd.read_csv("data/stroke_clean.csv")
X = df.drop(columns=['stroke'])
y = df['stroke']

print("Khoảng giá trị (min - max) của từng cột TRƯỚC chuẩn hóa:")
print(X.describe().loc[['min', 'max']].T)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)


def danh_gia(ten, model, X_test, y_test):
    pred = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    print(f"\n{ten}")
    print(f"  Accuracy : {accuracy_score(y_test, pred):.4f}")
    print(f"  Precision: {precision_score(y_test, pred, zero_division=0):.4f}")
    print(f"  Recall   : {recall_score(y_test, pred, zero_division=0):.4f}")
    print(f"  F1       : {f1_score(y_test, pred, zero_division=0):.4f}")
    print(f"  AUC      : {roc_auc_score(y_test, proba):.4f}")


# ===== KHÔNG chuẩn hóa =====
knn_tho = KNeighborsClassifier(n_neighbors=5)
knn_tho.fit(X_train, y_train)
danh_gia("3a-1. kNN (K=5) - KHÔNG chuẩn hóa", knn_tho, X_test, y_test)

# ===== CÓ chuẩn hóa (StandardScaler: đưa mỗi cột về trung bình 0, độ lệch chuẩn 1) =====
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)   # học thông số chuẩn hóa TỪ TRAIN
X_test_scaled = scaler.transform(X_test)          # áp dụng CÙNG thông số đó lên test

knn_chuanhoa = KNeighborsClassifier(n_neighbors=5)
knn_chuanhoa.fit(X_train_scaled, y_train)
danh_gia("3a-2. kNN (K=5) - ĐÃ chuẩn hóa (StandardScaler)", knn_chuanhoa, X_test_scaled, y_test)
