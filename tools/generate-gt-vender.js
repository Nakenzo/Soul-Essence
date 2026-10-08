const fs = require('fs');
const zlib = require('zlib');

// Create PNG buffer with raw RGBA data
function makePng(width, height, getPixel) {
  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    raw[rowOffset] = 0; // Filter none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }
  const idatData = zlib.deflateSync(raw);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    let c = 0xffffffff;
    for (let i = 0; i < toCrc.length; i++) {
      c ^= toCrc[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    crcBuf.writeInt32BE((c ^ 0xffffffff) | 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// 40x44 canvas grid - Guardian Tales 2-head tall chibi proportions
const W = 42;
const H = 44;
const grid = Array.from({ length: H }, () => Array(W).fill(null));

// Palette (Hex to [r,g,b,a])
function hex(h, a = 255) {
  const num = parseInt(h.replace('#', ''), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, a];
}

const PAL = {
  OUTLINE: hex('#111116'),
  DARK_BG: hex('#181824', 0), // Transparent
  
  // Horns
  HORN_DARK: hex('#7f1d1d'),
  HORN_MID: hex('#b91c1c'),
  HORN_LIGHT: hex('#ef4444'),
  HORN_HI: hex('#fca5a5'),

  // Hair
  HAIR_BLACK: hex('#111115'),
  HAIR_DARK: hex('#1f1f26'),
  HAIR_GRAD1: hex('#581414'),
  HAIR_GRAD2: hex('#991b1b'),
  HAIR_RED_BRIGHT: hex('#ef4444'),
  HAIR_RED_FIRE: hex('#f97316'),

  // Skin
  SKIN_SHADOW: hex('#e09873'),
  SKIN_BASE: hex('#ffcc99'),
  SKIN_LIGHT: hex('#ffe4b5'),

  // Eyes
  EYE_WHITE: hex('#ffffff'),
  EYE_RED_DARK: hex('#991b1b'),
  EYE_RED: hex('#dc2626'),
  EYE_RED_BRIGHT: hex('#ef4444'),

  // Flaming Eye
  FLAME_WHITE: hex('#fef9c3'),
  FLAME_YELLOW: hex('#fde047'),
  FLAME_ORANGE: hex('#fb923c'),
  FLAME_RED: hex('#ef4444'),

  // Hoodie
  HOOD_RED_DARK: hex('#7f1d1d'),
  HOOD_RED: hex('#b91c1c'),
  HOOD_RED_BRIGHT: hex('#ef4444'),
  HOODIE_BLACK_DARK: hex('#18181f'),
  HOODIE_BLACK: hex('#272732'),
  HOODIE_BLACK_HI: hex('#3f3f4e'),

  // Gloves
  GLOVE_DARK: hex('#18181b'),
  GLOVE_MID: hex('#27272a'),

  // Pants & Sneakers
  PANTS: hex('#181820'),
  PANTS_HI: hex('#282834'),
  SNEAKER_BLACK: hex('#18181b'),
  SNEAKER_RED: hex('#dc2626'),
  SNEAKER_SOLE: hex('#f4f4f5'),

  // Scythe
  STAFF_DARK: hex('#1c1917'),
  STAFF_MID: hex('#44403c'),
  BLADE_DARK: hex('#7f1d1d'),
  BLADE_RED: hex('#dc2626'),
  BLADE_FIRE: hex('#f97316'),
  BLADE_EDGE: hex('#fef08a')
};

function p(x, y, color) {
  if (x >= 0 && x < W && y >= 0 && y < H) {
    grid[y][x] = color;
  }
}

function rect(x, y, w, h, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      p(x + dx, y + dy, color);
    }
  }
}

// ================= DRAW CHIBI VENDER =================
// 1. SCYTHE SHAFT (behind or in hand)
for (let i = 0; i <= 24; i++) {
  const sx = 22 + Math.floor(i * 0.45);
  const sy = 34 - i;
  p(sx, sy, PAL.STAFF_DARK);
  p(sx + 1, sy, PAL.STAFF_MID);
}

// 2. SCYTHE CRESCENT BLADE (Top-Right of shaft at x=31..40, y=5..20)
const bladePixels = [
  [33,9,PAL.BLADE_DARK],[34,8,PAL.BLADE_DARK],[35,7,PAL.BLADE_DARK],
  [36,6,PAL.BLADE_RED],[37,5,PAL.BLADE_FIRE],[38,5,PAL.BLADE_EDGE],
  [39,6,PAL.BLADE_FIRE],[38,7,PAL.BLADE_RED],[37,8,PAL.BLADE_FIRE],
  [36,9,PAL.BLADE_RED],[35,11,PAL.BLADE_FIRE],[34,13,PAL.BLADE_RED],
  [33,15,PAL.BLADE_FIRE],[32,17,PAL.BLADE_RED],[31,19,PAL.BLADE_DARK],
  // Inner blade glow
  [37,6,PAL.BLADE_EDGE],[36,7,PAL.BLADE_EDGE],[35,9,PAL.BLADE_FIRE],
  [34,11,PAL.BLADE_EDGE],[33,13,PAL.BLADE_FIRE],[32,15,PAL.BLADE_FIRE]
];
for (const [bx, by, col] of bladePixels) {
  p(bx, by, col);
  p(bx - 1, by, PAL.OUTLINE);
  p(bx + 1, by, PAL.OUTLINE);
}

// 3. HORNS (Red Demon Horns: x=10..13 and x=25..28)
// Left horn (viewer left)
p(11, 4, PAL.HORN_LIGHT); p(12, 3, PAL.HORN_HI); p(12, 2, PAL.HORN_LIGHT);
p(10, 5, PAL.HORN_MID); p(11, 5, PAL.HORN_LIGHT); p(12, 4, PAL.HORN_MID);
p(10, 6, PAL.HORN_DARK); p(11, 6, PAL.HORN_MID); p(12, 6, PAL.HORN_DARK);
p(10, 7, PAL.HORN_DARK); p(11, 7, PAL.HORN_MID);

// Right horn (viewer right)
p(26, 4, PAL.HORN_LIGHT); p(25, 3, PAL.HORN_HI); p(25, 2, PAL.HORN_LIGHT);
p(27, 5, PAL.HORN_MID); p(26, 5, PAL.HORN_LIGHT); p(25, 4, PAL.HORN_MID);
p(27, 6, PAL.HORN_DARK); p(26, 6, PAL.HORN_MID); p(25, 6, PAL.HORN_DARK);
p(27, 7, PAL.HORN_DARK); p(26, 7, PAL.HORN_MID);

// 4. HAIR (Top solid black, transitioning down to intense glowing flame-red)
// Top hair dome (y=5..10, x=11..27)
for (let y = 5; y <= 10; y++) {
  const w = y === 5 ? 8 : (y <= 7 ? 14 : 16);
  const startX = 19 - Math.floor(w / 2);
  for (let x = startX; x < startX + w; x++) {
    p(x, y, (y === 6 && (x === 17 || x === 18)) ? PAL.HAIR_DARK : PAL.HAIR_BLACK);
  }
}
// Hair spikes top
p(14, 4, PAL.HAIR_BLACK); p(18, 3, PAL.HAIR_BLACK); p(19, 3, PAL.HAIR_BLACK); p(23, 4, PAL.HAIR_BLACK);

// Mid hair (y=10..13) - start transition to crimson gradient
for (let y = 10; y <= 13; y++) {
  p(9, y, PAL.HAIR_BLACK); p(10, y, PAL.HAIR_BLACK);
  p(27, y, PAL.HAIR_BLACK); p(28, y, PAL.HAIR_BLACK);
}

// 5. FACE BASE (Skin: y=11..19, x=12..25)
for (let y = 11; y <= 18; y++) {
  const inset = y === 18 ? 2 : (y === 17 ? 1 : 0);
  for (let x = 12 + inset; x <= 25 - inset; x++) {
    p(x, y, y === 18 ? PAL.SKIN_SHADOW : PAL.SKIN_BASE);
  }
}
// Ears (pointed cute elf/demon ears)
p(10, 14, PAL.SKIN_SHADOW); p(9, 14, PAL.SKIN_BASE); p(8, 13, PAL.SKIN_BASE);
p(27, 14, PAL.SKIN_SHADOW); p(28, 14, PAL.SKIN_BASE); p(29, 13, PAL.SKIN_BASE);

// 6. BANGS / DOWNWARD FALLING HAIR (y=11..16, overlapping forehead, with fiery tips!)
// Bang strands falling down naturally over forehead
const bangs = [
  // Left side locks
  [10, 14, PAL.HAIR_GRAD1], [10, 15, PAL.HAIR_GRAD2], [10, 16, PAL.HAIR_RED_BRIGHT],
  [11, 13, PAL.HAIR_BLACK], [11, 14, PAL.HAIR_GRAD1], [11, 15, PAL.HAIR_RED_BRIGHT], [11, 16, PAL.HAIR_RED_FIRE],
  [12, 12, PAL.HAIR_BLACK], [12, 13, PAL.HAIR_GRAD1], [12, 14, PAL.HAIR_RED_BRIGHT],
  // Middle bangs
  [15, 11, PAL.HAIR_BLACK], [15, 12, PAL.HAIR_GRAD1], [15, 13, PAL.HAIR_RED_BRIGHT],
  [18, 11, PAL.HAIR_BLACK], [18, 12, PAL.HAIR_GRAD1], [18, 13, PAL.HAIR_RED_BRIGHT], [18, 14, PAL.HAIR_RED_FIRE],
  [21, 11, PAL.HAIR_BLACK], [21, 12, PAL.HAIR_GRAD1], [21, 13, PAL.HAIR_RED_BRIGHT],
  // Right side locks
  [24, 12, PAL.HAIR_BLACK], [24, 13, PAL.HAIR_GRAD1], [24, 14, PAL.HAIR_RED_BRIGHT],
  [26, 13, PAL.HAIR_BLACK], [26, 14, PAL.HAIR_GRAD1], [26, 15, PAL.HAIR_RED_BRIGHT], [26, 16, PAL.HAIR_RED_FIRE],
  [27, 14, PAL.HAIR_GRAD1], [27, 15, PAL.HAIR_GRAD2], [27, 16, PAL.HAIR_RED_BRIGHT]
];
for (const [bx, by, col] of bangs) p(bx, by, col);

// 7. EYES & FACE DETAILS
// Right eye (normal blood-red anime eye, viewer left at x=14..16, y=14..16)
p(14, 14, PAL.OUTLINE); p(15, 14, PAL.OUTLINE); p(16, 14, PAL.OUTLINE);
p(14, 15, PAL.EYE_WHITE); p(15, 15, PAL.EYE_RED); p(16, 15, PAL.EYE_RED_DARK);
p(14, 16, PAL.EYE_WHITE); p(15, 16, PAL.EYE_RED_BRIGHT); p(16, 16, PAL.EYE_RED);
p(15, 15, PAL.EYE_WHITE); // cute sparkle highlight

// Left eye (FLAMING EYE emitting flame wisp, viewer right at x=21..24, y=14..16)
p(21, 14, PAL.FLAME_ORANGE); p(22, 14, PAL.FLAME_YELLOW); p(23, 14, PAL.FLAME_WHITE);
p(21, 15, PAL.FLAME_RED); p(22, 15, PAL.FLAME_ORANGE); p(23, 15, PAL.FLAME_YELLOW);
p(21, 16, PAL.FLAME_RED); p(22, 16, PAL.FLAME_ORANGE);
// Flame wisps radiating outward from left eye:
p(24, 13, PAL.FLAME_ORANGE); p(25, 12, PAL.FLAME_YELLOW); p(26, 11, PAL.FLAME_WHITE);
p(25, 13, PAL.FLAME_RED); p(26, 12, PAL.FLAME_ORANGE); p(27, 11, PAL.FLAME_YELLOW);
p(25, 14, PAL.FLAME_ORANGE); p(26, 13, PAL.FLAME_YELLOW);

// Confident cool mouth
p(18, 18, PAL.SKIN_SHADOW); p(19, 18, PAL.OUTLINE); p(20, 18, PAL.OUTLINE); p(21, 17, PAL.OUTLINE);

// 8. HOODIE COLLAR & FOLDED HOOD AT NECK (y=19..22, x=13..25)
for (let y = 19; y <= 21; y++) {
  p(13, y, PAL.HOOD_RED_DARK); p(14, y, PAL.HOOD_RED);
  p(24, y, PAL.HOOD_RED); p(25, y, PAL.HOOD_RED_DARK);
}
// Hood folds behind neck
p(15, 19, PAL.HOOD_RED); p(16, 19, PAL.HOOD_RED_BRIGHT);
p(22, 19, PAL.HOOD_RED_BRIGHT); p(23, 19, PAL.HOOD_RED);
p(17, 20, PAL.HOOD_RED); p(18, 20, PAL.HOODIE_BLACK_DARK); p(19, 20, PAL.HOODIE_BLACK_DARK); p(20, 20, PAL.HOOD_RED);
// Drawstrings
p(17, 21, PAL.HOOD_RED_BRIGHT); p(17, 22, PAL.HOOD_RED_BRIGHT); p(17, 23, hex('#fef08a'));
p(21, 21, PAL.HOOD_RED_BRIGHT); p(21, 22, PAL.HOOD_RED_BRIGHT); p(21, 23, hex('#fef08a'));

// 9. TORSO: SLENDER TECHWEAR HOODIE (y=21..28, x=14..24)
for (let y = 21; y <= 27; y++) {
  for (let x = 15; x <= 23; x++) {
    p(x, y, PAL.HOODIE_BLACK);
  }
}
// Red zipper down center
for (let y = 21; y <= 27; y++) p(19, y, PAL.HOOD_RED_BRIGHT);
// Flame pattern on pockets/hem (y=25..27)
p(16, 26, PAL.HOOD_RED); p(17, 25, PAL.HOOD_RED_BRIGHT); p(17, 26, PAL.HOOD_RED);
p(21, 25, PAL.HOOD_RED_BRIGHT); p(21, 26, PAL.HOOD_RED); p(22, 26, PAL.HOOD_RED);
// Hem line
for (let x = 15; x <= 23; x++) p(x, 28, PAL.HOOD_RED);

// 10. SLEEVES & ARMS (Elbow-length sleeves, exposed forearms, fingerless gloves)
// Right arm (viewer left, holding staff at hip/side)
p(13, 22, PAL.HOODIE_BLACK); p(14, 22, PAL.HOODIE_BLACK);
p(13, 23, PAL.HOODIE_BLACK); p(14, 23, PAL.HOODIE_BLACK);
p(13, 24, PAL.HOOD_RED); p(14, 24, PAL.HOOD_RED); // red sleeve cuff at elbow!
// Exposed lower forearm skin
p(13, 25, PAL.SKIN_BASE); p(14, 25, PAL.SKIN_BASE);
// Fingerless glove hand
p(13, 26, PAL.GLOVE_DARK); p(14, 26, PAL.GLOVE_MID);
p(13, 27, PAL.GLOVE_DARK); p(14, 27, PAL.SKIN_BASE); // bare fingers

// Left arm (viewer right, gripping scythe shaft)
p(24, 22, PAL.HOODIE_BLACK); p(25, 22, PAL.HOODIE_BLACK);
p(24, 23, PAL.HOODIE_BLACK); p(25, 23, PAL.HOODIE_BLACK);
p(24, 24, PAL.HOOD_RED); p(25, 24, PAL.HOOD_RED); // red sleeve cuff at elbow!
// Exposed lower forearm skin
p(25, 25, PAL.SKIN_BASE); p(26, 25, PAL.SKIN_BASE);
// Fingerless glove gripping scythe
p(25, 26, PAL.GLOVE_DARK); p(26, 26, PAL.GLOVE_MID); p(27, 26, PAL.GLOVE_DARK);
p(25, 27, PAL.SKIN_BASE); p(26, 27, PAL.SKIN_BASE); // bare fingers

// 11. LEGS & SNEAKERS (Compact chibi legs)
// Dark slim combat pants (y=29..32)
for (let y = 29; y <= 32; y++) {
  p(16, y, PAL.PANTS); p(17, y, PAL.PANTS_HI);
  p(21, y, PAL.PANTS_HI); p(22, y, PAL.PANTS);
}

// Left sneaker (viewer left at x=14..18, y=33..36)
p(15, 33, PAL.SNEAKER_RED); p(16, 33, PAL.SNEAKER_BLACK); p(17, 33, PAL.SNEAKER_BLACK);
p(14, 34, PAL.SNEAKER_RED); p(15, 34, PAL.SNEAKER_BLACK); p(16, 34, PAL.SNEAKER_RED); p(17, 34, PAL.SNEAKER_BLACK);
// White sole
for (let x = 14; x <= 18; x++) p(x, 35, PAL.SNEAKER_SOLE);

// Right sneaker (viewer right at x=20..24, y=33..36)
p(21, 33, PAL.SNEAKER_BLACK); p(22, 33, PAL.SNEAKER_RED); p(23, 33, PAL.SNEAKER_BLACK);
p(21, 34, PAL.SNEAKER_BLACK); p(22, 34, PAL.SNEAKER_RED); p(23, 34, PAL.SNEAKER_BLACK); p(24, 34, PAL.SNEAKER_RED);
// White sole
for (let x = 20; x <= 24; x++) p(x, 35, PAL.SNEAKER_SOLE);

// 12. ADD DARK PIXEL OUTLINE AROUND CHARACTER
// Scan all non-empty pixels and ensure borders have outline
const outlined = JSON.parse(JSON.stringify(grid));
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    if (grid[y][x] === null) {
      // Check if neighboring any non-null pixel
      const hasNeighbor = 
        grid[y-1][x] !== null || grid[y+1][x] !== null ||
        grid[y][x-1] !== null || grid[y][x+1] !== null;
      if (hasNeighbor) {
        outlined[y][x] = PAL.OUTLINE;
      }
    }
  }
}

// Native 42x44 PNG
const nativePng = makePng(W, H, (x, y) => outlined[y][x] || [0, 0, 0, 0]);
fs.writeFileSync('tools/test_out/vender-gt-native.png', nativePng);

// 8x Scaled Up Pixel Art (336x352) for crisp viewing
const SCALE = 8;
const bigPng = makePng(W * SCALE, H * SCALE, (x, y) => {
  const gx = Math.floor(x / SCALE);
  const gy = Math.floor(y / SCALE);
  return outlined[gy][gx] || [0, 0, 0, 0];
});
fs.writeFileSync('tools/test_out/vender-gt-scaled.png', bigPng);

console.log('Guardian Tales chibi Vender created successfully!');
