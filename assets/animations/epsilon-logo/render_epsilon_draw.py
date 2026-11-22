"""Render the Epsilon mark being drawn by one continuous pen.

The official silhouette (alpha of source-epsilon-logo.png, 4167 px wide) is the
final shape. A hand-authored centerline (WAYPOINTS, following the approved GIF
order) is turned into an arc-length parameterised path. Every silhouette pixel
gets the arc length at which the pen tip first covers it (union of round pen
discs whose radius follows the real local stroke width). A frame at pen
position S shows exactly the pixels with label <= S, so new pixels only ever
come from the single moving tip and drawn pixels never change.

Usage (needs numpy, pillow, scipy, opencv-python-headless, imageio-ffmpeg):
  python render_epsilon_draw.py debug        # centerline + label-map previews
  python render_epsilon_draw.py storyboard   # 24-frame contact sheet
  python render_epsilon_draw.py video        # portrait + square MP4s
  python render_epsilon_draw.py all
"""
import os
import subprocess
import sys

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, gaussian_filter1d, map_coordinates, maximum_filter1d, median_filter
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(HERE, "source-epsilon-logo.png")
MARK_COLS = 1300  # the symbol occupies columns 0..1299 of the source; the wordmark starts at 1476

BLUE = np.array([0x2B, 0x56, 0x9F], np.float32)
WHITE = np.array([255, 255, 255], np.float32)

FPS = 60
LEAD_IN = 0.10   # s of pure white
DRAW = 2.45      # s of drawing
HOLD = 0.45      # s holding the finished mark

# (x, y, snap_to_medial_axis) in source pixels, in drawing order.
# Ball terminal -> top arc -> left side of upper bowl -> waist -> out along the
# top half of the tail, hairpin at its bulb, back along its bottom half ->
# lower bowl -> crossing -> up the right of the loop -> over its top -> down
# its left -> through the crossing -> arrow shaft -> arrowhead tip.
WAYPOINTS = [
    (768, 196, 0), (738, 150, 0), (705, 105, 1), (660, 62, 1), (600, 42, 1),
    (533, 37, 1), (460, 40, 1), (400, 47, 1), (330, 60, 1), (267, 80, 1),
    (220, 120, 1), (190, 180, 1), (172, 250, 1), (167, 327, 1), (187, 400, 1),
    (225, 452, 0), (262, 478, 0), (300, 490, 2),
    # tail: out on its upper half, hairpin round the bulb, back on its lower half
    # (lanes sit at ~28% / 72% of the measured band thickness)
    (350, 497, 2), (420, 489, 2), (500, 473, 2), (560, 463, 2), (592, 461, 2),
    (607, 472, 2), (592, 487, 2), (560, 496, 2), (500, 504, 2), (420, 514, 2),
    (350, 528, 2), (315, 543, 0), (285, 565, 0),
    # lower bowl
    (240, 600, 1), (213, 627, 1), (175, 690, 1), (147, 747, 1), (120, 800, 1),
    (113, 840, 1), (115, 890, 1), (127, 933, 1), (150, 968, 1), (187, 993, 1),
    (230, 1012, 1), (280, 1020, 1), (340, 1022, 1), (400, 1016, 1), (480, 1002, 1),
    (560, 980, 1), (620, 948, 1),
    # first pass through the crossing, then counter-clockwise round the loop
    (665, 905, 1), (768, 778, 1), (790, 735, 1),
    (808, 690, 1), (820, 640, 1), (823, 590, 1), (808, 543, 1), (772, 512, 1),
    (720, 512, 1), (665, 530, 1), (620, 565, 1), (592, 615, 1), (586, 680, 1),
    (600, 742, 1),
    # second pass through the crossing, into the arrow
    (628, 790, 1), (830, 822, 1),
    (880, 800, 1), (940, 770, 1), (1000, 725, 1), (1053, 667, 1), (1100, 605, 1),
    (1130, 560, 1), (1150, 515, 1), (1165, 470, 0),
    # arrowhead axis to the tip
    (1180, 420, 0), (1200, 350, 0), (1222, 280, 0), (1242, 222, 0),
]

