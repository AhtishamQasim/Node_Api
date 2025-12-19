import oracledb from "oracledb";
// import dotenv from "dotenv";

// dotenv.config();  // MUST be at the very top

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

export async function initPool() {
 // console.log("DB_USER:", process.env.DB_USER);
//  console.log("DB_CONNECT:", process.env.DB_CONNECT);  // debug
  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1
  });
}

export async function getConnection() {
  if (!pool) {
    await initPool();
  }
  return await pool.getConnection();
}
