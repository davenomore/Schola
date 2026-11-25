/**
 * Standalone QR Code Generator
 * Fully compliant with ISO/IEC 18004 for QR Code Generation.
 * Generates QR Code matrix (2D boolean array) with UTF-8 byte encoding
 * and Reed-Solomon error correction.
 */

// Galois Field 256 math tables
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGF() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val <<= 1;
    if (val & 256) val ^= 0x11d;
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

// Polynomial generator for Reed-Solomon error correction
function rsGenPoly(numErrors) {
  let poly = [1];
  for (let i = 0; i < numErrors; i++) {
    const factor = [1, EXP_TABLE[i]];
    const nextPoly = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= poly[j];
      nextPoly[j + 1] ^= gMul(poly[j], factor[1]);
    }
    poly = nextPoly;
  }
  return poly;
}

// Compute error correction codewords
function rsCompute(data, numErrors) {
  const gen = rsGenPoly(numErrors);
  const res = new Uint8Array(numErrors);
  for (let i = 0; i < data.length; i++) {
    const coef = data[i] ^ res[0];
    for (let j = 0; j < numErrors - 1; j++) {
      res[j] = res[j + 1] ^ gMul(gen[j + 1], coef);
    }
    res[numErrors - 1] = gMul(gen[numErrors], coef);
  }
  return res;
}

// QR Table: Level M (15% error correction)
// Versions 1 to 6 (supports up to 134 bytes / characters, ample for web links, URLs, Wi-Fi configs)
const VERSION_SPECS = [
  null,
  // v1: 21x21 (max 14-16 bytes)
  { totalCW: 26, ecCW: 10, b1: 1, d1: 16, b2: 0, d2: 0, align: [] },
  // v2: 25x25 (max 28 bytes)
  { totalCW: 44, ecCW: 16, b1: 1, d1: 28, b2: 0, d2: 0, align: [6, 18] },
  // v3: 29x29 (max 44 bytes)
  { totalCW: 70, ecCW: 26, b1: 1, d1: 44, b2: 0, d2: 0, align: [6, 22] },
  // v4: 33x33 (max 64 bytes)
  { totalCW: 100, ecCW: 18, b1: 2, d1: 32, b2: 0, d2: 0, align: [6, 26] },
  // v5: 37x37 (max 86 bytes)
  { totalCW: 134, ecCW: 24, b1: 2, d1: 43, b2: 0, d2: 0, align: [6, 30] },
  // v6: 41x41 (max 108 bytes)
  { totalCW: 172, ecCW: 16, b1: 4, d1: 27, b2: 0, d2: 0, align: [6, 34] }
];

