const multer = require('multer');

// Store files in memory buffer before uploading to Supabase
const storage = multer.memoryStorage();

const createUpload = (fileTypes, maxSize) => {
  return multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      if (fileTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed: ${fileTypes.join(', ')}`), false);
      }
    }
  });
};

const uploadPhoto = createUpload(['image/jpeg', 'image/png', 'image/webp'], 2 * 1024 * 1024); // 2MB
const uploadCV = createUpload(['application/pdf'], 5 * 1024 * 1024); // 5MB

module.exports = {
  uploadPhoto,
  uploadCV
};
