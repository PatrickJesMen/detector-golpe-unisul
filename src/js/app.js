/* ====================================================
   MAIN APPLICATION - app.js
   Controls the interface and integrates all functionalities
   ==================================================== */

let app = {
    isLoaded: false,
    isRunning: false
};

async function iniciarAplicacao() {
    try {
        console.log('🚀 Starting application...');
        await dataLoader.carregar();

        const messages = dataLoader.obterMensagens();
        simulador.inicializar(messages);

        app.isLoaded = true;
        app.isRunning = true;

        carregarProximaMensagem();
        fetchAIInBackground();

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        exibirErro('Falha ao carregar a aplicação. Certifique-se de que o arquivo "mensagens.json" está no diretório correto.');
    }
}

function exibirErro(message) {
    const simulatorDiv = document.querySelector('.simulator-engine') || document.querySelector('.simulator');
    if (simulatorDiv) {
        simulatorDiv.innerHTML = `
            <div class="error-message" style="
                background: #fee2e2;
                border: 2px solid #ef4444;
                color: #991b1b;
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
            ">
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
    document.getElementById('tipoMensagem').textContent = message.tipo;
    document.getElementById('titulo').textContent = message.titulo;
    document.getElementById('remetente').textContent = message.remetente;
    document.getElementById('conteudo').textContent = message.conteudo;

    const linkContainer = document.getElementById('linkContainer');
    const linkElement = document.getElementById('link');

    if (message.link) {
        linkElement.href = message.link;
        linkElement.textContent = message.link;
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

    // Atualiza os horários
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
    } else if (rawType.includes('notificacao') || rawType.includes('notificação') || rawType.includes('alerta')) {
        viewport.classList.add('theme-notification');
    } else {
        viewport.classList.add('theme-sms');
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
        console.error('Error evaluating response:', error);
    }
}

function exibirResultado(result) {
    const feedbackSection = document.getElementById('feedbackSection');
    const feedbackContent = document.getElementById('feedbackContent');

    const isCorrect = result.estaCorreto;
    const cssClass = isCorrect ? 'correto' : 'incorreto';
    
    // Tradução das respostas
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

    habilitarBotoeResposta();
}

function desabilitarBotoeResposta() {
    if (document.getElementById('botaoGolpe')) document.getElementById('botaoGolpe').disabled = true;
    if (document.getElementById('botaoLegitima')) document.getElementById('botaoLegitima').disabled = true;
}

function habilitarBotoeResposta() {
    if (document.getElementById('botaoGolpe')) document.getElementById('botaoGolpe').disabled = false;
    if (document.getElementById('botaoLegitima')) document.getElementById('botaoLegitima').disabled = false;
}

function atualizarPontuacao() {
    const acertosEl = document.getElementById('acertos');
    const totalEl = document.getElementById('total');
    const percentualEl = document.getElementById('percentual');

    const percent = simulador.total > 0 ? Math.round((simulador.acertos / simulador.total) * 100) : 0;

    if (acertosEl) acertosEl.textContent = simulador.acertos;
    if (totalEl) totalEl.textContent = simulador.mensagensUtilizadas.length;
    if (percentualEl) percentualEl.textContent = percent + '%';
}

function proximaMensagem() {
    const hasMore = simulador.indiceAtual < simulador.mensagensUtilizadas.length;

    if (!hasMore) {
        mostrarTelaDeFim();
    } else {
        carregarProximaMensagem();
        
        if (Math.random() > 0.5) {
            fetchAIInBackground();
        }
    }
}

function mostrarTelaDeFim() {
    const decisionPanel = document.querySelector('.decision-panel');
    const feedbackSection = document.getElementById('feedbackSection');
    
    if (decisionPanel) decisionPanel.style.display = 'none';
    if (feedbackSection) feedbackSection.style.display = 'none';

    const finalSection = document.getElementById('finalSection');
    const percent = simulador.total > 0 ? Math.round((simulador.acertos / simulador.total) * 100) : 0;

    if (document.getElementById('finalAcertos')) document.getElementById('finalAcertos').textContent = simulador.acertos;
    if (document.getElementById('finalPercentual')) document.getElementById('finalPercentual').textContent = percent + '%';

    if (finalSection) {
        finalSection.style.display = 'block';
        finalSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function reiniciarSimulador() {
    const messages = dataLoader.obterMensagens();
    simulador.inicializar(messages);

    const decisionPanel = document.querySelector('.decision-panel');
    if (decisionPanel) decisionPanel.style.display = 'block';
    
    document.getElementById('feedbackSection').style.display = 'none';
    document.getElementById('finalSection').style.display = 'none';

    carregarProximaMensagem();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== AI BACKGROUND ENGINE ==========
async function fetchAIInBackground() {
    try {
        console.log('🤖 Background Engine: Requesting new AI scenario...');
        
        const response = await fetch('http://localhost:3000/api/generate-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const newScenarioJSON = await response.json();
            
            newScenarioJSON.isAI = true;
            
            simulador.mensagensUtilizadas.push(newScenarioJSON);
            console.log(`✅ Background Engine: Embedded AI Scenario ID ${newScenarioJSON.id} into queue.`);
            
            atualizarPontuacao();
        }
    } catch (error) {
        console.warn('⚠️ Background Engine: AI service unavailable. The simulator will rely purely on local JSON scenarios.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    iniciarAplicacao();
});