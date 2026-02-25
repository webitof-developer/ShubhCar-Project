// @ts-nocheck
const fs = require('fs/promises');
const path = require('path');

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
let fileTypeFromBufferLoader = null;

async function resolveFileTypeFromBuffer() {
  if (fileTypeFromBufferLoader) return fileTypeFromBufferLoader;

  const fileTypeModule = await import('file-type');
  fileTypeFromBufferLoader = fileTypeModule.fileTypeFromBuffer;
  return fileTypeFromBufferLoader;
}

/**
 * Validates file content using magic bytes.
 */
async function validateFileBuffer(buffer) {
  const fileTypeFromBuffer = await resolveFileTypeFromBuffer();
  const detectedType = await fileTypeFromBuffer(buffer);

  if (!detectedType) {
    throw new Error('Unable to determine file type');
  }

  // Security: Block SVG to prevent stored XSS via embedded scripts.
  if (detectedType.mime === 'image/svg+xml') {
    throw new Error('Unsupported file type');
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(detectedType.mime)) {
    throw new Error('Unsupported file type');
  }

  return detectedType;
}

async function getFileBuffer(file) {
  if (Buffer.isBuffer(file?.buffer)) {
    return file.buffer;
  }

  if (file?.path) {
    return fs.readFile(file.path);
  }

  throw new Error('Invalid uploaded file');
}

async function validateUploadedImageFiles(files = []) {
  for (const file of files) {
    const buffer = await getFileBuffer(file);
    const detectedType = await validateFileBuffer(buffer);

    if (file?.path) {
      await normalizeDiskFilePath(file, detectedType.ext);
    }

    file.detectedMimeType = detectedType.mime;
    file.detectedExtension = detectedType.ext;
  }
}

async function normalizeDiskFilePath(file, detectedExtension) {
  const currentPath = file?.path;
  if (!currentPath || !detectedExtension) return;

  const parsed = path.parse(currentPath);
  const expectedExtension = `.${detectedExtension}`;
  if (parsed.ext.toLowerCase() === expectedExtension) return;

  const nextPath = path.join(parsed.dir, `${parsed.name}${expectedExtension}`);
  await fs.rename(currentPath, nextPath);

  file.path = nextPath;
  file.filename = `${parsed.name}${expectedExtension}`;
}

async function cleanupUploadedFiles(files = []) {
  await Promise.all(
    files.map(async (file) => {
      if (file?.path) {
        await fs.unlink(file.path).catch(() => null);
      }
    }),
  );
}

module.exports = {
  validateFileBuffer,
  validateUploadedImageFiles,
  cleanupUploadedFiles,
  ALLOWED_IMAGE_MIME_TYPES,
};

