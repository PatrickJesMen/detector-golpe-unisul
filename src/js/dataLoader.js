/* ====================================================
   CARREGADOR DE DADOS - dataLoader.js
   Responsável por carregar as mensagens do arquivo JSON
   ==================================================== */

/**
 * Classe para gerenciar o carregamento de dados
 * Implementa padrões de segurança e tratamento de erros
 */
class DataLoader {
    /**
     * Construtor da classe DataLoader
     * @param {string} caminhoJSON - Caminho para o arquivo JSON com as mensagens
     */
    constructor(caminhoJSON = 'data/mensagens.json') {
        this.caminhoJSON = caminhoJSON;
        this.mensagens = [];
        this.carregado = false;
        this.erro = null;
    }

    /**
     * Carrega as mensagens do arquivo JSON
     * @returns {Promise<array>} - Promise que resolve com o array de mensagens
     */
    async carregar() {
        try {
            // Valida se o caminho é válido
            if (!this.caminhoJSON) {
                throw new Error('Caminho do arquivo JSON não definido');
            }

            // Realiza a requisição do arquivo JSON
            const resposta = await fetch(this.caminhoJSON);

            // Verifica se a resposta é bem-sucedida
            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status} - ${resposta.statusText}`);
            }

            // Converte a resposta para JSON
            this.mensagens = await resposta.json();

            // Validação básica do formato
            if (!Array.isArray(this.mensagens) || this.mensagens.length === 0) {
                throw new Error('Arquivo JSON inválido ou vazio');
            }

            // Valida a estrutura de cada mensagem
            this.validarEstruturaMensagens();

            this.carregado = true;
            this.erro = null;

            console.log(`✓ ${this.mensagens.length} mensagens carregadas com sucesso`);
            return this.mensagens;

        } catch (erro) {
            this.carregado = false;
            this.erro = erro.message;
            console.error('Erro ao carregar mensagens:', this.erro);
            throw erro;
        }
    }

    /**
     * Valida a estrutura de cada mensagem
     * Garante que todos os campos obrigatórios estão presentes
     */
    validarEstruturaMensagens() {
        const camposObrigatorios = ['id', 'tipo', 'titulo', 'remetente', 'conteudo', 'classificacao', 'explicacao', 'nivel'];

        for (let i = 0; i < this.mensagens.length; i++) {
            const mensagem = this.mensagens[i];

            // Verifica se todos os campos obrigatórios existem
            for (const campo of camposObrigatorios) {
                if (!(campo in mensagem)) {
                    throw new Error(`Mensagem ${i + 1}: Campo obrigatório "${campo}" está faltando`);
                }
            }

            // Valida classificação
            if (!['golpe', 'legitimo'].includes(mensagem.classificacao)) {
                throw new Error(`Mensagem ${i + 1}: Classificação inválida "${mensagem.classificacao}"`);
            }

            // Valida níveis
            if (!['facil', 'medio', 'dificil'].includes(mensagem.nivel)) {
                throw new Error(`Mensagem ${i + 1}: Nível inválido "${mensagem.nivel}"`);
            }
        }
    }

    /**
     * Retorna todas as mensagens carregadas
     * @returns {array} - Array com todas as mensagens
     */
    obterMensagens() {
        if (!this.carregado) {
            throw new Error('As mensagens ainda não foram carregadas. Execute carregar() primeiro.');
        }
        return this.mensagens;
    }

    /**
     * Retorna uma mensagem aleatória do conjunto
     * @returns {object} - Uma mensagem aleatória
     */
    obterMensagemAleatoria() {
        if (!this.carregado || this.mensagens.length === 0) {
            throw new Error('Nenhuma mensagem disponível');
        }

        const indiceAleatorio = Math.floor(Math.random() * this.mensagens.length);
        return this.mensagens[indiceAleatorio];
    }

    /**
     * Retorna mensagens filtradas por nível de dificuldade
     * @param {string} nivel - 'facil', 'medio' ou 'dificil'
     * @returns {array} - Array de mensagens filtradas
     */
    obterPorNivel(nivel) {
        if (!this.carregado) {
            throw new Error('As mensagens ainda não foram carregadas');
        }

        return this.mensagens.filter(mensagem => mensagem.nivel === nivel);
    }

    /**
     * Retorna mensagens filtradas por tipo
     * @param {string} tipo - Tipo de mensagem (email, sms, whatsapp, notificacao)
     * @returns {array} - Array de mensagens filtradas
     */
    obterPorTipo(tipo) {
        if (!this.carregado) {
            throw new Error('As mensagens ainda não foram carregadas');
        }

        return this.mensagens.filter(mensagem => mensagem.tipo === tipo);
    }

    /**
     * Retorna a quantidade total de mensagens carregadas
     * @returns {number} - Total de mensagens
     */
    obterTotal() {
        return this.mensagens.length;
    }

    /**
     * Retorna estatísticas sobre as mensagens
     * @returns {object} - Objeto com estatísticas
     */
    obterEstatisticas() {
        if (!this.carregado) {
            throw new Error('As mensagens ainda não foram carregadas');
        }

        const stats = {
            total: this.mensagens.length,
            golpes: 0,
            legitimas: 0,
            porTipo: {},
            porNivel: {}
        };

        for (const mensagem of this.mensagens) {
            // Contabiliza classificação
            if (mensagem.classificacao === 'golpe') {
                stats.golpes++;
            } else {
                stats.legitimas++;
            }

            // Contabiliza por tipo
            stats.porTipo[mensagem.tipo] = (stats.porTipo[mensagem.tipo] || 0) + 1;

            // Contabiliza por nível
            stats.porNivel[mensagem.nivel] = (stats.porNivel[mensagem.nivel] || 0) + 1;
        }

        return stats;
    }

    /**
     * Limpa os dados carregados
     */
    limpar() {
        this.mensagens = [];
        this.carregado = false;
        this.erro = null;
    }
}

// Cria uma instância global do DataLoader para fácil acesso
const dataLoader = new DataLoader();
