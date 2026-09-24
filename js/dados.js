/**
 * O catálogo de demonstração.
 *
 * Tem a mesma forma que a API `catalogo` devolve, para a tela não saber de
 * onde os dados vieram. É o que permite publicar esta página no GitHub Pages,
 * onde não há servidor nenhum, e mesmo assim navegar por tudo.
 *
 * Os títulos, as sinopses e os nomes são **inventados para este projeto**. As
 * mídias são fluxos HLS públicos de teste, publicados para quem desenvolve
 * player — nenhum vídeo mora neste repositório.
 */

const MUX = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const APPLE = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8';
const PTS = 'https://test-streams.mux.dev/pts_shift/master.m3u8';

const CREDITO = 'Fluxo HLS público de teste; o conteúdo do catálogo é fictício.';

/** Os perfis. */
export const PERFIS = [
  { id: 1, nome: 'Miguel', cor: '#A52A45', infantil: false, idadeMaxima: 18 },
  { id: 2, nome: 'Convidado', cor: '#541525', infantil: false, idadeMaxima: 18 },
  { id: 3, nome: 'Infantil', cor: '#781B32', infantil: true, idadeMaxima: 10 },
];

/** Os gêneros. */
export const GENEROS = [
  { nome: 'Drama', apelido: 'drama' },
  { nome: 'Ficção científica', apelido: 'ficcao' },
  { nome: 'Ação', apelido: 'acao' },
  { nome: 'Animação', apelido: 'animacao' },
  { nome: 'Suspense', apelido: 'suspense' },
  { nome: 'Romance', apelido: 'romance' },
];

