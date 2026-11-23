import { requireAuth, preencherNavbar, isStaff, STATUS_DISPLAY, PRIORIDADE_DISPLAY, formatarData } from "./auth.js";
import { getDashboardMetrics } from "./dashboard-api.js";
import "./notificacoes.js";

requireAuth();
preencherNavbar();
const acessoPermitido = isStaff();
if (!acessoPermitido) window.location.href = "/pages/dashboard/index.html";

// Mesmas cores semânticas das badges do restante do sistema.
const COR_STATUS = { aberto: "#ffc107", andamento: "#0dcaf0", concluido: "#198754" };
const BADGE_STATUS = { aberto: "bg-warning text-dark", andamento: "bg-info text-dark", concluido: "bg-success" };
const BADGE_PRIO = { alta: "bg-danger", media: "bg-warning text-dark", baixa: "bg-secondary" };

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let periodo = "tudo";
let recentes = [];
const graficos = {};

function setCarregando(on) {
    ["kpi-ativos", "kpi-criticos", "kpi-tma", "kpi-resolvidos"].forEach((id) => $(id).classList.toggle("skeleton", on));
    if (on) {
        $("tabela-body").innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
            <span class="spinner-border spinner-border-sm me-2"></span>Carregando...</td></tr>`;
    }
}

function formatarHoras(h) {
    if (h === null || h === undefined) return "—";
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 48) return `${h.toFixed(1).replace(".", ",")} h`;
    return `${(h / 24).toFixed(1).replace(".", ",")} d`;
}

function variacao(el, v, semBase = false) {
    if (v === null || v === undefined) { el.innerHTML = `<span class="text-muted">sem base de comparação</span>`; return; }
    if (semBase) { el.innerHTML = `<span class="text-success"><i class="bi bi-stars"></i> novo</span> <span class="text-muted">sem registros no período anterior</span>`; return; }
    const cls = v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-muted";
    const icone = v > 0 ? "bi-arrow-up-right" : v < 0 ? "bi-arrow-down-right" : "bi-dash";
    el.innerHTML = `<span class="${cls}"><i class="bi ${icone}"></i> ${Math.abs(v)}%</span> <span class="text-muted">vs período anterior</span>`;
}

function desenhar(id, config, vazio) {
    graficos[id]?.destroy();
    const canvas = $(id);
    canvas.parentElement.querySelector(".chart-vazio")?.remove();
    if (vazio) {
        canvas.parentElement.insertAdjacentHTML("beforeend", `<div class="chart-vazio">Sem dados no período</div>`);
        canvas.classList.add("d-none");
        return;
    }
    canvas.classList.remove("d-none");
    graficos[id] = new Chart(canvas, config);
}

function renderKpis(k) {
    $("kpi-ativos").textContent = k.ativos;
    $("kpi-ativos-var").innerHTML = `<span class="text-muted">${k.abertos_periodo} aberto${k.abertos_periodo === 1 ? "" : "s"} no período</span>`;
    $("kpi-criticos").textContent = k.criticos;
    $("kpi-tma").textContent = formatarHoras(k.tma_horas);
    const el = $("kpi-tma-var");
    if (k.tma_horas === null) el.innerHTML = `<span class="text-muted">sem resolvidos no período</span>`;
    else if (k.tma_horas_anterior === null) el.innerHTML = `<span class="text-muted">sem base de comparação</span>`;
    else {
        // Para o TMA, menor é melhor: queda aparece em verde.
        const dif = k.tma_horas - k.tma_horas_anterior;
        const cls = dif < 0 ? "text-success" : dif > 0 ? "text-danger" : "text-muted";
        const icone = dif < 0 ? "bi-arrow-down-right" : dif > 0 ? "bi-arrow-up-right" : "bi-dash";
        el.innerHTML = `<span class="${cls}"><i class="bi ${icone}"></i> ${formatarHoras(Math.abs(dif))}</span> <span class="text-muted">vs período anterior</span>`;
    }
    $("kpi-resolvidos").textContent = k.resolvidos;
    variacao($("kpi-resolvidos-var"), k.resolvidos_variacao, k.resolvidos > 0 && k.resolvidos_anterior === 0);
}

function renderGraficos(d) {
    const chaves = Object.keys(d.por_status);
    desenhar("grafico-status", {
        type: "doughnut",
        data: {
            labels: chaves.map((s) => STATUS_DISPLAY[s] ?? s),
            datasets: [{ data: chaves.map((s) => d.por_status[s]), backgroundColor: chaves.map((s) => COR_STATUS[s] ?? "#6c757d") }],
        },
        options: { maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
    }, chaves.every((s) => d.por_status[s] === 0));

    // Períodos longos chegam agrupados por mês (AAAA-MM-01); os demais por dia.
    const dias = d.evolucao.map((e) => {
        const [a, m, di] = e.data.split("-");
        return d.granularidade === "mes" ? `${m}/${a}` : `${di}/${m}`;
    });
    desenhar("grafico-evolucao", {
        type: "line",
        data: {
            labels: dias,
            datasets: [
                { label: "Abertos", data: d.evolucao.map((e) => e.abertos), borderColor: "#0d6efd", backgroundColor: "rgba(13,110,253,.15)", fill: true, tension: .3 },
                { label: "Resolvidos", data: d.evolucao.map((e) => e.resolvidos), borderColor: "#198754", backgroundColor: "rgba(25,135,84,.15)", fill: true, tension: .3 },
            ],
        },
        options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { position: "bottom" } } },
    }, d.total_periodo === 0);

    const barras = (id, lista, cor) => desenhar(id, {
        type: "bar",
        data: { labels: lista.map((i) => i.nome), datasets: [{ label: "Chamados", data: lista.map((i) => i.total), backgroundColor: cor, borderRadius: 6 }] },
        options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    }, lista.length === 0);
    barras("grafico-categoria", d.por_categoria, "#0d6efd");
    barras("grafico-solicitante", d.por_solicitante, "#6f42c1");
}

function renderTabela() {
    const termo = $("busca").value.trim().toLowerCase();
    const st = $("filtro-status").value;
    const pr = $("filtro-prioridade").value;
    const lista = recentes.filter((c) =>
        (!st || c.status === st) && (!pr || c.prioridade === pr) &&
        (!termo || `${c.id} ${c.titulo} ${c.solicitante} ${c.categoria}`.toLowerCase().includes(termo)));

    const filtrando = termo || st || pr;
    if (!lista.length) {
        $("tabela-body").innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
            ${filtrando ? "Nenhum chamado corresponde aos filtros." : "Nenhum chamado encontrado neste período."}</td></tr>`;
    } else {
        $("tabela-body").innerHTML = lista.map((c) => `
            <tr class="chamado-row" data-id="${c.id}">
                <td class="text-muted">#${c.id}</td>
                <td class="fw-semibold">${esc(c.titulo)}</td>
                <td>${esc(c.solicitante)}</td>
                <td>${esc(c.categoria)}</td>
                <td><span class="badge ${BADGE_PRIO[c.prioridade] ?? "bg-secondary"}">${esc(PRIORIDADE_DISPLAY[c.prioridade] ?? c.prioridade)}</span></td>
                <td><span class="badge ${BADGE_STATUS[c.status] ?? "bg-secondary"}">${esc(STATUS_DISPLAY[c.status] ?? c.status)}</span></td>
                <td class="text-muted small">${formatarData(c.data_criacao)}</td>
            </tr>`).join("");
    }
    $("tabela-rodape").textContent = `Exibindo ${lista.length} de ${recentes.length} chamados` +
        (recentes.length < totalPeriodo ? ` (os ${recentes.length} mais recentes de ${totalPeriodo} no período)` : "");
}

