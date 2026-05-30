#!/usr/bin/env python3
"""Generate placeholder pixel-art town assets into public/town/.

Self-contained PNG (RGBA) encoder — no external deps. Re-run any time to
regenerate. Swap any output file for nicer art later; the slots are stable.

Outputs:
  grass.png, path.png            48x48 tiles (opaque)
  character.png                  sprite sheet: 2 frames x 4 directions (16px cells -> 32x64), transparent
  <building>.png x8              48x48 building sprites (transparent bg)
"""
import zlib, struct, os

# ---- palette ----
CLEAR = (0, 0, 0, 0)
INK   = (45, 45, 68, 255)
SKIN  = (255, 220, 177, 255)
HAIR  = (91, 58, 41, 255)
SHIRT = (200, 182, 255, 255)   # lavender
PANTS = (60, 60, 90, 255)
CREAM = (255, 244, 224, 255)
GRASS = (168, 216, 138, 255)
GRASS_D = (140, 196, 112, 255)
PATHC = (216, 196, 150, 255)
PATH_D = (192, 170, 120, 255)

def canvas(w, h, fill=CLEAR):
    return [[list(fill) for _ in range(w)] for _ in range(h)]

def px(img, x, y, c):
    if 0 <= y < len(img) and 0 <= x < len(img[0]):
        img[y][x] = list(c)

def rect(img, x0, y0, x1, y1, c):
    for y in range(y0, y1):
        for x in range(x0, x1):
            px(img, x, y, c)

def outline_rect(img, x0, y0, x1, y1, c):
    for x in range(x0, x1):
        px(img, x, y0, c); px(img, x, y1 - 1, c)
    for y in range(y0, y1):
        px(img, x0, y, c); px(img, x1 - 1, y, c)

def png_bytes(img):
    h = len(img); w = len(img[0])
    raw = bytearray()
    for row in img:
        raw.append(0)
        for (r, g, b, a) in row:
            raw += bytes((r, g, b, a))
    comp = zlib.compress(bytes(raw), 9)
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)  # color type 6 = RGBA
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', comp) + chunk(b'IEND', b'')

def save(name, img):
    with open(f'public/town/{name}', 'wb') as f:
        f.write(png_bytes(img))

# ---- tiles ----
def make_tile(base, dark):
    img = canvas(48, 48, base)
    for y in range(48):
        for x in range(48):
            if (x * 7 + y * 13) % 17 == 0 or (x // 6 + y // 6) % 4 == 0 and (x + y) % 5 == 0:
                px(img, x, y, dark)
    return img

# ---- character sheet (2 frames x 4 dirs, 16px cells) ----
def draw_char(img, ox, oy, d, f):
    # hair cap
    rect(img, ox + 4, oy + 1, ox + 12, oy + 4, HAIR)
    # head
    rect(img, ox + 5, oy + 3, ox + 11, oy + 8, SKIN)
    if d == 0:      # down — two eyes
        px(img, ox + 6, oy + 5, INK); px(img, ox + 9, oy + 5, INK)
    elif d == 1:    # up — back of head
        rect(img, ox + 5, oy + 3, ox + 11, oy + 7, HAIR)
    elif d == 2:    # left
        px(img, ox + 6, oy + 5, INK)
    elif d == 3:    # right
        px(img, ox + 9, oy + 5, INK)
    # shirt
    rect(img, ox + 5, oy + 8, ox + 11, oy + 12, SHIRT)
    # arms
    rect(img, ox + 4, oy + 8, ox + 5, oy + 11, SKIN)
    rect(img, ox + 11, oy + 8, ox + 12, oy + 11, SKIN)
    # legs
    rect(img, ox + 5, oy + 12, ox + 7, oy + 15, PANTS)
    rect(img, ox + 9, oy + 12, ox + 11, oy + 15, PANTS)
    # stepping foot
    if f == 0:
        rect(img, ox + 5, oy + 15, ox + 7, oy + 16, PANTS)
    else:
        rect(img, ox + 9, oy + 15, ox + 11, oy + 16, PANTS)

def make_character():
    img = canvas(32, 64)  # 2 cols x 4 rows of 16
    for d in range(4):
        for f in range(2):
            draw_char(img, f * 16, d * 16, d, f)
    return img

# ---- buildings (48x48, transparent bg) ----
def house(roof, accent, door=INK):
    img = canvas(48, 48)
    # walls
    rect(img, 11, 22, 37, 43, CREAM)
    outline_rect(img, 11, 22, 37, 43, INK)
    # roof (triangle)
    for i, y in enumerate(range(9, 23)):
        half = i + 2
        rect(img, 24 - half, y, 24 + half, y + 1, roof)
    for i, y in enumerate(range(9, 23)):  # roof outline edges
        half = i + 2
        px(img, 24 - half, y, INK); px(img, 24 + half - 1, y, INK)
    rect(img, 9, 22, 39, 23, INK)
    # door
    rect(img, 20, 33, 28, 43, door)
    outline_rect(img, 20, 33, 28, 43, INK)
    # window
    rect(img, 14, 26, 19, 31, accent)
    outline_rect(img, 14, 26, 19, 31, INK)
    rect(img, 29, 26, 34, 31, accent)
    outline_rect(img, 29, 26, 34, 31, INK)
    return img

def tree():
    img = canvas(48, 48)
    # trunk
    rect(img, 22, 30, 26, 43, (120, 80, 50, 255))
    outline_rect(img, 22, 30, 26, 43, INK)
    # canopy (blocky circle)
    GREEN = (96, 168, 96, 255)
    DGREEN = (70, 134, 70, 255)
    for y in range(8, 32):
        for x in range(8, 40):
            if (x - 24) ** 2 + (y - 20) ** 2 <= 13 ** 2:
                px(img, x, y, GREEN if (x + y) % 3 else DGREEN)
    return img

BUILDINGS = {
    'library': ('house', (139, 94, 60, 255),  (200, 182, 255, 255)),  # brown roof
    'photo':   ('house', (200, 182, 255, 255), (45, 45, 68, 255)),     # lavender roof
    'well':    ('house', (150, 150, 160, 255), (120, 160, 200, 255)),  # stone
    'park':    ('tree',  None, None),
    'gym':     ('house', (255, 123, 123, 255), (255, 244, 224, 255)),  # coral roof
    'kitchen': ('house', (255, 181, 167, 255), (184, 224, 210, 255)),  # peach roof
    'inn':     ('house', (120, 160, 200, 255), (255, 244, 224, 255)),  # blue roof
    'tavern':  ('house', (150, 60, 60, 255),   (90, 40, 40, 255)),     # dark red roof
}

def main():
    os.makedirs('public/town', exist_ok=True)
    save('grass.png', make_tile(GRASS, GRASS_D))
    save('path.png', make_tile(PATHC, PATH_D))
    save('character.png', make_character())
    for name, (kind, roof, accent) in BUILDINGS.items():
        img = tree() if kind == 'tree' else house(roof, accent)
        save(f'{name}.png', img)
    print('wrote', len(os.listdir('public/town')), 'files to public/town/')
    for f in sorted(os.listdir('public/town')):
        print(' ', f, os.path.getsize(f'public/town/{f}'), 'bytes')

if __name__ == '__main__':
    main()
