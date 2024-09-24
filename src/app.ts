import express from "express";
import cors from "cors";
import { Response } from "express";
import http from "http";

import { Server } from "socket.io";

import routerApi from "./routes";

function createApp() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  // const whitelist = ["http://localhost:5173"];

  app.use(cors({ origin: "*" }));

  app.use(express.json());

  app.get("/", (_req, res: Response) => {
    res.send("generate image is aliveee");
  });

  routerApi(app, io);

  return { app, server };
}

export default createApp;
