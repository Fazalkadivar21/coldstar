import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function(req, res, cb) {
    cb(null, "./public/temp");
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname); // get the file extension
    cb(null, `${uniqueSuffix}-${file.fieldname}${ext}`);
  }
});

export const upload = multer({ storage: storage });