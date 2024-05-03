const express = require("express");
const sql = require("mssql");
const xlsx = require("xlsx");
const multer = require("multer");
const path = require("path");
const cors = require("cors")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB (en bytes)
  } });

const app = express();

app.use(express.json());
app.use(express.raw());
app.use(express.text());
app.use(express.static("uploads"));
app.use(cors());

var dbConfig = {
  user: "admin",
  password: "PnGJpG124",
  server: "databasedsw.cdcswyy0yssz.us-east-2.rds.amazonaws.com",
  port: 1433,
  database: "GETG",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

/*
var dbConfig = {
  user: "sa",
  password: "1234",
  server: "ERRON",
  database: "GETG",
  options: {
    trustServerCertificate: true,
    trustedConnection: true,
    enableArithAbort: true,
    instancename: "MSSQLSERVER",
  },
  port: 1433,
};
*/
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

//Sección de leer excel para registrar estudiantes.
app.post("/insertEstudiantes", upload.single("archivo"), async (req, res) => {
  try {
    await poolConnect;
    const sede = req.body.sede;
    const archivo = req.file.path;
    if (!archivo) {
      return res.status(400).send("Error: Archivo no carga");
    }
    const workbook = xlsx.readFile(archivo); // lee el archivo en el servidor
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rango = xlsx.utils.decode_range(worksheet["!ref"]);
    var result = 1;
    for (let rowNum = rango.s.r + 2; rowNum <= rango.e.r; rowNum++) {
      const request = pool.request();
      request.input("inSede", sql.VarChar(64), sede);
      const cellrango = rango.s.c;
      var direccion = xlsx.utils.encode_cell({ r: rowNum, c: cellrango });
      request.input("inNombre", sql.VarChar(32), worksheet[direccion]["v"]);
      direccion = xlsx.utils.encode_cell({ r: rowNum, c: cellrango + 1 });
      request.input("inApellido1", sql.VarChar(32), worksheet[direccion]["v"]);
      direccion = xlsx.utils.encode_cell({ r: rowNum, c: cellrango + 2 });
      request.input("inApellido2", sql.VarChar(32), worksheet[direccion]["v"]);
      direccion = xlsx.utils.encode_cell({ r: rowNum, c: cellrango + 3 });
      var carnet = worksheet[direccion]["v"];
      request.input("inCarnet", sql.VarChar(64), carnet.toString());
      direccion = xlsx.utils.encode_cell({ r: rowNum, c: cellrango + 4 });
      var celular = worksheet[direccion]["v"];
      request.input("inCelular", sql.VarChar(32), celular.toString());
      direccion = xlsx.utils.encode_cell({ r: rowNum, c: cellrango + 5 });
      request.input("inCorreo", sql.VarChar(64), worksheet[direccion]["v"]);
      result = await request.execute("dbo.registrarEstudiante");
      if (result.returnValue !== 1) {
        return res.status(500).send({ Result: result.returnValue });
      }
    }
    res.json({ Result: result.returnValue });
  } catch {
    res.status.json({ Result: -30 });
  }
});

/*
app.post("/archivo", upload.single("archivo"), (req, res) => {
  const archivoexcel = req.file.path;
  if (!archivoexcel) {
    return res.send("No se cargo los datos");
  }
  const workbook = xlsx.readFile(archivoexcel);

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = [];

  const rango = xlsx.utils.decode_range(worksheet["!ref"]);
  for (let rowNum = rango.s.r + 2; rowNum <= rango.e.r; rowNum++) {
    const row = [];
    for (let colNum = rango.s.c; colNum <= rango.e.c; colNum++) {
      const cellAdress = xlsx.utils.encode_cell({ r: rowNum, c: colNum });
      const cell = worksheet[cellAdress];
      if (cell) {
        console.log(cell["v"]);
      }
    }
    data.push(row);
  }
  res.send(data);
});
*/
//Obtener excel de todos los estudiantes
app.get("/archivoAll", async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    const dataCA = [
      ["Estudiantes"],
      [
        "Nombre",
        "Apellido1",
        "Apellidos2",
        "Carnet",
        "Celular",
        "Correo",
        "Sede",
      ],
    ];
    const dataSJ = [
      ["Estudiantes"],
      [
        "Nombre",
        "Apellido1",
        "Apellidos2",
        "Carnet",
        "Celular",
        "Correo",
        "Sede",
      ],
    ];
    const dataLI = [
      ["Estudiantes"],
      [
        "Nombre",
        "Apellido1",
        "Apellidos2",
        "Carnet",
        "Celular",
        "Correo",
        "Sede",
      ],
    ];
    const dataAL = [
      ["Estudiantes"],
      [
        "Nombre",
        "Apellido1",
        "Apellidos2",
        "Carnet",
        "Celular",
        "Correo",
        "Sede",
      ],
    ];
    const dataSC = [
      ["Estudiantes"],
      [
        "Nombre",
        "Apellido1",
        "Apellidos2",
        "Carnet",
        "Celular",
        "Correo",
        "Sede",
      ],
    ];
    const result = await request.execute("dbo.obtDatosAllEst");
    if (result.returnValue === -1) {
      return req.json({ Result: result.returnValue });
    }
    const workbook = xlsx.utils.book_new();
    result.recordset.forEach((row) => {
      if (row.Sede === "CA") {
        dataCA.push([
          row.Nombre,
          row.Apellido1,
          row.Apellido2,
          row.carnet,
          row.celular,
          row.correo,
          row.Sede,
        ]);
      } else if (row.Sede === "SJ") {
        dataSJ.push([
          row.Nombre,
          row.Apellido1,
          row.Apellido2,
          row.carnet,
          row.celular,
          row.correo,
          row.Sede,
        ]);
      } else if (row.Sede === "LI") {
        dataLI.push([
          row.Nombre,
          row.Apellido1,
          row.Apellido2,
          row.carnet,
          row.celular,
          row.correo,
          row.Sede,
        ]);
      } else if (row.Sede === "AL") {
        dataAL.push([
          row.Nombre,
          row.Apellido1,
          row.Apellido2,
          row.carnet,
          row.celular,
          row.correo,
          row.Sede,
        ]);
      } else {
        dataSC.push([
          row.Nombre,
          row.Apellido1,
          row.Apellido2,
          row.carnet,
          row.celular,
          row.correo,
          row.Sede,
        ]);
      }
    });
    var worksheet = "";
    if (dataCA.length > 2) {
      worksheet = xlsx.utils.aoa_to_sheet(dataCA);
      xlsx.utils.book_append_sheet(workbook, worksheet, "CA");
    }
    if (dataSJ.length > 2) {
      worksheet = xlsx.utils.aoa_to_sheet(dataSJ);
      xlsx.utils.book_append_sheet(workbook, worksheet, "SJ");
    }
    if (dataLI.length > 2) {
      worksheet = xlsx.utils.aoa_to_sheet(dataLI);
      xlsx.utils.book_append_sheet(workbook, worksheet, "LI");
    }
    if (dataAL.length > 2) {
      worksheet = xlsx.utils.aoa_to_sheet(dataAL);
      xlsx.utils.book_append_sheet(workbook, worksheet, "AL");
    }
    if (dataSC.length > 2) {
      worksheet = xlsx.utils.aoa_to_sheet(dataSC);
      xlsx.utils.book_append_sheet(workbook, worksheet, "SC");
    }
    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    res.setHeader("Content-Disposition", 'attachment; filename="datos.xlsx"');
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(excelBuffer);
  } catch {
    res.status(400).json({ Result: -30 });
  }
});
//Obtener excel de la sede de
app.get("/archivoSede", async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    const profesor = req.query.profe;
    const datos = [
      ["Estudiantes"],
      [
        "Nombre",
        "Apellido1",
        "Apellidos2",
        "Carnet",
        "Celular",
        "Correo",
        "Sede",
      ],
    ];
    request.input("inIdUsuario", sql.Int, profesor.toString());
    request.output("outSede", sql.VarChar(32), "");
    const result = await request.execute("dbo.obtDatosEstSede");
    const sede = result.output.outSede;
    if (result.returnValue !== 0) {
      return res.json({ Result: result.returnValue });
    }
    const workbook = xlsx.utils.book_new();
    result.recordset.forEach((row) => {
      datos.push([
        row.Nombre,
        row.Apellido1,
        row.Apellido2,
        row.carnet,
        row.celular,
        row.correo,
        row.Sede,
      ]);
    });
    var worksheet = xlsx.utils.aoa_to_sheet(datos);
    xlsx.utils.book_append_sheet(workbook, worksheet, `${sede}`);
    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="datos${sede}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(excelBuffer);
  } catch {
    res.status(400).json({ Result: -30 });
  }
});
//Registrar Profesor
app.post("/registrarProfe", upload.single("imagen"), async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    const celular = req.body.celular;
    const numOfi = req.body.numOfi;
    const extencion = req.body.exten;
    request.input("InCorreo", sql.VARCHAR(64), req.body.correo);
    request.input("InPassword", sql.VARCHAR(32), req.body.password);
    request.input("InSede", sql.VARCHAR(32), req.body.sede);
    request.input("InNombre", sql.VARCHAR(32), req.body.nombre);
    request.input("InApellido1", sql.VARCHAR(32), req.body.ap1);
    request.input("InApellido2", sql.VARCHAR(64), req.body.ap2);
    request.input("InCelular", sql.Int, celular.toString());
    request.input("InNumOficina", sql.Int, numOfi.toString());
    request.input("InExtension", sql.Int, extencion.toString());
    request.input("InImagen", sql.VARCHAR(128), req.file.path);
    const result = await request.execute("dbo.AgregarProfesor");
    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});
