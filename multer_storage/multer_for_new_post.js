const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./statics/userimages");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user.username + req.user.posts.length + Math.floor(Math.random() * 10000) + ext);
  }
});
const uploadForNewItems = multer({
  storage: storage
});

module.exports = uploadForNewItems;