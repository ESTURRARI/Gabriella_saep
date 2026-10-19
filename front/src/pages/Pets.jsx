import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import { formatarData } from "../utils.js";

const VAZIO = { nome: "", especie: "", raca: "", data_nascimento: "", tutor_id: "" };

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [p, t] = await Promise.all([api("/pets"), api("/tutores")]);
      setPets(p);
      setTutores(t);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...VAZIO });
    setErroForm("");
  }

  function abrirEdicao(p) {
    setEditandoId(p.id);
    setForm({
      nome: p.nome,
      especie: p.especie,
      raca: p.raca || "",
      data_nascimento: p.data_nascimento || "",
      tutor_id: String(p.tutor_id),
    });
    setErroForm("");
  }

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    setErroForm("");
    // Regra de negocio: todo pet precisa estar associado a um tutor
    if (!form.tutor_id) {
      setErroForm("Selecione o tutor responsável pelo pet.");
      return;
    }
    const corpo = {
      ...form,
      tutor_id: Number(form.tutor_id),
      data_nascimento: form.data_nascimento || null,
    };
    setSalvando(true);
    try {
      if (editandoId) {
        await api(`/pets/${editandoId}`, { method: "PUT", body: corpo });
        setSucesso("Pet atualizado.");
      } else {
        await api("/pets", { method: "POST", body: corpo });
        setSucesso("Pet cadastrado.");
      }
      setForm(null);
      await carregar();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(p) {
    if (!window.confirm(`Excluir o pet ${p.nome}?`)) return;
    setSucesso("");
    try {
      await api(`/pets/${p.id}`, { method: "DELETE" });
      setSucesso("Pet excluído.");
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <>
      <div className="titulo-linha">
        <div>
          <h1>Pets</h1>
          <p className="sub">Todo pet precisa estar associado a um tutor.</p>
        </div>
        <button className="btn btn-primario" onClick={abrirNovo} disabled={tutores.length === 0}>Novo pet</button>
      </div>

      {sucesso && <div className="alerta alerta-ok" role="status">{sucesso}</div>}
      {erro && <div className="alerta alerta-erro" role="alert">{erro}</div>}
      {!carregando && tutores.length === 0 && (
        <div className="alerta alerta-info">Cadastre um tutor antes de cadastrar pets.</div>
      )}

      <div className="tabela-wrap">
        <table>
          <thead>
            <tr><th>Nome</th><th>Espécie</th><th>Raça</th><th>Nascimento</th><th>Tutor</th><th></th></tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan="6" className="vazio">Carregando...</td></tr>}
            {!carregando && pets.length === 0 && <tr><td colSpan="6" className="vazio">Nenhum pet cadastrado ainda.</td></tr>}
            {!carregando && pets.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nome}</strong></td>
                <td>{p.especie}</td>
                <td>{p.raca || "—"}</td>
                <td className="num">{formatarData(p.data_nascimento)}</td>
                <td>{p.tutor_nome}</td>
                <td className="acoes">
                  <button className="btn btn-ghost" onClick={() => abrirEdicao(p)}>Editar</button>
                  <button className="btn btn-perigo" onClick={() => excluir(p)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal titulo={editandoId ? "Editar pet" : "Novo pet"} onClose={() => setForm(null)}>
          <form onSubmit={salvar} noValidate>
            {erroForm && <div className="alerta alerta-erro" role="alert">{erroForm}</div>}
            <label>Nome<input value={form.nome} onChange={mudar("nome")} autoFocus /></label>
            <div className="duas-colunas">
              <label>Espécie<input value={form.especie} onChange={mudar("especie")} placeholder="Cachorro, Gato..." /></label>
              <label>Raça<input value={form.raca} onChange={mudar("raca")} /></label>
            </div>
            <label>Data de nascimento<input type="date" value={form.data_nascimento} onChange={mudar("data_nascimento")} /></label>
            <label>
              Tutor
              <select value={form.tutor_id} onChange={mudar("tutor_id")}>
                <option value="">Selecione o tutor</option>
                {tutores.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </label>
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
