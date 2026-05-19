/* ====================================================
   MAIN APPLICATION - app.js
   Robust Sequential AI Loading and Correct UI Updates
   ==================================================== */

let appState = {
    isLoaded: false,
    isRunning: false
};

const TOTAL_LOCAL_ROUNDS = 10;
const TOTAL_AI_ROUNDS = 5;
const MAX_ROUNDS = TOTAL_LOCAL_ROUNDS + TOTAL_AI_ROUNDS;

const aiThemes = [
    "Falso prêmio via Pix",
    "Problema de entrega nos Correios",
    "Clonagem de WhatsApp familiar",
    "Falsa oferta de emprego",
    "Aviso urgente do banco"
];

const fallbackLocais = [
    { id: 9001, tipo: "email", titulo: "Acesso Suspeito", remetente: "Segurança TI", conteudo: "Identificamos acesso incomum. Valide seus dados: http://validacao-ti.net", link: "http://validacao-ti.net", classificacao: "golpe", explicacao: "Sistemas de TI internos raramente pedem validação por link direto.", nivel: "facil", isAI: true },
    { id: 9002, tipo: "sms", titulo: "Pacote Retido", remetente: "Entregas BR", conteudo: "Seu pacote foi retido. Pague a taxa de liberação: http://libera-pacote-br.com", link: "http://libera-pacote-br.com", classificacao: "golpe", explicacao: "Taxas de entrega devem ser verificadas no portal oficial dos correios/transportadora.", nivel: "facil", isAI: true },
    { id: 9003, tipo: "whatsapp", titulo: "Promoção Exclusiva", remetente: "Loja Parceira", conteudo: "Ganhe 80% de desconto hoje usando este link exclusivo: http://promo-loja-vip.net", link: "http://promo-loja-vip.net", classificacao: "golpe", explicacao: "Descontos irreais enviados não solicitados são típicos de phishing.", nivel: "medio", isAI: true },
    { id: 9004, tipo: "notificacao", titulo: "Atualização de Sistema", remetente: "OS Updater", conteudo: "Novas definições de segurança instaladas com sucesso.", link: null, classificacao: "legitimo", explicacao: "Avisos de sistema sem interação requerida geralmente são seguros.", nivel: "facil", isAI: true },
    { id: 9005, tipo: "rede social", titulo: "Ajuda Urgente", remetente: "Amigo Próximo", conteudo: "Preciso de um favor urgente. Consegue transferir R$50 pra essa chave pix?", link: null, classificacao: "golpe", explicacao: "Pedidos de dinheiro repentinos em redes sociais são frequentemente contas hackeadas.", nivel: "medio", isAI: true }
];

async function iniciarAplicacao() {
    try {
        console.log('🚀 Starting System...');
        await dataLoader.carregar();

        const localMessages = dataLoader.obterMensagens().slice(0, TOTAL_LOCAL_ROUNDS);
        simulador.inicializar(localMessages);

        appState.isLoaded = true;
        appState.isRunning = true;

        // Start background AI fetching without blocking the first scenario
        carregarIASequencialmente();
        carregarProximaMensagem();

    } catch (error) {
        console.error('❌ Erro durante a inicialização:', error);
        exibirErro('Falha ao carregar a aplicação.');
    }
}

