from PIL import Image, ImageFilter

src = r"g:\HR Assesment form\public\ahana-logo-official.png"
dst = r"g:\HR Assesment form\public\ahana-logo-white.png"

NAVY = (12, 28, 50)
WHITE = (255, 255, 255)

im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

BAR_Y0, BAR_Y1 = 76, 220
BAR_X0 = 168


def clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def letter_amount(r: int, g: int, b: int, a: int) -> float:
    if a < 10:
        return 0.0
    lum = (r + g + b) / 3.0
    sat = max(r, g, b) - min(r, g, b)
    t = clamp01((lum - 150) / 75.0)
    if sat > 30:
        t *= clamp01(1.0 - (sat - 30) / 85.0)
    t = clamp01((t - 0.08) / 0.82)
    return t


out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
op = out.load()

# 1) White banner + navy hospital name (matches header background)
for y in range(BAR_Y0, BAR_Y1 + 1):
    for x in range(BAR_X0, w):
        r, g, b, a = px[x, y]
        if a < 10:
            continue
        t = letter_amount(r, g, b, a)
        nr = int(WHITE[0] * (1 - t) + NAVY[0] * t)
        ng = int(WHITE[1] * (1 - t) + NAVY[1] * t)
        nb = int(WHITE[2] * (1 - t) + NAVY[2] * t)
        op[x, y] = (nr, ng, nb, a)

# 2) Icon on top in white, including the overlap with the banner
for y in range(BAR_Y0, BAR_Y1 + 1):
    for x in range(0, 200):
        r, g, b, a = px[x, y]
        if a < 16:
            continue
        if letter_amount(r, g, b, a) > 0.55:
            continue
        op[x, y] = (*WHITE, a)

# 3) Top and bottom lines: purple letter fill only (skip noisy white outlines), then thicken
for y0, y1 in ((0, BAR_Y0), (BAR_Y1 + 1, h)):
    mask = Image.new("L", (w, h), 0)
    m = mask.load()
    for y in range(y0, y1):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            sat = max(r, g, b) - min(r, g, b)
            if sat >= 30:
                m[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(3))
    m = mask.load()
    for y in range(y0, y1):
        for x in range(w):
            a = m[x, y]
            if a:
                op[x, y] = (*WHITE, a)

pad = 32
canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
canvas.paste(out, (pad, pad), out)
canvas.save(dst, "PNG")
print("saved", dst, canvas.size)