let totalPeriodo = 0;

async function carregar() {
    setCarregando(true);
    $("dash-erro").classList.add("d-none");
    try {
        const d = await getDashboardMetrics(periodo);
        if (!d) return;
        recentes = d.recentes;
        totalPeriodo = d.total_periodo;
        renderKpis(d.kpis);
        renderGraficos(d);
        renderTabela();
    } catch (e) {
        $("dash-erro").textContent = e.message || "Erro ao carregar o dashboard.";
        $("dash-erro").classList.remove("d-none");
        $("tabela-body").innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Não foi possível carregar os dados.</td></tr>`;
        ["kpi-ativos", "kpi-criticos", "kpi-tma", "kpi-resolvidos"].forEach((id) => { $(id).textContent = "—"; });
    } finally {
        setCarregando(false);
    }
}

$("filtro-periodo").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-periodo]");
    if (!btn || btn.dataset.periodo === periodo) return;
    periodo = btn.dataset.periodo;
    document.querySelectorAll("#filtro-periodo .btn").forEach((b) => b.classList.toggle("active", b === btn));
    carregar();
});
["busca", "filtro-status", "filtro-prioridade"].forEach((id) => $(id).addEventListener("input", renderTabela));
$("tabela-body").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (tr) window.location.href = `/pages/chamado/detalhe-admin/index.html?id=${tr.dataset.id}`;
});

if (acessoPermitido) carregar();
