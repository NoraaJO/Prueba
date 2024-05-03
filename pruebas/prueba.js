const express = require("express");
const sql = require("mssql");
const xlsx = require("xlsx");
const multer = require("multer");
const cors = require("cors");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
})
const upload = multer({storage: storage})

const app = express();

app.use(express.json());
app.use(express.raw());
app.use(express.text());
app.use(cors());

var dbConfig = {
  user: "admin",
  password: "PnGJpG124",
  server: "databasedsw.cdcswyy0yssz.us-east-2.rds.amazonaws.com",
  port: 1433,
  database: "prueba",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();



app.put("/prueba", async (req, res) => {
  try {
  await poolConnect;
  const request = pool.request()
  const nombre = req.body["nombre"]
  console.log(`${nombre}`)
  request.input('InNombre', sql.VarChar(32), nombre)
  const result = request.execute('CrearEstado')
  res.send(`Resultado:`)
  } catch(err){
    console.error("Error al consultar la base de datos:", err);
    res.status(500).send(err.message);
  }
})
app.get("/obtenerEst", async (req, res) =>{
  await poolConnect
  const request = pool.request();

  const result = await request.query('SELECT * FROM dbo.Estado');
  console.log(result.recordset)
  res.json(result.recordset);
})


app.post("/archivo", upload.single('archivo'), (req, res) => { 
  const archivoexcel = req.file.path;
  req.des
  if (!archivoexcel){
    return res.send("No se cargo los datos")
  }
  const workbook = xlsx.readFile(archivoexcel);

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = []

  const rango = xlsx.utils.decode_range(worksheet['!ref']);
  for(let rowNum = rango.s.r+2; rowNum <= rango.e.r; rowNum++){
    const row = []
    for (let colNum = rango.s.c; colNum <= rango.e.c ; colNum++){
      const cellAdress = xlsx.utils.encode_cell({r: rowNum, c: colNum});
      const cell = worksheet[cellAdress];
      if (cell){
        console.log(cell["v"])
      }
    }
    data.push(row);
  }
  res.send(data)
});
app.get("/pruebaExcel", (req, res) => {
  const data = [
    ['','Estudiantes'],
    ['Edad', 'Nombre'],
    [12, 'Maicol'],
    [14, 'Brand']
  ]
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(data)
  xlsx.utils.book_append_sheet(workbook, worksheet, 'CA')
  const excelBuffer = xlsx.write(workbook, {type: 'buffer', bookType: 'xlsx'})

  res.setHeader('Content-Disposition', 'attachment; filename="datos.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  res.send(excelBuffer)
});
  
app.get("/", (req, res) => {
  res.end("Hola mundo");
});

app.listen(3000);
console.log(`Server on port ${3000}`);
