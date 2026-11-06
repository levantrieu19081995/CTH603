"""
BƯỚC 6a: LƯU 3 MÔ HÌNH ĐÃ TRAIN (với cấu hình tốt nhất đã chốt) RA FILE
để API (main.py) load lên dùng, không phải train lại mỗi lần.

Lưu ra src/be/models/:
- decision_tree.pkl   (không cần scaler)
- knn.pkl             (cần dùng chung với scaler.pkl)
- svm.pkl             (cần dùng chung với scaler.pkl)
- scaler.pkl           (StandardScaler, dùng chung cho kNN và SVM)
- config.json          (tham số mặc định + ngưỡng + bảng mã hóa chữ->số, để main.py và FE dùng)
"""
import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC

THU_MUC_MODELS = Path("src/be/models")
THU_MUC_MODELS.mkdir(parents=True, exist_ok=True)

df = pd.read_csv("data/stroke_clean.csv")
X = df.drop(columns=['stroke'])
y = df['stroke']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

ten_cot = list(X.columns)  # thứ tự cột, API phải tạo input đúng thứ tự này

# ===== Scaler (dùng chung cho kNN và SVM) =====
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)

# ===== Decision Tree (max_depth=4, class_weight='balanced') - không cần scaler =====
dt = DecisionTreeClassifier(random_state=42, max_depth=4, class_weight='balanced')
dt.fit(X_train, y_train)

# ===== kNN (K=16, weights='uniform') - cần scaler, cần threshold=0.06 lúc dự đoán =====
knn = KNeighborsClassifier(n_neighbors=16, weights='uniform')
knn.fit(X_train_s, y_train)

# ===== SVM (kernel='linear', C=0.01, class_weight='balanced') - cần scaler =====
svm = SVC(kernel='linear', C=0.01, class_weight='balanced', random_state=42)
svm.fit(X_train_s, y_train)

# ===== Lưu file =====
joblib.dump(dt, THU_MUC_MODELS / "decision_tree.pkl")
joblib.dump(knn, THU_MUC_MODELS / "knn.pkl")
joblib.dump(svm, THU_MUC_MODELS / "svm.pkl")
joblib.dump(scaler, THU_MUC_MODELS / "scaler.pkl")

config = {
    "feature_order": ten_cot,
    "encoding_maps": {
        "gender": {"Male": 0, "Female": 1, "Other": 2},
        "ever_married": {"No": 0, "Yes": 1},
        "work_type": {"Private": 0, "Self-employed": 1, "Govt_job": 2, "children": 3, "Never_worked": 4},
        "Residence_type": {"Urban": 0, "Rural": 1},
        "smoking_status": {"never smoked": 0, "formerly smoked": 1, "smokes": 2, "Unknown": 3},
    },
    "models": {
        "decision_tree": {
            "label": "Decision Tree",
            "params": {"max_depth": 4, "class_weight": "balanced"},
            "needs_scaler": False,
            "threshold": 0.5,
            "metrics": {"accuracy": 0.6526, "precision": 0.1080, "recall": 0.84, "f1": 0.1913, "auc": 0.8305},
        },
        "knn": {
            "label": "kNN",
            "params": {"n_neighbors": 16, "weights": "uniform"},
            "needs_scaler": True,
            "threshold": 0.06,
            "metrics": {"accuracy": 0.6370, "precision": 0.1037, "recall": 0.84, "f1": 0.1846, "auc": 0.7831},
        },
        "svm": {
            "label": "SVM",
            "params": {"kernel": "linear", "C": 0.01, "class_weight": "balanced"},
            "needs_scaler": True,
            "threshold": 0.0,  # SVM dùng decision_function, ngưỡng mặc định là 0, không phải xác suất
            "metrics": {"accuracy": 0.7260, "precision": 0.1338, "recall": 0.84, "f1": 0.2308, "auc": 0.8404},
        },
    },
}
with open(THU_MUC_MODELS / "config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, ensure_ascii=False, indent=2)

print("Đã lưu các file vào", THU_MUC_MODELS.resolve())
for f in sorted(THU_MUC_MODELS.iterdir()):
    print(" -", f.name, f"({f.stat().st_size} bytes)")
