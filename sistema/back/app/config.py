"""Configuracoes da aplicacao (lidas de variaveis de ambiente ou do arquivo .env)."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent          # .../back
ROOT_DIR = BASE_DIR.parent                                  # raiz do projeto


def _load_dotenv() -> None:
    env_file = BASE_DIR / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()

# Chave de desenvolvimento: e a mesma usada para criptografar os CPFs do banco/script.sql
_DEV_ENCRYPTION_KEY = "xNUBAyLrhptOWk5DVeV4XUcZ3ULyFOFnU9b1pSWHoDY="


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "troque-esta-chave-em-producao-0123456789abcdef")
    ALGORITHM: str = "HS256"
    TOKEN_EXPIRE_MINUTES: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", "30"))
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", _DEV_ENCRYPTION_KEY)
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if o.strip()
    ]
    DB_PATH: Path = Path(os.getenv("DB_PATH", ROOT_DIR / "banco" / "clinica.db"))
    SQL_SCRIPT: Path = ROOT_DIR / "banco" / "script.sql"


settings = Settings()
