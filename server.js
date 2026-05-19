import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Comprehensive CORS configuration to allow your Netlify frontend
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Security check for the API Key
if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is not set in the environment variables!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Handle pre-flight requests from the browser
app.options('*', cors());

// VISUAL ROUTE: So you can open the Render link in your browser and see it's alive!
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 3rem; background: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 style="color: #2563eb; margin-bottom: 0.5rem;">🚀 API do Motor de Segurança</h1>
            <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 1.5rem;">O Backend de Análise de Ameaças está ATIVO.</p>
            <div style="background: #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 6px; font-family: monospace; font-size: 0.95rem;">
                Status: ONLINE • Pronto para receber conexões POST da Inteligência Artificial.
            </div>
        </div>
    `);
});

// Main route to handle AI scenario generation
app.post('/', async (req, res) => {
    console.log('🤖 AI generation requested...');
    
    try {
        // Extract the theme passed by the frontend to ensure unique scenarios
        const requestedTheme = req.body.theme || "random digital scam or legitimate interaction";
        const randomSeed = Math.random().toString(36).substring(7) + Date.now();

        // REDESIGNED PROMPT: Using placeholders instead of hardcoded examples 
        // to force the AI to generate completely new text based on the theme.
        const prompt = `You are a cybersecurity expert. Generate a SINGLE unique digital interaction scenario (scam or legitimate) for an educational simulator.
        
        CRITICAL INSTRUCTIONS:
        1. Theme/Context for this scenario: "${requestedTheme}"
        2. You MUST invent entirely new, creative content based specifically on this theme. DO NOT repeat standard examples.
        3. Random seed to enforce absolute uniqueness: ${randomSeed}
        4. Language: ALL generated text must be in Brazilian Portuguese (pt-BR).
        
        Return ONLY a valid JSON object with exactly this structure:
        { 
            "id": ${Math.floor(Math.random() * 9000) + 1000}, 
            "tipo": "<choose one: whatsapp, email, sms, rede social, notificacao>", 
            "titulo": "<invent a convincing title or subject>", 
            "remetente": "<invent a realistic sender name, phone number or email>", 
            "conteudo": "<write the main message text here, highly detailed and aligned with the theme>", 
            "link": "<invent a relevant URL (phishing or real), or use null if not applicable>", 
            "classificacao": "<choose either 'golpe' or 'legitimo'>", 
            "explicacao": "<write a brief educational explanation of why this is a scam or why it is safe>", 
            "nivel": "<choose one: facil, medio, dificil>" 
        }`;

        // Upgraded to gemini-2.0-flash to fix the 404 Not Found error from the older model endpoint
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                // Force the API to return clean JSON without markdown blocks
                responseMimeType: "application/json",
            }
        });

        let textResponse = response.text;
        
        if (!textResponse) {
            throw new Error("AI returned an empty response.");
        }
        
        // Clean up just in case the AI still decides to wrap in markdown despite the config
        textResponse = textResponse.replace(/^```json/gi, '').replace(/```$/g, '').trim();

        const parsedJson = JSON.parse(textResponse);
        parsedJson.isAI = true;
        
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("⚠️ AI request failed. Sending fallback security response. Error details:", error.message);
        
        // GUARANTEED FALLBACK: This will display the EXACT technical error on your website's screen
        // so we can debug exactly why the Google API is failing.
        return res.status(200).json({
            id: Math.floor(Math.random() * 9000) + 1000,
            tipo: "notificacao",
            titulo: "⚠️ Erro Técnico de Integração",
            remetente: "Sistema de Debug Unisul",
            conteudo: "A requisição para a Inteligência Artificial falhou. ERRO RETORNADO: " + error.message,
            link: null,
            classificacao: "legitimo",
            explicacao: "Se você está vendo esta mensagem, tire um print e mande para a equipe técnica. Precisamos saber o erro acima para consertar a API.",
            nivel: "facil",
            isAI: true
        });
    }
});

// Dynamic port for Render deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Security Engine running on port ${PORT}`);
});
