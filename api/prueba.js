/*                    Conexion local
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
/*                    Elemento de prueba
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
/*                      Elementos de prueba
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
