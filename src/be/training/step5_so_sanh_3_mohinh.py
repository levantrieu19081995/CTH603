"""
BƯỚC 5: SO SÁNH TỔNG HỢP 3 MÔ HÌNH
Huấn luyện lại cả 3 mô hình với đúng cấu hình đã chốt (Bước 2c, 3c, 4),
trên CÙNG 1 tập train/test (random_state=42, stratify=y) để so sánh công bằng.
"""
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # không cần màn hình, chỉ lưu file ảnh
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, roc_auc_score, roc_curve, confusion_matrix)

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
duong_cong_roc = {}  # luu (fpr, tpr) tung model de ve chung 1 bieu do

# ===== 1. Decision Tree (max_depth=4, class_weight='balanced') =====
dt = DecisionTreeClassifier(random_state=42, max_depth=4, class_weight='balanced')
dt.fit(X_train, y_train)  # Decision Tree KHÔNG cần chuẩn hóa
pred_dt = dt.predict(X_test)
proba_dt = dt.predict_proba(X_test)[:, 1]

# ===== 2. kNN (K=16, weights='uniform', threshold=0.06, cần chuẩn hóa) =====
knn = KNeighborsClassifier(n_neighbors=16, weights='uniform')
knn.fit(X_train_s, y_train)
proba_knn = knn.predict_proba(X_test_s)[:, 1]
pred_knn = (proba_knn >= 0.06).astype(int)  # áp dụng ngưỡng đã chọn ở Bước 3c

# ===== 3. SVM (kernel='linear', C=0.01, class_weight='balanced', cần chuẩn hóa) =====
svm = SVC(kernel='linear', C=0.01, class_weight='balanced', random_state=42, probability=False)
svm.fit(X_train_s, y_train)
pred_svm = svm.predict(X_test_s)
score_svm = svm.decision_function(X_test_s)  # dùng cho AUC/ROC thay vì predict_proba

mo_hinh_list = [
    ("Decision Tree (max_depth=4)", y_test, pred_dt, proba_dt),
    ("kNN (K=16, threshold=0.06)", y_test, pred_knn, proba_knn),
    ("SVM (linear, C=0.01)", y_test, pred_svm, score_svm),
]

for ten, yt, pred, score in mo_hinh_list:
    acc = accuracy_score(yt, pred)
    prec = precision_score(yt, pred, zero_division=0)
    rec = recall_score(yt, pred, zero_division=0)
    f1 = f1_score(yt, pred, zero_division=0)
    auc = roc_auc_score(yt, score)
    cm = confusion_matrix(yt, pred)
    fpr, tpr, _ = roc_curve(yt, score)
    duong_cong_roc[ten] = (fpr, tpr, auc)
    ket_qua.append({"model": ten, "accuracy": acc, "precision": prec,
                     "recall": rec, "f1": f1, "auc": auc,
                     "TN": cm[0][0], "FP": cm[0][1], "FN": cm[1][0], "TP": cm[1][1]})

df_kq = pd.DataFrame(ket_qua)
print("=" * 90)
print("BẢNG SO SÁNH CUỐI CÙNG - 3 MÔ HÌNH")
print("=" * 90)
print(df_kq.to_string(index=False))

df_kq.to_csv("data/so_sanh_3_mohinh.csv", index=False)
print("\nĐã lưu bảng so sánh: data/so_sanh_3_mohinh.csv")

# ===== Biểu đồ 1: Đường cong ROC của cả 3 mô hình =====
plt.figure(figsize=(7, 6))
for ten, (fpr, tpr, auc) in duong_cong_roc.items():
    plt.plot(fpr, tpr, label=f"{ten} (AUC={auc:.3f})")
plt.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Đoán ngẫu nhiên (AUC=0.5)")
plt.xlabel("False Positive Rate (tỉ lệ báo động giả)")
plt.ylabel("True Positive Rate (Recall)")
plt.title("Đường cong ROC - So sánh 3 mô hình dự đoán đột quỵ")
plt.legend(loc="lower right", fontsize=9)
plt.tight_layout()
plt.savefig("data/bieu_do_roc_3_mohinh.png", dpi=150)
print("Đã lưu biểu đồ: data/bieu_do_roc_3_mohinh.png")

# ===== Biểu đồ 2: So sánh 5 độ đo bằng bar chart =====
metrics = ["accuracy", "precision", "recall", "f1", "auc"]
fig, ax = plt.subplots(figsize=(9, 5))
x = range(len(metrics))
width = 0.25
colors = ["#4C72B0", "#DD8452", "#55A868"]
for i, row in df_kq.iterrows():
    values = [row[m] for m in metrics]
    positions = [p + i * width for p in x]
    ax.bar(positions, values, width=width, label=row["model"], color=colors[i])
ax.set_xticks([p + width for p in x])
ax.set_xticklabels(["Accuracy", "Precision", "Recall", "F1", "AUC"])
ax.set_ylim(0, 1)
ax.set_title("So sánh 5 độ đo giữa 3 mô hình")
ax.legend(fontsize=8)
plt.tight_layout()
plt.savefig("data/bieu_do_so_sanh_do_do.png", dpi=150)
print("Đã lưu biểu đồ: data/bieu_do_so_sanh_do_do.png")
