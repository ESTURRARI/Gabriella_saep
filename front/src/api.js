// Camada unica de comunicacao com o back-end (FastAPI).
const BASE = "/api";
const TOKEN_KEY = "clinica_token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Transforma a resposta de erro do FastAPI em um texto amigavel
function mensagemDeErro(data, status) {
  if (!data || data.detail === undefined) return `Erro inesperado (código ${status}).`;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((e) => {
        const campo = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : "";
        const msg = String(e.msg || "").replace(/^Value error, /, "");
        return campo && campo !== "body" ? `${campo}: ${msg}` : msg;
      })
      .join(" • ");
  }
  return "Dados inválidos.";
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique se o back-end está rodando.", 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token expirado/invalido (fora da tela de login): avisa o app para deslogar
    if (res.status === 401 && path !== "/auth/login") {
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(mensagemDeErro(data, res.status), res.status);
  }
  return data;
}
