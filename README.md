# Linha do tempo dos sistemas operacionais

Página estática com 28 marcos da história dos sistemas operacionais, de 1956 a 2026,
com foco nas funcionalidades e recursos acrescentados ao longo do tempo.

Dois diagramas dividem o mesmo eixo de anos: **Linhagens**, com uma linha por família de
sistemas, e **Recursos**, com uma linha por capacidade — quando cada uma estreou e quais
sistemas a trouxeram.

Todo o conteúdo vive em **`dados.json`**. O `index.html` é só a casca: ele lê o JSON e
monta a linha do tempo e o diagrama de linhagens a partir dele.

## Publicar no GitHub Pages

O repositório já está configurado. Para publicar alterações:

```bash
git add .
git commit -m "Atualiza a linha do tempo"
git push
```

No repositório, em **Settings → Pages**, a origem deve estar em *Deploy from a branch*,
com `main` e a pasta `/ (root)`. O site fica em
`https://andreidasilva.github.io/linha-tempo-SO-/`.

## Ver antes de publicar

A página lê o `dados.json` com `fetch`, e o navegador bloqueia isso em arquivos abertos
direto do disco. Então **abrir o `index.html` com duplo clique não funciona**. Sirva a pasta:

```bash
python3 -m http.server 8000
```

E acesse `http://localhost:8000`.

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `dados.json` | **Todo o conteúdo**: faixas do diagrama, épocas e marcos |
| `index.html` | A casca da página: cabeçalho, diagrama vazio e rodapé |
| `styles.css` | Cores, tipografia e layout |
| `timeline.js` | Lê o `dados.json` e monta a linha do tempo |
| `chart.js` | Desenha o diagrama de linhagens |
| `scroll.js` | Acende cada marco conforme a rolagem e move o cursor de ano |
| `editor.html` | Página para acrescentar, alterar e remover marcos |
| `editor.css`, `editor.js` | Estilo e lógica da página de edição |
| `.nojekyll` | Impede o GitHub de processar a pasta com o Jekyll |

## Editar pela página de edição

Abra `editor.html` — publicado em
`https://andreidasilva.github.io/linha-tempo-SO-/editor.html`, ou local com
`python3 -m http.server` e depois `http://localhost:8000/editor.html`.

Ela lista os marcos agrupados por época, com **Editar** e **Remover** em cada linha, e um
formulário para acrescentar novos, incluindo as caixas dos recursos que o marco introduz. A época é escolhida pelo ano, mas dá para trocar no
select. Ao terminar, clique em **Baixar dados.json**, substitua o arquivo na pasta e
envie com `git push`.

O site é estático: **a página não grava nada no servidor**, só monta o arquivo.

## Editar o JSON à mão

A estrutura é:

```json
{
  "faixas": [
    { "id": "linux", "nome": "Linux", "inicio": 1991, "fim": 2026 }
  ],
  "recursos": [
    { "id": "isolamento", "nome": "Isolamento de aplicações" }
  ],
  "epocas": [
    {
      "nome": "Mobilidade, nuvem e contêineres",
      "marcos": [
        {
          "ano": 2008,
          "titulo": "Android",
          "texto": "Descrição do marco.",
          "faixa": "mobile",
          "curto": "Android",
          "recursos": ["toque", "isolamento"]
        }
      ]
    }
  ]
}
```

- **`faixas`** são as linhas do diagrama de linhagens, uma por família de sistemas.
  `inicio` e `fim` definem o comprimento da barra.
- **`recursos`** é o vocabulário de capacidades do segundo diagrama, uma linha por capacidade.
  A barra de cada uma começa no ano do primeiro marco que a traz.
- **`epocas`** são os capítulos da linha do tempo. O intervalo de anos que aparece ao lado
  do título é calculado a partir dos marcos, não precisa ser escrito.
- **`faixa`** de um marco deve ser o `id` de uma faixa. Em branco, o marco aparece na linha
  do tempo mas não ganha marcador no diagrama.
- **`recursos`** de um marco lista os `id` das capacidades que ele introduziu ou consolidou.
  É o que o enunciado do trabalho pede em primeiro plano, e o que alimenta o segundo diagrama.
- **`curto`** é o nome que aparece ao passar o mouse no marcador.
- **`texto`** aceita `<i>termo</i>` para termos em outro idioma. Qualquer outra marcação é
  exibida como texto literal, não interpretada.

Não é preciso se preocupar com ordem: a página ordena as épocas e os marcos por ano.
A contagem de marcos na abertura e no rodapé também é calculada sozinha.

As seis cores `--era-1` a `--era-6`, no topo do `styles.css`, formam a rampa que avança com
o tempo e são distribuídas entre as épocas na ordem em que elas aparecem. O bloco
`prefers-color-scheme: dark` logo abaixo define as versões para tema escuro.
