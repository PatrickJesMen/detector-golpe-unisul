import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(express.json());

// Check if at least one API key is available
if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: Neither GROQ_API_KEY nor GEMINI_API_KEY are set!");
}

app.get('/', (req, res) => {
    res.status(200).send("🚀 Multi-AI Security Engine (Groq + Gemini) is ONLINE.");
});

app.post('/', async (req, res) => {
    console.log('🤖 AI Generation Requested...');
    
    const requestedTheme = req.body.theme || "scam";
    const randomSeed = Math.random().toString(36).substring(7);
    
    const prompt = `You are a cybersecurity expert. Generate a SINGLE unique digital interaction scenario (scam or legitimate) for an educational simulator.
    
    Theme: "${requestedTheme}"
    Language: Brazilian Portuguese (pt-BR).
    Random Seed: ${randomSeed}
    
    Return ONLY a raw JSON object with this exact structure:
    { 
        "id": ${Math.floor(Math.random() * 9000) + 1000}, 
        "tipo": "whatsapp", 
        "titulo": "invent a title", 
        "remetente": "invent a sender", 
        "conteudo": "write the detailed message", 
        "link": "invent a URL or null", 
        "classificacao": "golpe", 
        "explicacao": "explain why it is a scam", 
        "nivel": "facil" 
    }
    Do NOT wrap in markdown fences. Return raw JSON text only.`;

    let iaResponseData = null;

    // ========================================================
    // ATTEMPT 1: GROQ (LLAMA 3) - Extremely Fast
    // ========================================================
    try {
        if (process.env.GROQ_API_KEY) {
            console.log('🔄 Trying Primary AI: Groq (Llama 3)...');
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama3-8b-8192",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7
                })
            });
            
            const groqData = await groqRes.json();
            
            if (groqRes.ok && groqData.choices && groqData.choices[0]) {
                iaResponseData = groqData.choices[0].message.content;
                console.log('✅ Success with Groq!');
            } else {
                console.warn('⚠️ Groq Failed. Status:', groqRes.status, 'Error Details:', JSON.stringify(groqData));
            }
        } else {
            console.warn('⚠️ GROQ_API_KEY not configured. Skipping Groq.');
        }
    } catch (e) {
        console.warn('⚠️ Groq Network Error:', e.message);
    }

    // ========================================================
    // ATTEMPT 2: GEMINI (GOOGLE) - Reliable Fallback
    // ========================================================
    if (!iaResponseData) {
        try {
            if (process.env.GEMINI_API_KEY) {
                console.log('🔄 Trying Secondary AI: Gemini 1.5 Flash...');
                // Using raw HTTP fetch instead of SDK to avoid versioning/dependency crashes
                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });
                
                const geminiData = await geminiRes.json();
                
                if (geminiRes.ok && geminiData.candidates && geminiData.candidates[0]) {
                    iaResponseData = geminiData.candidates[0].content.parts[0].text;
                    console.log('✅ Success with Gemini!');
                } else {
                    console.warn('⚠️ Gemini Failed. Status:', geminiRes.status, 'Error Details:', JSON.stringify(geminiData));
                }
            } else {
                console.warn('⚠️ GEMINI_API_KEY not configured. Skipping Gemini.');
            }
        } catch (e) {
            console.warn('⚠️ Gemini Network Error:', e.message);
        }
    }

    // ========================================================
    // FINAL PROCESSING & PRESENTATION GUARANTEE
    // ========================================================
    try {
        if (!iaResponseData) {
            throw new Error("Both AI services failed or API keys are missing/invalid.");
        }

        // Clean any potential markdown from the AI output
        let textResponse = iaResponseData.trim();
        textResponse = textResponse.replace(/^```json/gi, '').replace(/```$/g, '').trim();

        // Extract strictly the JSON object
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[0]);
            return res.status(200).json(parsedJson);
        } else {
            throw new Error("Could not parse JSON from AI response: " + textResponse);
        }

    } catch (error) {
        console.error("❌ TOTAL AI FAILURE:", error.message);
        
        // ULTIMATE FALLBACK: NEVER break the presentation. Always return a valid scenario.
        return res.status(200).json({
            id: Math.floor(Math.random() * 9000) + 1000,
            tipo: "notificacao",
            titulo: "Verificação de Segurança",
            remetente: "Sistema Unisul",
            conteudo: `(Cenário Local) Notamos uma instabilidade nos servidores externos. Por favor, valide o seu acesso na secretaria acadêmica.`,
            link: null,
            classificacao: "legitimo",
            explicacao: "Cenário de backup ativado. As IAs não conseguiram responder a tempo, mas a simulação continua.",
            nivel: "facil"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Multi-AI API running on port ${PORT}`));
