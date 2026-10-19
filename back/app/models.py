import datetime as dt

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)


class Tutor(Base):
    __tablename__ = "tutores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    cpf_criptografado: Mapped[str] = mapped_column(String(255), nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(120), nullable=False)
    endereco: Mapped[str | None] = mapped_column(String(200))

    pets: Mapped[list["Pet"]] = relationship(back_populates="tutor")


class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(80), nullable=False)
    especie: Mapped[str] = mapped_column(String(40), nullable=False)
    raca: Mapped[str | None] = mapped_column(String(60))
    data_nascimento: Mapped[dt.date | None] = mapped_column(Date)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("tutores.id"), nullable=False)

    tutor: Mapped[Tutor] = relationship(back_populates="pets")
    agendamentos: Mapped[list["Agendamento"]] = relationship(back_populates="pet")


class Agendamento(Base):
    __tablename__ = "agendamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data: Mapped[dt.date] = mapped_column(Date, nullable=False)
    horario: Mapped[str] = mapped_column(String(5), nullable=False)  # "HH:MM"
    motivo: Mapped[str] = mapped_column(String(200), nullable=False)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id"), nullable=False)

    pet: Mapped[Pet] = relationship(back_populates="agendamentos")
