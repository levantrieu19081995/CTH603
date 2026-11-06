"""
BƯỚC 4: DÒ THAM SỐ kernel x C CHO SVM
Dùng class_weight='balanced' (giống Decision Tree) vì SVC hỗ trợ trực tiếp.
Dữ liệu được chuẩn hóa (StandardScaler) vì SVM cũng đo khoảng cách/margin.
AUC tính bằng decision_function (nhanh hơn predict_proba vì không cần Platt scaling).
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
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
for kernel in ['linear', 'rbf']:
    for C in [0.01, 0.1, 0.5, 1, 5, 10]:
        svm = SVC(kernel=kernel, C=C, class_weight='balanced', random_state=42)
        svm.fit(X_train_s, y_train)
        pred = svm.predict(X_test_s)
        score = svm.decision_function(X_test_s)  # dùng cho AUC, nhanh hơn predict_proba
        ket_qua.append({
            "kernel": kernel,
            "C": C,
            "accuracy": accuracy_score(y_test, pred),
            "precision": precision_score(y_test, pred, zero_division=0),
            "recall": recall_score(y_test, pred, zero_division=0),
            "f1": f1_score(y_test, pred, zero_division=0),
            "auc": roc_auc_score(y_test, score),
        })
        print(f"Đã xong: kernel={kernel}, C={C}")

df_kq = pd.DataFrame(ket_qua)
print("\n" + "=" * 70)
print("TOÀN BỘ KẾT QUẢ DÒ kernel x C")
print("=" * 70)
print(df_kq.to_string(index=False))

best_row = df_kq.loc[df_kq['auc'].idxmax()]
print("\n" + "=" * 70)
print("CẤU HÌNH TỐT NHẤT (theo AUC cao nhất)")
print("=" * 70)
print(best_row)
print("\nLưu ý: Recall ở ngưỡng mặc định (decision_function >= 0) có thể vẫn thấp")
print("dù AUC cao, giống bài học rút ra từ kNN ở Bước 3b — cần kiểm tra kỹ.")

df_kq.to_csv("data/svm_tuning_results.csv", index=False)
print("\nĐã lưu: data/svm_tuning_results.csv")
