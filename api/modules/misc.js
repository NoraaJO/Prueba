const express = require("express");
const sql = require("mssql");
const xlsx = require("xlsx");
const { getPool } = require("../db");

const miscRouter = express.Router();

miscRouter.get("/archivoSede", async (req, res) => {
  try {
    const pool = await getPool();
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

    const workbook = xlsx.utils.book_new();
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

miscRouter.post("/registrarEqui", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    const anno = req.body.anno;
    request.input("inAnno", sql.Int, anno);

    const result = await request.execute("dbo.crearEquipo");

    res.json({ Result: result.returnValue, Error: result.recordset });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

miscRouter.post("/registrarPlan", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdEquipo", sql.Int, req.body.idEquipo);
    request.input("inPeriodo", sql.Int, req.body.periodo);

    const result = await request.execute("dbo.insertarPlan");

    res.json({ Result: result.returnValue });
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

miscRouter.put("/cambiarPassword", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inCorreo", sql.VarChar(64), req.body.correo);
    request.input("inNewPassword", sql.VarChar(32), req.body.newPassword);

    const result = await request.execute("dbo.CambiarPassword");

    if (result.returnValue !== 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el usuario.";
          break;
        case -2:
          errorMessage = "Tiene que tener al menos 8 caracteres.";
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

miscRouter.post("/iniciarSesion", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inCorreo", sql.VarChar(64), req.body.correo);
    request.input("inPassword", sql.VarChar(32), req.body.password);

    const result = await request.execute("dbo.iniciarSesion");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "Correo o contraseña invalido.";
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

miscRouter.get("/obtenerDatosEquipo", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdEquipo", sql.Int, req.query.idEquipo);

    const result = await request.execute("dbo.obtenerDatosEquipo");

    if (result.returnValue < 0) {
      return res
        .status(400)
        .json({ Result: result.returnValue, Message: "Error." });
    }

    res.json(result.recordset);
  } catch {
    res.status(400).json({ Result: -30 });
  }
});

miscRouter.get("/obtenerPlanTrabajo", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inIdEquipo", sql.Int, req.query.idEquipo);

    const result = await request.execute("dbo.obtenerPlanTrabajo");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el equipo.";
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

miscRouter.get("/obtenerPlanTrabajoPorAnno", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inAnno", sql.Int, req.query.anno);

    const result = await request.execute("dbo.obtenerPlanTrabajoPorAnno");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro el equipo para el año dado.";
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

miscRouter.get("/obtenerProfesCedes", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("inSede", sql.VarChar(32), req.query.sede);

    const result = await request.execute("dbo.obtenerProfesCedes");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
          errorMessage = "No se encontro la sede.";
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

miscRouter.get("/obtTodoEquipos", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    const result = await request.execute("dbo.obtTodoEquipos");

    if (result.returnValue < 1) {
      let errorMessage;
      switch (result.returnValue) {
        case -1:
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

module.exports = { miscRouter };
