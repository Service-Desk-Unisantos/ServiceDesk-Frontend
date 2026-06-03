import { API_BASE, getHeaders } from "./api.js";

(() => {
    const endpointNotificacoes = `${API_BASE}/notificacoes/`;
    const caixaNotificacoes = document.getElementById("caixa-notificacoes");

    if (!caixaNotificacoes) {
        return;
    }

    function renderizarNotificacao(texto) {
        const notificacao = document.createElement("div");
        notificacao.className = "alert alert-info shadow-sm mb-2";
        notificacao.style.pointerEvents = "auto";
        notificacao.textContent = texto;
        caixaNotificacoes.prepend(notificacao);

        setTimeout(() => {
            notificacao.remove();
        }, 6000);
    }

    async function buscarNotificacoes() {
        try {
            const resposta = await fetch(endpointNotificacoes, {
                headers: getHeaders(),
            });
            if (!resposta.ok) {
                return;
            }

            const payload = await resposta.json();
            for (const notificacao of payload.notificacoes || []) {
                if (notificacao.mensagem) {
                    renderizarNotificacao(notificacao.mensagem);
                }
            }
        } catch (_) {
            // Falha silenciosa para nao interferir na navegacao da pagina.
        }
    }

    buscarNotificacoes();
    setInterval(buscarNotificacoes, 5000);
})();
