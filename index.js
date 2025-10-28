import express from "express";
import dotenv from "dotenv";
import { sequelize, testConnection } from "./src/db.js";
import { connectRabbitMQ, closeConnection } from "./src/config/rabbitmq.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import { seedRoles } from "./src/seeders/roleSeeder.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API working correctly" });
});

const startServer = async () => {
  try {
    await testConnection();

    await sequelize.sync({ alter: true });
    console.log("Models synchronized with the database");

    await seedRoles();

    // Conectar a RabbitMQ
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

// Manejo de señales para cerrar conexiones gracefully
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await closeConnection();
  await sequelize.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  await closeConnection();
  await sequelize.close();
  process.exit(0);
});

startServer();
