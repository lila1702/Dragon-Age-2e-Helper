# dragon-age-api

API REST + **Socket.IO** para persistir fichas de Dragon Age 2e em **MongoDB**, alinhada ao `CharacterSheet` da extensão Owlbear Rodeo.

## Setup local

Requer MongoDB (local ou Atlas).

```bash
cd dragon-age-api
cp .env.example .env
npm install
npm run dev
```

Servidor em `http://localhost:3001` (WebSocket na mesma porta).

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta HTTP (padrão `3001`) |
| `MONGODB_URI` | Connection string MongoDB (dev: `mongodb://127.0.0.1:27017/dragon_age`) |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula |
| `NODE_ENV` | `development` libera CORS aberto se `CORS_ORIGINS` estiver vazio |

## REST

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Health check + ping MongoDB |
| `GET` | `/characters/:id` | Buscar ficha (`{ id, sheet, createdAt, updatedAt }`) |
| `POST` | `/characters` | Criar (`{ "sheet": { ... } }`, `id` opcional UUID) |
| `PUT` | `/characters/:id` | Criar ou atualizar (`expectedUpdatedAt` opcional → `409` em conflito) |
| `GET` | `/rooms/:roomId/bindings` | Vínculos token ↔ ficha na mesa Owlbear |
| `GET` | `/rooms/:roomId/tokens/:tokenId/binding` | Vínculo de um token |
| `PUT` | `/rooms/:roomId/tokens/:tokenId/binding` | `{ "characterId": "..." }` |

Validação na borda com **Zod** (`src/schemas/characterSheet.ts`, espelho do helper). **RN-001**: HP/MP são normalizados para `0 ≤ current ≤ max` antes de gravar.

## Tempo real (Socket.IO)

Clientes da extensão conectam em `io(apiUrl)` e:

| Evento (cliente → servidor) | Payload |
| --- | --- |
| `subscribe:character` | `{ characterId }` |
| `unsubscribe:character` | `{ characterId }` |
| `subscribe:room` | `{ roomId }` |

| Evento (servidor → cliente) | Payload |
| --- | --- |
| `character:updated` | `{ id, sheet, createdAt, updatedAt }` após `POST`/`PUT` |
| `room:binding` | `{ roomId, tokenId, characterId }` após `PUT` binding |

Fluxo recomendado na mesa:

1. Criar ou carregar ficha via REST (`POST` / `GET`).
2. `PUT /rooms/:roomId/tokens/:tokenId/binding` com o `characterId`.
3. Gravar `characterId` no metadata do token (`com.dragonagehelper/characterApiId`).
4. Inscrever-se em `subscribe:character` e aplicar `character:updated` na UI.
5. Ao editar, `PUT /characters/:id` com `expectedUpdatedAt` + salvar metadata no token.

## Tabelas de referência (`/reference`)

Catálogo inicial alinhado ao helper (atributos, escolas arcanas, grupos de armas). Seed automático na coleção `reference_catalog` na primeira subida.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/reference` | Índice das tabelas |
| `GET` | `/reference/items` | Itens base (`?category=`, `?weaponGroup=`, `?tag=`) |
| `GET` | `/reference/items/:id` | Um item base (preço/dano padrão em aço comum) |
| `GET` | `/reference/items/:id/calculate` | Preço/dano variantes (`?materialId=&qualityId=&rarityId=`) |
| `POST` | `/reference/items/calculate` | Corpo `{ itemId, materialId?, qualityId?, rarityId? }` |
| `GET` | `/reference/materials` | Materiais e multiplicadores vs baseline |
| `GET` | `/reference/qualities` | Qualidade de fabricação |
| `GET` | `/reference/rarities` | Raridade de mercado |
| `GET` | `/reference/spells` | Magias (`?school=`, `?arcana=`, `?degree=`, `?q=`) |
| `GET` | `/reference/spells/:id` | Detalhe de uma magia |
| `GET` | `/reference/arcanas` | Escolas e listas de arcanas |
| `GET` | `/reference/attributes` | 9 atributos (AST…VON) |
| `GET` | `/reference/weapon-groups` | Grupos de armas sugeridos |
| `GET` | `/reference/currency-rules` | 100 cobre = 1 prata, etc. |
| `GET` | `/reference/general-stunts` | Façanhas gerais (custo PF) |
| `GET` | `/reference/spell-degrees` | Graus de magia + rótulos UI |

**Preço:** `preçoBaseCobre × material × qualidade × raridade`, retornado como `{ copper, silver, gold }` normalizado.

**Dano:** partindo de `baseDamage` do item, soma bônus de material/qualidade e dados extras (ex.: lyrium `+1d6`).

Exemplo — espada longa em lyrium, superior, raro:

`GET /reference/items/espada-longa/calculate?materialId=lyrium&qualityId=superior&rarityId=raro`

## Deploy

Build: `npm install && npm run build`  
Start: `npm start`  
Defina `MONGODB_URI` e `CORS_ORIGINS` (URL da extensão publicada).
