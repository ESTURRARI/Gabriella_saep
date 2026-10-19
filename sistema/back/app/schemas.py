import datetime as dt
import re

from pydantic import BaseModel, Field, field_validator

from .security import cpf_valido, so_digitos

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_HORA_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _texto_obrigatorio(v: str, campo: str) -> str:
    v = (v or "").strip()
    if not v:
        raise ValueError(f"{campo} é obrigatório")
    return v


def _checar_email(v: str) -> str:
    v = (v or "").strip().lower()
    if not _EMAIL_RE.match(v):
        raise ValueError("E-mail inválido")
    return v


# ------------------------------------------------------------------ auth
class LoginIn(BaseModel):
    email: str
    senha: str

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        return _checar_email(v)

    @field_validator("senha")
    @classmethod
    def _senha(cls, v):
        if not v:
            raise ValueError("Senha é obrigatória")
        return v


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: str

    model_config = {"from_attributes": True}


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    usuario: UsuarioOut


# ----------------------------------------------------------------- tutor
class TutorBase(BaseModel):
    nome: str = Field(max_length=100)
    telefone: str
    email: str
    endereco: str | None = Field(default=None, max_length=200)

    @field_validator("nome")
    @classmethod
    def _nome(cls, v):
        return _texto_obrigatorio(v, "Nome")

    @field_validator("telefone")
    @classmethod
    def _telefone(cls, v):
        d = so_digitos(v)
        if len(d) not in (10, 11):
            raise ValueError("Telefone deve ter 10 ou 11 dígitos (com DDD)")
        return d

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        return _checar_email(v)

    @field_validator("endereco")
    @classmethod
    def _endereco(cls, v):
        return (v or "").strip() or None


class TutorCreate(TutorBase):
    cpf: str

    @field_validator("cpf")
    @classmethod
    def _cpf(cls, v):
        if not cpf_valido(v):
            raise ValueError("CPF inválido")
        return so_digitos(v)


class TutorUpdate(TutorBase):
    # No update o CPF e opcional: vazio = manter o CPF atual
    cpf: str | None = None

    @field_validator("cpf")
    @classmethod
    def _cpf(cls, v):
        if v is None or not v.strip():
            return None
        if not cpf_valido(v):
            raise ValueError("CPF inválido")
        return so_digitos(v)


class TutorOut(BaseModel):
    id: int
    nome: str
    cpf: str  # sempre mascarado
    telefone: str
    email: str
    endereco: str | None
    qtd_pets: int


class TutorResumo(BaseModel):
    id: int
    nome: str
    cpf: str  # mascarado
    telefone: str
    email: str
    endereco: str | None


# ------------------------------------------------------------------- pet
class PetBase(BaseModel):
    nome: str = Field(max_length=80)
    especie: str = Field(max_length=40)
    raca: str | None = Field(default=None, max_length=60)
    data_nascimento: dt.date | None = None
    tutor_id: int

    @field_validator("nome")
    @classmethod
    def _nome(cls, v):
        return _texto_obrigatorio(v, "Nome do pet")

    @field_validator("especie")
    @classmethod
    def _especie(cls, v):
        return _texto_obrigatorio(v, "Espécie")

    @field_validator("raca")
    @classmethod
    def _raca(cls, v):
        return (v or "").strip() or None

    @field_validator("data_nascimento")
    @classmethod
    def _nasc(cls, v):
        if v and v > dt.date.today():
            raise ValueError("Data de nascimento não pode ser no futuro")
        return v


class PetIn(PetBase):
    pass


class PetOut(BaseModel):
    id: int
    nome: str
    especie: str
    raca: str | None
    data_nascimento: dt.date | None
    tutor_id: int
    tutor_nome: str


class PetResumo(BaseModel):
    id: int
    nome: str
    especie: str
    raca: str | None
    data_nascimento: dt.date | None


# ----------------------------------------------------------- agendamento
class AgendamentoCreate(BaseModel):
    pet_id: int
    data: dt.date
    horario: str
    motivo: str = Field(max_length=200)

    @field_validator("horario")
    @classmethod
    def _horario(cls, v):
        v = (v or "").strip()[:5]
        if not _HORA_RE.match(v):
            raise ValueError("Horário inválido (use HH:MM)")
        return v

    @field_validator("motivo")
    @classmethod
    def _motivo(cls, v):
        return _texto_obrigatorio(v, "Motivo")


class AgendamentoUpdate(BaseModel):
    data: dt.date
    horario: str | None = None
    motivo: str | None = Field(default=None, max_length=200)

    @field_validator("horario")
    @classmethod
    def _horario(cls, v):
        if v is None or not v.strip():
            return None
        v = v.strip()[:5]
        if not _HORA_RE.match(v):
            raise ValueError("Horário inválido (use HH:MM)")
        return v

    @field_validator("motivo")
    @classmethod
    def _motivo(cls, v):
        return (v or "").strip() or None


class AgendamentoOut(BaseModel):
    id: int
    data: dt.date
    horario: str
    motivo: str
    pet: PetResumo
    tutor: TutorResumo