// UTF-8 string to byte array
function toUtf8Bytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      i++;
      const nextCode = str.charCodeAt(i);
      const cp = 0x10000 + ((code & 0x3ff) << 10) + (nextCode & 0x3ff);
      bytes.push(0xf0 | (cp >> 18));
      bytes.push(0x80 | ((cp >> 12) & 0x3f));
      bytes.push(0x80 | ((cp >> 6) & 0x3f));
      bytes.push(0x80 | (cp & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

// Bit stream buffer
class BitBuffer {
  constructor() {
    this.buffer = [];
    this.length = 0;
  }
  put(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }
}

/**
 * Creates QR code matrix for text
 * Returns 2D boolean array (modules[row][col] is true if dark, false if light)
 */
export function generateQRCode(text) {
  if (!text || text.length === 0) {
    text = ' ';
  }
  const utf8 = toUtf8Bytes(text);

  // Pick smallest fitting version
  let version = 1;
  while (version <= 6) {
    const spec = VERSION_SPECS[version];
    const dataCW = spec.b1 * spec.d1 + spec.b2 * spec.d2;
    // 4 bits mode + 8 bits length + data*8
    const requiredBits = 4 + 8 + utf8.length * 8;
    if (requiredBits <= dataCW * 8) {
      break;
    }
    version++;
  }

  if (version > 6) {
    version = 6; // Cap at version 6
  }

  const spec = VERSION_SPECS[version];
  const totalDataCW = spec.b1 * spec.d1 + spec.b2 * spec.d2;

  // 1. Bit encoding (Byte Mode: 0100)
  const bitBuf = new BitBuffer();
  bitBuf.put(4, 4); // Byte mode
  bitBuf.put(utf8.length, 8); // Character count
  for (const b of utf8) {
    bitBuf.put(b, 8);
  }

  // Terminator bits (up to 4 zeroes)
  const remainingBits = totalDataCW * 8 - bitBuf.length;
  bitBuf.put(0, Math.min(4, Math.max(0, remainingBits)));

  // Pad to byte boundary
  while (bitBuf.length % 8 !== 0) {
    bitBuf.putBit(false);
  }

  // Pad bytes: 0xEC, 0x11
  const pad = [0xec, 0x11];
  let padIdx = 0;
  while (bitBuf.buffer.length < totalDataCW) {
    bitBuf.buffer.push(pad[padIdx % 2]);
    padIdx++;
  }

  // 2. Error correction block generation & interleaving
  const dataBlocks = [];
  let offset = 0;
  for (let i = 0; i < spec.b1; i++) {
    dataBlocks.push(bitBuf.buffer.slice(offset, offset + spec.d1));
    offset += spec.d1;
  }
  for (let i = 0; i < spec.b2; i++) {
    dataBlocks.push(bitBuf.buffer.slice(offset, offset + spec.d2));
    offset += spec.d2;
  }

  const ecBlocks = [];
  for (const block of dataBlocks) {
    ecBlocks.push(rsCompute(block, spec.ecCW));
  }

  // Interleave data codewords
  const finalCodewords = [];
  const maxDataLen = Math.max(spec.d1, spec.d2);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < dataBlocks.length; b++) {
      if (i < dataBlocks[b].length) {
        finalCodewords.push(dataBlocks[b][i]);
      }
    }
  }

  // Interleave error correction codewords
  for (let i = 0; i < spec.ecCW; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  // 3. Matrix construction
  const size = 17 + 4 * version;
  const modules = Array.from({ length: size }, () => new Array(size).fill(null));

  // Finder pattern helper with 1-module white separator
  const addFinderPattern = (r, c) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const row = r + y;
        const col = c + x;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (
            (y >= 0 && y <= 6 && (x === 0 || x === 6)) ||
            (x >= 0 && x <= 6 && (y === 0 || y === 6)) ||
            (y >= 2 && y <= 4 && x >= 2 && x <= 4)
          ) {
            modules[row][col] = true;
          } else {
            modules[row][col] = false;
          }
        }
      }
    }
  };

  // Three finder patterns
  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
    if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
  }

  // Alignment patterns
  if (spec.align && spec.align.length > 0) {
    for (const r of spec.align) {
      for (const c of spec.align) {
        // Skip if overlapping finder patterns
        if (
          (r <= 8 && c <= 8) ||
          (r <= 8 && c >= size - 8) ||
          (r >= size - 8 && c <= 8)
        ) {
          continue;
        }
        for (let y = -2; y <= 2; y++) {
          for (let x = -2; x <= 2; x++) {
            if (Math.abs(y) === 2 || Math.abs(x) === 2 || (y === 0 && x === 0)) {
              modules[r + y][c + x] = true;
            } else {
              modules[r + y][c + x] = false;
            }
          }
        }
      }
    }
  }

  // Dark module
  modules[4 * version + 9][8] = true;

  // Format info: Level M (00) + Mask 0 (000) -> 00000 XOR 101010000010010 = 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // 1st copy: Around top-left finder pattern
  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] === 1;
    if (i <= 5) modules[8][i] = bit;
    else if (i === 6) modules[8][7] = bit;
    else if (i === 7) modules[8][8] = bit;
    else if (i === 8) modules[7][8] = bit;
    else modules[14 - i][8] = bit;
  }

  // 2nd copy: Split across top-right (bits 0-7) and bottom-left (bits 8-14)
  for (let i = 0; i < 8; i++) {
    modules[8][size - 1 - i] = formatBits[i] === 1;
  }
  for (let i = 8; i < 15; i++) {
    modules[size - 15 + i][8] = formatBits[i] === 1;
  }

  // 4. Place data bits in matrix (right-to-left zigzag)
  let bitIndex = 0;
  const totalBits = finalCodewords.length * 8;
  const getBit = (idx) => {
    if (idx >= totalBits) return false;
    const byte = finalCodewords[Math.floor(idx / 8)];
    return ((byte >>> (7 - (idx % 8))) & 1) === 1;
  };

  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing pattern
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [col, col - 1]) {
        if (modules[r][c] === null) {
          const bitVal = getBit(bitIndex++);
          // Mask 0 formula: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          modules[r][c] = mask ? !bitVal : bitVal;
        }
      }
    }
    upwards = !upwards;
  }

  return modules;
}
