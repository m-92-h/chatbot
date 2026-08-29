# ChromaDB
## Install chroma locally in project
npm install chromadb @chroma-core/default-embed

## to run chroma
npx chroma run --path src/vector-data

# to stop chroma (run in another terminal at same location)
pkill -9 node


# pgvector
postgres=# CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION
postgres=# CREATE DATABASE rag_vector_db;
CREATE DATABASE
postgres=# \c rag_vector_db
You are now connected to database "rag_vector_db" as user "postgres".
ragdb=#
