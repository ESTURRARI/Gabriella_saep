import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import { formatarTelefone } from "../utils.js";

const VAZIO = { nome: "", cpf: "", telefone: "", email: "", endereco: "" };

export default function Tutores() {
  const [tutores, setTutores] = useState([]);
  const [termo, setTermo] = useState("");     // o que o usuario esta digitando
  const [filtro, setFiltro] = useState("");   // o termo ja confirmado (aplicado na listagem)
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [form, setForm] = useState(null);     // null = modal fechado
  const [editandoId, setEditandoId] = useState(null);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async (busca) => {
    setCarregando(true);
    setErro("");
    try {
      const q = busca ? `?busca=${encodeURIComponent(busca)}` : "";
      setTutores(await api(`/tutores${q}`));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(""); }, [carregar]);

  // Busca: o usuario insere o termo e confirma; a tabela e atualizada com os registros que correspondem
  function buscar(e) {
    e.preventDefault();
    setFiltro(termo.trim());
    setSucesso("");
    carregar(termo.trim());
  }

  function limpar() {
    setTermo("");
    setFiltro("");
    carregar("");
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...VAZIO });
    setErroForm("");
  }

  function abrirEdicao(t) {
    setEditandoId(t.id);
    setForm({ nome: t.nome, cpf: "", telefone: formatarTelefone(t.telefone), email: t.email, endereco: t.endereco || "" });
    setErroForm("");
  }

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    setErroForm("");
    if (!editandoId && !form.cpf.trim()) {
      setErroForm("Informe o CPF do tutor.");
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        await api(`/tutores/${editandoId}`, { method: "PUT", body: form });
        setSucesso("Dados do tutor atualizados.");
      } else {
        await api("/tutores", { method: "POST", body: form });
        setSucesso("Tutor cadastrado.");
      }
      setForm(null);
      await carregar(filtro);
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(t) {
    if (!window.confirm(`Excluir o tutor ${t.nome}?`)) return;
    setSucesso("");
    try {
      await api(`/tutores/${t.id}`, { method: "DELETE" });
      setSucesso("Tutor excluído.");
      await carregar(filtro);
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <>
      <div className="titulo-linha">
        <div>
          <h1>Tutores</h1>
          <p className="sub">Busque por nome, CPF, telefone ou e-mail.</p>
        </div>
        <button className="btn btn-primario" onClick={abrirNovo}>Novo tutor</button>
      </div>

      <form className="busca" onSubmit={buscar} role="search">
        <input
          type="search"
          placeholder="Digite o termo da busca"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          aria-label="Termo de busca"
        />
        <button className="btn btn-primario">Buscar</button>
        {filtro && <button type="button" className="btn btn-ghost" onClick={limpar}>Limpar busca</button>}
      </form>

      {sucesso && <div className="alerta alerta-ok" role="status">{sucesso}</div>}
      {erro && <div className="alerta alerta-erro" role="alert">{erro}</div>}

      <div className="tabela-wrap">
        <table>
          <thead>
            <tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th><th>Endereço</th><th>Pets</th><th></th></tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan="7" className="vazio">Carregando...</td></tr>}
            {!carregando && tutores.length === 0 && (
              <tr><td colSpan="7" className="vazio">
                {filtro ? `Nenhum tutor encontrado para “${filtro}”.` : "Nenhum tutor cadastrado ainda."}
              </td></tr>
            )}
            {!carregando && tutores.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.nome}</strong></td>
                <td className="num">{t.cpf}</td>
                <td className="num">{formatarTelefone(t.telefone)}</td>
                <td>{t.email}</td>
                <td>{t.endereco || "—"}</td>
                <td className="num">{t.qtd_pets}</td>
                <td className="acoes">
                  <button className="btn btn-ghost" onClick={() => abrirEdicao(t)}>Editar</button>
                  <button className="btn btn-perigo" onClick={() => excluir(t)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo={editandoId ? "Editar tutor" : "Novo tutor"} onClose={() => setForm(null)}>
          <form onSubmit={salvar} noValidate>
            {erroForm && <div className="alerta alerta-erro" role="alert">{erroForm}</div>}
            <label>Nome completo<input value={form.nome} onChange={mudar("nome")} autoFocus /></label>
            <label>
              CPF
              <input
                value={form.cpf}
                onChange={mudar("cpf")}
                inputMode="numeric"
                placeholder={editandoId ? "Deixe em branco para manter o atual" : "000.000.000-00"}
              />
              <small>Armazenado de forma criptografada.</small>
            </label>
            <div className="duas-colunas">
              <label>Telefone<input value={form.telefone} onChange={mudar("telefone")} placeholder="(19) 99999-9999" /></label>
              <label>E-mail<input type="email" value={form.email} onChange={mudar("email")} /></label>
            </div>
            <label>Endereço<input value={form.endereco} onChange={mudar("endereco")} /></label>
            <div className="modal-acoes">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn btn-primario" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
