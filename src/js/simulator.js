/* ====================================================
   SIMULADOR EDUCACIONAL - simulator.js
   Lógica principal do simulador de detecção de golpes
   ==================================================== */

/**
 * Classe que gerencia a lógica principal do simulador
 */
class SimuladorGolpes {
    /**
     * Construtor do simulador
     */
    constructor() {
        this.mensagemAtual = null;
        this.indiceAtual = 0;
        this.acertos = 0;
        this.total = 0;
        this.mensagensUtilizadas = [];
        this.respostadada = false;
        this.permitirResposta = true;
    }

    /**
     * Inicializa o simulador com as mensagens carregadas
     * @param {array} mensagens - Array de mensagens carregadas
     */
    inicializar(mensagens) {
        // Embaralha as mensagens para ordem aleatória
        this.mensagensUtilizadas = this.embaralhar([...mensagens]);
        this.indiceAtual = 0;
        this.acertos = 0;
        this.total = 0;
        this.respostadada = false;
        this.permitirResposta = true;

        console.log(`✓ Simulador inicializado com ${this.mensagensUtilizadas.length} mensagens`);
    }

    /**
     * Algoritmo Fisher-Yates para embaralhamento aleatório
     * @param {array} array - Array a ser embaralhado
     * @returns {array} - Array embaralhado
     */
    embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Carrega a próxima mensagem do simulador
     * @returns {object} - A próxima mensagem ou null se fim das mensagens
     */
    proximaMensagem() {
        // Verifica se há mensagens disponíveis
        if (this.indiceAtual >= this.mensagensUtilizadas.length) {
            return null;
        }

        // Obtém a mensagem atual
        this.mensagemAtual = this.mensagensUtilizadas[this.indiceAtual];
        this.indiceAtual++;
        this.respostadada = false;
        this.permitirResposta = true;

        return this.mensagemAtual;
    }

    /**
     * Processa a resposta do usuário
     * @param {string} resposta - 'golpe' ou 'legitimo'
     * @returns {object} - Objeto com resultado da avaliação
     */
    avaliarResposta(resposta) {
        // Validações
        if (!this.mensagemAtual) {
            throw new Error('Nenhuma mensagem carregada');
        }

        if (!this.permitirResposta) {
            throw new Error('Você já respondeu esta pergunta');
        }

        if (!['golpe', 'legitimo'].includes(resposta)) {
            throw new Error('Resposta inválida. Use "golpe" ou "legitimo"');
        }

        // Incrementa o total de questões
        this.total++;

        // Verifica se a resposta está correta
        const estaCorreto = resposta === this.mensagemAtual.classificacao;

        // Incrementa acertos se corretamente respondido
        if (estaCorreto) {
            this.acertos++;
        }

        // Marca como respondida
        this.respostadada = true;
        this.permitirResposta = false;

        // Retorna o resultado detalhado
        return {
            estaCorreto: estaCorreto,
            respostaUsuario: resposta,
            respostaCorreta: this.mensagemAtual.classificacao,
            explicacao: this.mensagemAtual.explicacao,
            mensagem: this.mensagemAtual,
            acertos: this.acertos,
            total: this.total,
            percentual: this.calcularPercentual()
        };
    }

    /**
     * Calcula o percentual de acertos
     * @returns {number} - Percentual de acertos (0-100)
     */
    calcularPercentual() {
        if (this.total === 0) return 0;
        return Math.round((this.acertos / this.total) * 100);
    }

    /**
     * Retorna se existem mais mensagens para jogar
     * @returns {boolean} - true se há mais mensagens
     */
    temMaisQuestoes() {
        return this.indiceAtual < this.mensagensUtilizadas.length;
    }

    /**
     * Retorna a pontuação atual
     * @returns {object} - Objeto com estatísticas
     */
    obterPontuacao() {
        return {
            acertos: this.acertos,
            total: this.total,
            percentual: this.calcularPercentual(),
            mensagensPendentes: this.mensagensUtilizadas.length - this.indiceAtual
        };
    }

    /**
     * Reinicia o simulador
     */
    reiniciar() {
        this.mensagemAtual = null;
        this.indiceAtual = 0;
        this.acertos = 0;
        this.total = 0;
        this.respostadada = false;
        this.permitirResposta = true;
    }

    /**
     * Retorna informações detalhadas da mensagem atual
     * @returns {object} - Objeto com informações formatadas
     */
    obterMensagemFormatada() {
        if (!this.mensagemAtual) {
            return null;
        }

        return {
            id: this.mensagemAtual.id,
            tipo: this.formatarTipo(this.mensagemAtual.tipo),
            titulo: this.mensagemAtual.titulo,
            remetente: this.mensagemAtual.remetente,
            conteudo: this.mensagemAtual.conteudo,
            link: this.mensagemAtual.link || null,
            nivel: this.mensagemAtual.nivel,
            numero: this.indiceAtual,
            total: this.mensagensUtilizadas.length
        };
    }

    /**
     * Formata o tipo de mensagem para exibição
     * @param {string} tipo - Tipo da mensagem
     * @returns {string} - Tipo formatado
     */
    formatarTipo(tipo) {
        const tipos = {
            'email': '📧 Email',
            'sms': '📱 SMS',
            'whatsapp': '💬 WhatsApp',
            'notificacao': '🔔 Notificação'
        };
        return tipos[tipo] || tipo;
    }

    /**
     * Formata o resultado da resposta para exibição
     * @param {object} resultado - Resultado da avaliação
     * @returns {string} - Mensagem formatada
     */
    formatarResultado(resultado) {
        if (resultado.estaCorreto) {
            return `✅ Correto! É realmente ${resultado.respostaCorreta === 'golpe' ? 'um golpe' : 'legítimo'}`;
        } else {
            return `❌ Incorreto! Na verdade, é ${resultado.respostaCorreta === 'golpe' ? 'um golpe' : 'legítimo'}`;
        }
    }

    /**
     * Retorna dica sobre como identificar a mensagem
     * @returns {string} - Dica educativa
     */
    obterDica() {
        if (!this.mensagemAtual) return null;

        const tipo = this.mensagemAtual.tipo;
        const conteudo = this.mensagemAtual.conteudo.toLowerCase();

        // Sinais comuns de golpe
        const sinalGolpe = [
            { termo: 'urgente', dica: '⚠️ Linguagem urgente pode ser sinal de golpe' },
            { termo: 'confirme', dica: '⚠️ Solicitação para confirmar dados é suspeita' },
            { termo: 'bloqueio', dica: '⚠️ Ameaça de bloqueio pode ser phishing' },
            { termo: 'prêmio', dica: '⚠️ Prêmios não solicitados são suspeitos' },
            { termo: 'pix', dica: '⚠️ Pedidos de PIX podem ser golpes' },
            { termo: 'atualizar', dica: '⚠️ Solicitação para atualizar dados é comum em fraudes' }
        ];

        for (const { termo, dica } of sinalGolpe) {
            if (conteudo.includes(termo)) {
                return dica;
            }
        }

        return '💡 Procure por sinais de urgência ou links suspeitos';
    }
}

// Cria uma instância global do simulador
const simulador = new SimuladorGolpes();
