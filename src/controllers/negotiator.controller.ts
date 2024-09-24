import dotenv from "dotenv";
import { Request, Response } from "express";
import AINegotiatorClass from "../services/ai.class";

dotenv.config();

const ai = new AINegotiatorClass(process.env.OPENAI_KEY as string);

export async function getNegotiatorPitch(
  req: Request,
  res: Response
): Promise<void> {
  const { name, imageUrl, negotiatorType } = req.body;

  if (!name || !imageUrl || !negotiatorType) {
    res.status(400).send({ error: "Todos los campos son obligatorios" });
    return;
  }

  try {
    const response = await ai.generateNegotiatorResponse(
      name,
      imageUrl,
      negotiatorType
    );
    res.status(200).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
}
