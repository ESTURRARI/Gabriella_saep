import { useState } from "react";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login, aviso } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setEnviando(true);
    try {
      await login(email.trim(), senha);
    } catch (err) {
      // Falha de autenticacao: mostra a validacao e limpa a senha
      setErro(err.message);
      setSenha("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-pagina">
      <form className="login-card" onSubmit={enviar} noValidate>
        <div className="login-marca" aria-hidden="true">🐾</div>
        <h1>Clínica Veterinária</h1>
        <p className="sub">Entre para gerenciar tutores, pets e agendamentos.</p>

        {aviso && <div className="alerta alerta-info" role="status">{aviso}</div>}
        {erro && <div className="alerta alerta-erro" role="alert">{erro}</div>}

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
        </label>

        <button className="btn btn-primario btn-bloco" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
