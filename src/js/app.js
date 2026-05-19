/* ====================================================
   APLICAÇÃO PRINCIPAL - app.js
   Controla a interface e integra todas as funcionalidades
   ==================================================== */

let appState = {
    isLoaded: false,
    isRunning: false
};

const TOTAL_LOCAL_ROUNDS = 10;
const TOTAL_AI_ROUNDS = 5; // Reduzido para 5 para evitar limites de taxa da API
const MAX_ROUNDS = TOTAL_LOCAL_ROUNDS + TOTAL_AI_ROUNDS;

// Array de temas distintos para forçar a IA a gerar cenários únicos
const aiThemes = [
    "Falso prêmio via Pix",
    "Problema de entrega nos Correios",
    "Clonagem de WhatsApp de familiar",
    "Falsa oferta de emprego de meio período",
    "Aviso urgente do banco sobre conta bloqueada"
];

async function iniciarAplicacao() {
    try {
        console.log('🚀 Iniciando sistema híbrido...');
        await dataLoader.carregar();

        // 1. Carrega exatamente 10 cenários locais
        const localMessages = dataLoader.obterMensagens().slice(0, TOTAL_LOCAL_ROUNDS);
        simulador.inicializar(localMessages);

        // 2. Busca os cenários da IA de forma ESTRITAMENTE SEQUENCIAL
        // Isso impede que a API do Google receba múltiplos pedidos ao mesmo tempo (Erro 429)
        carregarIASequencialmente();

        appState.isLoaded = true;
        appState.isRunning = true;

        carregarProximaMensagem();

    } catch (error) {
        console.error('❌ Erro durante a inicialização:', error);
        exibirErro('Falha ao carregar a aplicação. Certifique-se de que os arquivos estão corretos.');
    }
}