//Registrar Actividad
app.post("/registrarAct", upload.single("afiche"), async (req, res) => {
  await poolConnect;
  const request = pool.request();
  const semana = req.body.semana;
  const modalidad = req.body.modalidad;
  const idPlanTrb = req.body.idPlTr;
  const cantRecord = req.body.cantRecord;
  var modalidadInt = 0;
  request.input("inSemana", sql.Int, semana);
  request.input("inNombre", sql.VarChar(128), req.body.nombre);
  request.input("inTipo", sql.VarChar(32), req.body.tipo);
  request.input("inFechaRealizacion", sql.Date, req.body.fechaReal);
  if (modalidad === "virtual") {
    modalidadInt = 1;
  }
  request.input("inModalida", sql.Int, modalidadInt);
  request.input("inEnlance", sql.VarChar(128), req.body.enlace);
  request.input("inAfiche", sql.VarChar(256), req.file.filename);
  request.input("inIdPlanTrb", sql.Int, idPlanTrb);
  request.input("inCantRecord", sql.Int, cantRecord);
  const result = await request.execute("dbo.agregarAct");
  res.json({ Result: result.returnValue });
});
//Registrar Equipo
app.post("/registrarEqui", async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    const anno = req.body.anno;
    request.input("inAnno", sql.Int, anno);
    const result = await request.execute("dbo.crearEquipo");
    res.json({ Result: result.returnValue, Error: result.recordset });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});
