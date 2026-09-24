/**
 * As regras das fileiras, sem tocar no DOM.
 *
 * Elas estão aqui, e não no `app.js`, por dois motivos. O primeiro é desenho:
 * o `app.js` deveria ser só ligação entre clique e tela. O segundo é prático:
 * regra que depende de `document` não dá para testar fora do navegador, e
 * estas são exatamente as regras que valem a pena testar.
 *
 * São as mesmas que a API aplica. A repetição é deliberada: no modo embutido
 * não há API para aplicá-las, e uma tela que muda de comportamento conforme a
 * origem dos dados seria pior do que duas cópias da mesma regra.
 */

/** Abaixo disso, foi só uma espiada. */
export const FRACAO_MINIMA = 0.02;

/** A partir disso, considera-se assistido. */
export const FRACAO_DE_CONCLUSAO = 0.92;

/** Em conteúdo curto, a fração não serve; vale este piso. */
export const SEGUNDOS_MINIMOS = 30;

/** Quantos itens cada fileira mostra. */
export const ITENS_POR_FILEIRA = 20;

/** Os nomes dos gêneros. */
export const NOMES_DE_GENERO = {
  drama: 'Drama',
  ficcao: 'Ficção científica',
  acao: 'Ação',
  animacao: 'Animação',
  suspense: 'Suspense',
  romance: 'Romance',
  documentario: 'Documentário',
};

/** O nome de um gênero pelo apelido. */
export function nomeDoGenero(apelido) {
  return NOMES_DE_GENERO[apelido] ?? apelido;
}

/** Quanto do conteúdo já passou, de 0 a 1. */
export function fracaoDe(progresso) {
  return progresso?.duracaoEmSegundos > 0
    ? Math.min(1, Math.max(0, progresso.segundoAtual / progresso.duracaoEmSegundos))
    : 0;
}

/** Se começou de verdade e ainda não acabou. */
export function emAndamento(progresso) {
  // Sem duração conhecida não dá para dizer se está no meio ou no fim — e
  // chutar que está no meio prende na fileira algo que talvez já tenha
  // acabado. A mesma guarda existe do lado da API.
  if (!(progresso?.duracaoEmSegundos > 0)) return false;

  const fracao = fracaoDe(progresso);
  const comecou = fracao >= FRACAO_MINIMA || progresso.segundoAtual >= SEGUNDOS_MINIMOS;

  return comecou && fracao < FRACAO_DE_CONCLUSAO;
}

/** Se chegou perto o bastante do fim. */
export function concluido(progresso) {
  return progresso?.duracaoEmSegundos > 0 && fracaoDe(progresso) >= FRACAO_DE_CONCLUSAO;
}

/** Todos os episódios de uma série, em ordem, com o número da temporada junto. */
export function episodiosEmOrdem(titulo) {
  if (titulo?.tipo !== 'Serie' || !titulo.temporadas) return [];

  return titulo.temporadas
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .flatMap((temporada) =>
      temporada.episodios
        .slice()
        .sort((a, b) => a.numero - b.numero)
        .map((episodio) => ({ ...episodio, temporada: temporada.numero })));
}

/**
 * O episódio seguinte, atravessando a virada de temporada.
 *
 * Esquecer a virada faz a série sumir da fileira no fim de cada temporada —
 * exatamente quando a pessoa mais provavelmente vai continuar.
 */
export function proximoEpisodio(titulo, episodioId) {
  const todos = episodiosEmOrdem(titulo);
  const posicao = todos.findIndex((e) => e.id === episodioId);

  return posicao >= 0 && posicao + 1 < todos.length ? todos[posicao + 1] : null;
}

/** O rótulo de um episódio dentro de um título. */
export function rotuloDoEpisodio(titulo, episodioId) {
  const episodio = episodiosEmOrdem(titulo).find((e) => e.id === episodioId);

  return episodio ? `T${episodio.temporada}:E${episodio.numero} · ${episodio.nome}` : '';
}

