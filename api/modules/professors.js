const express = require("express");
const sql = require("mssql");
const multer = require("multer");
const { getPool } = require("../db");

const professorsRouter = express.Router();

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
professorsRouter.post(
  "/registrarProfe",
  upload.single("imagen"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const request = pool.request();

      const celular = req.body.celular;
      const numOfi = req.body.numOfi;
      const extension = req.body.exten;

      request.input("InCorreo", sql.VarChar(64), req.body.correo);
      request.input("InPassword", sql.VarChar(32), req.body.password);
      request.input("InSede", sql.VarChar(32), req.body.sede);
      request.input("InNombre", sql.VarChar(32), req.body.nombre);
      request.input("InApellido1", sql.VarChar(32), req.body.ap1);
      request.input("InApellido2", sql.VarChar(64), req.body.ap2);
      request.input("InCelular", sql.Int, celular.toString());
      request.input("InNumOficina", sql.Int, numOfi.toString());
      request.input("InExtension", sql.Int, extension.toString());
      request.input("InImagen", sql.VarChar(128), req.file.path);

      const result = await request.execute("dbo.AgregarProfesor");

      res.json({ Result: result.returnValue });
    } catch {
      res.status(400).json({ Result: -30 });
    }
  }
);

professorsRouter.post("/agregarProfeEquipo", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    console.log(`Profesor: ${req.body.idProfesor}`)
    console.log(`Equipo: ${req.body.idEquipo}`)
    console.log(`Usuario: ${req.body.idUsuario}`)
    request.input("inIdEquipo", sql.Int, req.body.idEquipo);
    request.input("inidProfesor", sql.Int, req.body.idProfesor);
    request.input("inidUsuario", sql.Int, req.body.idUsuario);

    const result = await request.execute("dbo.AgregarProfesorEquipo");

    if (result.returnValue !== 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el ID.";
          break;
        case -2:
          errorMessage = "Ya existe profesor.";
          break;
        case -4:
          errorMessage = "Sede erronea.";
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

professorsRouter.delete("/darDeBajaProfeEq", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdProfesor", sql.Int, req.body.idProfesor);
    request.input("inIdEquipo", sql.Int, req.body.idEquipo);
    request.input("inIdAsisAdminis", sql.Int, req.body.idAsisAdminis);

    const result = await request.execute("dbo.darDeBajaProfeEq");

    if (result.returnValue !== 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el ID.";
          break;
        case -2:
          errorMessage = "Sede erronea.";
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

professorsRouter.put("/definirCoordinador", async (req, res) => {
  try {

    const pool = await getPool();
    const request = pool.request();

    request.input("inIdEquipo", sql.Int, req.body.idEquipo);
    request.input("inIdProfe", sql.Int, req.body.idProfe);
    request.input("inIdAsisAdmin", sql.Int, req.body.idAsisAdmin);

    const result = await request.execute("dbo.definirCoordinador");

    if (result.returnValue !== 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el ID.";
          break;
        case -2:
          errorMessage = "No se encuentra asociado con la sede.";
          break;
        case -3:
          errorMessage = "Ya existe un coordinador.";
          break;
        case -4:
          errorMessage = "No se encuentra el profesor.";
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

professorsRouter.get("/obtenerDatosProfeso", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdProfesor", sql.Int, req.query.idProfesor);

    const result = await request.execute("dbo.obtenerDatosProfeso");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el profesor.";
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

professorsRouter.get("/esCoordinador", async (req, res)=>{
  try {
    const pool = await getPool();
    const request = pool.request();
  
    request.input("inAnno", sql.Int, req.query.idAnno);
    request.input("inIdUsuario", sql.Int, req.query.idUsuario);

    const result = await request.execute("dbo.esCoordinador");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el profesor.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(200)
        .json({ Result: result.returnValue, body: result.recordset });
    }

    res.json({ Result: result.returnValue, body: result.recordset });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

professorsRouter.put(
  "/modificarDatoProfesor",
  upload.single("imagen"),
  async (req, res) => {
    
    //try {

      console.log(req.body.idProfesor);
      console.log(req.body.nombre);
      console.log(req.body.correo);
      console.log(req.body.ap1);
      console.log(req.body.ap2);
      console.log(req.body.celular);
      console.log(req.body.numOfi);
      console.log(req.body.exten);
      console.log(req.file);
      console.log(req.body.idUsEnc);


      const pool = await getPool();
      const request = pool.request();

      request.input("inIdProfesor", sql.Int, req.body.idProfesor);
      request.input("inNombre", sql.VarChar(32), req.body.nombre);
      request.input("inCorreo", sql.VarChar(64), req.body.correo);
      request.input("inApellido1", sql.VarChar(32), req.body.ap1);
      request.input("inApellido2", sql.VarChar(32), req.body.ap2);
      request.input("inCelular", sql.Int, req.body.celular.toString());
      request.input("inNumOficina", sql.Int, req.body.numOfi.toString());
      request.input("inExtension", sql.Int, req.body.exten.toString());
      request.input("inImagen", sql.VarChar(128), req.file.path);
      request.input("inIdUsEnc", sql.Int, req.body.idUsEnc);

      const result = await request.execute("dbo.spModificarDatoProfesor");

      if (result.returnValue !== 1) {
        let errorMessage;
        switch (result.returnValue) {
          case -1:
            errorMessage = "No se encontro el ID.";
            break;
          case -2:
            errorMessage = "Las sedes no coinciden.";
            break;
          case -3:
            errorMessage = "Email duplicado.";
            break;
          default:
            errorMessage = "Error.";
        }
        return res
          .status(400)
          .json({ Result: result.returnValue, Message: errorMessage });
      }

      res.json({ Result: result.returnValue });
    //} catch {
      //res.status(400).json({ Result: -30 });
    //}
  }
);

professorsRouter.get("/obtenerProfesEnc", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdActividad", sql.Int, req.query.idActividad);

    const result = await request.execute("dbo.obtenerProfesEnc");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro la actividad asociada.";
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

module.exports = { professorsRouter };
