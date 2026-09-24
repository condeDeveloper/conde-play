import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  concluido,
  continuarAssistindo,
  emAndamento,
  episodiosEmOrdem,
  montarFileiras,
  nomeDoGenero,
  proximoEpisodio,
  relogio,
  retomarDe,
  rotuloDoEpisodio,
} from '../js/fileiras.js';
import { TITULOS } from '../js/dados.js';
import { capa, coresDe, matizDe } from '../js/capa.js';

const SERIE = TITULOS.find((t) => t.nome === 'Litoral');
const FILME = TITULOS.find((t) => t.nome === 'Cidade de Vidro');

const progresso = (extra) => ({
  tituloId: FILME.id,
  episodioId: null,
  segundoAtual: 0,
  duracaoEmSegundos: 7080,
  atualizadoEm: '2026-09-24T12:00:00Z',
  ...extra,
});

describe('quando algo conta como "começado"', () => {
  it('espiar dez segundos não conta', () => {
    assert.equal(emAndamento(progresso({ segundoAtual: 10 })), false);
  });

  it('em conteúdo curto vale o piso em segundos, não a fração', () => {
    // Num episódio de 3 minutos, 2% são menos de 4 segundos — tempo de errar
    // o clique.
    assert.equal(emAndamento(progresso({ segundoAtual: 40, duracaoEmSegundos: 180 })), true);
  });

  it('quem chegou perto do fim está concluído, e sai da fileira', () => {
    const quase = progresso({ segundoAtual: 6700 });

    assert.equal(concluido(quase), true);
    assert.equal(emAndamento(quase), false);
  });

  it('duração zero não conta como nada', () => {
    assert.equal(emAndamento(progresso({ segundoAtual: 100, duracaoEmSegundos: 0 })), false);
    assert.equal(concluido(progresso({ duracaoEmSegundos: 0 })), false);
  });
});

describe('a fileira "continuar assistindo"', () => {
  it('traz o filme no meio, com a barra preenchida', () => {
    const fileira = continuarAssistindo([progresso({ segundoAtual: 3540 })], TITULOS);

    assert.equal(fileira.length, 1);
    assert.equal(fileira[0].id, FILME.id);
    assert.ok(Math.abs(fileira[0].fracao - 0.5) < 0.01);
    assert.equal(fileira[0].retomar, 3540);
  });

  it('não traz o que só foi espiado', () => {
    assert.deepEqual(continuarAssistindo([progresso({ segundoAtual: 5 })], TITULOS), []);
  });

  it('episódio terminado aponta para o próximo, no segundo zero', () => {
    const primeiro = SERIE.temporadas[0].episodios[0];

    const fileira = continuarAssistindo(
      [progresso({ tituloId: SERIE.id, episodioId: primeiro.id, segundoAtual: 2500, duracaoEmSegundos: 2520 })],
      TITULOS,
    );

    assert.equal(fileira.length, 1);
    assert.equal(fileira[0].episodioId, SERIE.temporadas[0].episodios[1].id);
    assert.equal(fileira[0].retomar, 0);
    assert.equal(fileira[0].fracao, 0);
  });

  it('o último episódio da série tira ela da fileira', () => {
    const ultimo = SERIE.temporadas.at(-1).episodios.at(-1);

    const fileira = continuarAssistindo(
      [progresso({ tituloId: SERIE.id, episodioId: ultimo.id, segundoAtual: 2500, duracaoEmSegundos: 2520 })],
      TITULOS,
    );

    assert.deepEqual(fileira, []);
  });

  it('a série aparece uma vez só, no episódio mais recente', () => {
    const episodios = SERIE.temporadas[0].episodios;

    const progressos = episodios.slice(0, 3).map((e, i) =>
      progresso({
        tituloId: SERIE.id,
        episodioId: e.id,
        segundoAtual: 600,
        duracaoEmSegundos: 2520,
        atualizadoEm: `2026-09-24T12:0${i}:00Z`,
      }));

    const fileira = continuarAssistindo(progressos, TITULOS);

    assert.equal(fileira.length, 1);
    assert.equal(fileira[0].episodioId, episodios[2].id, 'o mais recente é o que vale');
  });

  it('progresso de título que não está no catálogo é ignorado', () => {
    // Acontece quando um título sai do ar ou quando o perfil é infantil.
    assert.deepEqual(continuarAssistindo([progresso({ tituloId: 9999 })], TITULOS), []);
  });

  it('sai do mais recente para o mais antigo', () => {
    const progressos = [
      progresso({ tituloId: 1, segundoAtual: 3000, atualizadoEm: '2026-09-20T12:00:00Z' }),
      progresso({ tituloId: 2, segundoAtual: 3000, atualizadoEm: '2026-09-24T12:00:00Z' }),
    ];

    assert.deepEqual(continuarAssistindo(progressos, TITULOS).map((t) => t.id), [2, 1]);
  });
});

