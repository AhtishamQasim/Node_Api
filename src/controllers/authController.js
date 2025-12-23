import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import oracledb from "oracledb"; // Added to specify output format
import { getConnection } from "../db/oracle.js";

export async function login(req, res) {
  const { email, password } = req.body;
  let conn;

  try {
    
    // 1. Establish Connection
    conn = await getConnection();

    // 2. Execute Query with explicit OutFormat to ensure user[1] exists
    const result = await conn.execute(
      `SELECT id, password, role FROM users WHERE email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_ARRAY } 
    );

    const user = result.rows[0];

    // 3. Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Compare Passwords
    // user[1] is the 'password' column from your SELECT statement
    const isMatch = await bcrypt.compare(password, user[1]);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5. Generate Token
    // Ensure JWT_SECRET is loaded from process.env
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const token = jwt.sign(
      { id: user[0], role: user[2] },
      secret,
      { expiresIn: "2h" }
    );

    // 6. Success Response
    return res.json({ 
      message: "Login successful",
      token 
    });

  } catch (err) {
    // 7. Enhanced Error Logging
    console.error("Login Error:", err); 
    
    // Return a readable error message instead of an empty object {}
    return res.status(500).json({ 
      message: "Internal Server Error", 
      error: err.message 
    });

  } finally {
    // 8. Safe Connection Closing
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
}