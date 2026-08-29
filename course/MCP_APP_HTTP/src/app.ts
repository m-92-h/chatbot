import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
});