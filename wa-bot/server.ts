import express from "express";
import { Client } from "whatsapp-web.js";
import { createRouter } from "./router";

export function createServer(waClient: Client): express.Application {
  const app = express();

  app.use(express.json());
  app.use("/", createRouter(waClient));

  return app;
}
