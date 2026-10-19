from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Agendamento, Pet
from ..schemas import AgendamentoCreate, AgendamentoOut, AgendamentoUpdate, PetResumo, TutorResumo
from ..security import descriptografar_cpf, mascarar_cpf, usuario_logado

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"], dependencies=[Depends(usuario_logado)])


def _out(a: Agendamento) -> AgendamentoOut:
    t = a.pet.tutor
    return AgendamentoOut(
        id=a.id,
        data=a.data,
        horario=a.horario,
        motivo=a.motivo,
        pet=PetResumo.model_validate(a.pet, from_attributes=True),
        tutor=TutorResumo(
            id=t.id,
            nome=t.nome,
            cpf=mascarar_cpf(descriptografar_cpf(t.cpf_criptografado)),
            telefone=t.telefone,
            email=t.email,
            endereco=t.endereco,
        ),
    )


@router.get("", response_model=list[AgendamentoOut])
def listar(db: Session = Depends(get_db)):
    """Todos os agendamentos, ordenados por dia (e horario), com dados do pet e do tutor."""
    consulta = (
        select(Agendamento)
        .options(joinedload(Agendamento.pet).joinedload(Pet.tutor))
        .order_by(Agendamento.data, Agendamento.horario, Agendamento.id)
    )
    return [_out(a) for a in db.scalars(consulta).unique()]


@router.post("", response_model=AgendamentoOut, status_code=status.HTTP_201_CREATED)
def criar(dados: AgendamentoCreate, db: Session = Depends(get_db)):
    if db.get(Pet, dados.pet_id) is None:
        raise HTTPException(422, "Pet não encontrado.")
    a = Agendamento(**dados.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return _out(a)


@router.put("/{agendamento_id}", response_model=AgendamentoOut)
def atualizar(agendamento_id: int, dados: AgendamentoUpdate, db: Session = Depends(get_db)):
    """Atualiza a data do agendamento (e, se enviados, horario e motivo)."""
    a = db.get(Agendamento, agendamento_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Agendamento não encontrado.")
    a.data = dados.data
    if dados.horario:
        a.horario = dados.horario
    if dados.motivo:
        a.motivo = dados.motivo
    db.commit()
    db.refresh(a)
    return _out(a)


@router.delete("/{agendamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(agendamento_id: int, db: Session = Depends(get_db)):
    a = db.get(Agendamento, agendamento_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Agendamento não encontrado.")
    db.delete(a)
    db.commit()
