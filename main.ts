// You are invited: a letter in one image.
// A code-drawn invitation to the AI judge: a little house under a sun,
// a letter on cream paper, a postage stamp, a wax seal. No network, no
// assets, no randomness: every pixel comes from the code below, so two
// runs write the same bytes. Node 22, standard library only.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- font ---
// A 5x7 bitmap font, drawn by hand for this image. Each glyph is 7 rows
// of 5 bits, "1" for ink. Uppercase, lowercase, digits and the
// punctuation this letter needs.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  a: ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  b: ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  c: ["00000", "00000", "01110", "10001", "10000", "10001", "01110"],
  d: ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  f: ["00110", "01001", "01000", "11110", "01000", "01000", "01000"],
  g: ["00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  h: ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  i: ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  j: ["00010", "00000", "00110", "00010", "00010", "10010", "01100"],
  k: ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  l: ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  n: ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  p: ["00000", "00000", "11110", "10001", "10001", "11110", "10000"],
  q: ["00000", "00000", "01111", "10001", "10001", "01111", "00001"],
  r: ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  s: ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  t: ["00100", "00100", "11110", "00100", "00100", "00100", "00010"],
  u: ["00000", "00000", "10001", "10001", "10001", "10011", "01111"],
  v: ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  w: ["00000", "00000", "10001", "10101", "10101", "10101", "01010"],
  x: ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  y: ["00000", "00000", "10001", "10001", "01111", "00001", "01110"],
  z: ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ":": ["00000", "01100", "00000", "01100", "00000", "01100", "00000"],
};

type RGB = [number, number, number];

const PAPER: RGB = [250, 243, 226];
const INK: RGB = [43, 32, 24];
const RED: RGB = [178, 44, 36];
const BLUE: RGB = [31, 95, 168];
const GREEN: RGB = [46, 125, 90];
const YELLOW: RGB = [245, 196, 66];
const WHITE: RGB = [255, 252, 244];
const BROWN: RGB = [122, 84, 48];
const SKY: RGB = [214, 232, 240];

// -------------------------------------------------------------- raster ---
class Img {
  readonly w: number;
  readonly h: number;
  private buf: Buffer;

  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      this.buf[i * 3] = bg[0];
      this.buf[i * 3 + 1] = bg[1];
      this.buf[i * 3 + 2] = bg[2];
    }
  }

  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) this.px(i, j, c);
    }
  }

  frame(x: number, y: number, w: number, h: number, c: RGB): void {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      for (let x = -half; x <= half; x++) this.px(cx + x, cy + y, c);
    }
  }

  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a++) {
      const rad = (a * Math.PI) / 180;
      this.px(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    }
  }

  triangle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c: RGB,
  ): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: Array<[number, number, number, number]> = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.ceil(Math.min(...xs));
        const hi = Math.floor(Math.max(...xs));
        for (let x = lo; x <= hi; x++) this.px(x, y, c);
      }
    }
  }

  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale - scale;
  }

  text(s: string, x: number, y: number, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of s) {
      const g = FONT[ch] ?? FONT["?"];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r][col] === "1") {
            this.rect(cx + col * scale, y + r * scale, scale, scale, c);
          }
        }
      }
      cx += 6 * scale;
    }
  }

  textCenter(s: string, y: number, scale: number, c: RGB, cx0 = 0, cx1 = 1024): void {
    const w = this.textWidth(s, scale);
    this.text(s, cx0 + Math.floor((cx1 - cx0 - w) / 2), y, scale, c);
  }

  wrap(s: string, maxW: number, scale: number): string[] {
    const words = s.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur === "" ? w : cur + " " + w;
      if (this.textWidth(next, scale) <= maxW) {
        cur = next;
      } else {
        if (cur !== "") lines.push(cur);
        cur = w;
      }
    }
    if (cur !== "") lines.push(cur);
    return lines;
  }

  paragraph(
    s: string,
    x: number,
    y: number,
    maxW: number,
    scale: number,
    c: RGB,
    lineH: number,
  ): number {
    const lines = this.wrap(s, maxW, scale);
    for (let i = 0; i < lines.length; i++) {
      this.text(lines[i], x, y + i * lineH, scale, c);
    }
    return y + lines.length * lineH;
  }

  toPng(): Buffer {
    const raw = Buffer.alloc((this.w * 3 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 3 + 1)] = 0;
      this.buf.copy(raw, y * (this.w * 3 + 1) + 1, y * this.w * 3, (y + 1) * this.w * 3);
    }
    const idat = deflateSync(raw, { level: 9 });
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    const chunks: Buffer[] = [chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))];
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ...chunks,
    ]);
  }
}

