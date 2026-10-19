from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..schemas import LoginIn, LoginOut, UsuarioOut
from ..security import criar_token, usuario_logado, verificar_senha

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=LoginOut)
def login(dados: LoginIn, db: Session = Depends(get_db)):
    usuario = db.scalar(select(Usuario).where(Usuario.email == dados.email))
    # Mesma mensagem para e-mail inexistente e senha errada (nao revela qual falhou)
    if usuario is None or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
        )
    token, expira = criar_token(usuario)
    return LoginOut(access_token=token, expires_in=expira, usuario=UsuarioOut.model_validate(usuario))


@router.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(usuario_logado)):
    return usuario
