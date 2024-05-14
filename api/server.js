const express = require("express");
const multer = require("multer");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const { studentsRouter } = require("./modules/students");
const { professorsRouter } = require("./modules/professors");
const { activitiesRouter } = require("./modules/activities");
const { commentsRouter } = require("./modules/comments");
const { miscRouter } = require("./modules/misc");

const app = express();

app.use(express.json());
app.use(express.raw());
app.use(express.text());
app.use(express.static("uploads"));
app.use(cors());

app.use("/students", studentsRouter);
app.use("/professors", professorsRouter);
app.use("/activities", activitiesRouter);
app.use("/comments", commentsRouter);
app.use("/", miscRouter);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const privateKey = fs.readFileSync('ruta/a/tu/clave.privada');
const certificate = fs.readFileSync('ruta/a/tu/certificado.ssl');

const server = https.createServer({
    key: privateKey,
    cert: certificate
}, app);

const PORT = process.env.PORT || 443;

server.listen(PORT, () => {
  console.log(`Server running on port 443`);
});