/**
 * Monta a fileira "continuar assistindo".
 *
 * Um título aparece **uma vez só**, mesmo com vários episódios começados: o
 * progresso mais recente é o que manda. E, quando o episódio terminou, a série
 * continua na fileira apontando para o próximo, no segundo zero.
 */
export function continuarAssistindo(progressos, catalogo, limite = ITENS_POR_FILEIRA) {
  const porTitulo = new Map();

  for (const progresso of progressos ?? []) {
    const titulo = catalogo.find((t) => t.id === progresso.tituloId);

    if (!titulo) continue;

    const anterior = porTitulo.get(titulo.id);
    const maisNovo = !anterior || quando(progresso) > quando(anterior);

    if (maisNovo) porTitulo.set(titulo.id, progresso);
  }

  const itens = [];

  for (const [id, progresso] of porTitulo) {
    const titulo = catalogo.find((t) => t.id === id);

    if (emAndamento(progresso)) {
      itens.push({
        ...titulo,
        fracao: fracaoDe(progresso),
        episodioId: progresso.episodioId ?? null,
        retomar: progresso.segundoAtual,
        quando: quando(progresso),
      });

      continue;
    }

    if (!concluido(progresso) || !progresso.episodioId) continue;

    const proximo = proximoEpisodio(titulo, progresso.episodioId);

    if (proximo) {
      itens.push({ ...titulo, fracao: 0, episodioId: proximo.id, retomar: 0, quando: quando(progresso) });
    }
  }

  return itens.sort((a, b) => b.quando - a.quando).slice(0, limite);
}

function quando(progresso) {
  const valor = new Date(progresso?.atualizadoEm ?? 0).getTime();

  return Number.isFinite(valor) ? valor : 0;
}

/**
 * As fileiras da tela inicial.
 *
 * Duas regras que evitam uma tela esquisita: **fileira vazia não aparece** —
 * uma faixa com título e nada embaixo parece defeito — e **nada se repete
 * entre fileiras**, porque ver o mesmo pôster três vezes na mesma tela faz o
 * catálogo parecer menor do que é.
 */
export function montarFileiras({ catalogo = [], progressos = [], lista = [] } = {}) {
  const visiveis = catalogo.filter((t) => t && !t.removido);
  const usados = new Set();
  const fileiras = [];

  const acrescentar = (nome, itens) => {
    const novos = (itens ?? []).filter((t) => t && !usados.has(t.id)).slice(0, ITENS_POR_FILEIRA);

    if (novos.length === 0) return;

    for (const item of novos) usados.add(item.id);

    fileiras.push({ nome, itens: novos });
  };

  acrescentar('Continuar assistindo', continuarAssistindo(progressos, visiveis));
  acrescentar('Minha lista', lista);
  acrescentar('Novidades no catálogo', visiveis);

  const porGenero = new Map();

  for (const titulo of visiveis) {
    for (const apelido of titulo.generos ?? []) {
      if (!porGenero.has(apelido)) porGenero.set(apelido, []);

      porGenero.get(apelido).push(titulo);
    }
  }

  // Em ordem alfabética para a tela ser estável entre dois carregamentos: uma
  // fileira que troca de lugar a cada F5 desorienta mais do que ajuda.
  for (const apelido of [...porGenero.keys()].sort()) {
    acrescentar(nomeDoGenero(apelido), porGenero.get(apelido));
  }

  return fileiras;
}

/** Onde retomar um título, ou zero se ele já acabou. */
export function retomarDe(progressos, tituloId, episodioId = null) {
  const achado = (progressos ?? []).find(
    (p) => p.tituloId === tituloId && (p.episodioId ?? null) === episodioId);

  if (!achado) return 0;

  return concluido(achado) ? 0 : achado.segundoAtual;
}

/** Segundos como relógio: 1:05:03 ou 4:07. */
export function relogio(segundos) {
  if (!Number.isFinite(segundos)) return '0:00';

  const total = Math.max(0, Math.round(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = total % 60;

  return horas > 0
    ? `${horas}:${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
    : `${minutos}:${String(resto).padStart(2, '0')}`;
}
