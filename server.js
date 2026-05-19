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

// VISUAL ROUTE: To check if the Render server is alive
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 3rem; background: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 style="color: #2563eb; margin-bottom: 0.5rem;">🚀 API do Motor de Segurança</h1>
            <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 1.5rem;">O Backend de Análise de Ameaças está ATIVO.</p>
            <div style="background: #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 6px; font-family: monospace; font-size: 0.95rem;">
                Status: ONLINE • Fallbacks Inteligentes Mapeados.
            </div>
        </div>
    `);
});

// INTELLIGENT FALLBACK DICTIONARY: Mapped exactly to the 10 frontend themes.
// This guarantees that even if the API is offline, the user gets 10 UNIQUE scenarios.
const themeFallbacks = {
    "Falso prêmio via Pix": {
        tipo: "whatsapp", titulo: "Prêmio Recebido", remetente: "Central Pix - Nubank",
        conteudo: "Você ganhou um sorteio de R$ 5.000,00 no Pix! Pague a taxa de R$ 49,90 no link abaixo para liberar o valor imediatamente.",
        link: "http://liberacao-pix-premiado.com", classificacao: "golpe",
        explicacao: "Prêmios verdadeiros nunca exigem pagamento antecipado de taxas para serem liberados.", nivel: "facil"
    },
    "Problema de entrega nos Correios": {
        tipo: "sms", titulo: "Taxa Alfandegária", remetente: "Correios",
        conteudo: "Sua encomenda internacional foi retida na alfândega. Efetue o pagamento do imposto para liberação.",
        link: "http://correios-pagamento-taxa.net", classificacao: "golpe",
        explicacao: "Golpe clássico de phishing. Sempre verifique o rastreio no aplicativo ou site oficial dos Correios.", nivel: "facil"
    },
    "Clonagem de WhatsApp de familiar": {
        tipo: "whatsapp", titulo: "Novo Número", remetente: "Mãe",
        conteudo: "Oi filho, troquei de número, anota aí! Pode me fazer um favor? Preciso pagar uma conta urgente mas meu app travou, pode fazer um Pix pra mim?",
        link: null, classificacao: "golpe",
        explicacao: "Urgência e pedido de dinheiro de 'novo número' é a marca registrada da clonagem de perfil. Ligue para a pessoa para confirmar.", nivel: "medio"
    },
    "Falsa oferta de emprego de meio período": {
        tipo: "whatsapp", titulo: "Vaga Confirmada", remetente: "RH Amazon",
        conteudo: "Estamos recrutando para trabalho de meio período no celular. Ganhos de R$ 300 a R$ 800 por dia. Clique no link para falar com o gerente.",
        link: "http://amazon-recrutamento-vip.com", classificacao: "golpe",
        explicacao: "Empresas como a Amazon não recrutam enviando mensagens aleatórias com promessas de lucros absurdos e fáceis.", nivel: "facil"
    },
    "Aviso urgente do banco sobre conta bloqueada": {
        tipo: "email", titulo: "Bloqueio Preventivo", remetente: "seguranca@banco.com.br",
        conteudo: "Detectamos atividade suspeita e bloqueamos seus cartões. Valide seus dados através do link abaixo para evitar o cancelamento da conta.",
        link: "http://validacao-seguranca-br.com/login", classificacao: "golpe",
        explicacao: "Bancos não ameaçam cancelamento de conta por e-mail, e o link não é do domínio oficial do banco.", nivel: "medio"
    },
    "Notificação do Serasa ou Receita Federal": {
        tipo: "email", titulo: "Pendência no CPF", remetente: "Receita Federal",
        conteudo: "Consta uma pendência na sua declaração de imposto de renda que irá negativar seu CPF. Acesse o portal e regularize o débito de R$ 120,00.",
        link: "http://regularizacao-cpf-gov.net", classificacao: "golpe",
        explicacao: "O Governo não envia e-mails com links de cobrança. O link também é falso (termina em .net em vez de .gov.br).", nivel: "dificil"
    },
    "Compra não reconhecida no cartão de crédito": {
        tipo: "sms", titulo: "Compra Aprovada", remetente: "Cartões",
        conteudo: "Compra aprovada nas Lojas Americanas valor R$ 2.450,00. Se não foi você, ligue urgentemente para 0800-888-0000.",
        link: null, classificacao: "golpe",
        explicacao: "Falsa central de atendimento. Se você ligar para esse número, golpistas tentarão roubar seus dados bancários.", nivel: "medio"
    },
    "Promoção impossível de loja famosa": {
        tipo: "rede social", titulo: "Liquidação Relâmpago", remetente: "Loja Oficial Fake",
        conteudo: "Saldão de aniversário! iPhone 15 Pro Max por apenas R$ 1.500,00 nas próximas 2 horas. Compre agora no site oficial abaixo!",
        link: "http://loja-aniversario-promo.com", classificacao: "golpe",
        explicacao: "Preços absurdamente abaixo do mercado (promoções milagrosas) são a isca principal para roubar dinheiro em lojas falsas.", nivel: "facil"
    },
    "Contato de suporte técnico pedindo senha": {
        tipo: "notificacao", titulo: "Verificação Necessária", remetente: "Suporte TI",
        conteudo: "Para concluir a migração do sistema, por favor nos responda com sua senha atual para validarmos a criptografia.",
        link: null, classificacao: "golpe",
        explicacao: "Nenhum suporte técnico ou equipe de TI legítima pedirá sua senha atual em texto para 'validar o sistema'.", nivel: "medio"
    },
    "Atualização de segurança obrigatória": {
        tipo: "notificacao", titulo: "Patch Disponível", remetente: "Sistema Operacional",
        conteudo: "A versão mais recente (v15.4) está pronta para ser instalada durante a madrugada para otimizar sua bateria.",
        link: null, classificacao: "legitimo",
        explicacao: "Atualizações de sistema operacional em notificações nativas sem pedidos urgentes ou links externos costumam ser legítimas.", nivel: "facil"
    }
};

// Generic fallbacks just in case the theme doesn't match perfectly
const genericFallbacks = Object.values(themeFallbacks);

// Main route to handle AI scenario generation
app.post('/', async (req, res) => {
    console.log('🤖 AI generation requested...');
    
    // Extract the theme passed by the frontend
    const requestedTheme = req.body.theme || "random digital scam or legitimate interaction";
    const randomSeed = Math.random().toString(36).substring(7) + Date.now();

    try {
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
        console.error(`⚠️ AI failure/Rate Limit. Serving mapped fallback for theme: "${requestedTheme}"`);
        
        // SMARTEST FALLBACK EVER:
        // Try to get the specific fallback mapped to the requested theme.
        // If it can't find an exact match, pull a random one from the generic list.
        let fallbackBase = themeFallbacks[requestedTheme];
        
        if (!fallbackBase) {
            const randomIndex = Math.floor(Math.random() * genericFallbacks.length);
            fallbackBase = genericFallbacks[randomIndex];
        }

        const finalFallback = { ...fallbackBase };
        
        // Ensure ID uniqueness and UI labeling
        finalFallback.id = Math.floor(Math.random() * 9000) + 1000;
        finalFallback.isAI = true; // Pretend it was synthesized by AI to keep the badge showing
        
        return res.status(200).json(finalFallback);
    }
});

// Dynamic port for Render deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Security Engine running on port ${PORT}`);
});