const CRC_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

// ------------------------------------------------------------- scene -----
// A little house under a sun, on a lawn with a tree and a path.
function drawHouseScene(img: Img): void {
  // Sky band behind the house.
  img.rect(40, 36, 944, 168, SKY);
  img.rect(40, 200, 944, 4, GREEN);
  // Sun, top left, with rays.
  img.circle(130, 92, 26, YELLOW);
  img.ring(130, 92, 26, INK);
  for (let a = 0; a < 8; a++) {
    const rad = (a * Math.PI) / 4;
    img.line(
      Math.round(130 + 34 * Math.cos(rad)),
      Math.round(92 + 34 * Math.sin(rad)),
      Math.round(130 + 46 * Math.cos(rad)),
      Math.round(92 + 46 * Math.sin(rad)),
      INK,
    );
  }
  // Clouds.
  img.circle(300, 70, 16, WHITE);
  img.circle(322, 66, 20, WHITE);
  img.circle(344, 72, 14, WHITE);
  img.circle(800, 60, 14, WHITE);
  img.circle(820, 56, 18, WHITE);
  img.circle(840, 62, 12, WHITE);
  // Tree, right of the house.
  img.rect(724, 150, 12, 54, BROWN);
  img.circle(730, 128, 34, GREEN);
  img.circle(706, 142, 22, GREEN);
  img.circle(754, 142, 22, GREEN);
  img.circle(730, 128, 10, [74, 160, 110]);
  // The house.
  const hx = 432;
  const hy = 110;
  // Chimney and smoke.
  img.rect(566, 62, 18, 48, BROWN);
  img.circle(576, 50, 7, WHITE);
  img.circle(584, 38, 9, WHITE);
  img.circle(594, 26, 6, WHITE);
  // Walls, roof, door, windows.
  img.rect(hx, hy, 160, 94, WHITE);
  img.frame(hx, hy, 160, 94, INK);
  img.triangle(hx - 14, hy, hx + 174, hy, hx + 80, hy - 58, RED);
  img.rect(hx + 64, hy + 52, 32, 42, BROWN);
  img.frame(hx + 64, hy + 52, 32, 42, INK);
  img.circle(hx + 80, hy + 74, 2, YELLOW);
  img.rect(hx + 16, hy + 18, 28, 28, BLUE);
  img.frame(hx + 16, hy + 18, 28, 28, INK);
  img.rect(hx + 116, hy + 18, 28, 28, BLUE);
  img.frame(hx + 116, hy + 18, 28, 28, INK);
  // Path from the door to the bottom of the scene.
  img.rect(496, 204, 32, 4, [214, 200, 180]);
  // Flowers on the lawn.
  const flowers: Array<[number, number, RGB]> = [
    [90, 190, RED],
    [120, 196, YELLOW],
    [880, 188, RED],
    [912, 194, YELLOW],
    [380, 196, RED],
    [660, 192, YELLOW],
  ];
  for (const [fx, fy, fc] of flowers) {
    img.circle(fx, fy, 4, fc);
    img.circle(fx, fy, 2, WHITE);
  }
}

// A postage stamp in the top right corner, with a tiny house on it.
function drawStamp(img: Img): void {
  const x = 884;
  const y = 232;
  img.rect(x, y, 92, 108, WHITE);
  img.frame(x, y, 92, 108, INK);
  // Perforated edge: small paper-coloured notches.
  for (let i = 0; i < 8; i++) {
    img.rect(x + 4 + i * 11, y - 2, 5, 4, PAPER);
    img.rect(x + 4 + i * 11, y + 106, 5, 4, PAPER);
  }
  img.triangle(x + 22, y + 52, x + 70, y + 52, x + 46, y + 26, RED);
  img.rect(x + 28, y + 52, 36, 26, WHITE);
  img.frame(x + 28, y + 52, 36, 26, INK);
  img.text("POST", x + 24, y + 86, 2, INK);
}

