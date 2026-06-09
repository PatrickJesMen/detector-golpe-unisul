import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(express.json());

// Check if at least one API key is available
if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: No API Key (Groq or Gemini) is defined in the environment!");
}

app.get('/', (req, res) => {
    res.status(200).send("🚀 Multi-AI Security Engine (Groq + Gemini) is ONLINE.");
});

// Fallback scenarios in case both AIs fail
const fallbackScenarios = [
    { tipo: "whatsapp", titulo: "Segurança de Conta", remetente: "Suporte Técnico", conteudo: "Identificamos um acesso no seu WhatsApp por outro dispositivo. Valide agora para evitar bloqueio acessando o link abaixo.", link: "http://seguranca-wpp-br.net", classificacao: "golpe", explicacao: "O WhatsApp oficial não envia links de validação por mensagem direta.", nivel: "medio" },
    { tipo: "email", titulo: "Atualização de Políticas", remetente: "no-reply@suporte-oficial.com", conteudo: "Informamos que nossos Termos de Serviço foram atualizados. Você pode revisar as mudanças no portal oficial.", link: "https://suporte-oficial.com/termos", classificacao: "legitimo", explicacao: "A mensagem utiliza um domínio oficial e coerente, sendo apenas informativa.", nivel: "facil" }
];

app.post('/', async (req, res) => {
    console.log('🤖 AI Generation Requested...');
    
    // 1. Array of varied contexts to prevent repetition
    const variedContexts = [
        "Notificação de multa de trânsito (Detran)",
        "Processo seletivo / Vaga de emprego no LinkedIn",
        "Confirmação de recebimento de PIX",
        "Problema na entrega dos Correios ou Mercado Livre",
        "Renovação de assinatura de streaming (Netflix, Spotify)",
        "Mensagem de um conhecido pedindo dinheiro emprestado",
        "Agendamento de consulta médica ou exame",
        "Alerta de acesso a uma nova máquina/dispositivo",
        "Comprovante de compra de passagem aérea"
    ];

    // Pick a random context
    const selectedContext = variedContexts[Math.floor(Math.random() * variedContexts.length)];
    const requestedTheme = req.body.theme || selectedContext;
    
    // 2. Randomly decide (50% chance) if it will be a SCAM or LEGITIMATE
    const isScam = Math.random() > 0.5;
    const expectedClassification = isScam ? "golpe" : "legitimo";
    const randomSeed = Math.random().toString(36).substring(7);

    // 3. Split the logic into completely different prompts to force the AI's behavior
    let promptTemplate = "";

    if (isScam) {
        promptTemplate = `Você é um Engenheiro Social experiente. Sua tarefa é criar um cenário de GOLPE DIGITAL altamente sofisticado e difícil de ser detectado para um simulador.
        Tema Base: "${requestedTheme}"
        
        REGRAS DO GOLPE:
        1. Seja sutil. Não use ameaças óbvias ou pânico exagerado. Use táticas de curiosidade, rotina ou falso senso de obrigação.
        2. O 'remetente' deve parecer quase idêntico a um domínio real, mas com um pequeno erro (ex: @suporte-gov.br, @amazon-vendas.com.br, @rh-nubank.com).
        3. REGRA CRÍTICA PARA O LINK: NUNCA, SOB HIPÓTESE ALGUMA, escreva a URL ou o link dentro da chave "conteudo". O texto da mensagem deve apenas indicar a ação (ex: "clique no link abaixo", "acesse o botão"). A URL falsa DEVE ir APENAS na chave "link".
        4. O nível de dificuldade deve ser "dificil".`;
    } else {
        promptTemplate = `Você é um analista de comunicação corporativa. Sua tarefa é criar uma mensagem 100% LEGÍTIMA, rotineira e SEGURA para um simulador.
        Tema Base: "${requestedTheme}"
        
        REGRAS DA MENSAGEM LEGÍTIMA:
        1. A mensagem deve ser completamente normal, sem pedidos suspeitos de senha, dados ou dinheiro.
        2. O 'remetente' deve utilizar domínios reais e oficiais (ex: @gov.br, @amazon.com.br, @detran.sp.gov.br, @mercadolivre.com).
        3. REGRA CRÍTICA PARA O LINK: NUNCA escreva a URL ou o link dentro da chave "conteudo". O texto da mensagem deve ser fluido. A URL verdadeira DEVE ir APENAS na chave "link".
        4. O nível de dificuldade deve ser "facil" ou "medio".`;
    }

    // Assemble the final prompt requesting strictly JSON
    const finalPrompt = `${promptTemplate}
    
    Semente de Aleatoriedade: ${randomSeed}
    
    Retorne APENAS um objeto JSON válido (sem formatação markdown \`\`\`json) com a exata estrutura abaixo:
    { 
        "id": ${Math.floor(Math.random() * 9000) + 1000}, 
        "tipo": "whatsapp", // escolha entre: whatsapp, email, sms, notificacao
        "titulo": "Título realista da mensagem", 
        "remetente": "Nome ou e-mail realista", 
        "conteudo": "O texto da mensagem em si. LEMBRE-SE: NENHUMA URL NESTE CAMPO.", 
        "link": "https://coloque-a-url-aqui.com", 
        "classificacao": "${expectedClassification}", 
        "explicacao": "Explique brevemente por que essa mensagem é um golpe sofisticado OU por que ela é totalmente segura.", 
        "nivel": "medio" 
    }`;

    let aiResponseData = null;

    // ========================================================
    // ATTEMPT 1: GROQ (LLAMA 3.1)
    // ========================================================
    try {
        if (process.env.GROQ_API_KEY) {
            console.log(`🔄 Tentando IA Primária (Groq). Esperado: ${expectedClassification.toUpperCase()}...`);
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant", 
                    messages: [{ role: "user", content: finalPrompt }],
                    temperature: 0.8 // Increased slightly for more creativity in scenarios
                })
            });
            
            const groqData = await groqRes.json();
            
            if (groqRes.ok && groqData.choices && groqData.choices[0]) {
                aiResponseData = groqData.choices[0].message.content;
                console.log('✅ Sucesso com Groq!');
            } else {
                console.warn('⚠️ Groq Falhou. Detalhes:', JSON.stringify(groqData));
            }
        }
    } catch (e) {
        console.warn('⚠️ Erro de rede na Groq:', e.message);
    }

    // ========================================================
    // ATTEMPT 2: GEMINI (GOOGLE) - Fallback
    // ========================================================
    if (!aiResponseData) {
        try {
            if (process.env.GEMINI_API_KEY) {
                console.log(`🔄 Tentando IA Secundária (Gemini). Esperado: ${expectedClassification.toUpperCase()}...`);
                
                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: finalPrompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });
                
                const geminiData = await geminiRes.json();
                
                if (geminiRes.ok && geminiData.candidates && geminiData.candidates[0]) {
                    aiResponseData = geminiData.candidates[0].content.parts[0].text;
                    console.log('✅ Sucesso com Gemini!');
                } else {
                    console.warn('⚠️ Gemini Falhou. Detalhes:', JSON.stringify(geminiData));
                }
            }
        } catch (e) {
            console.warn('⚠️ Erro de rede no Gemini:', e.message);
        }
    }

    // ========================================================
    // FINAL PROCESSING
    // ========================================================
    try {
        if (!aiResponseData) {
            throw new Error("Ambas as IAs falharam.");
        }

        let textResponse = aiResponseData.trim();
        // Remove weird formatting if the AI disobeys the "no markdown" rule
        textResponse = textResponse.replace(/^```json/gi, '').replace(/```$/g, '').trim();

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[0]);
            
            // Safety check: force the classification to match what the backend decided
            // This prevents the AI from being stubborn and returning "golpe" when we asked for "legitimo"
            parsedJson.classificacao = expectedClassification; 
            
            return res.status(200).json(parsedJson);
        } else {
            throw new Error("Não foi possível processar o JSON retornado pela IA.");
        }

    } catch (error) {
        console.error("❌ FALHA TOTAL, USANDO CENÁRIO DE RESERVA:", error.message);
        
        // Ensure the fallback scenario matches what we intended to send
        const filteredFallbacks = fallbackScenarios.filter(s => s.classificacao === expectedClassification);
        const fallbackScenario = filteredFallbacks.length > 0 ? filteredFallbacks[0] : fallbackScenarios[0];
        
        return res.status(200).json({
            id: Math.floor(Math.random() * 9000) + 1000,
            ...fallbackScenario,
            isAI: false 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Multi-AI API rodando na porta ${PORT}`));