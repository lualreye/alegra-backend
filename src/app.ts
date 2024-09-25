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

  // Lista de dominios permitidos
  const whitelist = ["https://alegra-frontend-challenge.vercel.app"];

  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allowed?: boolean) => void
    ) => {
      // Si el origen está en la lista permitida o no tiene origen (para clientes como Postman)
      if (whitelist.indexOf(origin || "") !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Asegura que acepte los métodos permitidos
    credentials: true, // Permite que se envíen cookies si es necesario
    optionsSuccessStatus: 204, // Respuesta exitosa para preflight requests
  };

  // Usar CORS con las opciones configuradas
  app.use(cors(corsOptions));

  app.use(express.json());

  app.get("/", (_req, res: Response) => {
    res.send("generate image is aliveee");
  });

  routerApi(app, io);

  return { app, server };
}

export default createApp;
