const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./statics/userimages");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.body.username + ext);
  },
});
const upload = multer({
  storage: storage
});
module.exports = upload;