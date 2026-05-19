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
        console.log('🤖 Gerando cenário via IA...');
        
        const prompt = `Gere um objeto JSON para um simulador de golpes. Formato: { "id": 100, "tipo": "whatsapp", "titulo": "Teste", "remetente": "Suporte", "conteudo": "Teste", "link": null, "classificacao": "golpe", "explicacao": "Explicação breve", "nivel": "facil" }. Use Português-BR. NÃO use markdown, responda apenas o JSON puro.`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        // Limpeza robusta da resposta
        let rawText = response.text().trim();
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '');

        const json = JSON.parse(rawText);
        res.status(200).json(json);

    } catch (error) {
        console.error("Erro na geração da IA:", error);
        // Retornar 500 aqui é o que causa o seu erro, mas agora temos o log no console
        res.status(500).json({ error: "Erro interno no servidor", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
