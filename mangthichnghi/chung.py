"""Tiện ích dùng chung: MLP huấn luyện bằng backprop (JAX + Adam), lưu kết quả."""
import json
import os
import time

import jax
import jax.numpy as jnp
import numpy as np
import optax

THU_MUC_KQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ketqua")
os.makedirs(THU_MUC_KQ, exist_ok=True)


def luu_json(ten, du_lieu):
    with open(os.path.join(THU_MUC_KQ, ten), "w", encoding="utf-8") as f:
        json.dump(du_lieu, f, ensure_ascii=False, indent=2)


def duong_dan(ten):
    return os.path.join(THU_MUC_KQ, ten)


def tb_lech(xs):
    xs = np.asarray(xs, float)
    return float(xs.mean()), float(xs.std())


# ---------------------------------------------------------------- MLP (backprop)
def khoi_tao_mlp(key, kich_thuoc):
    """kich_thuoc = [vào, ẩn1, ..., ra]; khởi tạo He."""
    ts = []
    for a, b in zip(kich_thuoc[:-1], kich_thuoc[1:]):
        key, k = jax.random.split(key)
        ts.append((jax.random.normal(k, (a, b)) * jnp.sqrt(2.0 / a), jnp.zeros(b)))
    return ts


def mlp(ts, x):
    for W, b in ts[:-1]:
        x = jax.nn.relu(x @ W + b)
    W, b = ts[-1]
    return x @ W + b


def so_tham_so(ts):
    return int(sum(W.size + b.size for W, b in ts))


class BoPhanLoaiMLP:
    """MLP phân loại, huấn luyện bằng lan truyền ngược + Adam."""

    def __init__(self, n_vao, n_lop, an=(128,), lr=1e-3, seed=0):
        self.key = jax.random.PRNGKey(seed)
        self.ts = khoi_tao_mlp(self.key, [n_vao, *an, n_lop])
        self.opt = optax.adam(lr)
        self.trang_thai = self.opt.init(self.ts)
        self.rng = np.random.default_rng(seed)

        def mat_mat(ts, x, y):
            return optax.softmax_cross_entropy_with_integer_labels(mlp(ts, x), y).mean()

        @jax.jit
        def buoc(ts, st, x, y):
            g = jax.grad(mat_mat)(ts, x, y)
            cap_nhat, st = self.opt.update(g, st, ts)
            return optax.apply_updates(ts, cap_nhat), st

        self._buoc = buoc
        self._du_doan = jax.jit(lambda ts, x: jnp.argmax(mlp(ts, x), -1))

    def huan_luyen(self, X, y, so_vong=30, lo=32):
        n = len(X)
        for _ in range(so_vong):
            p = self.rng.permutation(n)
            for i in range(0, n, lo):
                j = p[i:i + lo]
                self.ts, self.trang_thai = self._buoc(self.ts, self.trang_thai, X[j], y[j])

    def du_doan(self, X):
        return np.asarray(self._du_doan(self.ts, X))

    @property
    def so_tham_so(self):
        return so_tham_so(self.ts)


class DongHo:
    def __enter__(self):
        self.t0 = time.perf_counter()
        return self

    def __exit__(self, *a):
        self.giay = time.perf_counter() - self.t0
