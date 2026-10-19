import { useEffect } from "react";

export default function Modal({ titulo, onClose, children }) {
  useEffect(() => {
    const aoTecla = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", aoTecla);
    return () => window.removeEventListener("keydown", aoTecla);
  }, [onClose]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
