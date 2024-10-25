import OpenAI from "openai";
import { anthropic } from "./anthropic";
import { createOpenAI, openai } from "./openai";

export * from "./ai";

export const aiClient = {
	textModel: anthropic("claude-3-5-sonnet-20240620"),
	providers: {
		openai,
		anthropic,
		groq: createOpenAI({
			baseURL: "https://api.groq.com/openai/v1",
			apiKey: process.env.GROQ_CLOUD_API_KEY,
		}),
		_native: {
			// for using transcription or translation functions
			openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
		},
	},
};