async function carregarIASequencialmente() {
    console.log('⏳ Starting sequential AI queue...');
    let fallbackIndex = 0;

    for (let i = 0; i < TOTAL_AI_ROUNDS; i++) {
        try {
            console.log(`🤖 Requesting AI for theme: [${aiThemes[i]}]`);
            const response = await fetch('https://detector-golpe-unisul.onrender.com/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: aiThemes[i] })
            });

            if (!response.ok) {
                 throw new Error(`Server Error: ${response.status}`);
            }

            const data = await response.json();
            data.isAI = true;
            simulador.mensagensUtilizadas.push(data);
            console.log(`✅ AI Scenario [${aiThemes[i]}] loaded.`);
            atualizarPontuacaoVisor(false); // Update total rounds display

        } catch (error) {
            console.error(`❌ Failed AI fetch for [${aiThemes[i]}], using local fallback. Error:`, error);
            // Use local fallback to guarantee the array reaches MAX_ROUNDS without repeating
            simulador.mensagensUtilizadas.push(fallbackLocais[fallbackIndex % fallbackLocais.length]);
            fallbackIndex++;
            atualizarPontuacaoVisor(false);
        }

        // Wait before next request
        if (i < TOTAL_AI_ROUNDS - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

function exibirErro(message) {
    const simulatorDiv = document.querySelector('.simulator-engine') || document.querySelector('.simulator');
    if (simulatorDiv) {
        simulatorDiv.innerHTML = `<div class="error-message"><h2>⚠️ Erro</h2><p>${message}</p></div>`;
    }
}

function carregarProximaMensagem() {
    resetarInterfaceResposta();
    
    // Check if we hit the limit
    if (simulador.indiceAtual >= MAX_ROUNDS) {
        mostrarTelaDeFim();
        return;
    }

    const nextMessage = simulador.proximaMensagem();

    if (!nextMessage) {
        // Se a mensagem ainda não chegou (IA está lenta), mostra tela de carregamento
        mostrarCarregamentoIA();
        return;
    }

    exibirMensagem(nextMessage);
    atualizarPontuacaoVisor(false);
}

function mostrarCarregamentoIA() {
    document.getElementById('tipoMensagem').textContent = "sistema";
    document.getElementById('titulo').textContent = "Aguardando IA...";
    document.getElementById('remetente').textContent = "Motor Híbrido";
    document.getElementById('conteudo').innerHTML = "<i>Analisando rede para o próximo cenário de teste. Por favor, aguarde...</i>";
    
    const linkContainer = document.getElementById('linkContainer');
    if(linkContainer) linkContainer.style.display = 'none';
    
    desabilitarBotoeResposta();

    // Check periodically if the message arrived
    const checkInterval = setInterval(() => {
        if (simulador.indiceAtual < simulador.mensagensUtilizadas.length) {
            clearInterval(checkInterval);
            carregarProximaMensagem();
        }
    }, 1000);
}

function exibirMensagem(message) {
    if (document.getElementById('tipoMensagem')) document.getElementById('tipoMensagem').textContent = message.tipo;
    if (document.getElementById('titulo')) document.getElementById('titulo').textContent = message.titulo;
    if (document.getElementById('remetente')) document.getElementById('remetente').textContent = message.remetente;
    if (document.getElementById('conteudo')) document.getElementById('conteudo').innerHTML = message.conteudo;

    const linkContainer = document.getElementById('linkContainer');
    const linkElement = document.getElementById('link');

    if (message.link && message.link !== "null" && message.link !== "") {
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

    viewport.classList.remove('theme-whatsapp', 'theme-email', 'theme-sms', 'theme-social', 'theme-notification');
    
    if (rawType.includes('whatsapp') || rawType.includes('wpp')) {
        viewport.classList.add('theme-whatsapp');
        if(document.getElementById('contactStatus')) document.getElementById('contactStatus').textContent = 'online';
    } else if (rawType.includes('email') || rawType.includes('e-mail')) {
        viewport.classList.add('theme-email');
    } else if (rawType.includes('sms') || rawType.includes('torpedo') || rawType.includes('mensagem')) {
        viewport.classList.add('theme-sms');
    } else if (rawType.includes('rede social') || rawType.includes('instagram') || rawType.includes('facebook') || rawType.includes('social')) {
        viewport.classList.add('theme-social');
        if(document.getElementById('contactStatus')) document.getElementById('contactStatus').textContent = 'Public';
    } else {
        viewport.classList.add('theme-notification');
    }
}

function avaliarMensagem(response) {
    if (simulador.respostadada) return;

    desabilitarBotoeResposta();
    
    // Check if evaluator function exists and use it
    const result = simulador.avaliarResposta(response);

    exibirResultado(result);
    exibirExplicacao(result.explicacao || "");
    atualizarPontuacaoVisor(true); // Ensure accuracy is updated after guess
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
    } else if (explicacaoBox) {
        explicacaoBox.style.display = 'none';
    }
}

function resetarInterfaceResposta() {
    ['feedbackSection', 'explicacaoBox', 'finalSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const feedbackContent = document.getElementById('feedbackContent');
    if (feedbackContent) feedbackContent.className = 'feedback-banner';

    desabilitarBotoeResposta();
}

function desabilitarBotoeResposta() {
    const btnGolpe = document.getElementById('botaoGolpe');
    const btnLegitima = document.getElementById('botaoLegitima');
    if (btnGolpe) btnGolpe.disabled = true;
    if (btnLegitima) btnLegitima.disabled = true;
}

function habilitarBotoeResposta() {
    // Only enable if we actually have a message loaded
    if (simulador.indiceAtual <= simulador.mensagensUtilizadas.length) {
        const btnGolpe = document.getElementById('botaoGolpe');
        const btnLegitima = document.getElementById('botaoLegitima');
        if (btnGolpe) btnGolpe.disabled = false;
        if (btnLegitima) btnLegitima.disabled = false;
    }
}

// Dedicated function to update UI stats
function atualizarPontuacaoVisor(isPostAnswer = false) {
    const acertosEl = document.getElementById('acertos');
    const totalEl = document.getElementById('total');
    
    if (acertosEl) acertosEl.textContent = simulador.acertos;
    
    // Mostra o total de cenários já disponíveis no array, mas com teto máximo de 15
    const displayTotal = Math.min(simulador.mensagensUtilizadas.length, MAX_ROUNDS);
    if (totalEl) totalEl.textContent = displayTotal;
}

function proximaMensagem() {
    if (simulador.indiceAtual >= MAX_ROUNDS) {
        mostrarTelaDeFim();
        return;
    }
    carregarProximaMensagem();
}

function mostrarTelaDeFim() {
    const decisionPanel = document.querySelector('.decision-panel');
    const feedbackSection = document.getElementById('feedbackSection');
    
    if (decisionPanel) decisionPanel.style.display = 'none';
    if (feedbackSection) feedbackSection.style.display = 'none';

    const finalSection = document.getElementById('finalSection');
    
    // Calculates precision based on MAX_ROUNDS to ensure accuracy at the end
    const finalPercent = MAX_ROUNDS > 0 ? Math.round((simulador.acertos / MAX_ROUNDS) * 100) : 0;

    if (document.getElementById('finalAcertos')) document.getElementById('finalAcertos').textContent = simulador.acertos;
    if (document.getElementById('finalPercentual')) document.getElementById('finalPercentual').textContent = finalPercent + '%';

    if (finalSection) {
        finalSection.style.display = 'block';
        finalSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function reiniciarSimulador() {
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', iniciarAplicacao);

// Expose functions globally
window.avaliarMensagem = avaliarMensagem;
window.proximaMensagem = proximaMensagem;
window.reiniciarSimulador = reiniciarSimulador;
