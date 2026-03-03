// @ts-nocheck

function readUInt24LE(buffer, offset) {
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16)
  );
}

function getPngDimensions(buffer) {
  if (buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8);
  const expected = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!signature.equals(expected)) return null;

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) return null;
  return { width, height };
}

function getJpegDimensions(buffer) {
  if (buffer.length < 4) return null;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  const sofMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3,
    0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb,
    0xcd, 0xce, 0xcf,
  ]);

  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (buffer[offset] === 0xff && offset < buffer.length) {
      offset += 1;
    }
    if (offset >= buffer.length) break;

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 1 >= buffer.length) break;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2) return null;

    if (sofMarkers.has(marker)) {
      if (offset + 7 >= buffer.length) return null;
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      if (!width || !height) return null;
      return { width, height };
    }

    offset += segmentLength;
  }

  return null;
}

function getWebpDimensions(buffer) {
  if (buffer.length < 16) return null;
  if (
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;
    if (chunkDataOffset + chunkSize > buffer.length) return null;

    if (chunkType === 'VP8X') {
      if (chunkSize < 10) return null;
      const width = readUInt24LE(buffer, chunkDataOffset + 4) + 1;
      const height = readUInt24LE(buffer, chunkDataOffset + 7) + 1;
      return { width, height };
    }

    if (chunkType === 'VP8 ') {
      if (chunkSize < 10) return null;
      const startCode = buffer.subarray(chunkDataOffset + 3, chunkDataOffset + 6);
      if (
        startCode[0] !== 0x9d ||
        startCode[1] !== 0x01 ||
        startCode[2] !== 0x2a
      ) {
        return null;
      }
      const rawWidth = buffer.readUInt16LE(chunkDataOffset + 6);
      const rawHeight = buffer.readUInt16LE(chunkDataOffset + 8);
      const width = rawWidth & 0x3fff;
      const height = rawHeight & 0x3fff;
      if (!width || !height) return null;
      return { width, height };
    }

    if (chunkType === 'VP8L') {
      if (chunkSize < 5) return null;
      if (buffer[chunkDataOffset] !== 0x2f) return null;
      const b1 = buffer[chunkDataOffset + 1];
      const b2 = buffer[chunkDataOffset + 2];
      const b3 = buffer[chunkDataOffset + 3];
      const b4 = buffer[chunkDataOffset + 4];
      const width = 1 + (((b2 & 0x3f) << 8) | b1);
      const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      if (!width || !height) return null;
      return { width, height };
    }

    const padding = chunkSize % 2;
    offset = chunkDataOffset + chunkSize + padding;
  }

  return null;
}

function getImageDimensions(buffer, mimeType = '') {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return null;

  if (mimeType === 'image/png') return getPngDimensions(buffer);
  if (mimeType === 'image/jpeg') return getJpegDimensions(buffer);
  if (mimeType === 'image/webp') return getWebpDimensions(buffer);

  return (
    getPngDimensions(buffer) ||
    getJpegDimensions(buffer) ||
    getWebpDimensions(buffer)
  );
}

module.exports = {
  getImageDimensions,
};

