import OpenAI from "openai";
import axios from "axios"; // Agrega axios para descargar la imagen y convertirla a base64
import { NegotiatorType } from "../enum/services/SalesPerson.enum";
import type { ChatCompletionAssistantMessageParam } from "openai/resources";
import type { NegotiatorResponse } from "../interfaces/services/negotiatorService.interface";

const OPEN_AI_MODEL = "gpt-4";
const VISION_MODEL = "gpt-4-turbo"; // Cambiado a gpt-4-turbo

class AINegotiatorClass {
  private openai: OpenAI;
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey, timeout: 15 * 1000 });
    if (!apiKey || apiKey.length === 0) {
      throw new Error("OPENAI_KEY is missing");
    }
  }

  // Función para crear chats
  createChat = async (
    messages: ChatCompletionAssistantMessageParam[],
    model?: string,
    temperature = 0
  ) => {
    try {
      const completion = await this.openai.chat.completions.create({
        model: OPEN_AI_MODEL,
        messages,
        temperature,
        max_tokens: 256,
        top_p: 0,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.error(err);
      return "ERROR";
    }
  };

  // Función principal que combina vendedor + análisis de imagen (texto relacionado con la imagen)
  generateNegotiatorResponse = async (
    name: string,
    imageUrl: string,
    negotiatorType: NegotiatorType,
    prompt?: string
  ): Promise<NegotiatorResponse> => {
    // Paso 1: Descargar la imagen y convertirla a base64
    const imageBase64 = await this.downloadImageToBase64(imageUrl);

    // Paso 2: Crear el mensaje del vendedor basado en el tipo y análisis externo
    const finalPrompt = this.createPrompt(
      name,
      negotiatorType,
      "Análisis de la imagen, recuerda que la primera linea debe ser una frase de la imagen interesante de no mas de 60 caracteres"
    );

    // Paso 3: Usar OpenAI Vision para generar el mensaje final con la imagen
    const aiResponse = await this.callOpenAiWithImage(imageBase64, finalPrompt);

    return {
      message: aiResponse.message,
      description: aiResponse.description,
    };
  };

  // Descargar la imagen desde la URL y convertirla a base64
  private async downloadImageToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data, "binary");
      return buffer.toString("base64");
    } catch (error) {
      console.error("Error descargando la imagen:", error);
      throw new Error("Error descargando la imagen.");
    }
  }

  // Crear el prompt basado en el tipo de vendedor
  private createPrompt(
    name: string,
    negotiatorType: NegotiatorType,
    imageAnalysis: string
  ): string {
    let message = "";
    switch (negotiatorType) {
      case NegotiatorType.ACCOMMODATOR:
        message = `Hola, soy ${name}, estaré encantado de ayudarte. Aquí te muestro este producto basado en la imagen: ${imageAnalysis}.`;
        break;
      case NegotiatorType.ANALYST:
        message = `Soy ${name}, aquí para ofrecerte la mejor solución. El análisis del producto indica: ${imageAnalysis}.`;
        break;
      case NegotiatorType.ASSERTIVE:
        message = `Hola, soy ${name}, este producto es perfecto para ti según el análisis: ${imageAnalysis}.`;
        break;
      default:
        message = `Hola, soy ${name}, te ayudo a decidir sobre este producto. Análisis: ${imageAnalysis}.`;
    }

    return message;
  }

  // Llamar a OpenAI con la imagen y el prompt
  private async callOpenAiWithImage(
    base64: string,
    prompt: string,
    mimetype = "image/jpeg"
  ): Promise<{ message: string; description: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          {
            role: "system",
            content: "Eres un negociador experto en ventas",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimetype};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const text = response.choices[0].message.content!.trim();
      const { message, description } = this.splitResponse(text);

      return { message, description };
    } catch (err) {
      console.error("Error llamando a OpenAI con la imagen:", err);
      throw new Error("Error procesando la imagen con OpenAI.");
    }
  }

  // Modificar la función para generar un título atractivo y expandir la descripción
  private splitResponse(response: string): {
    message: string;
    description: string;
  } {
    const [firstLine, ...otherLines] = response
      .split("\n")
      .filter((line) => line.trim() !== "");

    // Recortar el primer mensaje a 60 caracteres máximo
    const message = firstLine.trim();

    // El resto lo ponemos en la descripción, extendiendo un poco el mensaje del negociador
    const description = otherLines.join(" ").trim();

    return {
      message,
      description,
    };
  }
}

export default AINegotiatorClass;