// Nova função para garantir que a IA seja chamada uma por vez com intervalo seguro
async function carregarIASequencialmente() {
    console.log('⏳ Iniciando fila sequencial de requisições para a IA...');
    
    for (let i = 0; i < TOTAL_AI_ROUNDS; i++) {
        // Aguarda a requisição atual terminar totalmente antes de passar para a próxima
        try {
            await fetchAIInBackground(aiThemes[i]);
        } catch (error) {
             console.error(`Falha no cenário ${i}:`, error);
        }
        
        // Dá um "respiro" obrigatório de 4 segundos para a API esfriar e evitar o bloqueio (Rate Limit)
        if (i < TOTAL_AI_ROUNDS - 1) {
            console.log(`⏱️ Aguardando 4 segundos de respiro para a API do Google...`);
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }
    
    console.log('✅ Fila de IA concluída com sucesso!');
}

function exibirErro(message) {
    const simulatorDiv = document.querySelector('.simulator-engine') || document.querySelector('.simulator');
    if (simulatorDiv) {
        simulatorDiv.innerHTML = `
            <div class="error-message" style="background: #fee2e2; border: 2px solid #ef4444; color: #991b1b; padding: 2rem; border-radius: 8px; text-align: center;">
                <h2 style="margin-bottom: 1rem;">⚠️ Erro ao carregar a aplicação</h2>
                <p>${message}</p>
            </div>
        `;
    }
}

function carregarProximaMensagem() {
    resetarInterfaceResposta();
    const nextMessage = simulador.proximaMensagem();

    if (!nextMessage) {
        mostrarTelaDeFim();
        return;
    }

    const formattedMessage = typeof simulador.obterMensagemFormatada === 'function' 
        ? simulador.obterMensagemFormatada() 
        : nextMessage;
        
    exibirMensagem(formattedMessage);
    atualizarPontuacao();
}

function exibirMensagem(message) {
    if (document.getElementById('tipoMensagem')) document.getElementById('tipoMensagem').textContent = message.tipo;
    if (document.getElementById('titulo')) document.getElementById('titulo').textContent = message.titulo;
    if (document.getElementById('remetente')) document.getElementById('remetente').textContent = message.remetente;
    if (document.getElementById('conteudo')) document.getElementById('conteudo').textContent = message.conteudo;

    const linkContainer = document.getElementById('linkContainer');
    const linkElement = document.getElementById('link');

    if (message.link && message.link !== "null") {
        if (linkElement) {
            linkElement.href = message.link;
            linkElement.textContent = message.link;
        }
        if (linkContainer) linkContainer.style.display = 'block';
    } else {
        if (linkContainer) linkContainer.style.display = 'none';
    }

    const aiBadge = document.getElementById('aiBadge');
    if (aiBadge) {
        aiBadge.style.display = message.isAI ? 'inline-flex' : 'none';
    }

    applyDeviceTheme(message);
    habilitarBotoeResposta();
}

function applyDeviceTheme(message) {
    const viewport = document.getElementById('deviceViewport');
    if (!viewport) return;

    const senderName = message.remetente || "Desconhecido";
    const rawType = message.tipo.toLowerCase();
    const initial = senderName.charAt(0).toUpperCase();
    
    if (document.getElementById('avatarInitial')) document.getElementById('avatarInitial').textContent = initial;
    if (document.getElementById('avatarInitialEmail')) document.getElementById('avatarInitialEmail').textContent = initial;
    if (document.getElementById('emailNameSync')) document.getElementById('emailNameSync').textContent = senderName;

    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTime12 = `${date.getHours() % 12 || 12}:${minutes} ${ampm}`;
    const formattedTime24 = `${hours}:${minutes}`;

    if(document.getElementById('osTime')) document.getElementById('osTime').textContent = formattedTime24;
    if(document.getElementById('waTime')) document.getElementById('waTime').textContent = formattedTime24;
    if(document.getElementById('emailTime')) document.getElementById('emailTime').textContent = formattedTime12;
    if(document.getElementById('smsTime')) document.getElementById('smsTime').textContent = `Hoje ${formattedTime12}`;

    viewport.classList.remove('theme-whatsapp', 'theme-email', 'theme-sms', 'theme-social', 'theme-notification');
    
    if (rawType.includes('whatsapp') || rawType.includes('wpp')) {
        viewport.classList.add('theme-whatsapp');
        if (document.getElementById('contactStatus')) document.getElementById('contactStatus').textContent = 'online';
    } else if (rawType.includes('email') || rawType.includes('e-mail')) {
        viewport.classList.add('theme-email');
    } else if (rawType.includes('sms') || rawType.includes('torpedo') || rawType.includes('mensagem')) {
        viewport.classList.add('theme-sms');
    } else if (rawType.includes('rede social') || rawType.includes('instagram') || rawType.includes('facebook') || rawType.includes('social')) {
        viewport.classList.add('theme-social');
        if (document.getElementById('contactStatus')) document.getElementById('contactStatus').textContent = '2h atrás • Público';
    } else {
        viewport.classList.add('theme-notification');
    }
}

function avaliarMensagem(response) {
    try {
        if (simulador.respostadada) return;

        desabilitarBotoeResposta();
        const result = simulador.avaliarResposta(response);

        exibirResultado(result);
        exibirExplicacao(result.explicacao || "");

    } catch (error) {
        console.error('Erro ao avaliar resposta:', error);
    }
}

function exibirResultado(result) {
    const feedbackSection = document.getElementById('feedbackSection');
    const feedbackContent = document.getElementById('feedbackContent');

    const isCorrect = result.estaCorreto;
    const cssClass = isCorrect ? 'correto' : 'incorreto';
    
    const correctType = result.respostaCorreta === 'golpe' ? 'um golpe' : 'legítimo';
    const message = isCorrect ? `✅ Correto! Na verdade, isso é ${correctType}.` : `❌ Incorreto! Na verdade, isso era ${correctType}.`;

    if (feedbackContent) {
        feedbackContent.className = `feedback-banner ${cssClass}`; 
        feedbackContent.textContent = message;
    }

    if (feedbackSection) {
        feedbackSection.style.display = 'block';
        feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function exibirExplicacao(explanation) {
    const explicacaoBox = document.getElementById('explicacaoBox');
    const explicacaoText = document.getElementById('explicacao');

    if (explanation && explicacaoText && explicacaoBox) {
        explicacaoText.textContent = explanation;
        explicacaoBox.style.display = 'block';
        explicacaoBox.style.animation = 'none';
        setTimeout(() => { explicacaoBox.style.animation = ''; }, 10);
    } else if (explicacaoBox) {
        explicacaoBox.style.display = 'none';
    }
}

function resetarInterfaceResposta() {
    const elementsToHide = ['feedbackSection', 'explicacaoBox', 'finalSection'];
    elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const feedbackContent = document.getElementById('feedbackContent');
    if (feedbackContent) feedbackContent.className = 'feedback-banner';

    // Mantém os botões desabilitados inicialmente por 2 segundos para forçar a leitura
    desabilitarBotoeResposta();
}

function desabilitarBotoeResposta() {
    const btnGolpe = document.getElementById('botaoGolpe');
    const btnLegitima = document.getElementById('botaoLegitima');
    if (btnGolpe) btnGolpe.disabled = true;
    if (btnLegitima) btnLegitima.disabled = true;
}

function habilitarBotoeResposta() {
    setTimeout(() => {
        const btnGolpe = document.getElementById('botaoGolpe');
        const btnLegitima = document.getElementById('botaoLegitima');
        if (btnGolpe) btnGolpe.disabled = false;
        if (btnLegitima) btnLegitima.disabled = false;
    }, 2000);
}

function atualizarPontuacao() {
    const acertosEl = document.getElementById('acertos');
    const totalEl = document.getElementById('total');

    const maxDisplayTotal = Math.min(simulador.mensagensUtilizadas.length, MAX_ROUNDS);
    
    if (acertosEl) acertosEl.textContent = simulador.acertos;
    if (totalEl) totalEl.textContent = maxDisplayTotal;
}

function proximaMensagem() {
    // LIMITE RESTRITO: Se chegamos ao limite, forçar a tela final.
    if (simulador.indiceAtual >= MAX_ROUNDS) {
        mostrarTelaDeFim();
        return;
    }

    const hasMore = simulador.indiceAtual < simulador.mensagensUtilizadas.length;

    if (!hasMore) {
        mostrarTelaDeFim();
    } else {
        carregarProximaMensagem();
    }
}

function mostrarTelaDeFim() {
    const decisionPanel = document.querySelector('.decision-panel');
    const feedbackSection = document.getElementById('feedbackSection');
    
    if (decisionPanel) decisionPanel.style.display = 'none';
    if (feedbackSection) feedbackSection.style.display = 'none';

    const finalSection = document.getElementById('finalSection');
    const finalPercent = MAX_ROUNDS > 0 ? Math.round((simulador.acertos / MAX_ROUNDS) * 100) : 0;

    if (document.getElementById('finalAcertos')) document.getElementById('finalAcertos').textContent = simulador.acertos;
    if (document.getElementById('finalPercentual')) document.getElementById('finalPercentual').textContent = finalPercent + '%';

    if (finalSection) {
        finalSection.style.display = 'block';
        finalSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function reiniciarSimulador() {
    // Recarrega a página para resetar tudo perfeitamente
    window.location.reload();
}

async function fetchAIInBackground(themeContext) {
    try {
        console.log(`🤖 Solicitando cenário de IA com tema: [${themeContext}]`);
        
        // Garanta que esta URL seja o seu endpoint ativo no Render!
        const response = await fetch('https://detector-golpe-unisul.onrender.com/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: themeContext })
        });

        if (response.ok) {
            const textResponse = await response.text();
            try {
                 const newScenarioJSON = JSON.parse(textResponse);
                 newScenarioJSON.isAI = true;
                
                 simulador.mensagensUtilizadas.push(newScenarioJSON);
                 console.log(`✅ Cenário IA ID ${newScenarioJSON.id} carregado | Tema: ${themeContext}`);
                
                 atualizarPontuacao();
            } catch (jsonError) {
                 console.error("Erro ao analisar a resposta JSON do servidor:", jsonError, textResponse);
                 throw new Error("Resposta inválida do servidor.");
            }
        } else {
            console.error(`Erro na requisição: ${response.status} - ${response.statusText}`);
            throw new Error(`Erro do servidor: ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ Falha ao buscar serviço de IA:', error);
        // Se a requisição falhar (ex: CORS, indisponível), adicionamos um fallback no próprio front-end
        const fallbackId = Math.floor(Math.random() * 9000) + 1000;
        simulador.mensagensUtilizadas.push({
            id: fallbackId,
            tipo: "notificacao",
            titulo: "⚠️ Verificação de Segurança (Local)",
            remetente: "Sistema Unisul",
            conteudo: "Os serviços de Inteligência Artificial estão indisponíveis. Este é um cenário de teste padrão.",
            link: null,
            classificacao: "legitimo",
            explicacao: "Fallback acionado no cliente devido à indisponibilidade do backend.",
            nivel: "facil",
            isAI: true
        });
        atualizarPontuacao();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    iniciarAplicacao();
});

// Expõe funções globalmente para os manipuladores de eventos HTML (onclick)
window.avaliarMensagem = avaliarMensagem;
window.proximaMensagem = proximaMensagem;
window.reiniciarSimulador = reiniciarSimulador;
