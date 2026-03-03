const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const multer = require('multer');
const {
  validateUploadedImageFiles,
  cleanupUploadedFiles,
} = require('../utils/uploadFileValidation');
const { getImageDimensions } = require('../utils/imageDimensions');

const MAX_CATEGORY_IMAGE_BYTES = 2 * 1024 * 1024;
const CATEGORY_ICON_SIZE_PX = 256;
const uploadRoot = path.join(__dirname, '..', 'uploads', 'categories');

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeExt = ext && ext.length <= 8 ? ext : '';
    const unique =
      Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, `${unique}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  return cb(null, true);
};

const uploadCategoryImage = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: MAX_CATEGORY_IMAGE_BYTES,
  },
});

const validateUploadedCategoryImage = async (req: any, _res: any, next: any) => {
  const file = req.file;
  if (!file) return next();

  try {
    await validateUploadedImageFiles([file]);
    const buffer = await fsp.readFile(file.path);
    const dimensions = getImageDimensions(buffer, file.detectedMimeType);

    if (!dimensions) {
      throw new Error('Unable to read image dimensions');
    }

    if (
      dimensions.width !== CATEGORY_ICON_SIZE_PX ||
      dimensions.height !== CATEGORY_ICON_SIZE_PX
    ) {
      throw new Error(
        `Category icon must be exactly ${CATEGORY_ICON_SIZE_PX}x${CATEGORY_ICON_SIZE_PX}px`,
      );
    }

    return next();
  } catch (err) {
    await cleanupUploadedFiles([file]);
    return next(err);
  }
};

module.exports = {
  uploadCategoryImage,
  validateUploadedCategoryImage,
  MAX_CATEGORY_IMAGE_BYTES,
  CATEGORY_ICON_SIZE_PX,
};
