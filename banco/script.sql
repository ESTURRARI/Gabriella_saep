-- =====================================================================
-- Banco de dados: Clinica Veterinaria
-- SGBD: SQLite (sintaxe compativel com a maioria dos bancos SQL)
-- Este script cria as tabelas e insere os dados de exemplo (seed).
-- Cada tabela possui pelo menos 3 registros.
--
-- * Senhas: guardadas como hash PBKDF2 (nunca em texto puro).
-- * CPF dos tutores: guardado CRIPTOGRAFADO (Fernet) na coluna cpf_criptografado.
-- =====================================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS agendamentos;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS tutores;
DROP TABLE IF EXISTS usuarios;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(120) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL
);

CREATE TABLE tutores (
    id                 INTEGER      PRIMARY KEY AUTOINCREMENT,
    nome               VARCHAR(100) NOT NULL,
    cpf_criptografado  VARCHAR(255) NOT NULL,
    telefone           VARCHAR(20)  NOT NULL,
    email              VARCHAR(120) NOT NULL,
    endereco           VARCHAR(200)
);

CREATE TABLE pets (
    id               INTEGER     PRIMARY KEY AUTOINCREMENT,
    nome             VARCHAR(80) NOT NULL,
    especie          VARCHAR(40) NOT NULL,
    raca             VARCHAR(60),
    data_nascimento  DATE,
    tutor_id         INTEGER     NOT NULL,
    FOREIGN KEY (tutor_id) REFERENCES tutores (id)
);

CREATE TABLE agendamentos (
    id        INTEGER      PRIMARY KEY AUTOINCREMENT,
    data      DATE         NOT NULL,
    horario   VARCHAR(5)   NOT NULL,   -- formato HH:MM
    motivo    VARCHAR(200) NOT NULL,
    pet_id    INTEGER      NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets (id)
);

CREATE INDEX idx_pets_tutor ON pets (tutor_id);
CREATE INDEX idx_agendamentos_data ON agendamentos (data, horario);
CREATE INDEX idx_agendamentos_pet ON agendamentos (pet_id);

-- ---------------------------------------------------------------------
-- Seed (dados de exemplo)
-- ---------------------------------------------------------------------
-- Logins de teste:
--   admin@clinica.com    / Admin@123
--   marina@clinica.com   / Vet@12345
--   recepcao@clinica.com / Recep@123

INSERT INTO usuarios (nome, email, senha_hash) VALUES
    ('Administrador', 'admin@clinica.com', 'pbkdf2_sha256$200000$1O0p/y4wv1bBQrBBLyoCow==$rPlab37vR8OMuddPyXphYi+10uO15QhPcUdzZheq9ic='),
    ('Gabriella', 'gabriella@clinica.com', 'pbkdf2_sha256$200000$eu3HVFP/+iUeJAVbLt0LaQ==$B+Q0BKkAYWtkDXZxq6OkBok7EdntxOjCzYARQK046IE='),
    ('Recepção', 'recepcao@clinica.com', 'pbkdf2_sha256$200000$kW2pfn/PC+F3zWp4XzJ8tQ==$2SZX8EuXY0MQYEC0V36ghIGhfqOtZjYxChi3oxn0P7g=');

-- CPFs de exemplo (fictícios, mas com dígitos verificadores válidos); abaixo estão criptografados.
INSERT INTO tutores (nome, cpf_criptografado, telefone, email, endereco) VALUES
    ('Carlos Henrique Lima', 'gAAAAABq1fsqQWKtcWrBSBGo0d4E4JoF2yLaLmLSSWBsb_RCnVwMQtYKqZD4fLJPw1McMFoMpC70aFA8NXuYHghP2E-u17x91w==', '19991234567', 'carlos.lima@email.com', 'Rua das Acácias, 120 - Campinas/SP'),
    ('Fernanda Oliveira', 'gAAAAABq1fsqD30Tf5lKaCWnNrIZ8JFwI8x6_9fqwWOxsQPnVmpK7pjoRnDReooRa9JXYNWuV7SRgZbEGOXlll1J84Tm3T3c7g==', '19988776655', 'fernanda.oliveira@email.com', 'Av. Brasil, 845 - Campinas/SP'),
    ('João Pedro Santos', 'gAAAAABq1fsqAsAaZCiVqBFG_y-Y-IHl-uBI5XeyU8B7BajGn1gTELEp2PXQFRXd0NGWsH5ivUB0JrJedOzESmHB6D6ACX6aiw==', '1932145678', 'joao.santos@email.com', 'Rua Barão de Jaguara, 50 - Campinas/SP'),
    ('Beatriz Almeida', 'gAAAAABq1fsqIYs87kk17qlnOn7fXbdJ7EibVggyO7TiczsSr8-wFsFykWP9OJXzmCXwrEJtahMat611ZppcaDJCwjfKF6JIQw==', '19977665544', 'bia.almeida@email.com', 'Rua Sete de Setembro, 310 - Valinhos/SP'),
    ('Ricardo Menezes', 'gAAAAABq1fsqGY1GSqXddj1phBzha-E8Slb-RLk1Eg3JpDbibKk0HUpA9YxQxi0YNuRxfV-VnP5Qqo89zgZjxIJtsurrfejHFw==', '19966554433', 'ricardo.menezes@email.com', NULL);

INSERT INTO pets (nome, especie, raca, data_nascimento, tutor_id) VALUES
    ('Thor', 'Cachorro', 'Golden Retriever', '2019-03-14', 1),
    ('Mel', 'Gato', 'Siamês', '2021-07-02', 1),
    ('Luna', 'Cachorro', 'Poodle', '2020-11-23', 2),
    ('Bob', 'Cachorro', 'Vira-lata', '2018-05-09', 3),
    ('Nina', 'Gato', 'Persa', '2022-01-30', 4),
    ('Pipoca', 'Coelho', 'Mini Lop', '2023-06-18', 5);

INSERT INTO agendamentos (data, horario, motivo, pet_id) VALUES
    ('2026-11-05', '14:30', 'Vacina antirrábica', 3),
    ('2026-10-27', '09:00', 'Consulta de rotina', 1),
    ('2026-11-05', '10:00', 'Retorno pós-cirurgia', 4),
    ('2026-10-30', '16:00', 'Limpeza de tártaro', 2),
    ('2026-11-12', '11:15', 'Check-up geral', 5),
    ('2026-11-18', '15:45', 'Aplicação de vermífugo', 6);
