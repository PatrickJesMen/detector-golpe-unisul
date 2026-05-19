import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Configurações de Middlewares
app.use(cors());
app.use(express.json());

// Verificação de segurança da chave
if (!process.env.GEMINI_API_KEY) {
    console.error("ERRO CRÍTICO: GEMINI_API_KEY não configurada no Render!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Rota para o POST da IA
app.post('/', async (req, res) => {
    try {
        const prompt = "..."; 
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const text = response.text().trim();
        // Regex para extrair apenas o objeto JSON, ignorando qualquer lixo textual
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("Formato inválido");
        }
    } catch (error) {
        console.error("IA falhou, enviando resposta de segurança:", error);
        // RETORNA UM JSON VÁLIDO DE SEGURANÇA (Não quebra o simulador)
        return res.json({
            id: 9999,
            tipo: "notificacao",
            titulo: "Verificação de Segurança",
            remetente: "Sistema Unisul",
            conteudo: "Estamos realizando manutenção nos servidores. Por favor, analise esta mensagem como teste.",
            link: null,
            classificacao: "legitimo",
            explicacao: "Mensagem de fallback por indisponibilidade momentânea da IA.",
            nivel: "facil",
            isAI: true
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
