export const API_BASE = "http://localhost:8000/api/v1";

export function getHeaders() {
    const token = localStorage.getItem("sd_access_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
}

async function handleResponse(res) {
    if (res.status === 401) {
        // Token expirado — tenta renovar automaticamente
        const renovado = await renovarToken();
        if (!renovado) {
            localStorage.clear();
            window.location.href = "/pages/login/index.html";
            return null;
        }
        return null; // chamador deve repetir a requisição
    }
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw Object.assign(new Error(res.statusText), { status: res.status, data: erro });
    }
    return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
}

export async function renovarToken() {
    const refresh = localStorage.getItem("sd_refresh_token");
    if (!refresh) return false;
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("sd_access_token", data.access);
    return true;
}

export async function logout() {
    const refresh = localStorage.getItem("sd_refresh_token");
    await fetch(`${API_BASE}/auth/logout/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ refresh }),
    }).catch(() => {});
    localStorage.clear();
    window.location.href = "/pages/login/index.html";
}

export async function cadastrar(dados) {
    const res = await fetch(`${API_BASE}/auth/cadastro/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    return handleResponse(res);
}

// ── Chamados ─────────────────────────────────────────────────────────────────

export async function getChamados(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/chamados/${query ? "?" + query : ""}`, {
        headers: getHeaders(),
    });
    return handleResponse(res);
}

export async function getChamado(id) {
    const res = await fetch(`${API_BASE}/chamados/${id}/`, {
        headers: getHeaders(),
    });
    return handleResponse(res);
}

export async function criarChamado(dados) {
    const res = await fetch(`${API_BASE}/chamados/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(dados),
    });
    return handleResponse(res);
}

export async function atualizarChamado(id, dados) {
    const res = await fetch(`${API_BASE}/chamados/${id}/`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(dados),
    });
    return handleResponse(res);
}

// ── Comentários ───────────────────────────────────────────────────────────────

export async function getComentarios(chamadoId) {
    const res = await fetch(`${API_BASE}/chamados/${chamadoId}/comentarios/`, {
        headers: getHeaders(),
    });
    return handleResponse(res);
}

export async function adicionarComentario(chamadoId, texto) {
    const res = await fetch(`${API_BASE}/chamados/${chamadoId}/comentarios/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ texto }),
    });
    return handleResponse(res);
}

// ── Notificações ──────────────────────────────────────────────────────────────

export async function getNotificacoes() {
    const res = await fetch(`${API_BASE}/notificacoes/`, {
        headers: getHeaders(),
    });
    return handleResponse(res);
}
