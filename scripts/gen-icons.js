// Generates solid PNG app icons (no external deps) for the PWA.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const CRC_TABLE = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function makePng(size, file) {
  const bg = hex("#0f172a");
  const green = hex("#22c55e");
  const red = hex("#ef4444");

  const m = Math.round(size * 0.16); // margin
  const g = Math.round(size * 0.06); // gap
  const sqW = Math.round((size - 2 * m - g) / 2);
  const top = m;
  const bottom = size - m;
  const leftX0 = m;
  const leftX1 = m + sqW;
  const rightX0 = m + sqW + g;
  const rightX1 = size - m;

  // Raw scanlines: 1 filter byte + RGBA per pixel.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let col = bg;
      if (y >= top && y < bottom) {
        if (x >= leftX0 && x < leftX1) col = green;
        else if (x >= rightX0 && x < rightX1) col = red;
      }
      raw[p++] = col[0];
      raw[p++] = col[1];
      raw[p++] = col[2];
      raw[p++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(file, png);
  console.log("wrote", file, png.length, "bytes");
}

const pub = path.join(__dirname, "..", "public");
makePng(192, path.join(pub, "icon-192.png"));
makePng(512, path.join(pub, "icon-512.png"));
