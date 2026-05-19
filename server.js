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
        
        Return ONLY a raw JSON object with exactly this structure:
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
        }
        
        Do NOT wrap the response in markdown blocks (like \`\`\`json). Return raw text only.`;

        // Using gemini-2.0-flash for maximum stability and widespread availability
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        // FIXED: The new @google/genai SDK uses .text as a property, not a function.
        let textResponse = typeof response.text === 'function' ? response.text() : response.text;
        
        if (!textResponse) {
            throw new Error("AI returned an empty response.");
        }
        
        textResponse = textResponse.trim();
        
        // Clean up any markdown formatting (e.g., ```json ... ```) that the AI might still include
        textResponse = textResponse.replace(/^```json/gi, '').replace(/```$/g, '').trim();

        // Extract only the JSON object to prevent parsing errors
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[0]);
            parsedJson.isAI = true;
            return res.status(200).json(parsedJson);
        } else {
            throw new Error("Invalid format received from the AI model: " + textResponse);
        }

    } catch (error) {
        console.error("⚠️ AI request failed. Sending fallback security response. Error details:", error.message);
        
        // GUARANTEED FALLBACK: If the AI fails, we send a valid JSON with status 200 (Success).
        // This prevents the frontend from crashing and keeps the 20-round flow intact.
        return res.status(200).json({
            id: Math.floor(Math.random() * 9000) + 1000,
            tipo: "notificacao",
            titulo: "Verificação de Segurança",
            remetente: "Sistema Unisul",
            conteudo: "Estamos realizando manutenção nos servidores de IA. Por favor, analise esta mensagem como um teste de nivelamento.",
            link: null,
            classificacao: "legitimo",
            explicacao: "Mensagem de fallback ativada devido à indisponibilidade temporária do serviço de Inteligência Artificial.",
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
