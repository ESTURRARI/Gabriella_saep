import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import { formatarData, formatarTelefone } from "../utils.js";

export default function Agendamentos() {
  const [lista, setLista] = useState([]);
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modal, setModal] = useState(null); // { tipo: "novo" | "editar", ... }
  const [form, setForm] = useState({});
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [ag, p] = await Promise.all([api("/agendamentos"), api("/pets")]);
      setLista(ag);
      setPets(p);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovo() {
    setModal({ tipo: "novo" });
    setForm({ pet_id: "", data: "", horario: "", motivo: "" });
    setErroForm("");
  }

  function abrirEdicao(a) {
    setModal({ tipo: "editar", agendamento: a });
    setForm({ data: a.data, horario: a.horario, motivo: a.motivo });
    setErroForm("");
  }

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    setErroForm("");
    if (!form.data) return setErroForm("Informe a data do agendamento.");
    setSalvando(true);
    try {
      if (modal.tipo === "novo") {
        if (!form.pet_id) {
          setErroForm("Selecione o pet.");
          setSalvando(false);
          return;
        }
        await api("/agendamentos", { method: "POST", body: { ...form, pet_id: Number(form.pet_id) } });
        setSucesso("Agendamento cadastrado.");
      } else {
        // Atualiza a data do agendamento ja cadastrado (horario e motivo tambem podem ser ajustados)
        await api(`/agendamentos/${modal.agendamento.id}`, { method: "PUT", body: form });
        setSucesso("Agendamento atualizado.");
      }
      setModal(null);
      await carregar();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(a) {
    if (!window.confirm(`Excluir o agendamento de ${a.pet.nome} em ${formatarData(a.data)}?`)) return;
    setSucesso("");
    try {
      await api(`/agendamentos/${a.id}`, { method: "DELETE" });
      setSucesso("Agendamento excluído.");
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  // Agrupa visualmente por dia (a API ja devolve ordenado por data)
  let diaAnterior = null;

  return (
    <>
      <div className="titulo-linha">
        <div>
          <h1>Agendamentos</h1>
          <p className="sub">Ordenados por dia, com os dados do pet e do tutor.</p>
        </div>
        <button className="btn btn-primario" onClick={abrirNovo} disabled={pets.length === 0}>Novo agendamento</button>
      </div>

      {sucesso && <div className="alerta alerta-ok" role="status">{sucesso}</div>}
      {erro && <div className="alerta alerta-erro" role="alert">{erro}</div>}
      {!carregando && pets.length === 0 && <div className="alerta alerta-info">Cadastre um pet antes de criar agendamentos.</div>}

      <div className="tabela-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Hora</th><th>Motivo</th><th>Pet</th><th>Tutor</th><th>Contato</th><th></th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan="7" className="vazio">Carregando...</td></tr>}
            {!carregando && lista.length === 0 && <tr><td colSpan="7" className="vazio">Nenhum agendamento cadastrado ainda.</td></tr>}
            {!carregando && lista.map((a) => {
              const novoDia = a.data !== diaAnterior;
              diaAnterior = a.data;
              return (
                <tr key={a.id} className={novoDia ? "novo-dia" : ""}>
                  <td className="num"><strong>{novoDia ? formatarData(a.data) : ""}</strong></td>
                  <td className="num">{a.horario}</td>
                  <td>{a.motivo}</td>
                  <td>
                    <strong>{a.pet.nome}</strong>
                    <div className="detalhe">{a.pet.especie}{a.pet.raca ? ` • ${a.pet.raca}` : ""}</div>
                  </td>
                  <td>
                    <strong>{a.tutor.nome}</strong>
                    <div className="detalhe">CPF {a.tutor.cpf}</div>
                  </td>
                  <td>
                    <div>{formatarTelefone(a.tutor.telefone)}</div>
                    <div className="detalhe">{a.tutor.email}</div>
                  </td>
                  <td className="acoes">
                    <button className="btn btn-ghost" onClick={() => abrirEdicao(a)}>Alterar data</button>
                    <button className="btn btn-perigo" onClick={() => excluir(a)}>Excluir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          titulo={modal.tipo === "novo" ? "Novo agendamento" : `Alterar agendamento de ${modal.agendamento.pet.nome}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={salvar} noValidate>
            {erroForm && <div className="alerta alerta-erro" role="alert">{erroForm}</div>}
            {modal.tipo === "novo" && (
              <label>
                Pet
                <select value={form.pet_id} onChange={mudar("pet_id")} autoFocus>
                  <option value="">Selecione o pet</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} — tutor(a) {p.tutor_nome}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="duas-colunas">
              <label>Data<input type="date" value={form.data} onChange={mudar("data")} autoFocus={modal.tipo === "editar"} /></label>
              <label>Horário<input type="time" value={form.horario} onChange={mudar("horario")} /></label>
            </div>
            <label>Motivo<input value={form.motivo} onChange={mudar("motivo")} placeholder="Consulta, vacina, retorno..." /></label>
            <div className="modal-acoes">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primario" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
