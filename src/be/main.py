"""
BƯỚC 6b: API (FastAPI) PHỤC VỤ GIAO DIỆN DEMO

Chạy thử: PYTHONIOENCODING=utf-8 python -m uvicorn src.be.main:app --reload --port 8000 --host 0.0.0.0
(chạy từ thư mục gốc CT603)
--host 0.0.0.0 để máy khác trong mạng LAN (hoặc trình duyệt mở bằng IP thay vì
localhost) cũng gọi được API này — mặc định uvicorn chỉ lắng nghe 127.0.0.1.

3 nhóm endpoint:
- POST /predict           : nhận 1 bệnh nhân (+ tham số tùy chỉnh nếu có) -> dự đoán cả 3 mô hình
- GET  /config            : cấu hình mặc định tốt nhất + độ đo từng mô hình
- GET  /tuning/{model}    : bảng dò tham số đã lưu sẵn (Bước 2c/3b/3c/4), cho FE vẽ biểu đồ minh chứng
- GET  /tuning-live/{model}: CHẠY LẠI việc dò tham số ngay lúc gọi (không đọc file cũ) — dùng
                             cho trang "Chạy dò trực tiếp", chứng minh kết quả không phải số cố định
- GET  /cv-live/{model}    : CHẠY LẠI 5-fold Cross-Validation ngay lúc gọi cho đúng 1 cấu hình
                             tốt nhất đã chốt (không quét tham số) — xem Bước 7 trong Nhatkythuchien.md
"""
import json
import time
from pathlib import Path
from typing import Optional, Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# ---------------------------------------------------------------------------
# Khởi tạo: nạp model mặc định + config + dữ liệu đã dọn (dùng để train lại
# nhanh khi người dùng đổi tham số ở trang cấu hình)
# ---------------------------------------------------------------------------
GOC = Path(__file__).resolve().parents[2]  # thư mục gốc CT603
THU_MUC_MODELS = GOC / "src" / "be" / "models"
THU_MUC_DATA = GOC / "data"

