# Dragon Age 2e Helper

Extensão Owlbear Rodeo 2.0 para fichas e rolagens Dragon Age 2e (homebrew Fantasy Age 2e).

## Desenvolvimento local

```bash
cd dragon-age-helper
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador. Fora do Owlbear, a ficha usa dados de exemplo e rolagens simuladas (3d6 aleatório).

Para testar no Owlbear com dev server, use a URL do manifest apontando para seu host (ex.: ngrok) conforme o [tutorial Hello World](https://docs.owlbear.rodeo/extensions/tutorial-hello-world/create-your-site/).

## Deploy (GitHub Pages)

1. Ative **GitHub Pages** no repositório: Settings → Pages → Source: **GitHub Actions**
2. Faça push na branch `main` (ou dispare o workflow manualmente)
3. A extensão ficará em: `https://lila1702.github.io/Dragon-Age-2e-Helper/`
4. URL do manifest para instalar no Owlbear:

   `https://lila1702.github.io/Dragon-Age-2e-Helper/manifest.json`

### Instalar na mesa

1. Perfil Owlbear → **Add Extension** → cole a URL do manifest
2. Na sala → **Extras** → **Extensions** → ative **Dragon Age 2e Helper**
3. Ative também a extensão **Dice+** (oficial) para rolagens 3d6 na mesa

## Épico 3 — entregas

- Notificações Owlbear (`OBR.notification`) ao rolar atributos
- Tema claro fixo (estilo planilha), independente do tema do Owlbear
- Rolagem simulada fora do Owlbear (`devDiceRoll`)
- Hook `usePlayerRole` (preparação para UI de GM)
- Build de produção + workflow GitHub Pages
