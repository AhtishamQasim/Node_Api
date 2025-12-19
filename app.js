import express from "express";
import helmet from "helmet";
import userRoutes from "./src/routes/userRoutes.js";

import dotenv from "dotenv";
dotenv.config({ silent: true });
const app = express();

app.use(express.json());
app.use(helmet());

app.use("/api/users", userRoutes);

app.listen(process.env.PORT, () =>
  console.log("Server running on Port " + process.env.PORT)
);
