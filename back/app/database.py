"""Conexao com o banco (SQLite) e criacao/populacao inicial a partir do banco/script.sql."""
import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    f"sqlite:///{settings.DB_PATH}",
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _ativar_chaves_estrangeiras(dbapi_conn, _record):
    # SQLite so respeita FOREIGN KEY se isto estiver ligado em cada conexao
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def executar_script(recriar: bool = False) -> None:
    """Executa o banco/script.sql (cria as tabelas e insere o seed)."""
    if recriar and settings.DB_PATH.exists():
        engine.dispose()
        settings.DB_PATH.unlink()
    settings.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    script = settings.SQL_SCRIPT.read_text(encoding="utf-8")
    conn = sqlite3.connect(settings.DB_PATH)
    try:
        conn.executescript(script)
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    """Se o banco ainda nao existe, cria e popula com o seed."""
    if not settings.DB_PATH.exists():
        executar_script()
