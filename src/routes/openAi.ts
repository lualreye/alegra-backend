import express from "express";

import { getNegotiatorPitch } from "../controllers/negotiator.controller";

const router = express.Router();

router.post("/get-sales-pitch", getNegotiatorPitch);

export default router;
