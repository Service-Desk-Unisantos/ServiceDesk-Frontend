import { getHistorico } from "./api.js";
import { formatarData } from "./auth.js";

// Aba de histórico do chamado: tabela com filtros por coluna e ordenação.

const COLUNAS = [
    { chave: "autor_username", rotulo: "Autor" },
    { chave: "acao_display",   rotulo: "Ação" },
    { chave: "atributo",       rotulo: "Atributo" },
    { chave: "valor_anterior", rotulo: "De" },
    { chave: "valor_novo",     rotulo: "Para" },
    { chave: "data",           rotulo: "Data" },
];

// Títulos e comentários vêm do usuário, então tudo é escapado antes de ir ao HTML.
function esc(texto) {
    const el = document.createElement("div");
    el.textContent = texto ?? "";
    return el.innerHTML;
}

function valoresUnicos(registros, chave) {
    return [...new Set(registros.map(r => r[chave]).filter(Boolean))].sort();
}

function dataLocal(iso) {
    return new Date(iso).toLocaleDateString("en-CA");
}

export async function iniciarHistorico(chamadoId, container) {
    let registros = [];
    let ordem = { chave: "data", direcao: -1 };
    const filtros = {};

    container.innerHTML = `<p class="text-muted text-center py-3">Carregando...</p>`;

    try {
        const dados = await getHistorico(chamadoId);
        registros = dados.results ?? dados;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-danger mb-0">${esc(err.message || "Erro ao carregar histórico.")}</div>`;
        return;
    }

    function campoFiltro(col) {
        if (col.chave === "acao_display" || col.chave === "atributo") {
            const opcoes = valoresUnicos(registros, col.chave)
                .map(v => `<option value="${esc(v)}" ${filtros[col.chave] === v ? "selected" : ""}>${esc(v)}</option>`)
                .join("");
            return `<select class="form-select form-select-sm historico-filtro" data-chave="${col.chave}">
                        <option value=""></option>${opcoes}</select>`;
        }
        if (col.chave === "data") {
            return `<input type="date" class="form-control form-control-sm historico-filtro"
                           data-chave="data" value="${esc(filtros.data ?? "")}">`;
        }
        return `<input type="text" class="form-control form-control-sm historico-filtro"
                       data-chave="${col.chave}" value="${esc(filtros[col.chave] ?? "")}">`;
    }

    function filtrar() {
        return registros.filter(r => Object.entries(filtros).every(([chave, valor]) => {
            if (!valor) return true;
            if (chave === "data") return dataLocal(r.data) === valor;
            if (chave === "acao_display" || chave === "atributo") return r[chave] === valor;
            return (r[chave] ?? "").toLowerCase().includes(valor.toLowerCase());
        }));
    }

    function ordenar(lista) {
        const { chave, direcao } = ordem;
        return [...lista].sort((a, b) => {
            const va = a[chave] ?? "", vb = b[chave] ?? "";
            return (va < vb ? -1 : va > vb ? 1 : 0) * direcao;
        });
    }

    function renderLinhas() {
        const lista = ordenar(filtrar());
        const corpo = container.querySelector("#historico-corpo");
        if (!lista.length) {
            corpo.innerHTML = `<tr><td colspan="${COLUNAS.length}" class="text-muted text-center small py-3">Nenhum registro encontrado.</td></tr>`;
            return;
        }
        corpo.innerHTML = lista.map(r => `
            <tr>
                <td>${esc(r.autor_username) || "-"}</td>
                <td>${esc(r.acao_display)}</td>
                <td>${esc(r.atributo)}</td>
                <td>${esc(r.valor_anterior) || "-"}</td>
                <td class="historico-valor">${esc(r.valor_novo) || "-"}</td>
                <td class="text-nowrap">${esc(formatarData(r.data))}</td>
            </tr>`).join("");
    }

    function renderTabela() {
        const seta = chave => ordem.chave !== chave ? "bi-arrow-down-up"
            : ordem.direcao === 1 ? "bi-arrow-up" : "bi-arrow-down";
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-borderless align-middle historico-tabela mb-0">
                    <thead>
                        <tr>${COLUNAS.map(c => `
                            <th><button type="button" class="btn btn-link p-0 text-muted fw-semibold small text-decoration-none historico-ordenar" data-chave="${c.chave}">
                                <i class="bi ${seta(c.chave)} me-1"></i>${c.rotulo}</button></th>`).join("")}
                        </tr>
                        <tr>${COLUNAS.map(c => `<th>${campoFiltro(c)}</th>`).join("")}</tr>
                    </thead>
                    <tbody id="historico-corpo"></tbody>
                </table>
            </div>`;

        container.querySelectorAll(".historico-ordenar").forEach(btn =>
            btn.addEventListener("click", () => {
                const chave = btn.dataset.chave;
                ordem = { chave, direcao: ordem.chave === chave ? -ordem.direcao : 1 };
                renderTabela();
            }));
        container.querySelectorAll(".historico-filtro").forEach(campo =>
            campo.addEventListener("input", () => {
                filtros[campo.dataset.chave] = campo.value;
                renderLinhas();
            }));
        renderLinhas();
    }

    renderTabela();
}
