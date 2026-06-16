/* ====================================================
   MAIN APPLICATION - app.js
   Robust Sequential AI Loading and Correct UI Updates
   ==================================================== */

let appState = {
    isLoaded: false,
    isRunning: false
};

const TOTAL_LOCAL_ROUNDS = 10;
// Increased AI rounds to 10
const TOTAL_AI_ROUNDS = 10;
const MAX_ROUNDS = TOTAL_LOCAL_ROUNDS + TOTAL_AI_ROUNDS;

// Added 5 new themes to reach exactly 10 unique AI requests
const aiThemes = [
    "Golpe: Falso prêmio via SMS (Texto muito curto e direto)",
    "Legítimo: E-mail da faculdade sobre período de rematrícula (Texto longo e detalhado)",
    "Golpe: Falsa oferta de emprego no WhatsApp (Texto médio)",
    "Legítimo: SMS do banco confirmando um agendamento feito pelo usuário (Texto muito curto)",
    "Golpe: E-mail de falso suporte técnico com ameaça de bloqueio de conta (Texto longo)",
    "Golpe: WhatsApp de falso familiar pedindo PIX urgente (Texto curto)",
    "Legítimo: E-mail de confirmação de compra em e-commerce conhecido (Texto médio)",
    "Golpe: SMS falso dos Correios sobre taxa de liberação de alfândega (Texto curto)",
    "Legítimo: Notificação do LinkedIn sobre nova vaga na sua área (Texto curto)",
    "Golpe: E-mail do banco pedindo atualização de token de segurança (Texto longo)"
];

const fallbackLocais = [
    { id: 9001, tipo: "email", titulo: "Rematrícula Aberta", remetente: "Secretaria Acadêmica", conteudo: "Olá aluno, informamos que o período de rematrícula para o próximo semestre letivo já está aberto. Por favor, acesse o portal do aluno pelo aplicativo oficial da instituição para conferir as disciplinas e realizar a confirmação da sua grade. O prazo se encerra no dia 30. Em caso de dúvidas, procure a coordenação.", link: null, classificacao: "legitimo", explicacao: "Comunicações oficiais sem links externos diretos para login e que orientam o uso do app oficial são legítimas.", nivel: "facil", isAI: true },
    { id: 9002, tipo: "sms", titulo: "Pacote Retido", remetente: "Entregas BR", conteudo: "Seu pacote foi retido. Pague a taxa: http://libera-pacote-br.com", link: "http://libera-pacote-br.com", classificacao: "golpe", explicacao: "Correios e transportadoras não enviam links suspeitos por SMS para pagamento imediato.", nivel: "facil", isAI: true },
    { id: 9003, tipo: "whatsapp", titulo: "Reunião de Alinhamento", remetente: "Chefe (João)", conteudo: "Pessoal, lembrando que a nossa reunião de projeto mudou para as 14h na sala 3. Levem os relatórios.", link: null, classificacao: "legitimo", explicacao: "Mensagens cotidianas de trabalho, sem senso de urgência financeira ou links de login, são legítimas.", nivel: "facil", isAI: true },
    { id: 9004, tipo: "email", titulo: "Conta Suspensa", remetente: "Suporte", conteudo: "Prezado cliente, sua conta foi temporariamente suspensa devido a atividades suspeitas na última madrugada. Para evitar o cancelamento definitivo e a perda de seus dados, você deve realizar a validação de segurança imediatamente. Acesse o link, insira seu CPF, senha e o token para restabelecer o acesso.", link: "http://suporte-validacao-urgente.net", classificacao: "golpe", explicacao: "Senso de urgência extremo, ameaça de perda de dados e links externos pedindo senha/token são sinais clássicos de phishing.", nivel: "medio", isAI: true },
    { id: 9005, tipo: "whatsapp", titulo: "Ajuda Urgente", remetente: "Mãe", conteudo: "Oi, meu celular estragou e tô usando esse número provisório. Preciso pagar uma conta urgente, faz um pix de R$ 300 pra mim?", link: null, classificacao: "golpe", explicacao: "Urgência e pedido de dinheiro vindo de um 'novo número' é a marca registrada da clonagem de perfil.", nivel: "medio", isAI: true }
];

async function iniciarAplicacao() {
    try {
        console.log('🚀 Starting System...');
        await dataLoader.carregar();

        // 1. Obtém a lista completa do banco de mensagens
        const todasMensagens = dataLoader.obterMensagens();
        
        // 2. Embaralha TODAS as mensagens disponíveis antes de cortar
        const mensagensEmbaralhadas = simulador.embaralhar([...todasMensagens]);
        
        // 3. Pega 10 mensagens do array que agora está em ordem aleatória
        const localMessages = mensagensEmbaralhadas.slice(0, TOTAL_LOCAL_ROUNDS);
        
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
    // Clean up AI placeholders before displaying
    if (message.conteudo) {
        message.conteudo = message.conteudo.replace(/\[\s*(nome|name|seu nome|cliente|usuário|usuario)\s*\]/gi, "Cliente");
    }

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
    const percentualEl = document.getElementById('percentual'); // Now capturing the Precision element
    
    if (acertosEl) acertosEl.textContent = simulador.acertos;
    
    // Shows the total scenarios available in the array, up to MAX_ROUNDS
    const displayTotal = Math.min(simulador.mensagensUtilizadas.length, MAX_ROUNDS);
    if (totalEl) totalEl.textContent = displayTotal;

    // Calculates and updates Precision based on answered questions
    if (percentualEl) {
        if (simulador.total > 0) {
            const percent = Math.round((simulador.acertos / simulador.total) * 100);
            percentualEl.textContent = percent + '%';
        } else {
            percentualEl.textContent = '—'; // Default dash before the first answer
        }
    }
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

// Expose functions globally for index.html to access
window.avaliarMensagem = avaliarMensagem;
window.proximaMensagem = proximaMensagem;
window.reiniciarSimulador = reiniciarSimulador;
window.exibirMensagem = exibirMensagem;
window.MAX_ROUNDS = MAX_ROUNDS;
