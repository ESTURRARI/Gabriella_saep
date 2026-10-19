from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tutor
from ..schemas import TutorCreate, TutorOut, TutorUpdate
from ..security import (
    criptografar_cpf,
    descriptografar_cpf,
    mascarar_cpf,
    so_digitos,
    usuario_logado,
)

router = APIRouter(prefix="/tutores", tags=["Tutores"], dependencies=[Depends(usuario_logado)])


def _out(t: Tutor) -> TutorOut:
    return TutorOut(
        id=t.id,
        nome=t.nome,
        cpf=mascarar_cpf(descriptografar_cpf(t.cpf_criptografado)),
        telefone=t.telefone,
        email=t.email,
        endereco=t.endereco,
        qtd_pets=len(t.pets),
    )


def _cpf_ja_existe(db: Session, cpf: str, ignorar_id: int | None = None) -> bool:
    # O CPF e criptografado (resultado diferente a cada vez), entao a comparacao
    # e feita descriptografando em memoria. Para uma clinica, o volume e pequeno.
    for t in db.scalars(select(Tutor)):
        if t.id != ignorar_id and descriptografar_cpf(t.cpf_criptografado) == cpf:
            return True
    return False


@router.get("", response_model=list[TutorOut])
def listar(busca: str | None = Query(default=None), db: Session = Depends(get_db)):
    """Lista tutores. Com `busca`, filtra por nome, e-mail, telefone ou CPF."""
    tutores = list(db.scalars(select(Tutor).order_by(Tutor.nome)))
    termo = (busca or "").strip().lower()
    if termo:
        digitos = so_digitos(termo)

        def combina(t: Tutor) -> bool:
            if termo in t.nome.lower() or termo in t.email.lower():
                return True
            if digitos and (digitos in t.telefone or digitos in descriptografar_cpf(t.cpf_criptografado)):
                return True
            return False

        tutores = [t for t in tutores if combina(t)]
    return [_out(t) for t in tutores]


@router.get("/{tutor_id}", response_model=TutorOut)
def obter(tutor_id: int, db: Session = Depends(get_db)):
    t = db.get(Tutor, tutor_id)
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tutor não encontrado.")
    return _out(t)


@router.post("", response_model=TutorOut, status_code=status.HTTP_201_CREATED)
def criar(dados: TutorCreate, db: Session = Depends(get_db)):
    if _cpf_ja_existe(db, dados.cpf):
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe um tutor com este CPF.")
    t = Tutor(
        nome=dados.nome,
        cpf_criptografado=criptografar_cpf(dados.cpf),
        telefone=dados.telefone,
        email=dados.email,
        endereco=dados.endereco,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _out(t)


@router.put("/{tutor_id}", response_model=TutorOut)
def atualizar(tutor_id: int, dados: TutorUpdate, db: Session = Depends(get_db)):
    t = db.get(Tutor, tutor_id)
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tutor não encontrado.")
    if dados.cpf:
        if _cpf_ja_existe(db, dados.cpf, ignorar_id=t.id):
            raise HTTPException(status.HTTP_409_CONFLICT, "Já existe outro tutor com este CPF.")
        t.cpf_criptografado = criptografar_cpf(dados.cpf)
    t.nome = dados.nome
    t.telefone = dados.telefone
    t.email = dados.email
    t.endereco = dados.endereco
    db.commit()
    db.refresh(t)
    return _out(t)


@router.delete("/{tutor_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(tutor_id: int, db: Session = Depends(get_db)):
    t = db.get(Tutor, tutor_id)
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tutor não encontrado.")
    if t.pets:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Este tutor possui pets cadastrados. Remova ou transfira os pets antes de excluir.",
        )
    db.delete(t)
    db.commit()
