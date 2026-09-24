# conde-play

A tela do **CondePlay**: seleção de perfil, herói, fileiras com rolagem, ficha
do título com temporadas e episódios, busca, minha lista, continuar assistindo
e o reprodutor.

Sem framework, sem etapa de build, sem uma dependência: são módulos ES
carregados direto pelo navegador.

**[→ ver funcionando](https://condedeveloper.github.io/conde-play/)**

## As peças que ele junta

| | De onde vem |
|---|---|
| catálogo, perfis, progresso | [`catalogo`](https://github.com/condeDeveloper/catalogo) — API em C# e .NET 8 |
| reprodução | [`player-hls`](https://github.com/condeDeveloper/player-hls) — player HLS do zero |
| capas e avatares | desenhados aqui, por código |

## O conteúdo é próprio

Os títulos, as sinopses e os nomes são **inventados para este projeto**. As
mídias apontam para fluxos HLS **públicos de teste** — os da Mux e o exemplo
oficial da Apple —, publicados justamente para quem está desenvolvendo player.

E **não há um único arquivo de imagem no repositório**: cada capa é um SVG
gerado a partir do nome do título e de uma cor derivada do id. Além de manter
o repositório leve, isso significa que nenhuma capa pode "quebrar" — não há
imagem para falhar.

## Decisões que valeram o trabalho

### 1. A cor da capa é estável, e vem do ângulo áureo

A matiz sai de `id × 137,508°`. Duas propriedades caem daí:

- **O mesmo título tem sempre a mesma cor**, entre recarregamentos e entre
  dispositivos. Uma cor sorteada a cada desenho faria a fileira piscar de
  cores diferentes a cada visita, e a memória visual do catálogo se perderia.
- **Ids vizinhos ficam longe no círculo cromático.** Com um incremento
  qualquer, 1, 2 e 3 sairiam quase da mesma cor; o ângulo áureo espalha.

### 2. O site funciona sem servidor

Ele fala com a API quando ela está no ar e cai para o catálogo embutido quando
não está. Não é remendo: é o que permite publicar no GitHub Pages, onde não
existe servidor, e ainda assim navegar por tudo — e é o que deixa o
desenvolvimento local rodar contra a API de verdade sem trocar uma linha.

O que muda entre os dois modos é só a origem. A **forma** dos dados é a mesma,
e por isso a tela não sabe nem precisa saber de onde eles vieram.

### 3. As regras das fileiras moram fora do DOM

`js/fileiras.js` não toca em `document`. Duas razões: o `app.js` deveria ser só
ligação entre clique e tela, e regra que depende do navegador não dá para
testar fora dele — e estas são exatamente as regras que valem a pena testar.

### 4. O progresso vai a cada cinco segundos, não a cada quadro

O evento `timeupdate` dispara umas quatro vezes por segundo. Gravar em todos
faria quatro requisições por segundo por espectador.

### 5. Duas cópias da mesma regra, de propósito

As regras de "continuar assistindo" existem aqui **e** na API. A repetição é
deliberada: no modo embutido não há API para aplicá-las, e uma tela que muda de
comportamento conforme a origem dos dados seria pior do que duas cópias.

O preço apareceu na hora: a cópia em JavaScript nasceu **sem a guarda de
duração zero** que a de C# tem, e o teste pegou. Sem duração conhecida não dá
para dizer se algo está no meio ou no fim — e chutar "no meio" prende na
fileira algo que talvez já tenha acabado.

## Rodando

Precisa de um servidor, porque módulos ES não carregam de `file://`:

```bash
npm run servir
# http://localhost:5210
```

Com a API junto, para ver os dados de verdade:

```bash
dotnet run --project ../catalogo/src/Catalogo.Api   # porta 5000
npm run servir
```

Em `localhost` o site procura a API sozinho; em qualquer outro endereço ele usa
o catálogo embutido.

```bash
npm test
```

34 testes, sobre as regras que não dependem do navegador: quando algo conta
como começado, a virada de temporada em "continuar assistindo", a ausência de
fileira vazia e de título repetido, a estabilidade das cores e o escape do SVG.

## Estrutura

```
index.html        a tela inteira: perfis, topo, herói, fileiras, ficha, player
css/estilo.css    a identidade em grafite e vinho, escrita à mão
js/dados.js       o catálogo de demonstração, na mesma forma da API
js/api.js         o cliente, com queda para o embutido
js/capa.js        capas, banners e avatares desenhados por código
js/fileiras.js    as regras das fileiras, sem DOM — é o que os testes cobrem
js/app.js         a ligação entre clique e tela
js/player-hls/    cópia do player irmão (sem build, a biblioteca vem embutida)
```

## Limites conhecidos

- **Sem login.** O perfil é escolhido e guardado no navegador; não há conta nem
  senha. Num serviço de verdade isso é a primeira coisa a existir.
- **Sem servidor, o que é pessoal fica no navegador.** Lista e progresso vão
  para o `localStorage` e somem se a pessoa limpar o armazenamento. É honesto:
  sem servidor, não há onde guardar.
- **O player embutido é uma cópia.** Sem etapa de build, a biblioteca irmã vem
  copiada em `js/player-hls/` com o commit de origem anotado no cabeçalho.
  Para alterá-la, altere lá e copie de novo.
- **Sem legendas e sem faixas de áudio**, porque o player ainda não as toca.
- **Sem rolagem infinita.** Cada fileira traz 20 itens; paginar exigiria um
  cursor por fileira.
- **Sem teste de interface.** O que é testado são as regras; cliques e desenho
  não têm cobertura automatizada.

## Licença

MIT.