describe('a ordem dos episódios', () => {
  it('atravessa a virada de temporada', () => {
    // Sem isso a série some da fileira no fim de cada temporada — justamente
    // quando a pessoa mais provavelmente vai continuar.
    const ultimoDaPrimeira = SERIE.temporadas[0].episodios.at(-1);
    const proximo = proximoEpisodio(SERIE, ultimoDaPrimeira.id);

    assert.ok(proximo);
    assert.equal(proximo.numero, 1);
    assert.equal(proximo.temporada, 2);
  });

  it('o último da série não leva a lugar nenhum', () => {
    const ultimo = SERIE.temporadas.at(-1).episodios.at(-1);

    assert.equal(proximoEpisodio(SERIE, ultimo.id), null);
  });

  it('filme não tem episódio nenhum', () => {
    assert.deepEqual(episodiosEmOrdem(FILME), []);
    assert.equal(proximoEpisodio(FILME, 1), null);
  });

  it('a lista sai em ordem, temporada por temporada', () => {
    const todos = episodiosEmOrdem(SERIE);

    assert.equal(todos.length, 6);
    assert.deepEqual(todos.map((e) => `${e.temporada}x${e.numero}`), ['1x1', '1x2', '1x3', '1x4', '2x1', '2x2']);
  });

  it('o rótulo traz temporada, episódio e nome', () => {
    const primeiro = SERIE.temporadas[0].episodios[0];

    assert.equal(rotuloDoEpisodio(SERIE, primeiro.id), `T1:E1 · ${primeiro.nome}`);
    assert.equal(rotuloDoEpisodio(SERIE, 9999), '');
  });
});