//Registrar Plan de Trabajo
app.post("/registrarPlan", async (req, res) => {
  try {
    await poolConnect;
    const request = pool.request();
    request.input("inIdEquipo", sql.Int, req.body.idEquipo);
    request.input("inPeriodo", sql.Int, req.body.periodo);
    const result = await request.execute("dbo.insertarPlan");
    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});
//Actividad Realizada
app.post("/actividadRealiza",upload.single("justificacion"),async (req, res) => {
    try {
      await poolConnect;
      var request = pool.request();
      request.input("inIdActividad", sql.Int, req.body.IdActiv);
      request.input("inJustificacion", sql.VarChar(256), req.file.filename);
      var result = await request.execute("dbo.InsertJustificacion");
      if (result.returnValue !== 1) {
        return res.status(400).json({ Result: result.returnValue });
      }
      request = pool.request();
      request.input("inIdActividad", sql.Int, req.body.IdActiv);
      request.input("inEstado", sql.VarChar(32), "REALIZADA");
      result = await request.execute("dbo.ActualizarEstado");
      res.json({ Result: result.returnValue });
    } catch {
      res.status(400).json({ Result: -30 });
    }
  }
);
//Actividad Cancelada
app.post("/actividadCancelada",upload.single("justificacion"),async (req, res) => {
    try {
      await poolConnect;
      var request = pool.request();
      request.input("inIdActividad", sql.Int, req.body.IdActiv);
      request.input("inJustificacion", sql.VarChar(256), req.file.filename);
      var result = await request.execute("dbo.InsertJustificacion");
      if (result.returnValue !== 1) {
        return res.status(400).json({ Result: result.returnValue });
      }
      request = pool.request();
      request.input("inIdActividad", sql.Int, req.body.IdActiv);
      request.input("inEstado", sql.VarChar(32), "CANCELADA");
      result = await request.execute("dbo.ActualizarEstado");
      res.json({ Result: result.returnValue });
    } catch {
      res.status(400).json({ Result: -30 });
    }
  }
);
//Cambiar Estado de actividad
app.put("/cambiarEstado", upload.single("justificacion"), async (req, res) => {
  try {
    await poolConnect;
    var request = pool.request();
    request.input("inIdActividad", sql.Int, req.body.IdActiv);
    request.input("inEstado", sql.VarChar(32), req.body.estado);
    result = await request.execute("dbo.ActualizarEstado");
    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

//Elementos de prueba
/*
app.get("/pruebaExcel", (req, res) => {
  const data = [
    ["", "Estudiantes"],
    ["Edad", "Nombre"],
    [12, "Maicol"],
    [14, "Brand"],
  ];
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  xlsx.utils.book_append_sheet(workbook, worksheet, "CA");
  const excelBuffer = xlsx.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  res.setHeader("Content-Disposition", 'attachment; filename="datos.xlsx"');
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.send(excelBuffer);
});

app.get("/", async (req, res) => {
  await poolConnect;
  const request= pool.request();
  const result = await request.query('SELECT * FROM dbo.Usuario')
  console.log(result)
  res.json(result.recordset)
});
*/

app.listen(3000);
console.log(`Server on port ${3000}`);
