import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Layout() {
  const { usuario, logout } = useAuth();
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span aria-hidden="true">🐾</span> Clínica Veterinária
        </NavLink>
        <nav className="menu" aria-label="Principal">
          <NavLink to="/" end>Início</NavLink>
          <NavLink to="/tutores">Tutores</NavLink>
          <NavLink to="/pets">Pets</NavLink>
          <NavLink to="/agendamentos">Agendamentos</NavLink>
        </nav>
        <div className="usuario">
          <span title={usuario?.email}>{usuario?.nome}</span>
          <button className="btn btn-ghost" onClick={() => logout()}>Sair</button>
        </div>
      </header>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