describe('as fileiras da tela inicial', () => {
  it('nenhuma fileira sai vazia', () => {
    // Uma faixa com título e nada embaixo parece defeito.
    const fileiras = montarFileiras({ catalogo: TITULOS });

    assert.ok(fileiras.length > 0);
    assert.ok(fileiras.every((f) => f.itens.length > 0));
    assert.ok(!fileiras.some((f) => f.nome === 'Continuar assistindo'));
    assert.ok(!fileiras.some((f) => f.nome === 'Minha lista'));
  });

  it('o mesmo título não aparece em duas fileiras', () => {
    // Ver o mesmo pôster três vezes faz o catálogo parecer menor do que é.
    const fileiras = montarFileiras({
      catalogo: TITULOS,
      progressos: [progresso({ segundoAtual: 3540 })],
      lista: [TITULOS[1]],
    });

    const ids = fileiras.flatMap((f) => f.itens.map((i) => i.id));

    assert.equal(new Set(ids).size, ids.length);
  });

  it('continuar assistindo vem antes de minha lista, e as duas antes dos gêneros', () => {
    const fileiras = montarFileiras({
      catalogo: TITULOS,
      progressos: [progresso({ segundoAtual: 3540 })],
      lista: [TITULOS[1]],
    });

    assert.equal(fileiras[0].nome, 'Continuar assistindo');
    assert.equal(fileiras[1].nome, 'Minha lista');
    assert.equal(fileiras[2].nome, 'Novidades no catálogo');
  });

  it('os gêneros saem em ordem alfabética, para a tela não dançar a cada F5', () => {
    const fileiras = montarFileiras({ catalogo: TITULOS });
    const generos = fileiras.slice(1).map((f) => f.nome);

    assert.deepEqual(generos, [...generos].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  });

  it('catálogo vazio não produz fileira nenhuma', () => {
    assert.deepEqual(montarFileiras({ catalogo: [] }), []);
    assert.deepEqual(montarFileiras(), []);
  });
});

describe('onde retomar', () => {
  it('devolve o segundo guardado', () => {
    assert.equal(retomarDe([progresso({ segundoAtual: 1200 })], FILME.id), 1200);
  });

  it('o que já acabou recomeça do zero', () => {
    assert.equal(retomarDe([progresso({ segundoAtual: 7000 })], FILME.id), 0);
  });

  it('sem progresso, começa do zero', () => {
    assert.equal(retomarDe([], FILME.id), 0);
    assert.equal(retomarDe(null, FILME.id), 0);
  });

  it('o episódio é parte da chave', () => {
    const progressos = [progresso({ tituloId: SERIE.id, episodioId: 101, segundoAtual: 900 })];

    assert.equal(retomarDe(progressos, SERIE.id, 101), 900);
    assert.equal(retomarDe(progressos, SERIE.id, 102), 0);
  });
});

describe('o relógio', () => {
  it('formata com e sem hora', () => {
    assert.equal(relogio(0), '0:00');
    assert.equal(relogio(65), '1:05');
    assert.equal(relogio(3903), '1:05:03');
  });

  it('valor inválido não quebra a tela', () => {
    assert.equal(relogio(NaN), '0:00');
    assert.equal(relogio(Infinity), '0:00');
    assert.equal(relogio(-5), '0:00');
  });
});

describe('as capas desenhadas', () => {
  it('a cor é estável: o mesmo id dá sempre a mesma', () => {
    // Uma cor sorteada a cada render faria a fileira piscar de cores
    // diferentes a cada visita.
    assert.equal(matizDe(7), matizDe(7));
    assert.deepEqual(coresDe(3), coresDe(3));
  });

  it('ids vizinhos ficam longe no círculo cromático', () => {
    // É para isso que serve o ângulo áureo: sem ele, 1, 2 e 3 sairiam quase
    // da mesma cor.
    const distancia = Math.abs(matizDe(1) - matizDe(2));

    assert.ok(Math.min(distancia, 360 - distancia) > 90, `ficaram a ${distancia}°`);
  });

  it('o SVG traz o nome e a classificação', () => {
    const svg = capa({ id: 1, nome: 'Cidade de Vidro', ano: 2024, classificacao: '12' });

    assert.match(svg, /^<svg xmlns=/);
    assert.ok(svg.includes('Cidade de'));
    assert.ok(svg.includes('2024'));
    assert.ok(svg.includes('>12<'));
  });

  it('nome com caractere de marcação é escapado', () => {
    // Sem escapar, um nome com "<" quebraria o SVG inteiro.
    const svg = capa({ id: 1, nome: 'A & B <script>', ano: 2024 });

    assert.ok(!svg.includes('<script>'));
    assert.ok(svg.includes('&amp;'));
    assert.ok(svg.includes('&lt;script&gt;'));
  });

  it('nome comprido é quebrado em até quatro linhas', () => {
    const svg = capa({ id: 1, nome: 'Um nome absurdamente comprido que não cabe de jeito nenhum numa linha só', ano: 2024 });
    const linhas = (svg.match(/class="n"/g) ?? []).length;

    assert.ok(linhas > 1 && linhas <= 4, `deu ${linhas} linhas`);
  });
});

describe('os nomes dos gêneros', () => {
  it('traduzem o apelido', () => {
    assert.equal(nomeDoGenero('ficcao'), 'Ficção científica');
    assert.equal(nomeDoGenero('acao'), 'Ação');
  });

  it('apelido desconhecido sai como veio, em vez de sumir', () => {
    assert.equal(nomeDoGenero('inventado'), 'inventado');
  });
});