/** O catálogo. */
export const TITULOS = [
  {
    id: 1,
    tipo: 'Filme',
    nome: 'Cidade de Vidro',
    sinopse: 'Numa capital onde todo prédio virou espelho, uma engenheira descobre que os reflexos estão dois segundos atrasados.',
    ano: 2024,
    classificacao: '12',
    classificacaoPorExtenso: 'Não recomendado para menores de 12 anos',
    duracaoEmMinutos: 118,
    midiaUrl: MUX,
    credito: CREDITO,
    destaque: true,
    generos: ['ficcao'],
    direcao: ['Rita Amorim'],
    elenco: ['Solange Vieira', 'Otávio Braga'],
  },
  {
    id: 2,
    tipo: 'Filme',
    nome: 'O Último Trem para Olinda',
    sinopse: 'Três desconhecidos dividem a última cabine de um trem que ninguém lembra de ter visto sair.',
    ano: 2023,
    classificacao: '14',
    classificacaoPorExtenso: 'Não recomendado para menores de 14 anos',
    duracaoEmMinutos: 96,
    midiaUrl: APPLE,
    credito: CREDITO,
    generos: ['drama'],
    direcao: ['Rita Amorim'],
    elenco: ['Benedito Rangel', 'Solange Vieira'],
  },
  {
    id: 3,
    tipo: 'Filme',
    nome: 'Enquanto a Chuva Não Passa',
    sinopse: 'Dois vizinhos que nunca se falaram ficam presos na mesma marquise por uma tarde inteira.',
    ano: 2022,
    classificacao: 'L',
    classificacaoPorExtenso: 'Livre para todos os públicos',
    duracaoEmMinutos: 84,
    midiaUrl: PTS,
    credito: CREDITO,
    generos: ['romance'],
    direcao: ['Caio Sampaio'],
    elenco: ['Marina Teles', 'Otávio Braga'],
  },
  {
    id: 4,
    tipo: 'Filme',
    nome: 'Caçadores de Estática',
    sinopse: 'Uma equipe de rádios piratas rastreia um sinal que só aparece durante tempestades.',
    ano: 2025,
    classificacao: '16',
    classificacaoPorExtenso: 'Não recomendado para menores de 16 anos',
    duracaoEmMinutos: 131,
    midiaUrl: MUX,
    credito: CREDITO,
    generos: ['acao'],
    direcao: ['Caio Sampaio'],
    elenco: ['Otávio Braga', 'Ivone Castelo'],
  },
  {
    id: 5,
    tipo: 'Filme',
    nome: 'A Ilha dos Relógios Parados',
    sinopse: 'Uma menina e um farol conversam sobre o que fazer quando o tempo decide tirar férias.',
    ano: 2021,
    classificacao: 'L',
    classificacaoPorExtenso: 'Livre para todos os públicos',
    duracaoEmMinutos: 77,
    midiaUrl: APPLE,
    credito: CREDITO,
    generos: ['animacao'],
    direcao: ['Lúcia Bandeira'],
    elenco: ['Marina Teles'],
  },
  {
    id: 6,
    tipo: 'Filme',
    nome: 'Dossiê Meia-Noite',
    sinopse: 'O arquivista de um jornal fechado há trinta anos recebe uma pauta nova.',
    ano: 2020,
    classificacao: '18',
    classificacaoPorExtenso: 'Não recomendado para menores de 18 anos',
    duracaoEmMinutos: 104,
    midiaUrl: PTS,
    credito: CREDITO,
    generos: ['suspense'],
    direcao: ['Rita Amorim'],
    elenco: ['Benedito Rangel', 'Ivone Castelo'],
  },
  {
    id: 7,
    tipo: 'Serie',
    nome: 'Litoral',
    sinopse: 'Uma família administra o último posto de gasolina antes da ponte — e tudo que atravessa por ali.',
    ano: 2023,
    classificacao: '14',
    classificacaoPorExtenso: 'Não recomendado para menores de 14 anos',
    credito: CREDITO,
    generos: ['drama'],
    direcao: ['Lúcia Bandeira'],
    elenco: ['Solange Vieira'],
    temporadas: [
      {
        id: 1,
        numero: 1,
        nome: 'Temporada 1',
        ano: 2023,
        episodios: [
          { id: 101, numero: 1, nome: 'Maré de sizígia', duracaoEmMinutos: 42, midiaUrl: MUX, aberturaComecaEm: 5, aberturaTerminaEm: 35 },
          { id: 102, numero: 2, nome: 'O turno da madrugada', duracaoEmMinutos: 43, midiaUrl: APPLE, aberturaComecaEm: 5, aberturaTerminaEm: 35 },
          { id: 103, numero: 3, nome: 'Quem paga em espécie', duracaoEmMinutos: 44, midiaUrl: MUX, aberturaComecaEm: 5, aberturaTerminaEm: 35 },
          { id: 104, numero: 4, nome: 'Ponte levadiça', duracaoEmMinutos: 45, midiaUrl: APPLE, aberturaComecaEm: 5, aberturaTerminaEm: 35 },
        ],
      },
      {
        id: 2,
        numero: 2,
        nome: 'Temporada 2',
        ano: 2024,
        episodios: [
          { id: 201, numero: 1, nome: 'Vento sul', duracaoEmMinutos: 45, midiaUrl: PTS },
          { id: 202, numero: 2, nome: 'O que a ponte engoliu', duracaoEmMinutos: 45, midiaUrl: PTS },
        ],
      },
    ],
  },
  {
    id: 8,
    tipo: 'Serie',
    nome: 'Sinal Fraco',
    sinopse: 'Uma operadora de telefonia rural começa a receber chamadas de números que ainda não existem.',
    ano: 2025,
    classificacao: '16',
    classificacaoPorExtenso: 'Não recomendado para menores de 16 anos',
    credito: CREDITO,
    generos: ['suspense', 'ficcao'],
    direcao: ['Caio Sampaio'],
    elenco: ['Ivone Castelo'],
    temporadas: [
      {
        id: 3,
        numero: 1,
        nome: 'Temporada 1',
        ano: 2025,
        episodios: [
          { id: 301, numero: 1, nome: 'Linha cruzada', duracaoEmMinutos: 38, midiaUrl: MUX },
          { id: 302, numero: 2, nome: 'Área de sombra', duracaoEmMinutos: 39, midiaUrl: MUX },
          { id: 303, numero: 3, nome: 'Torre 12', duracaoEmMinutos: 40, midiaUrl: MUX },
        ],
      },
    ],
  },
];

/** A idade mínima que cada selo exige. É o que ordena, não o texto. */
export const IDADE_DO_SELO = { L: 0, 10: 10, 12: 12, 14: 14, 16: 16, 18: 18 };