ARROWHEAD = ((1243, 218), (1055, 434), (1299, 459))  # tip, left barb, right barb (source px)
# Concave corners of the loop's self-crossing, in angular order: bowl/loop-left notch,
# inner-hole tip, loop-right/arrow wedge, arrow/bowl notch (source px). Between them lie the
# four arms; the first pass owns bowl + core + loop-right, the second loop-left + arrow.
CROSSING = ((671, 853), (723, 796), (789, 804), (738, 871))
CROSSING_SPLIT = 3300.0  # arc length between the two passes (top of the loop)

STEP = 0.5  # arc-length sample spacing, source px


def load_mask():
    a = np.array(Image.open(SOURCE).convert("RGBA"))[:, :MARK_COLS, 3].astype(np.float32) / 255.0
    return a


def catmull_rom(pts, n_per=60):
    """Centripetal Catmull-Rom through pts (no overshoot on tight turns)."""
    p = np.vstack([2 * pts[0] - pts[1], pts, 2 * pts[-1] - pts[-2]])
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        t0 = 0.0
        t1 = t0 + np.linalg.norm(p1 - p0) ** 0.5
        t2 = t1 + np.linalg.norm(p2 - p1) ** 0.5
        t3 = t2 + np.linalg.norm(p3 - p2) ** 0.5
        t = np.linspace(t1, t2, n_per, endpoint=False)[:, None]
        a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1
        a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2
        a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3
        b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2
        b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3
        out.append((t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2)
    out.append(pts[-1][None])
    return np.vstack(out)


def resample(curve, step):
    seg = np.linalg.norm(np.diff(curve, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    si = np.arange(0, s[-1], step)
    return np.stack([np.interp(si, s, curve[:, 0]), np.interp(si, s, curve[:, 1])], 1)


def sample(field, xy):
    return map_coordinates(field, [xy[:, 1], xy[:, 0]], order=1, mode="nearest")


def build_path(dt):
    pts = np.array([(x, y) for x, y, _ in WAYPOINTS], np.float64)
    snap = np.array([s == 1 for _, _, s in WAYPOINTS])
    # Snap flagged waypoints onto the medial axis along their local normal.
    for i in np.where(snap)[0]:
        d = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        n = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-9)
        cand = pts[i] + np.linspace(-12, 12, 49)[:, None] * n
        pts[i] = cand[np.argmax(sample(dt, cand))]
    path = resample(catmull_rom(pts), STEP)
    path[:, 0] = gaussian_filter1d(path[:, 0], 6, mode="nearest")
    path[:, 1] = gaussian_filter1d(path[:, 1], 6, mode="nearest")
    return resample(path, STEP)


def pen_radius(path, dt, mask):
    """Pen disc radius = farther band edge along the normal, so one disc spans the
    whole cross-section even where the path is slightly off-centre."""
    d = np.gradient(path, axis=0)
    n = np.stack([-d[:, 1], d[:, 0]], 1) / (np.linalg.norm(d, axis=1)[:, None] + 1e-9)
    ts = np.arange(0, 160, 0.5)
    ext = []
    for sign in (1, -1):
        ray = path[:, None, :] + sign * ts[None, :, None] * n[:, None, :]
        vals = map_coordinates(mask, [ray[..., 1].ravel(), ray[..., 0].ravel()], order=1).reshape(len(path), -1)
        ext.append(np.argmax(vals < 0.5, axis=1) * 0.5)
    w = np.maximum(*ext)
    # Junctions and crossings make rays run on into the other stroke; cap at the
    # local typical half-width so the pen never reveals a neighbouring stroke early.
    # Samples whose cross-section jumps above the stroke's running width are inside a
    # junction or crossing: carry the radius straight through from either side instead.
    typical = median_filter(w, size=401, mode="nearest")
    bad = w > typical * 1.08
    bad = np.convolve(bad, np.ones(41), mode="same") > 0  # widen by 10 px so the pen does not bulge entering a junction
    bad[: int(120 / STEP)] = False  # the ball terminal is genuinely wide
    r = w.copy()
    idx = np.arange(len(w))
    r[bad] = np.interp(idx[bad], idx[~bad], w[~bad]) * 0.92  # stay inside the strand; gaps fill on the later pass
    # Inside junctions the pen is a band instead of a disc: its left and right edges are
    # each carried straight through from the strand's real edges on either side, so the
    # strand keeps clean continuous edges where it crosses another stroke.
    ep, em = ext[0].astype(np.float64), ext[1].astype(np.float64)
    ep[bad] = np.interp(idx[bad], idx[~bad], ep[~bad])
    em[bad] = np.interp(idx[bad], idx[~bad], em[~bad])
    # Each edge follows the real silhouette edge wherever its ray is not running into the
    # other stroke (measured <= straight estimate + 2 px), and only bridges the gap where
    # the other arm attaches; otherwise the edge steps where the arm begins.
    ep, em = gaussian_filter1d(ep, 6), gaussian_filter1d(em, 6)
    # Hairpin lanes share one band: each lane only covers its own half.
    pts = np.array([(x, y) for x, y, _ in WAYPOINTS], np.float64)
    lane = np.array([f == 2 for _, _, f in WAYPOINTS])[cKDTree(pts).query(path)[1]]
    r[lane] = gaussian_filter1d(sample(dt, path[lane]), 30, mode="nearest")  # smooth: raw DT steps show as a staircase edge
    return gaussian_filter1d(r, 6) + 1.0, (bad & ~lane, n, ep, em, lane)


def split_crossing(lab, mask, path, s, radius, band, reach=130, core_r=75):
    """Give each pixel near the self-crossing to the pass that owns its arm, so the first
    pass's edges run straight between the real corners instead of stepping or bulging."""
    corners = np.array(CROSSING, np.float64)
    c = corners.mean(0)
    h, w = mask.shape
    y0, y1, x0, x1 = int(c[1] - reach), int(c[1] + reach) + 1, int(c[0] - reach), int(c[0] + reach) + 1
    yy, xx = np.mgrid[y0:y1, x0:x1]
    near = (mask[y0:y1, x0:x1] > 0) & ((xx - c[0]) ** 2 + (yy - c[1]) ** 2 <= reach ** 2)
    core = np.zeros((y1 - y0, x1 - x0), np.uint8)
    cv2.fillConvexPoly(core, np.round(corners - [x0, y0]).astype(np.int32), 1)
    ang = np.arctan2(yy - c[1], xx - c[0])
    ca = np.arctan2(corners[:, 1] - c[1], corners[:, 0] - c[0])

    def between(a, lo, hi):  # angle a inside the arc going from lo to hi through the sector
        return np.mod(a - lo, 2 * np.pi) < np.mod(hi - lo, 2 * np.pi)

    rr_all = np.hypot(xx - c[0], yy - c[1])
    sector2 = (between(ang, ca[0], ca[1]) | between(ang, ca[2], ca[3])) & ~core.astype(bool)
    # Sectors are only reliable close to the core (the arrow arm curves round further out);
    # beyond that the global field already gives every arm pixel to its own pass.
    second = np.where(rr_all <= core_r, sector2, lab[y0:y1, x0:x1] > CROSSING_SPLIT)
    close = np.linalg.norm(path - c, axis=1) < reach + 150
    sub = lab[y0:y1, x0:x1]
    n = band[1]
    for want_second in (False, True):
        ids = np.flatnonzero(close & ((s > CROSSING_SPLIT) if want_second else (s < CROSSING_SPLIT)))
        sel = near & (second == want_second)
        q = np.stack([xx[sel], yy[sel]], 1).astype(np.float64)
        pos = cKDTree(path[ids]).query(q)[1]
        k = ids[pos]
        dl = np.einsum("ij,ij->i", q - path[k], n[k])
        # Lateral extent of the pixels this pass owns at each centreline sample, so the
        # round tip spans the arm's real width (fillets included), not just the band.
        lo = np.full(len(ids), np.nan); hi = np.full(len(ids), np.nan)
        np.fmin.at(lo, pos, dl); np.fmax.at(hi, pos, dl)
        have = np.isfinite(lo)
        j = np.arange(len(ids))
        lo = np.interp(j, j[have], lo[have]); hi = np.interp(j, j[have], hi[have])
        lo = gaussian_filter1d(-maximum_filter1d(-lo, 9), 3); hi = gaussian_filter1d(maximum_filter1d(hi, 9), 3)
        mid, half = (lo + hi) / 2, np.maximum((hi - lo) / 2, 1.0)
        d = dl - mid[pos]
        ana = s[k] - np.sqrt(np.clip(half[pos] ** 2 - d ** 2, 0, None))
        # Blend from the pen-disc labels (outer ring) into the analytic ones (inner zone).
        rr = np.hypot(q[:, 0] - c[0], q[:, 1] - c[1])
        wgt = np.clip((reach - rr) / (reach - core_r), 0, 1)
        wgt = wgt * wgt * (3 - 2 * wgt)
        old = sub[sel]
        right = np.isfinite(old) & ((old > CROSSING_SPLIT) == want_second)
        sub[sel] = np.where(right, wgt * ana + (1 - wgt) * old, ana)
    return lab


def paint_pen(lab, path, s, radius, band, indices):
    """Paint the pen shape of each sample (late->early, so the earliest arc length wins)."""
    sh = 4  # cv2 fixed-point sub-pixel bits
    quad, n, ep, em, lane = band
    for i in sorted(indices, reverse=True):
        c = (int(round(path[i, 0] * 16)), int(round(path[i, 1] * 16)))
        if quad[i] and i + 1 < len(path):
            j = i + 1
            poly = np.array([path[i] + ep[i] * n[i], path[j] + ep[j] * n[j],
                             path[j] - em[j] * n[j], path[i] - em[i] * n[i]])
            cv2.fillConvexPoly(lab, np.round(poly * 16).astype(np.int32), float(s[i]), lineType=cv2.LINE_8, shift=sh)
            # disc spanning the band's full width keeps the tip round without widening it
            m = path[i] + (ep[i] - em[i]) / 2 * n[i]
            cv2.circle(lab, (int(round(m[0] * 16)), int(round(m[1] * 16))), int(round((ep[i] + em[i]) / 2 * 16)),
                       float(s[i]), -1, lineType=cv2.LINE_8, shift=sh)
        elif lane[i]:
            cv2.circle(lab, c, int(round(radius[i] * 16)), float(s[i]), -1, lineType=cv2.LINE_8, shift=sh)
        else:
            # centred between the stroke's two edges, so the round tip is symmetric even
            # where the centreline runs a little off-centre
            m = path[i] + (ep[i] - em[i]) / 2 * n[i]
            cv2.circle(lab, (int(round(m[0] * 16)), int(round(m[1] * 16))), int(round(((ep[i] + em[i]) / 2 + 1.0) * 16)),
                       float(s[i]), -1, lineType=cv2.LINE_8, shift=sh)
    return lab


def label_field(mask, path, radius, band):
    """Arc length at which each pixel is first covered by the pen."""
    h, w = mask.shape
    lab = np.full((h, w), np.inf, np.float32)
    s = np.arange(len(path)) * STEP
    paint_pen(lab, path, s, radius, band, range(len(path)))
    inside = mask > 0.0
    miss = inside & ~np.isfinite(lab)
    if miss.any():  # silhouette pixels no disc reached (rims, junctions, arrowhead corners)
        # Attach each to the disc whose edge is closest: it is revealed as that disc
        # grows past it, so it stays connected to the pen tip instead of popping up alone.
        yy, xx = np.nonzero(miss)
        q = np.stack([xx, yy], 1).astype(np.float32)
        sub = np.arange(0, len(path), 4)
        c, r = path[sub].astype(np.float32), radius[sub].astype(np.float32)
        best = np.empty(len(q), np.int64)
        for k in range(0, len(q), 4096):
            d = np.linalg.norm(q[k:k + 4096, None, :] - c[None], axis=2) - r[None]
            # Among discs whose edge is (nearly) the closest, take the latest pass: at a
            # crossing a pixel then waits for the stroke that owns it instead of leaking early.
            i0 = np.argmin(d, axis=1)
            later = (d <= d.min(axis=1, keepdims=True) + 12.0) & (s[sub][None] - s[sub][i0][:, None] > 300)
            i1 = np.where(later, d, np.inf).argmin(axis=1)
            best[k:k + 4096] = sub[np.where(later.any(axis=1), i1, i0)]
        lab[yy, xx] = s[best]
    lab = split_crossing(lab, mask, path, s, radius, band)
    # Arrowhead: once the pen reaches the base it fills the head from the base centre,
    # reaching the barbs part-way and the tip last (a disc cannot reach thin barbs in order).
    tip, left, right = (np.array(p, np.float64) for p in ARROWHEAD)
    base = (left + right) / 2
    u = (tip - base) / np.linalg.norm(tip - base)
    head = np.zeros_like(mask, np.uint8)
    tri = np.array([tip, left, right])
    tri = tri + 8 * (tri - tri.mean(0)) / np.linalg.norm(tri - tri.mean(0), axis=1)[:, None]  # include antialiased rim
    cv2.fillPoly(head, [np.round(tri).astype(np.int32)], 1)
    yy, xx = np.nonzero(head.astype(bool) & inside)
    rel = np.stack([xx, yy], 1) - base
    t = np.maximum(rel @ u, 0) / np.linalg.norm(tip - base)
    lat = np.abs(rel @ np.array([-u[1], u[0]])) / (np.linalg.norm(right - left) / 2)
    s_base = s[np.argmin(np.linalg.norm(path - base, axis=1))]
    lab[yy, xx] = s_base + (s[-1] - s_base) * np.clip(0.75 * t + 0.45 * lat, 0, 1)
    lab[~inside] = np.inf
    return lab, s[-1]


def timing(path, total_frames_draw):
    """Pen arc length per draw frame: curvature-aware speed with soft start/end."""
    d1 = np.gradient(path, axis=0)
    d2 = np.gradient(d1, axis=0)
    k = np.abs(d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0]) / (np.linalg.norm(d1, axis=1) ** 3 + 1e-9)
    k = gaussian_filter1d(k, 20)
    speed = 1.0 / np.sqrt(1.0 + (k * 55.0) ** 2)      # slower in tight curves
    speed = gaussian_filter1d(np.maximum(speed, 0.38), 90)  # no abrupt speed changes
    tau = np.concatenate([[0], np.cumsum(STEP / speed[:-1])])
    tau /= tau[-1]
    # Global gesture envelope: quick confident start, gentle settle at the tip.
    p = np.linspace(0, 1, 4001)
    up = np.clip(p / 0.10, 0, 1)
    down = np.clip((1 - p) / 0.20, 0, 1)
    env = np.minimum(up * up * (3 - 2 * up), down * down * (3 - 2 * down))
    env = 0.12 + 0.88 * env
    e = np.concatenate([[0], np.cumsum((env[1:] + env[:-1]) / 2)])
    e /= e[-1]
    s = np.arange(len(path)) * STEP
    tf = np.arange(1, total_frames_draw + 1) / total_frames_draw
    return np.interp(np.interp(tf, p, e), tau, s)


class Animation:
    def __init__(self):
        self.mask = load_mask()
        dt = distance_transform_edt(self.mask > 0.5)
        self.path = build_path(dt)
        self.radius, band = pen_radius(self.path, dt, self.mask)
        self.label, self.length = label_field(self.mask, self.path, self.radius, band)
        self.n_lead = round(LEAD_IN * FPS)
        self.n_draw = round(DRAW * FPS)
        self.n_hold = round(HOLD * FPS)
        self.n = self.n_lead + self.n_draw + self.n_hold
        self.pen_s = timing(self.path, self.n_draw)
        ys, xs = np.nonzero(self.mask > 0)
        self.bbox = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

    def pen_at(self, f):
        if f < self.n_lead:
            return -1.0
        return float(self.pen_s[min(f - self.n_lead, self.n_draw - 1)])

    def alpha(self, f):
        S = self.pen_at(f)
        if S < 0:
            return np.zeros_like(self.mask)
        if f >= self.n_lead + self.n_draw - 1:
            return self.mask.copy()  # exact final silhouette
        # 1-sample soft front for temporal/spatial antialiasing of the tip.
        cov = np.clip((S - self.label) / (2 * STEP) + 0.5, 0, 1)
        return self.mask * cov

    def frame(self, f, size, logo_w):
        W, H = size
        x0, y0, x1, y1 = self.bbox
        a = self.alpha(f)[y0:y1, x0:x1]
        scale = logo_w / (x1 - x0)
        tw, th = round((x1 - x0) * scale), round((y1 - y0) * scale)
        a = cv2.resize(a, (tw, th), interpolation=cv2.INTER_AREA)
        canvas = np.ones((H, W), np.float32) * 0
        ox, oy = (W - tw) // 2, (H - th) // 2
        canvas[oy:oy + th, ox:ox + tw] = a
        rgb = WHITE * (1 - canvas[..., None]) + BLUE * canvas[..., None]
        return np.clip(np.round(rgb), 0, 255).astype(np.uint8)


def debug(anim):
    rgb = np.dstack([anim.mask * 200] * 3).astype(np.uint8)
    im = Image.fromarray(rgb)
    d = ImageDraw.Draw(im)
    d.line([tuple(p) for p in anim.path], fill=(255, 0, 0), width=3)
    for x, y, _ in WAYPOINTS:
        d.ellipse([x - 4, y - 4, x + 4, y + 4], outline=(0, 255, 0))
    im.resize((975, 796)).save(os.path.join(HERE, "_debug_path.png"))
    lab = anim.label.copy()
    fin = np.isfinite(lab)
    norm = np.zeros_like(lab)
    norm[fin] = lab[fin] / anim.length
    hsv = np.dstack([(norm * 150).astype(np.uint8), np.full(lab.shape, 255, np.uint8),
                     (fin * 255).astype(np.uint8)])
    col = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    Image.fromarray(col).resize((975, 796)).save(os.path.join(HERE, "_debug_labels.png"))
    print(f"path length {anim.length:.0f}px, frames {anim.n}, radius {anim.radius.min():.1f}..{anim.radius.max():.1f}")


def storyboard(anim, out, count=24, cols=6):
    draw = np.linspace(anim.n_lead, anim.n_lead + anim.n_draw - 1, count).round().astype(int)
    tiles = []
    for f in draw:
        img = Image.fromarray(anim.frame(f, (440, 380), 400))
        d = ImageDraw.Draw(img)
        d.rectangle([0, 0, 439, 379], outline=(220, 220, 220))
        d.text((8, 6), f"#{len(tiles) + 1}  frame {f}  t={f / FPS:.2f}s", fill=(120, 120, 120))
        tiles.append(img)
    rows = (count + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 440, rows * 380), "white")
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 440, (i // cols) * 380))
    sheet.save(out)


def encode(anim, out, size, logo_w):
    W, H = size
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "4", "-tune", "animation", "-x264-params", "aq-mode=0:deblock=-1,-1",
           "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-color_range", "tv",
           "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1",
           "-movflags", "+faststart", "-r", str(FPS), out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(anim.n):
        proc.stdin.write(anim.frame(f, size, logo_w).tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError(f"ffmpeg failed for {out}")


def self_check(anim):
    """Asserts: blank start, exact end, monotone reveal, one pen tip."""
    assert anim.alpha(0).max() == 0, "first frame must be blank"
    assert np.array_equal(anim.alpha(anim.n - 1), anim.mask), "final frame must equal the silhouette"
    assert np.all(np.diff(anim.pen_s) >= -1e-6), "pen must never move backwards"
    jumps = np.diff(anim.pen_s)
    prev = anim.alpha(anim.n_lead)
    worst = 0.0
    split = []
    for f in range(anim.n_lead + 1, anim.n_lead + anim.n_draw):
        cur = anim.alpha(f)
        assert np.all(cur >= prev - 1e-6), f"frame {f} erased drawn pixels"
        new = (cur - prev) > 0.02
        if new.any():
            yy, xx = np.nonzero(new)
            i = int(anim.pen_at(f) / STEP)
            j = max(0, int(anim.pen_at(f - 1) / STEP) - 1)
            # every new pixel must lie within reach of the pen segment traversed this frame
            seg = anim.path[j:i + 1]
            dist, _ = cKDTree(seg).query(np.stack([xx, yy], 1))
            reach = anim.radius[j:i + 1].max()
            worst = max(worst, float((dist - reach).max()))
            # new pixels must form one blob attached to what is already drawn (or the very first dab)
            _, _, stats, _ = cv2.connectedComponentsWithStats(
                cv2.dilate(new.astype(np.uint8), np.ones((5, 5), np.uint8)))
            if (stats[1:, cv2.CC_STAT_AREA] > 60).sum() > 1:  # ignore 1-4 px antialias specks
                split.append(f)
        prev = cur
    print(f"frames where new pixels form >1 separate blob: {split}")
    print(f"pen step per frame: max {jumps.max():.1f}px, min {jumps.min():.2f}px (source px)")
    print(f"farthest new pixel beyond the pen disc: {worst:.1f}px (source px)")
    return worst


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    anim = Animation()
    if mode in ("debug", "all"):
        debug(anim)
    if mode in ("check", "all"):
        self_check(anim)
    if mode in ("storyboard", "all"):
        storyboard(anim, os.path.join(HERE, "epsilon-logo-draw-storyboard.png"))
    if mode in ("video", "all"):
        encode(anim, os.path.join(HERE, "epsilon-logo-draw-portrait-1080p60.mp4"), (1080, 1920), 720)
        encode(anim, os.path.join(HERE, "epsilon-logo-draw-square-1080p60.mp4"), (1080, 1080), 760)
