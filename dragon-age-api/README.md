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

## Deploy

Build: `npm install && npm run build`  
Start: `npm start`  
Defina `MONGODB_URI` e `CORS_ORIGINS` (URL da extensão publicada).
