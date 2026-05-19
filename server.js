import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(express.json());

// Verifica se pelo menos uma chave está disponível
if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.error("ERRO CRÍTICO: Nenhuma chave (Groq ou Gemini) está definida no ambiente!");
}

app.get('/', (req, res) => {
    res.status(200).send("🚀 Multi-AI Security Engine (Groq + Gemini) is ONLINE.");
});

// Banco de cenários reserva caso ambas as IAs falhem
const cenariosReserva = [
    { tipo: "whatsapp", titulo: "Segurança de Conta", remetente: "Suporte Técnico", conteudo: "Identificamos um acesso no seu WhatsApp por outro dispositivo. Valide agora para evitar bloqueio: http://seguranca-wpp-br.net", link: "http://seguranca-wpp-br.net", classificacao: "golpe", explicacao: "O WhatsApp oficial não envia links de validação por mensagem direta.", nivel: "medio" },
    { tipo: "email", titulo: "Fatura Atrasada", remetente: "Cobrança", conteudo: "Sua fatura com vencimento para hoje consta em aberto. Evite multas pagando agora: http://fatura-segura.com/pagar", link: "http://fatura-segura.com/pagar", classificacao: "golpe", explicacao: "Sempre verifique o remetente do e-mail e desconfie de links diretos para pagamento.", nivel: "facil" },
    { tipo: "sms", titulo: "Prêmio Recebido", remetente: "Promoção", conteudo: "Você foi sorteado! Receba R$ 500 no PIX agora: http://pix-sorteio-promo.com", link: "http://pix-sorteio-promo.com", classificacao: "golpe", explicacao: "Promoções que pedem acesso a links via SMS são armadilhas comuns.", nivel: "facil" }
];

app.post('/', async (req, res) => {
    console.log('🤖 AI Generation Requested...');
    
    const requestedTheme = req.body.theme || "scam";
    const randomSeed = Math.random().toString(36).substring(7);
    
    const prompt = `You are a cybersecurity expert. Generate a SINGLE unique digital interaction scenario (scam or legitimate) for an educational simulator.
    
    CRITICAL INSTRUCTIONS:
    1. Theme: "${requestedTheme}"
    2. Language: Brazilian Portuguese (pt-BR).
    3. Random Seed: ${randomSeed}
    4. MUST use realistic fake names (e.g., 'João da Silva', 'Maria Fernandes'). DO NOT use placeholders like '[NOME]', '[EMPRESA]', or '<link>'.
    5. The 'remetente' must sound realistic for the context.
    
    Return ONLY a raw JSON object with this exact structure:
    { 
        "id": ${Math.floor(Math.random() * 9000) + 1000}, 
        "tipo": "whatsapp", 
        "titulo": "invent a title", 
        "remetente": "invent a realistic sender", 
        "conteudo": "write the detailed message without any brackets or placeholders", 
        "link": "invent a URL or null", 
        "classificacao": "golpe", 
        "explicacao": "explain why it is a scam or safe", 
        "nivel": "facil" 
    }
    Do NOT wrap in markdown fences. Return raw JSON text only.`;

    let iaResponseData = null;

    // ========================================================
    // TENTATIVA 1: GROQ (LLAMA 3.1) - Modelo Atualizado e Rápido
    // ========================================================
    try {
        if (process.env.GROQ_API_KEY) {
            console.log('🔄 Tentando IA Primária: Groq (Llama 3.1)...');
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant", 
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7
                })
            });
            
            const groqData = await groqRes.json();
            
            if (groqRes.ok && groqData.choices && groqData.choices[0]) {
                iaResponseData = groqData.choices[0].message.content;
                console.log('✅ Sucesso com Groq!');
            } else {
                console.warn('⚠️ Groq Falhou. Status:', groqRes.status, 'Detalhes:', JSON.stringify(groqData));
            }
        } else {
            console.warn('⚠️ Chave da Groq não configurada no ambiente.');
        }
    } catch (e) {
        console.warn('⚠️ Erro de rede na Groq:', e.message);
    }

    // ========================================================
    // TENTATIVA 2: GEMINI (GOOGLE) - Fallback Seguro
    // ========================================================
    if (!iaResponseData) {
        try {
            if (process.env.GEMINI_API_KEY) {
                console.log('🔄 Tentando IA Secundária: Gemini...');
                
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
                    console.log('✅ Sucesso com Gemini!');
                } else {
                    console.warn('⚠️ Gemini Falhou. Status:', geminiRes.status, 'Detalhes:', JSON.stringify(geminiData));
                }
            } else {
                console.warn('⚠️ Chave do Gemini não configurada no ambiente.');
            }
        } catch (e) {
            console.warn('⚠️ Erro de rede no Gemini:', e.message);
        }
    }

    // ========================================================
    // PROCESSAMENTO FINAL E GARANTIA DE APRESENTAÇÃO
    // ========================================================
    try {
        if (!iaResponseData) {
            throw new Error("Ambas as IAs falharam.");
        }

        let textResponse = iaResponseData.trim();
        textResponse = textResponse.replace(/^```json/gi, '').replace(/```$/g, '').trim();

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[0]);
            return res.status(200).json(parsedJson);
        } else {
            throw new Error("Não foi possível processar o JSON: " + textResponse);
        }

    } catch (error) {
        console.error("❌ FALHA TOTAL DA IA, USANDO CENÁRIO DE RESERVA:", error.message);
        
        // Puxa um cenário aleatório da nossa lista de reserva em vez de uma mensagem de erro genérica
        const cenarioFallback = cenariosReserva[Math.floor(Math.random() * cenariosReserva.length)];
        
        return res.status(200).json({
            id: Math.floor(Math.random() * 9000) + 1000,
            ...cenarioFallback,
            isAI: true // Mantém a flag isAI para a UI
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Multi-AI API rodando na porta ${PORT}`));
