/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from "openai";

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Content-Type': 'text/event-stream',
	'Cache-Control': 'no-cache',
	'Connection': 'keep-alive'
};

export default {
	async fetch(request, env, ctx) {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		let oInputs = { text: "" };
		const contentLength = request.headers.get('content-length');
		if (contentLength && parseInt(contentLength) > 0) {
			oInputs = await request.json();
		}
		
		// The file at promptUrl is saved as windows-1255, so we need to read and decode it accordingly.
		// We'll fetch as arrayBuffer, then decode using TextDecoder.
		const promptArrayBuffer = await (await fetch("https://www.lawdata.co.il/upload/natlantostructuredfieldsprompt/prompt.txt?dt="+new Date().getTime())).arrayBuffer();
		const decoder = new TextDecoder('windows-1255');
		const sPrompt = decoder.decode(new Uint8Array(promptArrayBuffer));

		const oOpenAi = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL: "https://gateway.ai.cloudflare.com/v1/1719b913db6cbf5b9e3267b924244e58/extract-search-fields-from-prompt/openai"
		});

		const messagesForOpenAI = [
			{ role: 'system', content: sPrompt.trim() },
			{ role: 'user', content: oInputs.prompt },
		];

		const chatCompletion = await oOpenAi.chat.completions.create({
			model: "gpt-4.1-mini",
			messages: messagesForOpenAI,
			temperature: 0,
			presence_penalty: 0,
			frequency_penalty: 0,
			stream: false
		});

		const sResponse = chatCompletion.choices?.[0]?.message?.content || "";

		return new Response(sResponse, { headers: corsHeaders });
	}
};
