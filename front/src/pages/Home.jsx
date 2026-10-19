import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { formatarData } from "../utils.js";

export default function Home() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(null);

  useEffect(() => {
    Promise.all([api("/tutores"), api("/pets"), api("/agendamentos")])
      .then(([tutores, pets, agendamentos]) => setDados({ tutores, pets, agendamentos }))
      .catch(() => setDados(null));
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);
  const proximo = dados?.agendamentos.find((a) => a.data >= hoje);

  return (
    <>
      <h1>Olá, {usuario.nome}</h1>
      <p className="sub">Você está logado como {usuario.email}. Escolha por onde começar:</p>

      <div className="atalhos">
        <Link to="/tutores" className="atalho">
          <strong>Tutores</strong>
          <span>{dados ? `${dados.tutores.length} cadastrados` : "Cadastrar e buscar tutores"}</span>
        </Link>
        <Link to="/pets" className="atalho">
          <strong>Pets</strong>
          <span>{dados ? `${dados.pets.length} cadastrados` : "Cadastrar e editar pets"}</span>
        </Link>
        <Link to="/agendamentos" className="atalho">
          <strong>Agendamentos</strong>
          <span>{dados ? `${dados.agendamentos.length} no total` : "Ver e remarcar atendimentos"}</span>
        </Link>
      </div>

      {proximo && (
        <section className="proximo">
          <h2>Próximo atendimento</h2>
          <p>
            <strong>{formatarData(proximo.data)} às {proximo.horario}</strong> — {proximo.pet.nome} ({proximo.pet.especie}),
            tutor(a) {proximo.tutor.nome}. Motivo: {proximo.motivo}.
          </p>
        </section>
      )}
    </>
  );
}
