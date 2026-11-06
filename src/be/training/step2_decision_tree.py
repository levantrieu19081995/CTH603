"""
BƯỚC 2: DECISION TREE
- 2a: Decision Tree bình thường (chưa xử lý mất cân bằng lớp)
- 2b: Decision Tree có xử lý mất cân bằng lớp (class_weight='balanced')
So sánh để thấy rõ vì sao phải quan tâm Recall/F1, không chỉ Accuracy.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, roc_auc_score, confusion_matrix, classification_report)

df = pd.read_csv("data/stroke_clean.csv")

X = df.drop(columns=['stroke'])
y = df['stroke']

# Chia 80% train / 20% test. stratify=y đảm bảo tỉ lệ 95%/5% được giữ
# đều nhau ở cả 2 phần train và test, không bị lệch ngẫu nhiên.
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Số dòng train:", len(X_train), "| Số dòng test:", len(X_test))
print("Tỉ lệ stroke=1 trong train:", round(y_train.mean() * 100, 2), "%")
print("Tỉ lệ stroke=1 trong test :", round(y_test.mean() * 100, 2), "%")


def danh_gia(ten_mo_hinh, model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]  # xác suất dự đoán là stroke=1

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n{'=' * 60}")
    print(f"KẾT QUẢ: {ten_mo_hinh}")
    print(f"{'=' * 60}")
    print(f"Accuracy  : {acc:.4f}")
    print(f"Precision : {prec:.4f}")
    print(f"Recall    : {rec:.4f}")
    print(f"F1        : {f1:.4f}")
    print(f"AUC       : {auc:.4f}")
    print("Confusion Matrix (hàng=thực tế, cột=dự đoán):")
    print("              Dự đoán=0   Dự đoán=1")
    print(f"Thực tế=0     {cm[0][0]:<10} {cm[0][1]:<10}")
    print(f"Thực tế=1     {cm[1][0]:<10} {cm[1][1]:<10}")
    return {"model": ten_mo_hinh, "accuracy": acc, "precision": prec,
            "recall": rec, "f1": f1, "auc": auc, "cm": cm}


# ===== 2a: Decision Tree BÌNH THƯỜNG =====
dt_thuong = DecisionTreeClassifier(random_state=42)
dt_thuong.fit(X_train, y_train)
kq_2a = danh_gia("2a. Decision Tree (bình thường)", dt_thuong, X_test, y_test)

# ===== 2b: Decision Tree CÓ XỬ LÝ MẤT CÂN BẰNG =====
dt_balanced = DecisionTreeClassifier(random_state=42, class_weight='balanced')
dt_balanced.fit(X_train, y_train)
kq_2b = danh_gia("2b. Decision Tree (class_weight='balanced')", dt_balanced, X_test, y_test)

print(f"\n{'=' * 60}")
print("SO SÁNH NHANH")
print(f"{'=' * 60}")
print(f"{'Mô hình':<40}{'Accuracy':<10}{'Recall':<10}{'F1':<10}{'AUC':<10}")
for kq in [kq_2a, kq_2b]:
    print(f"{kq['model']:<40}{kq['accuracy']:<10.4f}{kq['recall']:<10.4f}{kq['f1']:<10.4f}{kq['auc']:<10.4f}")
