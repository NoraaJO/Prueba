const express = require("express");
const sql = require("mssql");
const xlsx = require("xlsx");
const multer = require("multer");
const path = require("path");
const { getPool } = require("../db");

const studentsRouter = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB (en bytes)
  },
});

studentsRouter.post(
  "/insertEstudiantes",
  upload.single("archivo"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const sede = req.body.sede;
      const archivo = req.file.path;

      if (!archivo) {
        return res.status(400).send("Error: Archivo no carga");
      }

      const workbook = xlsx.readFile(archivo);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rango = xlsx.utils.decode_range(worksheet["!ref"]);

      for (let rowNum = rango.s.r + 2; rowNum <= rango.e.r; rowNum++) {
        const request = pool.request();
        request.input("inSede", sql.VarChar(64), sede);

        let direccion = xlsx.utils.encode_cell({ r: rowNum, c: rango.s.c });
        request.input("inNombre", sql.VarChar(32), worksheet[direccion]["v"]);

        direccion = xlsx.utils.encode_cell({ r: rowNum, c: rango.s.c + 1 });
        request.input(
          "inApellido1",
          sql.VarChar(32),
          worksheet[direccion]["v"]
        );

        direccion = xlsx.utils.encode_cell({ r: rowNum, c: rango.s.c + 2 });
        request.input(
          "inApellido2",
          sql.VarChar(32),
          worksheet[direccion]["v"]
        );

        direccion = xlsx.utils.encode_cell({ r: rowNum, c: rango.s.c + 3 });
        request.input(
          "inCarnet",
          sql.VarChar(64),
          worksheet[direccion]["v"].toString()
        );

        direccion = xlsx.utils.encode_cell({ r: rowNum, c: rango.s.c + 4 });
        request.input(
          "inCelular",
          sql.VarChar(32),
          worksheet[direccion]["v"].toString()
        );

        direccion = xlsx.utils.encode_cell({ r: rowNum, c: rango.s.c + 5 });
        request.input("inCorreo", sql.VarChar(64), worksheet[direccion]["v"]);

        const result = await request.execute("dbo.registrarEstudiante");

        if (result.returnValue !== 1) {
          return res.status(500).send({ Result: result.returnValue });
        }
      }

      res.json({ Result: 1 });
    } catch {
      res.status(400).json({ Result: -30 });
    }
  }
);

