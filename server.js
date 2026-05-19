/* ====================================================
   AI SCENARIO GENERATOR BACKEND - server.js
   Express server integrating Google Gen AI SDK with fallback
   ==================================================== */

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Rota inicial traduzida para PT-BR
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 3rem; background: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 style="color: #2563eb; margin-bottom: 0.5rem;">🚀 API do Motor de Segurança</h1>
            <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 1.5rem;">O Backend de Análise de Ameaças está rodando perfeitamente na porta 3000.</p>
            <div style="background: #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 6px; font-family: monospace; font-size: 0.95rem;">
                Status: ATIVO • Pronto para processar nós de simulação de IA.
            </div>
        </div>
    `);
});

app.post('/api/generate-scenario', async (req, res) => {
    console.log('🤖 AI Prompt dispatch requested...');

    const prompt = `
    You are an expert in cybersecurity and social engineering.
    Your task is to generate a SINGLE random digital communication scenario for an educational simulator.
    The scenario must be either a scam ("golpe") or legitimate ("legitimo").
    
    You MUST return ONLY a valid JSON object matching exactly this structure, with no markdown formatting, no backticks, and no introductory text:
    {
        "id": ${Math.floor(Math.random() * 9000) + 1000},
        "tipo": "<choose randomly one of: email, whatsapp, sms, rede social, notificacao>",
        "titulo": "<A convincing short title or subject>",
        "remetente": "<A realistic sender name, phone number, or email address>",
        "conteudo": "<The main text body of the message. Make it realistic for the chosen 'tipo'>",
        "link": "<A relevant URL (can be a phishing link or legitimate), or null if not applicable>",
        "classificacao": "<choose either 'golpe' or 'legitimo'>",
        "explicacao": "<A brief educational explanation (in Portuguese) of why this is a scam or safe>",
        "nivel": "<choose randomly one of: facil, medio, dificil>"
    }
    
    Ensure ALL text content (titulo, remetente, conteudo, explicacao) is written strictly in Brazilian Portuguese (PT-BR).
    `;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let responseText = '';
    let success = false;

    for (const modelName of modelsToTry) {
        try {
            console.log(`📡 Querying external intelligence service via [${modelName}]...`);
            
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
            });

            if (response && response.text) {
                responseText = response.text;
                success = true;
                console.log(`⚡ Service [${modelName}] responded successfully.`);
                break;
            }
        } catch (modelError) {
            console.warn(`⚠️ Warning: Model [${modelName}] failed or was overloaded. Status: ${modelError.status || '503'}`);
        }
    }

    if (!success) {
        console.error('❌ Critical: All remote model clusters are currently unavailable.');
        return res.status(503).json({ 
            error: 'Serviço de IA temporariamente sobrecarregado. Tente novamente em breve.' 
        });
    }

    try {
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
        }

        const scenarioData = JSON.parse(jsonText);
        console.log(`✅ Successfully synthesized AI Scenario ID: ${scenarioData.id}`);
        res.json(scenarioData);

    } catch (parseError) {
        console.error('❌ Failed to parse synthesized payload string into clean JSON structure:', parseError);
        res.status(500).json({ error: 'Erro de formatação de dados na geração do modelo.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Security Engine running on http://localhost:${PORT}`);
});