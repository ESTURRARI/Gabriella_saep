"""Senhas (PBKDF2), token JWT com expiracao e criptografia do CPF (Fernet)."""
import base64
import datetime as dt
import hashlib
import hmac
import os
import re

import jwt
from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import Usuario

# ---------------------------------------------------------------- senhas
_ITERACOES = 200_000


def gerar_hash_senha(senha: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt, _ITERACOES)
    return f"pbkdf2_sha256${_ITERACOES}${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        _, iteracoes, salt_b64, dk_b64 = senha_hash.split("$")
        salt = base64.b64decode(salt_b64)
        esperado = base64.b64decode(dk_b64)
        dk = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt, int(iteracoes))
        return hmac.compare_digest(dk, esperado)
    except Exception:
        return False


# ---------------------------------------------------------------- CPF
_fernet = Fernet(settings.ENCRYPTION_KEY.encode())


def so_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


def criptografar_cpf(cpf: str) -> str:
    return _fernet.encrypt(so_digitos(cpf).encode()).decode()


def descriptografar_cpf(token: str) -> str:
    try:
        return _fernet.decrypt(token.encode()).decode()
    except InvalidToken:
        return ""


def mascarar_cpf(cpf: str) -> str:
    """12345678909 -> ***.456.789-** (nunca devolvemos o CPF completo pela API)."""
    d = so_digitos(cpf)
    if len(d) != 11:
        return "***.***.***-**"
    return f"***.{d[3:6]}.{d[6:9]}-**"


def cpf_valido(cpf: str) -> bool:
    d = so_digitos(cpf)
    if len(d) != 11 or d == d[0] * 11:
        return False
    for i in (9, 10):
        soma = sum(int(d[n]) * (i + 1 - n) for n in range(i))
        digito = (soma * 10 % 11) % 10
        if digito != int(d[i]):
            return False
    return True


# ---------------------------------------------------------------- JWT
def criar_token(usuario: Usuario) -> tuple[str, int]:
    expira_em = dt.timedelta(minutes=settings.TOKEN_EXPIRE_MINUTES)
    agora = dt.datetime.now(dt.timezone.utc)
    payload = {"sub": str(usuario.id), "iat": agora, "exp": agora + expira_em}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, int(expira_em.total_seconds())


_bearer = HTTPBearer(auto_error=False)


def usuario_logado(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    erro = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão expirada ou inválida. Faça login novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if cred is None:
        raise erro
    try:
        payload = jwt.decode(cred.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        usuario = db.get(Usuario, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise erro
    if usuario is None:
        raise erro
    return usuario
