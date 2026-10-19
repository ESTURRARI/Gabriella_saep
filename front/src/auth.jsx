import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore } from "./api.js";

const AuthContext = createContext(null);
const USER_KEY = "clinica_usuario";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return tokenStore.get() ? JSON.parse(localStorage.getItem(USER_KEY)) : null;
    } catch {
      return null;
    }
  });
  const [aviso, setAviso] = useState("");

  const logout = useCallback((mensagem = "") => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
    setAviso(typeof mensagem === "string" ? mensagem : "");
  }, []);

  const login = useCallback(async (email, senha) => {
    const data = await api("/auth/login", { method: "POST", body: { email, senha } });
    tokenStore.set(data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    setAviso("");
  }, []);

  // Quando o back responde 401 (token expirou), volta para o login
  useEffect(() => {
    const aoExpirar = () => logout("Sua sessão expirou. Faça login novamente.");
    window.addEventListener("auth:expired", aoExpirar);
    return () => window.removeEventListener("auth:expired", aoExpirar);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, aviso }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
