const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  validateUploadedImageFiles,
  cleanupUploadedFiles,
} = require('../utils/uploadFileValidation');

const uploadRoot = path.join(__dirname, '..', 'uploads', 'media');

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeExt = ext && ext.length <= 8 ? ext : '';
    const unique =
      Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, `${unique}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Hint-only gate; final file trust comes from magic-byte validation post-upload.
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  return cb(null, true);
};

const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { files: 10, fileSize: 8 * 1024 * 1024 },
});

const validateUploadedMediaFiles = async (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return next();

  try {
    await validateUploadedImageFiles(files);
    return next();
  } catch (err) {
    await cleanupUploadedFiles(files);
    return next(err);
  }
};

module.exports = {
  uploadMedia,
  validateUploadedMediaFiles,
};
