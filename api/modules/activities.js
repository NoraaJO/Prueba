const express = require("express");
const sql = require("mssql");
const multer = require("multer");
const { getPool } = require("../db");

const activitiesRouter = express.Router();

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

activitiesRouter.post(
  "/registrarAct",
  upload.single("afiche"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const request = pool.request();

      const semana = req.body.semana;
      const modalidad = req.body.modalidad;
      const idPlanTrb = req.body.idPlTr;
      const cantRecord = req.body.cantRecord;

      request.input("inSemana", sql.Int, semana);
      request.input("inNombre", sql.VarChar(128), req.body.nombre);
      request.input("inTipo", sql.VarChar(32), req.body.tipo);
      request.input("inFechaRealizacion", sql.Date, req.body.fechaReal);
      request.input("inModalida", sql.Int, modalidad === "virtual" ? 1 : 0);
      request.input("inEnlance", sql.VarChar(128), req.body.enlace);
      request.input("inAfiche", sql.VarChar(256), req.file.filename);
      request.input("inIdPlanTrb", sql.Int, idPlanTrb);
      request.input("inFreqRecord", sql.Int, cantRecord);
      request.input("inFechaPublica", sql.Date, req.body.fechaPubli);
      const result = await request.execute("dbo.agregarAct");

      res.json({ Result: result.returnValue });
    } catch {
      res.status(400).json({ Result: -30 });
    }
  }
);

activitiesRouter.post(
  "/actividadRealiza",
  upload.single("justificacion"),
  async (req, res) => {
    try {
      const pool = await getPool();
      let request = pool.request();

      request.input("inIdActividad", sql.Int, req.body.IdActiv);
      request.input("inJustificacion", sql.VarChar(256), req.file.filename);

      let result = await request.execute("dbo.InsertJustificacion");

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

activitiesRouter.post(
  "/actividadCancelada",
  upload.single("justificacion"),
  async (req, res) => {
    try {
      const pool = await getPool();
      let request = pool.request();

      request.input("inIdActividad", sql.Int, req.body.IdActiv);
      request.input("inJustificacion", sql.VarChar(256), req.file.filename);

      let result = await request.execute("dbo.InsertJustificacion");

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

activitiesRouter.put(
  "/cambiarEstado",
  upload.single("justificacion"),
  async (req, res) => {
    try {
      const pool = await getPool();
      const request = pool.request();

      request.input("inIdActividad", sql.Int, req.body.IdActiv);
      request.input("inEstado", sql.VarChar(32), req.body.estado);

      const result = await request.execute("dbo.ActualizarEstado");

      res.json({ Result: result.returnValue });
    } catch {
      res.status(400).json({ Result: -30 });
    }
  }
);
activitiesRouter.post("/registrarEncargados", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    var lista = req.body.lista;
    var buffer = "";
    lista.forEach((element) => {
      buffer = buffer + element + ",";
    });
    buffer = buffer.slice(0, -1);
    request.input("inIdProfesor", sql.VarChar(64), buffer);
    request.input("inIdActividad", sql.Int, req.body.IdActiv);
    const result = await request.execute("dbo.registrarProfeEncargados");
    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "Profesor o Actividad no encontrada.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(400)
        .json({ Result: result.returnValue, body: result.recordset });
    }
    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});
activitiesRouter.get("/obtenerProfesEncargado", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    var buffer = "";
    request.input("inIdActividad", sql.Int, req.query.idActividad);
    const result = await request.execute("dbo.ObtenerProfesEncargador");
    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "Actividad no encontrada.";
          break;
        case -2:
          errorMessage = "Error inesperado.";
          break;
        default:
          errorMessage = "Error.";
      }
      return res
        .status(400)
        .json({ Result: result.returnValue, body: errorMessage });
    }
    result.recordset.forEach((row) => {
      buffer = buffer + row.Nombre + ",";
    });
    buffer = buffer.slice(0, -1);
    res.json({ Result: result.returnValue, body: buffer });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

activitiesRouter.get("/obtenerDatosActividad", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdActividad", sql.Int, req.query.idActividad);

    const result = await request.execute("dbo.obtenerDatosActividad");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro la actividad.";
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

activitiesRouter.get("/obtenerProxActividad", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inFechaAct", sql.Date, req.query.fechaAct);
    request.input("inIdPlanTraba", sql.Int, req.query.idPlanTraba);

    const result = await request.execute("dbo.obtenerProxActividad");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el plan de trabajo.";
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

activitiesRouter.get("/spObtenerActivi", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdPlanTrab", sql.Int, req.query.idPlanTrab);

    const result = await request.execute("dbo.spObtenerActivi");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontró el plan de trabajo.";
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
activitiesRouter.get("/obtenerActPlaneadas", async(req, res)=>{
  try{
    const pool = await getPool();
    const request = pool.request();
    request.input("inAnno", sql.Int, req.query.anno);
    const result = await request.execute("dbo.ObtenerActividadesPlaneadas");
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
  }
  catch{
    res.status(400).json({ Result: -30 });
  }
});

module.exports = { activitiesRouter };
