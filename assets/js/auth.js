import { login as apiLogin, logout as apiLogout, cadastrar, API_BASE } from "./api.js";

async function verificarBackend() {
    try {
        await fetch(`${API_BASE}/chamados/`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("sd_access_token")}` },
            signal: AbortSignal.timeout(3000),
        });
    } catch {
        const banner = document.createElement("div");
        banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;padding:.75rem;background:#dc3545;color:#fff;text-align:center;font-weight:600;";
        banner.textContent = "⚠️ Servidor indisponível — nenhuma operação pode ser salva.";
        document.body.prepend(banner);
    }
}

// Mapas de exibição (substituem os filtros Django get_FOO_display)
export const STATUS_DISPLAY = {
    aberto: "Aberto",
    andamento: "Em andamento",
    concluido: "Concluído",
};

export const PRIORIDADE_DISPLAY = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
};

export const CATEGORIA_DISPLAY = {
    hardware: "Hardware",
    software: "Software",
    rede: "Rede",
    acesso: "Acesso",
    outros: "Outros",
};

// ── Sessão ────────────────────────────────────────────────────────────────────

export function getUsuario() {
    const raw = localStorage.getItem("sd_user");
    return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
    return !!localStorage.getItem("sd_access_token");
}

export function isStaff() {
    const user = getUsuario();
    return user ? (user.is_staff || user.is_superuser) : false;
}

// Redireciona para login se não autenticado. Chame no topo de cada página protegida.
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = "/pages/login/index.html";
        return;
    }
    verificarBackend();
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

export function preencherNavbar() {
    const user = getUsuario();
    if (!user) return;

    const elUsername = document.getElementById("navbar-username");
    const elAdmin    = document.getElementById("navbar-badge-admin");
    const elCliente  = document.getElementById("navbar-badge-cliente");
    const elLogout   = document.getElementById("btn-logout");

    if (elUsername) elUsername.textContent = user.username;
    if (user.is_staff || user.is_superuser) {
        elAdmin?.classList.remove("d-none");
    } else {
        elCliente?.classList.remove("d-none");
    }
    elLogout?.addEventListener("click", (e) => {
        e.preventDefault();
        apiLogout();
    });
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function handleLogin(username, password) {
    const data = await apiLogin(username, password);
    localStorage.setItem("sd_access_token", data.access);
    localStorage.setItem("sd_refresh_token", data.refresh);
    localStorage.setItem("sd_user", JSON.stringify(data.user));

    if (data.user.is_staff || data.user.is_superuser) {
        window.location.href = "/pages/dashboard/index.html";
    } else {
        window.location.href = "/pages/dashboard/index.html";
    }
}

// ── Cadastro ──────────────────────────────────────────────────────────────────

export async function handleCadastro(dados) {
    await cadastrar(dados);
    window.location.href = "/pages/login/index.html";
}

// ── Utilitários de data e texto ───────────────────────────────────────────────

export function formatarData(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export function linebreaksbr(texto) {
    if (!texto) return "";
    return texto.replace(/\n/g, "<br>");
}

// ── Feedback visual (substitui {% if messages %}) ─────────────────────────────

export function mostrarAlerta(container, mensagem, tipo = "info") {
    const div = document.createElement("div");
    div.className = `alert alert-${tipo} alert-dismissible fade show`;
    div.role = "alert";
    div.innerHTML = `${mensagem}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    container.prepend(div);
}