with open(THU_MUC_MODELS / "config.json", "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

MODEL_MAC_DINH = {
    "decision_tree": joblib.load(THU_MUC_MODELS / "decision_tree.pkl"),
    "knn": joblib.load(THU_MUC_MODELS / "knn.pkl"),
    "svm": joblib.load(THU_MUC_MODELS / "svm.pkl"),
}
SCALER_MAC_DINH = joblib.load(THU_MUC_MODELS / "scaler.pkl")

_df_full = pd.read_csv(THU_MUC_DATA / "stroke_clean.csv")
_X_full = _df_full.drop(columns=["stroke"])
_y_full = _df_full["stroke"]
X_TRAIN, X_TEST, Y_TRAIN, Y_TEST = train_test_split(
    _X_full, _y_full, test_size=0.2, random_state=42, stratify=_y_full
)

app = FastAPI(title="API Dự đoán nguy cơ đột quỵ - Đồ án CT603")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo nội bộ, không public - cho phép mọi origin cho tiện
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schema dữ liệu đầu vào/đầu ra
# ---------------------------------------------------------------------------
class ThongTinBenhNhan(BaseModel):
    gender: Literal["Male", "Female", "Other"]
    age: float = Field(..., ge=0, le=120)
    hypertension: Literal[0, 1]
    heart_disease: Literal[0, 1]
    ever_married: Literal["Yes", "No"]
    work_type: Literal["Private", "Self-employed", "Govt_job", "children", "Never_worked"]
    Residence_type: Literal["Urban", "Rural"]
    avg_glucose_level: float = Field(..., gt=0)
    bmi: float = Field(..., gt=0)
    smoking_status: Literal["never smoked", "formerly smoked", "smokes", "Unknown"]


class ThamSoDecisionTree(BaseModel):
    max_depth: Optional[int] = None
    class_weight: Optional[Literal["balanced", "none"]] = "balanced"


class ThamSoKNN(BaseModel):
    n_neighbors: int = 16
    weights: Literal["uniform", "distance"] = "uniform"
    threshold: float = Field(0.06, ge=0.0, le=1.0)


class ThamSoSVM(BaseModel):
    kernel: Literal["linear", "rbf"] = "linear"
    C: float = Field(0.01, gt=0)
    class_weight: Optional[Literal["balanced", "none"]] = "balanced"


class ThamSoTuyChinh(BaseModel):
    decision_tree: Optional[ThamSoDecisionTree] = None
    knn: Optional[ThamSoKNN] = None
    svm: Optional[ThamSoSVM] = None


class YeuCauDuDoan(BaseModel):
    patient: ThongTinBenhNhan
    params: Optional[ThamSoTuyChinh] = None


# ---------------------------------------------------------------------------
# Hàm phụ trợ
# ---------------------------------------------------------------------------
def chuyen_benh_nhan_thanh_vector(patient: ThongTinBenhNhan) -> pd.DataFrame:
    """Đổi thông tin bệnh nhân (chữ) thành 1 dòng số, đúng thứ tự cột đã lưu trong config.json."""
    enc = CONFIG["encoding_maps"]
    row = {
        "gender": enc["gender"][patient.gender],
        "age": patient.age,
        "hypertension": patient.hypertension,
        "heart_disease": patient.heart_disease,
        "ever_married": enc["ever_married"][patient.ever_married],
        "work_type": enc["work_type"][patient.work_type],
        "Residence_type": enc["Residence_type"][patient.Residence_type],
        "avg_glucose_level": patient.avg_glucose_level,
        "bmi": patient.bmi,
        "smoking_status": enc["smoking_status"][patient.smoking_status],
    }
    return pd.DataFrame([row])[CONFIG["feature_order"]]


def class_weight_hoac_none(val):
    return None if val in (None, "none") else val


def du_doan_decision_tree(X_row, tham_so: Optional[ThamSoDecisionTree]):
    if tham_so is None:
        model = MODEL_MAC_DINH["decision_tree"]
        params_dung = CONFIG["models"]["decision_tree"]["params"]
    else:
        model = DecisionTreeClassifier(
            random_state=42,
            max_depth=tham_so.max_depth,
            class_weight=class_weight_hoac_none(tham_so.class_weight),
        )
        model.fit(X_TRAIN, Y_TRAIN)
        params_dung = tham_so.model_dump()
    proba = model.predict_proba(X_row)[0][1]
    pred = int(proba >= 0.5)
    return pred, float(proba), params_dung


def du_doan_knn(X_row, tham_so: Optional[ThamSoKNN]):
    if tham_so is None:
        model = MODEL_MAC_DINH["knn"]
        scaler = SCALER_MAC_DINH
        threshold = CONFIG["models"]["knn"]["threshold"]
        params_dung = CONFIG["models"]["knn"]["params"]
    else:
        scaler = StandardScaler().fit(X_TRAIN)
        model = KNeighborsClassifier(n_neighbors=tham_so.n_neighbors, weights=tham_so.weights)
        model.fit(scaler.transform(X_TRAIN), Y_TRAIN)
        threshold = tham_so.threshold
        params_dung = tham_so.model_dump()
    X_scaled = scaler.transform(X_row)
    proba = model.predict_proba(X_scaled)[0][1]
    pred = int(proba >= threshold)
    return pred, float(proba), params_dung


def du_doan_svm(X_row, tham_so: Optional[ThamSoSVM]):
    if tham_so is None:
        model = MODEL_MAC_DINH["svm"]
        scaler = SCALER_MAC_DINH
        params_dung = CONFIG["models"]["svm"]["params"]
    else:
        scaler = StandardScaler().fit(X_TRAIN)
        model = SVC(
            kernel=tham_so.kernel, C=tham_so.C,
            class_weight=class_weight_hoac_none(tham_so.class_weight), random_state=42,
        )
        model.fit(scaler.transform(X_TRAIN), Y_TRAIN)
        params_dung = tham_so.model_dump()
    X_scaled = scaler.transform(X_row)
    score = model.decision_function(X_scaled)[0]
    pred = int(score >= 0)
    # quy đổi decision_function (khoảng cách tới siêu phẳng) sang 0-1 cho dễ hiểu, dùng sigmoid
    import math
    proba_tuong_duong = 1 / (1 + math.exp(-score))
    return pred, float(proba_tuong_duong), params_dung


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/config")
def lay_cau_hinh():
    """Trả về tham số tốt nhất + độ đo của từng mô hình, để FE điền mặc định trang cấu hình."""
    return CONFIG


@app.get("/tuning/{model}")
def lay_ket_qua_do_tham_so(model: Literal["decision_tree", "knn", "svm"], aspect: Optional[str] = None):
    """Trả về bảng dò tham số đã lưu (Bước 2c/3b/3c/4) dạng JSON, cho FE vẽ biểu đồ."""
    ten_file = {
        "decision_tree": "decision_tree_tuning_results.csv",
        "knn": "knn_threshold_tuning_results.csv" if aspect == "threshold" else "knn_tuning_results.csv",
        "svm": "svm_tuning_results.csv",
    }[model]
    duong_dan = THU_MUC_DATA / ten_file
    if not duong_dan.exists():
        raise HTTPException(status_code=404, detail=f"Chưa có file {ten_file}")
    df = pd.read_csv(duong_dan)
    return json.loads(df.to_json(orient="records"))


@app.get("/tuning-live/{model}")
def do_tham_so_truc_tiep(model: Literal["decision_tree", "knn", "svm"]):
    """Chạy lại việc dò tham số THẬT SỰ ngay lúc gọi API (không đọc file CSV đã lưu sẵn),
    cùng vùng dò và cùng cách chia train/test (random_state=42) như Bước 2c/3b/4 — để
    chứng minh trực tiếp cấu hình tốt nhất không phải số liệu cố định, tính lại lúc nào
    cũng ra cùng kết quả."""
    t0 = time.time()
    ket_qua = []

    if model == "decision_tree":
        for depth in list(range(1, 21)) + [None]:
            dt = DecisionTreeClassifier(random_state=42, max_depth=depth, class_weight="balanced")
            dt.fit(X_TRAIN, Y_TRAIN)
            pred = dt.predict(X_TEST)
            proba = dt.predict_proba(X_TEST)[:, 1]
            ket_qua.append({
                "max_depth": depth,
                "accuracy": accuracy_score(Y_TEST, pred),
                "precision": precision_score(Y_TEST, pred, zero_division=0),
                "recall": recall_score(Y_TEST, pred, zero_division=0),
                "f1": f1_score(Y_TEST, pred, zero_division=0),
                "auc": roc_auc_score(Y_TEST, proba),
            })

    elif model == "knn":
        scaler = StandardScaler().fit(X_TRAIN)
        X_train_s = scaler.transform(X_TRAIN)
        X_test_s = scaler.transform(X_TEST)
        for weight_mode in ["uniform", "distance"]:
            for k in range(1, 31):
                knn = KNeighborsClassifier(n_neighbors=k, weights=weight_mode)
                knn.fit(X_train_s, Y_TRAIN)
                pred = knn.predict(X_test_s)
                proba = knn.predict_proba(X_test_s)[:, 1]
                ket_qua.append({
                    "k": k,
                    "weights": weight_mode,
                    "accuracy": accuracy_score(Y_TEST, pred),
                    "precision": precision_score(Y_TEST, pred, zero_division=0),
                    "recall": recall_score(Y_TEST, pred, zero_division=0),
                    "f1": f1_score(Y_TEST, pred, zero_division=0),
                    "auc": roc_auc_score(Y_TEST, proba),
                })

    else:  # svm
        scaler = StandardScaler().fit(X_TRAIN)
        X_train_s = scaler.transform(X_TRAIN)
        X_test_s = scaler.transform(X_TEST)
        for kernel in ["linear", "rbf"]:
            for C in [0.01, 0.1, 0.5, 1, 5, 10]:
                svm = SVC(kernel=kernel, C=C, class_weight="balanced", random_state=42)
                svm.fit(X_train_s, Y_TRAIN)
                pred = svm.predict(X_test_s)
                score = svm.decision_function(X_test_s)
                ket_qua.append({
                    "kernel": kernel,
                    "C": C,
                    "accuracy": accuracy_score(Y_TEST, pred),
                    "precision": precision_score(Y_TEST, pred, zero_division=0),
                    "recall": recall_score(Y_TEST, pred, zero_division=0),
                    "f1": f1_score(Y_TEST, pred, zero_division=0),
                    "auc": roc_auc_score(Y_TEST, score),
                })

    return {"elapsed_seconds": round(time.time() - t0, 2), "so_cau_hinh_da_thu": len(ket_qua), "results": ket_qua}


@app.get("/cv-live/{model}")
def kiem_chung_cv_truc_tiep(model: Literal["decision_tree", "knn", "svm"]):
    """Chạy lại 5-fold Stratified Cross-Validation THẬT SỰ ngay lúc gọi API, cho đúng
    1 cấu hình tốt nhất đã chốt của mô hình (không quét lại tham số) — xem Bước 7
    trong Nhatkythuchien.md. Dùng để kiểm chứng kết quả ổn định qua nhiều cách chia
    dữ liệu khác nhau, không phải do may rủi của 1 lần chia."""
    t0 = time.time()
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    ket_qua = []

    for fold, (idx_train, idx_test) in enumerate(skf.split(_X_full, _y_full), start=1):
        X_tr, X_te = _X_full.iloc[idx_train], _X_full.iloc[idx_test]
        y_tr, y_te = _y_full.iloc[idx_train], _y_full.iloc[idx_test]

        if model == "decision_tree":
            m = DecisionTreeClassifier(random_state=42, max_depth=4, class_weight="balanced")
            m.fit(X_tr, y_tr)
            proba = m.predict_proba(X_te)[:, 1]
            pred = (proba >= 0.5).astype(int)
        elif model == "knn":
            scaler = StandardScaler().fit(X_tr)
            X_tr_s, X_te_s = scaler.transform(X_tr), scaler.transform(X_te)
            m = KNeighborsClassifier(n_neighbors=16, weights="uniform")
            m.fit(X_tr_s, y_tr)
            proba = m.predict_proba(X_te_s)[:, 1]
            pred = (proba >= 0.06).astype(int)
        else:  # svm
            scaler = StandardScaler().fit(X_tr)
            X_tr_s, X_te_s = scaler.transform(X_tr), scaler.transform(X_te)
            m = SVC(kernel="linear", C=0.01, class_weight="balanced", random_state=42)
            m.fit(X_tr_s, y_tr)
            proba = m.decision_function(X_te_s)
            pred = (proba >= 0).astype(int)

        ket_qua.append({
            "fold": fold,
            "auc": roc_auc_score(y_te, proba),
            "recall": recall_score(y_te, pred, zero_division=0),
            "accuracy": accuracy_score(y_te, pred),
        })

    df_kq = pd.DataFrame(ket_qua)
    return {
        "elapsed_seconds": round(time.time() - t0, 2),
        "folds": ket_qua,
        "auc_mean": float(df_kq["auc"].mean()),
        "auc_std": float(df_kq["auc"].std()),
        "recall_mean": float(df_kq["recall"].mean()),
        "recall_std": float(df_kq["recall"].std()),
    }


@app.post("/predict")
def du_doan(yeu_cau: YeuCauDuDoan):
    X_row = chuyen_benh_nhan_thanh_vector(yeu_cau.patient)
    tham_so = yeu_cau.params or ThamSoTuyChinh()

    pred_dt, proba_dt, params_dt = du_doan_decision_tree(X_row, tham_so.decision_tree)
    pred_knn, proba_knn, params_knn = du_doan_knn(X_row, tham_so.knn)
    pred_svm, proba_svm, params_svm = du_doan_svm(X_row, tham_so.svm)

    def goi_y(pred):
        return "Có nguy cơ đột quỵ" if pred == 1 else "Không có nguy cơ đột quỵ"

    return {
        "decision_tree": {"prediction": pred_dt, "probability": round(proba_dt, 4),
                           "label": goi_y(pred_dt), "params_used": params_dt},
        "knn": {"prediction": pred_knn, "probability": round(proba_knn, 4),
                "label": goi_y(pred_knn), "params_used": params_knn},
        "svm": {"prediction": pred_svm, "probability": round(proba_svm, 4),
                "label": goi_y(pred_svm), "params_used": params_svm},
    }


@app.get("/")
def trang_chu():
    return {"message": "API Dự đoán nguy cơ đột quỵ - CT603. Xem /docs để thử API."}
