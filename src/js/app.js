/* ====================================================
   APLICAÇÃO PRINCIPAL - app.js
   Controla a interface e integra todas as funcionalidades
   ==================================================== */

let appState = {
    isLoaded: false,
    isRunning: false
};

const TOTAL_LOCAL_ROUNDS = 10;
const TOTAL_AI_ROUNDS = 5; 
const MAX_ROUNDS = TOTAL_LOCAL_ROUNDS + TOTAL_AI_ROUNDS;

// Nova lógica de geração local de cenários: SIMULA A IA SEM DEPENDER DE SERVIDOR
const geradorLocalInteligente = () => {
    const tipos = ["whatsapp", "email", "sms", "rede social"];
    const remetentes = ["Suporte Bancário", "Logística Express", "Promoção VIP", "Familiar Distante", "Segurança Digital"];
    const conteudos = [
        "Identificamos um acesso suspeito. Valide sua identidade aqui: ",
        "Você ganhou um prêmio exclusivo! Resgate agora: ",
        "Seu pacote está parado na alfândega. Pague a taxa: ",
        "Oi, mudei de número, me chama aqui: ",
        "Sua conta será bloqueada em 24h. Acesse para evitar: "
    ];

    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    return {
        tipo: tipo,
        titulo: "Alerta de Segurança",
        remetente: remetentes[Math.floor(Math.random() * remetentes.length)],
        conteudo: conteudos[Math.floor(Math.random() * conteudos.length)] + " http://link-seguro.com/verificar",
        link: "http://link-seguro.com/verificar",
        classificacao: Math.random() > 0.5 ? "golpe" : "legitimo",
        explicacao: "Simulação de segurança gerada localmente para evitar erros de rede.",
        nivel: "medio",
        isAI: true
    };
};

async function iniciarAplicacao() {
    try {
        console.log('🚀 Iniciando sistema híbrido resiliente...');
        await dataLoader.carregar();

        const localMessages = dataLoader.obterMensagens().slice(0, TOTAL_LOCAL_ROUNDS);
        simulador.inicializar(localMessages);

        appState.isLoaded = true;
        appState.isRunning = true;

        // Pré-carrega os cenários extras sem depender do servidor
        for(let i=0; i<TOTAL_AI_ROUNDS; i++) {
            simulador.mensagensUtilizadas.push(geradorLocalInteligente());
        }

        carregarProximaMensagem();

    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
}

function carregarProximaMensagem() {
    resetarInterfaceResposta();
    const nextMessage = simulador.proximaMensagem();

    if (!nextMessage) {
        mostrarTelaDeFim();
        return;
    }

    exibirMensagem(nextMessage);
    atualizarPontuacao();
}

function exibirMensagem(message) {
    if (document.getElementById('tipoMensagem')) document.getElementById('tipoMensagem').textContent = message.tipo;
    if (document.getElementById('titulo')) document.getElementById('titulo').textContent = message.titulo;
    if (document.getElementById('remetente')) document.getElementById('remetente').textContent = message.remetente;
    if (document.getElementById('conteudo')) document.getElementById('conteudo').innerHTML = message.conteudo;

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
    if (simulador.respostadada) return;

    desabilitarBotoeResposta();
    const result = simulador.avaliarResposta(response);

    exibirResultado(result);
    exibirExplicacao(result.explicacao || "");
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
    const elementsToHide = ['feedbackSection', 'explicacaoBox', 'finalSection'];
    elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    desabilitarBotoeResposta();
}

function desabilitarBotoeResposta() {
    const btnGolpe = document.getElementById('botaoGolpe');
    const btnLegitima = document.getElementById('botaoLegitima');
    if (btnGolpe) btnGolpe.disabled = true;
    if (btnLegitima) btnLegitima.disabled = true;
}

function habilitarBotoeResposta() {
    const btnGolpe = document.getElementById('botaoGolpe');
    const btnLegitima = document.getElementById('botaoLegitima');
    if (btnGolpe) btnGolpe.disabled = false;
    if (btnLegitima) btnLegitima.disabled = false;
}

function atualizarPontuacao() {
    const acertosEl = document.getElementById('acertos');
    const totalEl = document.getElementById('total');
    
    if (acertosEl) acertosEl.textContent = simulador.acertos;
    if (totalEl) totalEl.textContent = simulador.mensagensUtilizadas.length;
}

function proximaMensagem() {
    if (simulador.indiceAtual >= simulador.mensagensUtilizadas.length) {
        mostrarTelaDeFim();
        return;
    }
    carregarProximaMensagem();
}

function mostrarTelaDeFim() {
    const decisionPanel = document.querySelector('.decision-panel');
    const finalSection = document.getElementById('finalSection');
    
    if (decisionPanel) decisionPanel.style.display = 'none';
    
    const finalPercent = simulador.mensagensUtilizadas.length > 0 ? Math.round((simulador.acertos / simulador.mensagensUtilizadas.length) * 100) : 0;

    if (document.getElementById('finalAcertos')) document.getElementById('finalAcertos').textContent = simulador.acertos;
    if (document.getElementById('finalPercentual')) document.getElementById('finalPercentual').textContent = finalPercent + '%';

    if (finalSection) {
        finalSection.style.display = 'block';
    }
}

function reiniciarSimulador() {
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', function() {
    iniciarAplicacao();
});

window.avaliarMensagem = avaliarMensagem;
window.proximaMensagem = proximaMensagem;
window.reiniciarSimulador = reiniciarSimulador;
