"""Ajudantes para editar o banco/script.sql na mao.

    python utils_seed.py cpf 12345678909      -> imprime o CPF criptografado
    python utils_seed.py senha MinhaSenha@1   -> imprime o hash da senha
"""
import sys

from app.security import criptografar_cpf, gerar_hash_senha

if len(sys.argv) != 3 or sys.argv[1] not in ("cpf", "senha"):
    print(__doc__)
    sys.exit(1)

print(criptografar_cpf(sys.argv[2]) if sys.argv[1] == "cpf" else gerar_hash_senha(sys.argv[2]))
