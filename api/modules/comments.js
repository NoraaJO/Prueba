const express = require("express");
const sql = require("mssql");
const { getPool } = require("../db");

const commentsRouter = express.Router();

commentsRouter.get("/obtenerComentarios", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdActividad", sql.Int, req.query.idActividad);

    const result = await request.execute("dbo.obtenerComentarios");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontraron los comentarios.";
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

commentsRouter.post("/insertarComentario", async (req, res) => {
  try {
    console.log(req.body.idActividad)
    console.log(req.body.comentario)
    console.log(req.body.fecha)
    console.log(req.body.idProfesor)

    const pool = await getPool();
    const request = pool.request();

    request.input("inIdActividad", sql.Int, req.body.idActividad);
    request.input("inComentario", sql.VarChar(256), req.body.comentario);
    request.input("InFecha", sql.Date, req.body.fecha);
    request.input("inIdProfesor", sql.Int, req.body.idProfesor);

    const result = await request.execute("dbo.spInsertarComentario");

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

    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

commentsRouter.post("/insertarReplica", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdActividad", sql.Int, req.body.idActividad);
    request.input("inComentario", sql.VarChar(256), req.body.comentario);
    request.input("InFecha", sql.Date, req.body.fecha);
    request.input("inIdProfesor", sql.Int, req.body.idProfesor);
    request.input("inIdComentario", sql.Int, req.body.idComentario);

    const result = await request.execute("dbo.spInsertarReplica");

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

    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

module.exports = { commentsRouter };
