from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import agendamentos, auth, pets, tutores


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()  # cria o banco e roda o seed na primeira execucao
    yield


app = FastAPI(
    title="API da Clínica Veterinária",
    description="Cadastro e gerenciamento de tutores, pets e agendamentos, com autenticação.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tutores.router)
app.include_router(pets.router)
app.include_router(agendamentos.router)


@app.get("/", tags=["Status"])
def raiz():
    return {"status": "ok", "docs": "/docs"}
