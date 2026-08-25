import express from "express";
import { log } from "./logger.js";

const app = express();
const PORT = parseInt(process.env.DEMO_APP_PORT || "3001", 10);

// Fault injection: read from env on every request so it can be toggled at runtime
function isErrorForced(): boolean {
  return process.env.FORCE_ERROR === "true";
}

app.use(express.json());

// Graceful error handling for malformed JSON
app.use((err: any, _req: any, res: any, next: any) => {
  if (err.type === "entity.parse.failed") {
    log({
      level: "warn",
      endpoint: _req.path,
      method: _req.method,
      statusCode: 400,
      message: "Malformed JSON in request body",
    });
    res.status(400).json({ error: "Invalid JSON in request body" });
    return;
  }
  next(err);
});

// Health check - always works
app.get("/health", (_req, res) => {
  const start = Date.now();
  log({
    level: "info",
    endpoint: "/health",
    method: "GET",
    statusCode: 200,
    message: "Health check OK",
    durationMs: Date.now() - start,
  });
  res.json({ status: "healthy", uptime: process.uptime() });
});

// Checkout endpoint - breaks when FORCE_ERROR=true
app.post("/checkout", (req, res) => {
  const start = Date.now();

  if (isErrorForced()) {
    const errorMsg = "PaymentProcessingError: connection to payment gateway timed out";
    log({
      level: "error",
      endpoint: "/checkout",
      method: "POST",
      statusCode: 500,
      message: errorMsg,
      error: errorMsg,
      durationMs: Date.now() - start,
    });
    res.status(500).json({ error: errorMsg });
    return;
  }

  log({
    level: "info",
    endpoint: "/checkout",
    method: "POST",
    statusCode: 200,
    message: "Checkout processed successfully",
    durationMs: Date.now() - start,
  });
  res.json({ orderId: `ORD-${Date.now()}`, status: "confirmed" });
});

// List products - always works
app.get("/products", (_req, res) => {
  const start = Date.now();
  const products = [
    { id: 1, name: "Widget A", price: 9.99 },
    { id: 2, name: "Widget B", price: 19.99 },
    { id: 3, name: "Gadget C", price: 49.99 },
  ];
  log({
    level: "info",
    endpoint: "/products",
    method: "GET",
    statusCode: 200,
    message: "Listed products",
    durationMs: Date.now() - start,
  });
  res.json(products);
});

const server = app.listen(PORT, () => {
  console.log(`Demo app running on http://localhost:${PORT}`);
  console.log(`FORCE_ERROR=${process.env.FORCE_ERROR || "false"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  server.close(() => process.exit(0));
});