studentsRouter.get("/archivoAll", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    const dataCA = [
      ["Estudiantes"],
      [
        "Nombre",
        "Apellido1",
        "Apellido2",
        "Carnet",
        "Celular",
        "Correo",
        "Sede",
      ],
    ];
    const dataSJ = [...dataCA];
    const dataLI = [...dataCA];
    const dataAL = [...dataCA];
    const dataSC = [...dataCA];

    const result = await request.execute("dbo.obtDatosAllEst");

    if (result.returnValue === -1) {
      return res.json({ Result: result.returnValue });
    }

    const workbook = xlsx.utils.book_new();

    result.recordset.forEach((row) => {
      const record = [
        row.Nombre,
        row.Apellido1,
        row.Apellido2,
        row.carnet,
        row.celular,
        row.correo,
        row.Sede,
      ];

      switch (row.Sede) {
        case "CA":
          dataCA.push(record);
          break;
        case "SJ":
          dataSJ.push(record);
          break;
        case "LI":
          dataLI.push(record);
          break;
        case "AL":
          dataAL.push(record);
          break;
        default:
          dataSC.push(record);
          break;
      }
    });

    if (dataCA.length > 2) {
      const worksheetCA = xlsx.utils.aoa_to_sheet(dataCA);
      xlsx.utils.book_append_sheet(workbook, worksheetCA, "CA");
    }

    if (dataSJ.length > 2) {
      const worksheetSJ = xlsx.utils.aoa_to_sheet(dataSJ);
      xlsx.utils.book_append_sheet(workbook, worksheetSJ, "SJ");
    }

    if (dataLI.length > 2) {
      const worksheetLI = xlsx.utils.aoa_to_sheet(dataLI);
      xlsx.utils.book_append_sheet(workbook, worksheetLI, "LI");
    }

    if (dataAL.length > 2) {
      const worksheetAL = xlsx.utils.aoa_to_sheet(dataAL);
      xlsx.utils.book_append_sheet(workbook, worksheetAL, "AL");
    }

    if (dataSC.length > 2) {
      const worksheetSC = xlsx.utils.aoa_to_sheet(dataSC);
      xlsx.utils.book_append_sheet(workbook, worksheetSC, "SC");
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

studentsRouter.put("/actualizarEstudiante", async (req, res) => {
  try {
  
    const pool = await getPool();
    const request = pool.request();
    request.input("inIdUsEnc", sql.Int, req.body.idUsEnc);
    request.input("inIdEstudian", sql.Int, req.body.idEstudiante);
    request.input("inNombre", sql.VarChar(32), req.body.nombre);
    request.input("inApellido1", sql.VarChar(32), req.body.apellido1);
    request.input("inApellido2", sql.VarChar(32), req.body.apellido2);
    request.input("inCelular", sql.VarChar(32), req.body.celular);
    request.input("inCorreo", sql.VarChar(64), req.body.correo);

    const result = await request.execute("dbo.ActualizarEstudiante");

    if (result.returnValue !== 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el ID.";
          break;
        case -2:
          errorMessage = "Sede erronea.";
          break;
        case -3:
          errorMessage = "Correo duplicado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(400)
        .json({ Result: result.returnValue, Message: errorMessage });
    }

    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

studentsRouter.get("/obtenerDatosEstudiante", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input("inIdUsuario", sql.Int, req.query.idUsuario);

    const result = await request.execute("dbo.obtenerDatosEstudiante");

    if (result.returnValue < 1) {
      return res
        .status(400)
        .json({ Result: result.returnValue, Message: "Error." });
    }

    res.json(result.recordset);
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

studentsRouter.get("/obtenerDatosEstudianteCarnet", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input("inIdUsuario", sql.Int, req.query.idUsuario);

    const result = await request.execute("dbo.obtenerDatosEstudianteCarnet");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el usuario.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(400)
        .json({ Result: result.returnValue, Message: errorMessage });
    }

    res.json(result.recordset);
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

studentsRouter.get("/obtenerEstudiante", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input("inSede", sql.VarChar(32), req.query.sede);
    request.input("inCarnet", sql.VarChar(64), req.query.carnet);

    const result = await request.execute("dbo.obtenerEstudiante");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro la sede o el estudiante.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(400)
        .json({ Result: result.returnValue, Message: errorMessage });
    }

    res.json(result.recordset);
  } catch {
    res.status(400).json({ Result: -30 });
  }
});
studentsRouter.get("/obtDetailEstudiante", async(req, res)=>{
  try{
    const pool = await getPool();
    const request = pool.request();
    request.input("inIdUsuario", sql.Int, req.query.idUsuario);
    const result = await request.execute("dbo.verDetallesEstudiante");
    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el estudiante.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(200)
        .json({ Result: result.returnValue, Message: errorMessage });
    }
    res.json(result.recordset);
 }
  catch{
    res.status(400).json({ Result: -30 });
  }
});
studentsRouter.put("/modificarDatosEst", upload.single("imagen"),async(req, res)=>{
  try{
    const pool = await getPool();
    const request = pool.request();
    request.input("inIdEstudiante", sql.Int, req.body.idEstudiante);
    request.input("inCelular", sql.Int, req.body.celular);
    request.input("inFoto", sql.VarChar(256), req.file.path);
    const result = await request.execute("dbo.ModificarDatosEstudiantes");
    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el estudiante.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(400)
        .json({ Result: result.returnValue, Message: errorMessage });
    }
    res.json({Result: result.returnValue});
  }catch{
    res.status(400).json({ Result: -30 });
  }
});
studentsRouter.put("/modificarDatosEstSinImagen", async(req, res)=>{
  try{
    const pool = await getPool();
    const request = pool.request();
    request.input("inIdEstudiante", sql.Int, req.body.idEstudiante);
    request.input("inCelular", sql.Int, req.body.celular);
    request.input("inFoto", sql.VarChar(256), "");
    const result = await request.execute("dbo.ModificarDatosEstudiantes");
    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el estudiante.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(400)
        .json({ Result: result.returnValue, Message: errorMessage });
    }
    res.json({Result: result.returnValue});
  }catch{
    res.status(400).json({ Result: -30 });
  }
});

module.exports = { studentsRouter };
