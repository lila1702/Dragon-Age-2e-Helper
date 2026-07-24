# dragon-age-api

API REST para persistir fichas de Dragon Age 2e em **MySQL** (Aiven).

A API expõe `CharacterSheet` como **JSON** (igual ao helper Owlbear). Por baixo, o repositório **monta e desmonta** o documento em tabelas SQL relacionais.

## Setup local

```bash
cd dragon-age-api
cp .env.example .env
# Preencha DB_HOST, DB_PASSWORD, etc.
npm install
npm run migrate
npm run migrate:backfill   # opcional: converte sheet_json legado → tabelas
npm run dev
```

Servidor em `http://localhost:3001`.

## Esquema relacional

| Tabela | Conteúdo |
| --- | --- |
| `characters` | Cabeçalho, combate, HP/MP, moedas, flags de habilidades |
| `character_attributes` | 9 atributos (valor, foco ativo, bônus…) |
| `character_focuses` | Focos por atributo |
| `melee_attacks` / `ranged_attacks` | Ataques corpo a corpo e à distância |
| `class_abilities` | Habilidades de classe |
| `talents` | Talentos (benefícios Novato/Experiente/Mestre) |
| `arcana_specializations` | Especializações arcanas |
| `spells` | Magias por grau |
| `inventory_items` | Itens do inventário |

A coluna `sheet_json` permanece **nullable** só para migração de dados antigos; novos saves gravam nas tabelas acima.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta HTTP (padrão `3001`) |
| `DB_HOST` | Host Aiven |
| `DB_PORT` | Porta (ex. `12555`) |
| `DB_USER` | Usuário |
| `DB_PASSWORD` | Senha (**nunca commitar**) |
| `DB_NAME` | Banco (`defaultdb`) |
| `DB_SSL_CA_PATH` | Caminho do CA PEM (padrão `./certs/aiven-ca.pem`) |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula |

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Health check + conexão MySQL |
| `GET` | `/characters/:id` | Buscar ficha |
| `POST` | `/characters` | Criar (`{ "sheet": { ... } }`, `id` opcional UUID) |
| `PUT` | `/characters/:id` | Criar ou atualizar (`expectedUpdatedAt` opcional para conflito) |

### Exemplo POST

```json
{
  "sheet": {
    "id": "00000000-0000-4000-8000-000000000001",
    "name": "Nolalya",
    "className": "Maga",
    "level": 2,
    "hpCurrent": 20,
    "hpMax": 31,
    "mpCurrent": 22,
    "mpMax": 22,
    "attributes": [{ "name": "Comunicação", "abbreviation": "COM", "value": 2 }],
    "talents": [],
    "arcanaSpecializations": [],
    "spells": [],
    "inventory": { "items": [], "currency": { "copper": 0, "silver": 0, "gold": 0 } }
  }
}
```

## Deploy (Render)

1. Web Service apontando para `dragon-age-api`
2. Build: `npm install && npm run build`
3. Start: `npm run migrate && npm run migrate:backfill && npm start`
4. Definir as variáveis `DB_*` no painel (mesmos valores do Aiven)

**Não** commite o arquivo `.env` — ele está no `.gitignore`.
