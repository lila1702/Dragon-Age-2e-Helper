# Especificação Técnica — Dragon Age 2e Helper

| Campo | Valor |
| --- | --- |
| **Projeto** | Dragon Age / Fantasy AGE 2e Helper |
| **Plataforma** | Owlbear Rodeo 2.0 (extensão) + website de fichas |
| **Repositório** | `Dragon-Age-2e-Helper` (monorepo) |
| **Fonte da verdade** | API HTTP + WebSocket + Postgres |
| **Versão do documento** | 3.0.0 |
| **Última revisão** | 2026-11-01 |

---

## 1. Visão geral

Extensão Owlbear e website compartilham a mesma API. A ficha vive no servidor. O token do mapa só guarda referência (`characterApiId`) e barras de HP/MP. A planilha deixou de ser origem dos dados.

Clientes:

- `dragon-age-helper` — popover Owlbear (rolagens Dice+, barras, vínculo de token)
- `web` — edição e consulta de fichas pela conta
- `server` — REST, WebSocket, migrations Postgres
- `packages/domain` — tipos, regras AGE, patches, ports
- `packages/client` — ApiClient, RealtimeClient, CatalogProvider, sync hook

---

## 2. Identidade e vínculos

| Vínculo | Papel |
| --- | --- |
| `User` | Conta do site (e-mail/senha). Sessão própria no site e no popover (`localStorage`). |
| `OwlbearIdentity` | Liga `OBR.player.id` + `OBR.room.id` ao `User`. |
| `Character.ownerUserId` | Dono da ficha (edita sem depender de token). |
| `TokenLink` | Liga `characterId` a um ou mais tokens da sala. |
| `Membership` | Papel `GM` / `PLAYER` na campanha. |

Permissão de ficha: dono ou GM editam. `canEditToken` do Owlbear vale só para gravar barras/metadata no item.

---

## 3. Persistência

### 3.1 Postgres + migrations

Arquivos em `server/migrations/`, aplicados por `npm run migrate`. Tabela `schema_migrations` controla o que já rodou.

Configuração local (não versionada): `server/settings.local.json`, modelo em `server/settings.example.json`. Alternativa: `DATABASE_URL`, `SESSION_SECRET`, `PORT`.

### 3.2 Documento da ficha

`characters.sheet` é JSONB no formato `CharacterSheet` do domínio. Colunas `revision`, `owner_user_id`, `campaign_id` ficam fora do JSON.

### 3.3 Metadata Owlbear

| Chave | Uso |
| --- | --- |
| `com.dragonagehelper/characterApiId` | Id da ficha na API |
| `com.dragonagehelper/trackers` | Cache HP/MP |
| `com.dragonagehelper/sheet` | Legado; migrado na primeira abertura autenticada |
| `com.dragonagehelper/ownerPlayerId` | Dono do token na mesa |

---

## 4. Tempo real

Patches por campo via WebSocket da campanha (`/ws/campaigns/:id?token=…`) e `POST /characters/:id/patches`.

```ts
type SheetPatch = {
  characterId: string;
  baseRevision: number;
  opId: string;
  path: string;
  value: unknown;
};
```

- Cliente aplica otimista, envia patch, ignora eco do próprio `opId`.
- `baseRevision` atrasado → snapshot completo.
- Textos longos usam presença (trava enquanto outra pessoa edita).
- HP/MP: patch imediato; a extensão atualiza barras de todos os `TokenLink` da cena aberta.

---

## 5. Catálogo e regras

Catálogo no banco (`GET /rulesets/:id/catalog`): atributos, escolas, arcanas, grupos de arma, graus. Seed nas migrations.

Regras AGE em código (`AgeRuleset`): façanha, poder arcano, bônus de ataque. Ports trocáveis:

| Port | Implementações |
| --- | --- |
| `DiceRoller` | `dice-plus` (extensão), `local` (site) |
| `Ruleset` | `dragon-age-age` |
| `TabletopBridge` | `OwlbearBridge`, `NoTabletop` |
| `InitiativeBoard` | REST `/campaigns/:id/initiative` |

---

## 6. Contrato HTTP (resumo)

- `POST /users`, `POST /sessions`, `GET /me`
- `GET/POST /me/campaigns`, `POST /campaigns`
- `GET /me/characters`, `GET /campaigns/:id/characters`
- `GET/PUT /characters/:id`, `POST /characters`, `POST /characters/migrate`
- `POST /characters/:id/patches`
- `POST/GET/DELETE …/token-links`, `GET /token-links/lookup`
- `POST /me/owlbear-identities`
- `GET /rulesets/:id/catalog`
- `GET/PUT /campaigns/:id/initiative`

---

## 7. Fluxos principais

### Abrir ficha no Owlbear (autenticado)

1. Login no popover (sessão local).
2. Opcional: “Este jogador sou eu”.
3. Resolver token selecionado → `TokenLink` ou migrar metadata legado.
4. Inscrever no WebSocket da campanha.
5. Editar → patches; HP/MP → barras dos tokens vinculados.

### Vincular / copiar

- **Vincular:** mesmo `characterId` em outro token.
- **Copiar:** cria personagem novo com cópia do sheet e novo `TokenLink`.

### Site

Mesma conta, lista campanhas/fichas, edição ao vivo, painel de iniciativa para GM, rolagem local.

---

## 8. Desenvolvimento

```bash
npm install
# configure server/settings.local.json e o banco Postgres
npm run migrate
npm run dev:server
npm run dev:web
npm run dev:extension
```

Variáveis dos clientes: `VITE_API_BASE_URL` (padrão `http://localhost:3001`).
