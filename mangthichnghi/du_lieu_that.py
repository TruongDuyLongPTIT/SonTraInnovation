"""Tải và đệm các bộ dữ liệu thật (lưu trong dulieu/, không đưa lên git).

- MNIST, Fashion-MNIST: 70.000 ảnh 28x28, 10 lớp.
- Luồng dữ liệu chuẩn của ngành học trực tuyến (bản của scikit-multiflow):
    elec     45.312 mẫu, giá điện bang NSW (Úc) 1996–1998 tăng hay giảm, 6 đặc trưng, có trôi dạt tự nhiên.
    covtype  581.012 mẫu, loại rừng trên từng ô đất 30x30 m ở Colorado, 54 đặc trưng, 7 lớp.
    weather  18.159 ngày, trạm khí tượng Bellevue (Mỹ) 50 năm, ngày mai có mưa không, 8 đặc trưng.
"""
import gzip
import os
import urllib.request

import numpy as np

THU_MUC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dulieu")
os.makedirs(THU_MUC, exist_ok=True)

NGUON_ANH = {
    "mnist": "https://ossci-datasets.s3.amazonaws.com/mnist/",
    "fashion": "https://raw.githubusercontent.com/zalandoresearch/fashion-mnist/master/data/fashion/",
}
TEP_ANH = ["train-images-idx3-ubyte.gz", "train-labels-idx1-ubyte.gz",
           "t10k-images-idx3-ubyte.gz", "t10k-labels-idx1-ubyte.gz"]
NGUON_LUONG = "https://raw.githubusercontent.com/scikit-multiflow/streaming-datasets/master/{}.csv"


def _tai(url, dich):
    if not os.path.exists(dich):
        print("tải", url, flush=True)
        urllib.request.urlretrieve(url, dich + ".tmp")
        os.replace(dich + ".tmp", dich)
    return dich


def anh(ten):
    """Trả về Xtr, ytr, Xte, yte; X là float32 trong [0, 1], đã làm phẳng 784 chiều."""
    npz = os.path.join(THU_MUC, f"{ten}.npz")
    if not os.path.exists(npz):
        mang = []
        for tep in TEP_ANH:
            p = _tai(NGUON_ANH[ten] + tep, os.path.join(THU_MUC, f"{ten}_{tep}"))
            with gzip.open(p) as f:
                b = f.read()
            mang.append(np.frombuffer(b, np.uint8, offset=16 if "images" in tep else 8))
        np.savez_compressed(npz, Xtr=mang[0].reshape(-1, 784), ytr=mang[1],
                            Xte=mang[2].reshape(-1, 784), yte=mang[3])
    d = np.load(npz)
    return (d["Xtr"] / 255.0).astype(np.float32), d["ytr"].astype(int), \
        (d["Xte"] / 255.0).astype(np.float32), d["yte"].astype(int)


def luong(ten):
    """Trả về X (float32), y (int) theo đúng thứ tự thời gian của luồng."""
    npz = os.path.join(THU_MUC, f"{ten}.npz")
    if not os.path.exists(npz):
        p = _tai(NGUON_LUONG.format(ten), os.path.join(THU_MUC, f"{ten}.csv"))
        M = np.loadtxt(p, delimiter=",", skiprows=1)
        y = M[:, -1].astype(int)
        y = np.unique(y, return_inverse=True)[1]
        np.savez_compressed(npz, X=M[:, :-1].astype(np.float32), y=y)
    d = np.load(npz)
    return d["X"], d["y"]


if __name__ == "__main__":
    for t in NGUON_ANH:
        print(t, [a.shape for a in anh(t)])
    for t in ["elec", "covtype", "weather"]:
        X, y = luong(t)
        print(t, X.shape, np.bincount(y))
