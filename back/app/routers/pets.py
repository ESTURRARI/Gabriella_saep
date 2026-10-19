from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Pet, Tutor
from ..schemas import PetIn, PetOut
from ..security import usuario_logado

router = APIRouter(prefix="/pets", tags=["Pets"], dependencies=[Depends(usuario_logado)])


def _out(p: Pet) -> PetOut:
    return PetOut(
        id=p.id,
        nome=p.nome,
        especie=p.especie,
        raca=p.raca,
        data_nascimento=p.data_nascimento,
        tutor_id=p.tutor_id,
        tutor_nome=p.tutor.nome,
    )


def _exigir_tutor(db: Session, tutor_id: int) -> None:
    if db.get(Tutor, tutor_id) is None:
        raise HTTPException(422, "Todo pet deve ser associado a um tutor existente.")


@router.get("", response_model=list[PetOut])
def listar(db: Session = Depends(get_db)):
    return [_out(p) for p in db.scalars(select(Pet).order_by(Pet.nome))]


@router.post("", response_model=PetOut, status_code=status.HTTP_201_CREATED)
def criar(dados: PetIn, db: Session = Depends(get_db)):
    _exigir_tutor(db, dados.tutor_id)
    p = Pet(**dados.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _out(p)


@router.put("/{pet_id}", response_model=PetOut)
def atualizar(pet_id: int, dados: PetIn, db: Session = Depends(get_db)):
    p = db.get(Pet, pet_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet não encontrado.")
    _exigir_tutor(db, dados.tutor_id)
    for campo, valor in dados.model_dump().items():
        setattr(p, campo, valor)
    db.commit()
    db.refresh(p)
    return _out(p)


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(pet_id: int, db: Session = Depends(get_db)):
    p = db.get(Pet, pet_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet não encontrado.")
    if p.agendamentos:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Este pet possui agendamentos. Exclua os agendamentos antes de remover o pet.",
        )
    db.delete(p)
    db.commit()
