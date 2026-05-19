/* ====================================================
   MAIN APPLICATION - app.js
   Version with Real AI Integration (Strict Sequential Queue)
   ==================================================== */

const MAX_ROUNDS = 15;
const TOTAL_LOCAL_ROUNDS = 10;
const TOTAL_AI_ROUNDS = 5;

const aiThemes = [
    "Falso prêmio via Pix",
    "Problema de entrega nos Correios",
    "Clonagem de WhatsApp familiar",
    "Falsa oferta de emprego",
    "Aviso urgente do banco",
    "Ganho de um sorteio"
];

async function iniciarAplicacao() {
    console.log('🚀 Starting Hybrid System with Real AI...');
    await dataLoader.carregar();

    const localMessages = dataLoader.obterMensagens().slice(0, TOTAL_LOCAL_ROUNDS);
    simulador.inicializar(localMessages);

    // Inicia a fila de requisições da IA em background
    fetchRealAISequentially();

    carregarProximaMensagem();
}

async function fetchRealAISequentially() {
    console.log('⏳ Starting sequential AI queue...');
    for (let i = 0; i < TOTAL_AI_ROUNDS; i++) {
        await fetchSingleAIScenario(aiThemes[i]);
        
        // Espera 6 segundos entre chamadas para não sobrecarregar a API
        if (i < TOTAL_AI_ROUNDS - 1) {
            console.log('⏱️ Cooling down API for 6 seconds...');
            await new Promise(resolve => setTimeout(resolve, 6000));
        }
    }
}

async function fetchSingleAIScenario(theme) {
    try {
        console.log(`🤖 Requesting AI for theme: [${theme}]`);
        const response = await fetch('https://detector-golpe-unisul.onrender.com/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: theme })
        });

        if (!response.ok) throw new Error(`Server Error: ${response.status}`);

        const data = await response.json();
        data.isAI = true;
        simulador.mensagensUtilizadas.push(data);
        atualizarPontuacao();
        
        console.log(`✅ AI Scenario [${theme}] successfully loaded!`);
    } catch (error) {
        console.error(`❌ Failed to fetch AI for [${theme}]:`, error);
        simulador.mensagensUtilizadas.push(generateEmergencyFallback(theme));
    }
}

function generateEmergencyFallback(theme) {
    // Cenário de emergência caso a internet caia bem na hora da apresentação
    return {
        id: Math.floor(Math.random() * 99999),
        tipo: "notificacao",
        titulo: `Alerta: ${theme}`,
        remetente: "Sistema Unisul",
        conteudo: `Falha na conexão com a IA para o tema: ${theme}. Valide sua conta no link abaixo. http://falso-link.com`,
        link: "http://falso-link.com",
        classificacao: "golpe",
        explicacao: "Cenário gerado localmente devido à falha de rede temporária na IA.",
        nivel: "facil",
        isAI: true
    };
}

function carregarProximaMensagem() {
    const nextMessage = simulador.proximaMensagem();
    if (!nextMessage) {
        mostrarTelaDeFim();
        return;
    }
    
    document.getElementById('tipoMensagem').textContent = nextMessage.tipo;
    document.getElementById('titulo').textContent = nextMessage.titulo;
    document.getElementById('remetente').textContent = nextMessage.remetente;
    document.getElementById('conteudo').innerHTML = nextMessage.conteudo;
    
    const linkContainer = document.getElementById('linkContainer');
    if (nextMessage.link && nextMessage.link !== "null") {
        document.getElementById('link').href = nextMessage.link;
        linkContainer.style.display = 'block';
    } else {
        linkContainer.style.display = 'none';
    }

    const aiBadge = document.getElementById('aiBadge');
    if(aiBadge) aiBadge.style.display = nextMessage.isAI ? 'inline-block' : 'none';

    applyDeviceTheme(nextMessage);
    habilitarBotoeResposta();
}

function applyDeviceTheme(message) {
    const viewport = document.getElementById('deviceViewport');
    if (!viewport) return;

    const rawType = message.tipo.toLowerCase();
    viewport.className = 'device-viewport'; 
    
    if (rawType.includes('whatsapp')) viewport.classList.add('theme-whatsapp');
    else if (rawType.includes('email')) viewport.classList.add('theme-email');
    else if (rawType.includes('sms')) viewport.classList.add('theme-sms');
    else viewport.classList.add('theme-notification');
}

function avaliarMensagem(resposta) {
    if (simulador.respostadada) return;
    
    desabilitarBotoeResposta();
    const result = simulador.avaliarResposta(resposta);
    
    const feedbackContent = document.getElementById('feedbackContent');
    feedbackContent.textContent = result.estaCorreto ? "✅ Correto!" : "❌ Incorreto!";
    feedbackContent.className = `feedback-banner ${result.estaCorreto ? 'correto' : 'incorreto'}`;
    
    document.getElementById('feedbackSection').style.display = 'block';
    document.getElementById('explicacao').textContent = result.explicacao;
    document.getElementById('explicacaoBox').style.display = 'block';
}

function desabilitarBotoeResposta() {
    document.getElementById('botaoGolpe').disabled = true;
    document.getElementById('botaoLegitima').disabled = true;
}

function habilitarBotoeResposta() {
    document.getElementById('botaoGolpe').disabled = false;
    document.getElementById('botaoLegitima').disabled = false;
}

function atualizarPontuacao() {
    const acertosEl = document.getElementById('acertos');
    const totalEl = document.getElementById('total');
    if (acertosEl) acertosEl.textContent = simulador.acertos;
    if (totalEl) totalEl.textContent = simulador.mensagensUtilizadas.length;
}

function proximaMensagem() {
    document.getElementById('feedbackSection').style.display = 'none';
    document.getElementById('explicacaoBox').style.display = 'none';
    carregarProximaMensagem(); 
}

function mostrarTelaDeFim() {
    document.querySelector('.decision-panel').style.display = 'none';
    const finalPercent = Math.round((simulador.acertos / simulador.mensagensUtilizadas.length) * 100);
    document.getElementById('finalAcertos').textContent = simulador.acertos;
    document.getElementById('finalPercentual').textContent = finalPercent + '%';
    document.getElementById('finalSection').style.display = 'block';
}

function reiniciarSimulador() { window.location.reload(); }

document.addEventListener('DOMContentLoaded', iniciarAplicacao);
window.avaliarMensagem = avaliarMensagem;
window.proximaMensagem = proximaMensagem;
window.reiniciarSimulador = reiniciarSimulador;
