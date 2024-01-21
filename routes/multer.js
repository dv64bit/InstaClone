const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    const unique = uuidv4(); // yeh line uploaded file ko ek random unique naam dega
    cb(null, unique + path.extname(file.originalname)); // path.extname(file.originalname ko use kar ke hum file ka extentions unique file name ke sath jodte hai
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
