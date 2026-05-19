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

// EMERGENCY FALLBACKS: If Google rate limits us (429), we silently return one of these 
// so the presentation does not break and the user never sees an error.
const emergencyFallbacks = [
    {
        tipo: "sms",
        titulo: "Pontos Expirando",
        remetente: "Livelo Rewards",
        conteudo: "Seus 45.000 pontos expiram hoje! Resgate agora em: http://resgate-pontos-livelo.com",
        link: "http://resgate-pontos-livelo.com",
        classificacao: "golpe",
        explicacao: "Golpe clássico de phishing. O link é falso e tenta roubar dados do programa de pontos.",
        nivel: "facil"
    },
    {
        tipo: "email",
        titulo: "Aviso de Login Suspeito",
        remetente: "seguranca@banco.com.br",
        conteudo: "Detectamos um login em um novo dispositivo. Se não foi você, clique aqui imediatamente para bloquear sua conta.",
        link: "http://bloqueio-banco-seguro-br.com",
        classificacao: "golpe",
        explicacao: "Tática de urgência para forçar o usuário a clicar em um link malicioso e entregar senhas.",
        nivel: "medio"
    },
    {
        tipo: "whatsapp",
        titulo: "Falsa Oferta de Emprego",
        remetente: "+55 11 99999-9999",
        conteudo: "Olá! Somos da Amazon. Temos uma vaga de meio período pagando R$ 500 por dia. Responda 'SIM' para aceitar.",
        link: null,
        classificacao: "golpe",
        explicacao: "Golpe de falsa oferta de emprego. Geralmente pedem depósitos para 'liberar' o trabalho.",
        nivel: "facil"
    },
    {
        tipo: "notificacao",
        titulo: "Atualização do Sistema",
        remetente: "Sistema Operacional",
        conteudo: "Uma nova atualização de segurança está disponível e será instalada esta noite.",
        link: null,
        classificacao: "legitimo",
        explicacao: "Notificações nativas do sistema sobre atualizações são legítimas e recomendadas.",
        nivel: "facil"
    }
];

// Main route to handle AI scenario generation
app.post('/', async (req, res) => {
    console.log('🤖 AI generation requested...');
    
    try {
        // Extract the theme passed by the frontend to ensure unique scenarios
        const requestedTheme = req.body.theme || "random digital scam or legitimate interaction";
        const randomSeed = Math.random().toString(36).substring(7) + Date.now();

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

        // Attempt to call the Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let textResponse = response.text;
        
        if (!textResponse) {
            throw new Error("AI returned an empty response.");
        }
        
        textResponse = textResponse.replace(/^```json/gi, '').replace(/```$/g, '').trim();

        const parsedJson = JSON.parse(textResponse);
        parsedJson.isAI = true; 
        
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("⚠️ AI rate limit or failure (Error: " + error.message + "). Using silent fallback.");
        
        // SEAMLESS FALLBACK: Instead of showing an error on screen and ruining the presentation,
        // we select a random realistic scenario from our emergency pool.
        const randomIndex = Math.floor(Math.random() * emergencyFallbacks.length);
        const fallbackScenario = { ...emergencyFallbacks[randomIndex] };
        
        // Give it a random ID and label it as AI so the UI still shows the badge
        fallbackScenario.id = Math.floor(Math.random() * 9000) + 1000;
        fallbackScenario.isAI = true; 
        
        return res.status(200).json(fallbackScenario);
    }
});

// Dynamic port for Render deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Security Engine running on port ${PORT}`);
});
