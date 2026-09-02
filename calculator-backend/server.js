const dotenv = require("dotenv");

dotenv.config({ quiet: true });

const cors = require("cors");
const express = require("express");
const path = require("path");
const pool = require("./config/db");
const calcRoutes = require("./routes/calcRoutes");

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const trustedOrigins = new Set([
  ...allowedOrigins,
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
]);
const frontendDirectory = path.resolve(__dirname, "..");
const frontendFiles = {
  "/": "index.html",
  "/index.html": "index.html",
  "/sty.css": "sty.css",
  "/app.js": "app.js",
  "/history.js": "history.js",
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || trustedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error("This origin is not allowed by CORS.");
      error.status = 403;
      return callback(error);
    },
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "10kb" }));

app.use("/api", calcRoutes);

app.get(Object.keys(frontendFiles), (req, res, next) => {
  const requestedFile = path.join(frontendDirectory, frontendFiles[req.path]);
  res.sendFile(requestedFile, (error) => {
    if (error) next(error);
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found.",
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      error: "Request body contains invalid JSON.",
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({
    success: false,
    error: status >= 500 ? "Internal server error." : error.message,
  });
});

let httpServer;

async function startServer() {
  await pool.query("SELECT 1");

  httpServer = app.listen(port, () => {
    console.log(`Calculator API listening on http://localhost:${port}`);
  });

  return httpServer;
}

async function shutDown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);

  if (httpServer) {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await pool.end();
}

if (require.main === module) {
  startServer().catch(async (error) => {
    console.error("Unable to start the server:", error.message);
    await pool.end().catch(() => {});
    process.exitCode = 1;
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      shutDown(signal)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("Error during shutdown:", error);
          process.exit(1);
        });
    });
  }
}

module.exports = { app, startServer };
