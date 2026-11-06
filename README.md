# Dragon Age 2e Helper

Monorepo da extensão Owlbear, do site de fichas e da API compartilhados.

## Pacotes

| Pasta | Função |
| --- | --- |
| `dragon-age-helper` | Extensão Owlbear (popover) |
| `web` | Site de fichas |
| `server` | API REST + WebSocket + migrations Postgres |
| `packages/domain` | Tipos, regras AGE, patches, ports |
| `packages/client` | Cliente HTTP/WS e sync em tempo real |

## Configuração local

1. Postgres rodando.
2. Copie `server/settings.example.json` para `server/settings.local.json` e ajuste `databaseUrl` / `sessionSecret`.
3. Na raiz:

```bash
npm install
npm run migrate
npm run dev:server
npm run dev:web
npm run dev:extension
```

Clientes usam `VITE_API_BASE_URL` (padrão `http://localhost:3001`).

## Fluxo

- Conta no site ou no popover (sessão no `localStorage` de cada frente).
- Ficha na API; token Owlbear só referencia (`characterApiId`) e mostra barras.
- Edição ao vivo por WebSocket da campanha.
- Catálogo (escolas, arcanas, etc.) vem do ruleset no banco.
- Rolagens: Dice+ na extensão, rolador local no site.

Detalhes em [specifications.md](specifications.md).
