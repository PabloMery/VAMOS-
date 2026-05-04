CREATE DATABASE vamos_usuarios;
CREATE DATABASE vamos_eventos;

-- Nos conectamos específicamente a la base de datos de eventos
\c vamos_eventos;

-- Habilitamos la IA (Embeddings) solo en la app de eventos
CREATE EXTENSION IF NOT EXISTS vector;