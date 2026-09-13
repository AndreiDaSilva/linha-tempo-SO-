# Linha do tempo dos sistemas operacionais

Página estática com 28 marcos da história dos sistemas operacionais, de 1956 a 2026.
O conteúdo vem do documento `Linha do Tempo SO.docx`.

## Publicar no GitHub Pages

```bash
git init
git add .
git commit -m "Linha do tempo dos sistemas operacionais"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

Depois, no repositório: **Settings → Pages → Source: Deploy from a branch**,
escolha `main` e a pasta `/ (root)`. Em um ou dois minutos o site fica em
`https://USUARIO.github.io/REPOSITORIO/`.

## Ver antes de publicar

Abrir `index.html` no navegador já funciona. Para servir localmente:

```bash
python3 -m http.server 8000
```

E acessar `http://localhost:8000`.

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `index.html` | Todo o conteúdo da linha do tempo |
| `styles.css` | Cores, tipografia e layout |
| `chart.js` | Monta o diagrama de linhagens a partir do HTML |
| `scroll.js` | Acende cada marco conforme a rolagem e move o cursor de ano |
| `editor.html` | Página de configuração para acrescentar marcos |
| `editor.css`, `editor.js` | Estilo e lógica da página de configuração |
| `.nojekyll` | Impede o GitHub de processar a pasta com o Jekyll |

O texto fica todo no `index.html`. Os scripts leem o próprio HTML, então
sem JavaScript a linha do tempo continua completa — só o diagrama não aparece.

## Acrescentar um marco pela página de configuração

Abra `editor.html` — publicado em
`https://andreidasilva.github.io/linha-tempo-SO-/editor.html`, ou local com
`python3 -m http.server` e depois `http://localhost:8000/editor.html`.

Preencha ano, título, descrição e faixa do diagrama. A lista ao lado mostra em tempo real
onde o marco vai entrar. Ao confirmar, a página monta um `index.html` completo para baixar:
o marco entra na época certa e na posição cronológica correta, o intervalo de anos do título
da época se ajusta e a contagem de marcos é reescrita por extenso.

O site é estático, então **a página não grava nada no servidor**. Depois de baixar:

```bash
# substitua o index.html da pasta pelo arquivo baixado, então:
git add index.html
git commit -m "Novo marco"
git push
```

Abrir o `editor.html` com duplo clique não funciona: o navegador bloqueia a leitura de
arquivos locais. Nesse caso a própria página oferece um seletor para escolher o
`index.html` à mão.

## Editar à mão

**Mudar um texto:** procure o ano no `index.html` e edite o `<h3>` e o `<p>`.

**Acrescentar um marco:** copie um bloco `<article class="entry">` inteiro e ajuste:

```html
<article class="entry" id="a1998" data-year="1998" data-lane="windows" data-short="Windows 98">
  <p class="entry-year">1998</p>
  <div class="entry-body">
    <h3>Windows 98</h3>
    <p>Descrição do marco.</p>
  </div>
</article>
```

- `id` precisa ser único (o diagrama usa isso para rolar até o marco).
- `data-lane` diz em qual faixa do diagrama o marcador aparece. Os valores
  disponíveis são `mainframe`, `unix`, `pc`, `vms`, `apple`, `windows`, `linux` e `mobile`,
  definidos no topo do `chart.js`. Sem `data-lane`, o marco entra na linha do tempo
  mas não ganha marcador no diagrama.
- `data-short` é o nome curto que aparece ao passar o mouse no marcador.

**Acrescentar uma faixa ao diagrama:** edite a lista `LANES` no `chart.js`.

**Mudar as cores:** as variáveis estão no topo do `styles.css`. As seis cores
`--era-1` a `--era-6` formam a rampa que avança com o tempo — são usadas nos
títulos de época, nos anos, nos marcadores e no gradiente das faixas. O bloco
`prefers-color-scheme: dark` logo abaixo define as versões para tema escuro.
