"""
BUOC 7: BO SUNG 5-FOLD CROSS-VALIDATION CHO CA 3 MO HINH

Muc tieu: DE_TAI.md muc 5 "Phuong phap danh gia" co ghi Cross-validation (5-fold)
nhung Buoc 2-5 chi dung 1 lan chia train/test co dinh (random_state=42). Buoc nay
chay bo sung 5-fold Stratified Cross-Validation cho cau hinh tot nhat da chot cua
ca 3 mo hinh, de kiem chung ket qua khong phai do may rui cua 1 lan chia du lieu.

Dung StratifiedKFold (khong phai KFold thuong) vi du lieu mat can bang lop nang
(~5% stroke=1) - KFold thuong co the vo tinh de 1 fold khong co ca duong tinh nao,
lam AUC/Recall cua fold do khong tinh duoc hoac sai lech.
"""
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import recall_score, roc_auc_score, accuracy_score

df = pd.read_csv("data/stroke_clean.csv")
X = df.drop(columns=["stroke"]).reset_index(drop=True)
y = df["stroke"].reset_index(drop=True)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

ket_qua = {"decision_tree": [], "knn": [], "svm": []}

for fold, (idx_train, idx_test) in enumerate(skf.split(X, y), start=1):
    X_train, X_test = X.iloc[idx_train], X.iloc[idx_test]
    y_train, y_test = y.iloc[idx_train], y.iloc[idx_test]

    # --- Decision Tree (max_depth=4, class_weight='balanced') ---
    dt = DecisionTreeClassifier(random_state=42, max_depth=4, class_weight="balanced")
    dt.fit(X_train, y_train)
    proba_dt = dt.predict_proba(X_test)[:, 1]
    pred_dt = (proba_dt >= 0.5).astype(int)
    ket_qua["decision_tree"].append({
        "fold": fold,
        "auc": roc_auc_score(y_test, proba_dt),
        "recall": recall_score(y_test, pred_dt, zero_division=0),
        "accuracy": accuracy_score(y_test, pred_dt),
    })

    # --- kNN (K=16, uniform, threshold=0.06) - can chuan hoa ---
    scaler = StandardScaler().fit(X_train)
    X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)
    knn = KNeighborsClassifier(n_neighbors=16, weights="uniform")
    knn.fit(X_train_s, y_train)
    proba_knn = knn.predict_proba(X_test_s)[:, 1]
    pred_knn = (proba_knn >= 0.06).astype(int)
    ket_qua["knn"].append({
        "fold": fold,
        "auc": roc_auc_score(y_test, proba_knn),
        "recall": recall_score(y_test, pred_knn, zero_division=0),
        "accuracy": accuracy_score(y_test, pred_knn),
    })

    # --- SVM (kernel='linear', C=0.01, class_weight='balanced') ---
    svm = SVC(kernel="linear", C=0.01, class_weight="balanced", random_state=42)
    svm.fit(X_train_s, y_train)
    score_svm = svm.decision_function(X_test_s)
    pred_svm = (score_svm >= 0).astype(int)
    ket_qua["svm"].append({
        "fold": fold,
        "auc": roc_auc_score(y_test, score_svm),
        "recall": recall_score(y_test, pred_svm, zero_division=0),
        "accuracy": accuracy_score(y_test, pred_svm),
    })

print("=" * 70)
print("KET QUA 5-FOLD CROSS-VALIDATION (cau hinh tot nhat da chot)")
print("=" * 70)

tong_hop = []
for model, ten_hien_thi in [("decision_tree", "Decision Tree"), ("knn", "kNN"), ("svm", "SVM")]:
    df_kq = pd.DataFrame(ket_qua[model])
    print(f"\n--- {ten_hien_thi} ---")
    print(df_kq.to_string(index=False))
    auc_mean, auc_std = df_kq["auc"].mean(), df_kq["auc"].std()
    recall_mean, recall_std = df_kq["recall"].mean(), df_kq["recall"].std()
    print(f"AUC trung binh:    {auc_mean:.4f}  (+/- {auc_std:.4f})")
    print(f"Recall trung binh: {recall_mean:.4f}  (+/- {recall_std:.4f})")
    tong_hop.append({
        "model": ten_hien_thi,
        "auc_mean": auc_mean, "auc_std": auc_std,
        "recall_mean": recall_mean, "recall_std": recall_std,
    })
    df_kq.to_csv(f"data/{model}_cv5_results.csv", index=False)

print("\n" + "=" * 70)
print("BANG TONG HOP (trung binh +/- do lech chuan qua 5 fold)")
print("=" * 70)
df_tong_hop = pd.DataFrame(tong_hop)
print(df_tong_hop.to_string(index=False))
df_tong_hop.to_csv("data/cv5_tong_hop.csv", index=False)

print("\nDa luu: data/decision_tree_cv5_results.csv, data/knn_cv5_results.csv,")
print("        data/svm_cv5_results.csv, data/cv5_tong_hop.csv")