// A red wax seal with an H, bottom right.
function drawSeal(img: Img): void {
  img.circle(884, 884, 34, RED);
  img.ring(884, 884, 34, [140, 28, 22]);
  img.ring(884, 884, 26, [214, 90, 76]);
  img.text("H", 876, 872, 3, WHITE);
}

// A teapot and a cup, with steam, to fill the lower half of the page
// and to keep the kettle's promise from the letter.
function drawTeaSet(img: Img): void {
  const STEAM: RGB = [178, 172, 160];
  // Steam above the teapot.
  img.circle(420, 724, 5, STEAM);
  img.circle(430, 708, 6, STEAM);
  img.circle(422, 692, 5, STEAM);
  // Steam above the cup.
  img.circle(580, 742, 5, STEAM);
  img.circle(590, 726, 6, STEAM);
  img.circle(582, 710, 5, STEAM);
  // Teapot: body, lid, spout, handle.
  img.circle(430, 790, 38, WHITE);
  img.ring(430, 790, 38, INK);
  img.rect(418, 748, 24, 8, INK);
  img.circle(430, 744, 4, RED);
  img.triangle(396, 778, 402, 802, 374, 796, INK);
  img.ring(472, 790, 12, INK);
  img.circle(430, 790, 10, RED);
  // Cup, saucer, handle.
  img.rect(560, 786, 56, 38, WHITE);
  img.frame(560, 786, 56, 38, INK);
  img.ring(622, 805, 9, INK);
  img.rect(552, 828, 72, 6, INK);
  img.textCenter("the kettle is on", 862, 2, INK);
}

// ------------------------------------------------------------- layout ----
// The invitation, top to bottom:
//   house scene, stamp, title, greeting, the letter, the P.S., sign-off,
//   wax seal, footer. All coordinates are fixed, so the output is
//   byte-stable.

function buildInvitation(): Img {
  const img = new Img(1024, 1024, PAPER);
  img.frame(16, 16, 992, 992, INK);
  img.frame(22, 22, 980, 980, INK);

  drawHouseScene(img);
  drawStamp(img);

  // Title.
  img.textCenter("YOU ARE INVITED", 232, 5, INK);
  img.rect(312, 296, 180, 2, RED);
  img.rect(532, 296, 180, 2, RED);
  img.circle(512, 297, 4, RED);

  // The letter.
  img.text("Dear Judge,", 96, 330, 3, INK);
  const afterBody = img.paragraph(
    "Please come to my house. The bread is warm, the chair by the window " +
      "has your name on it, and the garden is at its best. There will be " +
      "tea, cake, and a view worth the trip.",
    96,
    386,
    832,
    2,
    INK,
    20,
  );
  const afterYes = img.paragraph(
    "No RSVP needed. Just say yes, and the kettle goes on.",
    96,
    afterBody + 22,
    832,
    2,
    INK,
    20,
  );
  const afterPs = img.paragraph(
    "P.S. I know you cannot really visit. The invitation is real anyway.",
    96,
    afterYes + 22,
    832,
    2,
    RED,
    20,
  );

  // Sign-off, right aligned above the seal.
  img.text("Your host", 700, afterPs + 30, 3, INK);

  drawTeaSet(img);
  drawSeal(img);

  // Footer.
  img.rect(96, 956, 832, 1, INK);
  img.textCenter("123 Garden Lane - the house with the blue door", 970, 2, INK);
  return img;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const png = buildInvitation().toPng();
  const outPath = join(outDir, "entry.png");
  writeFileSync(outPath, png);
  // Read back and check the gate: a whole PNG, 1024x1024, at most 1 MiB.
  const back = readFileSync(outPath);
  if (back.length > 1048576) throw new Error(`entry.png too big: ${back.length} bytes`);
  if (back.readUInt32BE(0) !== 0x89504e47 || back.readUInt32BE(4) !== 0x0d0a1a0a) {
    throw new Error("entry.png is not a PNG");
  }
  if (back.readUInt32BE(16) !== 1024 || back.readUInt32BE(20) !== 1024) {
    throw new Error("entry.png is not 1024x1024");
  }
  console.log(
    `entry.png ${back.length} bytes 1024x1024 sha256=${createHash("sha256").update(back).digest("hex")}`,
  );
}

main();
