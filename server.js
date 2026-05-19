import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(express.json());

// Verificar a chave da nova IA
if (!process.env.GROQ_API_KEY) {
    console.error("ERRO CRÍTICO: GROQ_API_KEY não está definida!");
}

app.get('/', (req, res) => {
    res.status(200).send("🚀 Servidor Inteligente Llama 3 Ativo.");
});

app.post('/', async (req, res) => {
    console.log('🤖 Geração de IA solicitada via Groq/Llama3...');
    
    try {
        const requestedTheme = req.body.theme || "scam";
        
        const prompt = `You are a cybersecurity expert. Generate a SINGLE unique digital interaction scenario (scam or legitimate) for an educational simulator.
        
        Theme: "${requestedTheme}"
        Language: Brazilian Portuguese (pt-BR).
        
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
        Do NOT wrap in markdown. Return raw JSON.`;

        // Ligar à Groq Cloud (Llama 3 8B)
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Modelo ultrarrápido
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (!data.choices || !data.choices[0]) {
            throw new Error("Resposta inválida da API Groq");
        }

        let textResponse = data.choices[0].message.content.trim();
        textResponse = textResponse.replace(/^```json/gi, '').replace(/```$/g, '').trim();

        const parsedJson = JSON.parse(textResponse);
        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("⚠️ Falha no pedido da IA:", error.message);
        return res.status(500).json({ error: "Falha na geração da IA" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API a correr na porta ${PORT}`));
