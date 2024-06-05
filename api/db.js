const sql = require("mssql");

const dbConfig = {
  user: "admin",
  password: "PnGJpG124",
  server: "database-dsw.crs4isccq6xa.us-east-2.rds.amazonaws.com",
  port: 1433,
  database: "GETG",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

async function getPool() {
  await poolConnect;
  return pool;
}

module.exports = { getPool };
