import { API_BASE, getHeaders, renovarToken } from "./api.js";

// Busca as métricas do dashboard. Renova o token uma vez se expirar (401).
export async function getDashboardMetrics(periodo = "7d", tentouRenovar = false) {
    let res;
    try {
        res = await fetch(`${API_BASE}/dashboard/metrics/?periodo=${encodeURIComponent(periodo)}`, {
            headers: getHeaders(),
        });
    } catch {
        throw Object.assign(new Error("Servidor indisponível. Verifique se o backend está rodando."), { isNetworkError: true });
    }
    if (res.status === 401 && !tentouRenovar && await renovarToken()) {
        return getDashboardMetrics(periodo, true);
    }
    if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/pages/login/index.html";
        return null;
    }
    if (res.status === 403) {
        throw Object.assign(new Error("Acesso restrito a administradores."), { status: 403 });
    }
    if (!res.ok) {
        throw Object.assign(new Error("Não foi possível carregar o dashboard."), { status: res.status });
    }
    return res.json();
}
