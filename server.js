import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Middleware de CORS robusto
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.options('*', cors());

app.post('/', async (req, res) => {
    const prompt = `Gere um cenário de golpe ou legítimo em formato JSON estrito: { "id": 1, "tipo": "email", "titulo": "...", "remetente": "...", "conteudo": "...", "link": null, "classificacao": "golpe", "explicacao": "...", "nivel": "medio" }. Tudo em Português-BR.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        let jsonText = response.text().trim().replace(/^```json/, '').replace(/```$/, '');
        res.json(JSON.parse(jsonText));
    } catch (e) {
        res.status(500).json({ error: "Erro na geração" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
