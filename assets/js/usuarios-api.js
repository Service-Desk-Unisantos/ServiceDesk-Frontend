import { API_BASE, getHeaders, renovarToken } from "./api.js";

// Lista usuários ativos (somente staff). Renova o token uma vez se expirar.
export async function getUsuarios(tentouRenovar = false) {
    let res;
    try {
        res = await fetch(`${API_BASE}/usuarios/`, { headers: getHeaders() });
    } catch {
        throw new Error("Servidor indisponível.");
    }
    if (res.status === 401 && !tentouRenovar && await renovarToken()) return getUsuarios(true);
    if (!res.ok) throw Object.assign(new Error("Não foi possível carregar os usuários."), { status: res.status });
    return res.json();
}
