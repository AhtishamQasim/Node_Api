import { getConnection } from "../db/oracle.js";
import bcrypt from "bcrypt";

/* CREATE USER 
export async function createUser(req, res) {
  const { name, email } = req.body;
  const conn = await getConnection();

  try {
    await conn.execute(
      `INSERT INTO users (name, email) VALUES (:name, :email)`,
      { name, email },
      { autoCommit: true }
    );
    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json(err);
  } finally {
    await conn.close();
  }
}
*/export async function createUser(req, res) {
  const { name, email, password, role } = req.body;
  let conn;

  try {
    conn = await getConnection();
    const hashedPassword = await bcrypt.hash(password, 12);

    await conn.execute(
      `INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)`,
      { name, email, password: hashedPassword, role: role || 'USER' },
      { autoCommit: true }
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    // This will help you see if it's a DB error (like a duplicate email)
    console.error("Create User Error:", err);
    res.status(500).json({ 
      message: "Database error during user creation", 
      error: err.message 
    });
  } finally {
    if (conn) await conn.close();
  }
}

/* READ ALL USERS */
export async function getUsers(req, res) {
  let conn;

  try {
    conn = await getConnection();
    
    // Explicitly requesting object format to make the JSON response readable
    const result = await conn.execute(
      `SELECT id, name, email, role FROM users`, 
      [], 
      { outFormat: 4002 } // oracledb.OUT_FORMAT_OBJECT
    );

    // Check if the rows array is empty
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ 
        message: "No users found in the database." 
      });
    }

    // Return the list of users
    res.json({
      count: result.rows.length,
      users: result.rows
    });

  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: err.message 
    });
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}
/* READ USER BY ID */
export async function getUserById(req, res) {
  const { id } = req.params;
  let conn;

  try {
    conn = await getConnection();

    // 1. Select specific columns (Security: Exclude password)
    // 2. Use OUT_FORMAT_OBJECT for easier access
    const result = await conn.execute(
      `SELECT id, name, email, role FROM users WHERE id = :id`,
      { id },
      { outFormat: 4002 } // oracledb.OUT_FORMAT_OBJECT
    );

    const user = result.rows[0];

    // 3. Proper check for non-existent user
    if (!user) {
      return res.status(404).json({ 
        message: "User not found", 
        details: `No record found with ID: ${id}` 
      });
    }

    // 4. Return the user object directly
    res.json(user);

  } catch (err) {
    console.error("Get User By ID Error:", err);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: err.message 
    });
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

/* UPDATE USER 
export async function updateUser(req, res) {
  const conn = await getConnection();
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    await conn.execute(
      `UPDATE users SET name=:name, email=:email WHERE id=:id`,
      { id, name, email },
      { autoCommit: true }
    );
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json(err);
  } finally {
    await conn.close();
  }
}
*/


export async function updateUser(req, res) {
  const { id } = req.params; // ID comes from the URL: /api/users/:id
  const { name, email, password, role } = req.body;
  let conn;

  try {
    conn = await getConnection();

    // 1. Check if the user exists first
    const checkUser = await conn.execute(
      `SELECT id FROM users WHERE id = :id`,
      { id }
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Prepare the update logic
    // If a password is provided, hash it. If not, we update other fields.
    let query;
    let binds = { name, email, role, id };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      query = `UPDATE users SET name = :name, email = :email, password = :password, role = :role WHERE id = :id`;
      binds.password = hashedPassword;
    } else {
      query = `UPDATE users SET name = :name, email = :email, role = :role WHERE id = :id`;
    }

    // 3. Execute Update
    await conn.execute(query, binds, { autoCommit: true });

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  } finally {
    if (conn) await conn.close();
  }
}

/* DELETE USER */
export async function deleteUser(req, res) {
  const { id } = req.params;
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `DELETE FROM users WHERE id = :id`,
      { id },
      { autoCommit: true }
    );

    // Check if any row was actually deleted
    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        message: "User not found", 
        details: `No user exists with ID: ${id}` 
      });
    }

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: err.message 
    });
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}
