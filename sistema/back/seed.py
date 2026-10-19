"""Recria o banco do zero a partir de banco/script.sql (tabelas + dados de exemplo).

Uso (dentro da pasta back, com o ambiente virtual ativo):
    python seed.py
"""
from app.config import settings
from app.database import executar_script

if __name__ == "__main__":
    executar_script(recriar=True)
    print(f"Banco recriado e populado: {settings.DB_PATH}")
