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

// Fallbacks locais distintos. Acionados apenas se o servidor Render cair completamente
// Garante que nunca haverá repetição de mensagens caso a IA falhe 5 vezes.
const clientSideFallbacks = [
    {
        tipo: "email", titulo: "Acesso Bloqueado", remetente: "Segurança Banco",
        conteudo: "Identificamos um acesso suspeito. Por favor, valide sua identidade clicando no link abaixo.",
        link: "http://banco-seguranca-verificar.com", classificacao: "golpe",
        explicacao: "Bancos não enviam links diretos para validação de segurança por e-mail.", nivel: "facil"
    },
    {
        tipo: "whatsapp", titulo: "Oferta Exclusiva", remetente: "Loja Parceira",
        conteudo: "Você foi selecionado para receber 70% de desconto em qualquer smartphone. Use o cupom VIP70 no link.",
        link: "http://promocao-celular-vip.net", classificacao: "golpe",
        explicacao: "Descontos absurdos via mensagens não solicitadas são armadilhas clássicas de phishing.", nivel: "medio"
    },
    {
        tipo: "sms", titulo: "Pacote Pendente", remetente: "Logística Nacional",
        conteudo: "Seu pacote não pôde ser entregue devido a uma taxa pendente de R$ 15,90. Pague para liberar o envio.",
        link: "http://pagamento-taxa-envio.com", classificacao: "golpe",
        explicacao: "Empresas de logística atualizam taxas apenas nos canais oficiais de rastreamento, não por SMS com links aleatórios.", nivel: "facil"
    },
    {
        tipo: "notificacao", titulo: "Alerta de Segurança", remetente: "Sistema",
        conteudo: "Foi detectada uma tentativa de login num dispositivo desconhecido. Revise as atividades recentes na sua conta.",
        link: null, classificacao: "legitimo",
        explicacao: "Avisos de sistema sem links que direcionem você a inserir dados externamente costumam ser legítimos.", nivel: "medio"
    },
    {
        tipo: "rede social", titulo: "Sorteio Vencido", remetente: "Influenciador Digital",
        conteudo: "Parabéns! Você ganhou o sorteio de um iPhone. Transfira o valor do frete (R$ 50) para a chave PIX enviada abaixo para o envio.",
        link: null, classificacao: "golpe",
        explicacao: "Sorteios verdadeiros nunca exigem pagamento de frete ou taxas antecipadas aos vencedores.", nivel: "facil"
    }
];
let fallbackIndex = 0;

async function iniciarAplicacao() {
    try {
        console.log('🚀 Iniciando sistema híbrido...');
        await dataLoader.carregar();

        // 1. Carrega exatamente 10 cenários locais
        const localMessages = dataLoader.obterMensagens().slice(0, TOTAL_LOCAL_ROUNDS);
        simulador.inicializar(localMessages);

        // 2. Busca os cenários da IA de forma ESTRITAMENTE SEQUENCIAL
        carregarIASequencialmente();

        appState.isLoaded = true;
        appState.isRunning = true;

        carregarProximaMensagem();

    } catch (error) {
        console.error('❌ Erro durante a inicialização:', error);
        exibirErro('Falha ao carregar a aplicação. Certifique-se de que os arquivos estão corretos.');
    }
}

// Função para garantir que a IA seja chamada uma por vez com intervalo seguro
async function carregarIASequencialmente() {
    console.log('⏳ Iniciando fila de 1 por 1...');
    
    for (let i = 0; i < TOTAL_AI_ROUNDS; i++) {
        // Aguarda a requisição atual terminar totalmente
        await buscarCenarioUmPorUm(aiThemes[i]);
        
        // Intervalo de segurança de 3 segundos entre chamadas
        if (i < TOTAL_AI_ROUNDS - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

async function buscarCenarioUmPorUm(tema) {
    try {
        const response = await fetch('https://detector-golpe-unisul.onrender.com/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ theme: tema })
        });
        
        if (!response.ok) throw new Error("Erro no servidor");
        
        const data = await response.json();
        data.isAI = true;
        simulador.mensagensUtilizadas.push(data);
        console.log(`✅ Cenário [${tema}] carregado com sucesso.`);
    } catch (e) {
        console.warn(`⚠️ Erro no tema [${tema}], usando fallback local.`);
        simulador.mensagensUtilizadas.push(gerarFallbackLocal());
    }
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
    if (document.getElementById('conteudo')) document.getElementById('conteudo').innerHTML = message.conteudo; // Usando innerHTML para permitir o spinner de loading

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

function gerarFallbackLocal(reason) {
    console.warn('⚠️ Acionando fallback local seguro: ', reason);
    
    // Puxa um fallback da lista e garante que não se repete ciclicamente
    const fallbackScenario = clientSideFallbacks[fallbackIndex % clientSideFallbacks.length];
    fallbackIndex++;
    
    simulador.mensagensUtilizadas.push({
        ...fallbackScenario,
        id: Math.floor(Math.random() * 9000) + 1000,
        isAI: true
    });
    atualizarPontuacao();
}

function proximaMensagem() {
    // LIMITE RESTRITO: Se chegamos ao limite, forçar a tela final.
    if (simulador.indiceAtual >= MAX_ROUNDS) {
        mostrarTelaDeFim();
        return;
    }

    const hasMore = simulador.indiceAtual < simulador.mensagensUtilizadas.length;

    // NOVO: Resolve o bug de clicar muito rápido!
    // Se não há mais mensagens na fila (a IA ainda está carregando), mostra um ecrã de espera
    if (!hasMore) {
        document.getElementById('tipoMensagem').textContent = 'sistema';
        document.getElementById('titulo').textContent = 'Conectando IA...';
        document.getElementById('remetente').textContent = 'Motor de Segurança';
        document.getElementById('conteudo').innerHTML = '<i>Sintetizando o próximo cenário. Por favor, aguarde alguns segundos...</i>';
        
        const linkContainer = document.getElementById('linkContainer');
        if (linkContainer) linkContainer.style.display = 'none';
        
        desabilitarBotoeResposta();
        
        let verificacoes = 0;
        const checkInterval = setInterval(() => {
            verificacoes++;
            
            // Se a IA carregou com sucesso a mensagem
            if (simulador.indiceAtual < simulador.mensagensUtilizadas.length) {
                clearInterval(checkInterval);
                carregarProximaMensagem();
            } 
            // Timeout: Se a IA demorar mais de 15 segundos, força um fallback local e avança
            else if (verificacoes > 15) {
                clearInterval(checkInterval);
                gerarFallbackLocal("Timeout na espera da IA.");
                carregarProximaMensagem();
            }
        }, 1000);

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

async function fetchAIInBackground(themeContext) {
    try {
        console.log(`🤖 Solicitando cenário de IA com tema: [${themeContext}]`);
        
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
                 throw new Error("Resposta inválida do servidor.");
            }
        } else {
            throw new Error(`Erro do servidor: ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ Falha ao buscar serviço de IA:', error);
        // O frontend agora gere os fallbacks de forma segura para não repetir
        gerarFallbackLocal(error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    iniciarAplicacao();
});

// Expõe funções globalmente para os manipuladores de eventos HTML (onclick)
window.avaliarMensagem = avaliarMensagem;
window.proximaMensagem = proximaMensagem;
window.reiniciarSimulador = reiniciarSimulador;
