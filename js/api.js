/**
 * De onde vêm os dados.
 *
 * O site fala com a API `catalogo` quando ela está no ar e cai para o catálogo
 * embutido quando não está. Não é um remendo: é o que permite publicar esta
 * página no GitHub Pages, onde não existe servidor, e ainda assim navegar por
 * tudo — e é o que deixa o desenvolvimento local rodar contra a API de verdade
 * sem trocar uma linha.
 *
 * O que muda entre os dois modos é só a origem. A **forma** dos dados é a
 * mesma, e por isso a tela não sabe nem precisa saber de onde eles vieram.
 */

import { GENEROS, IDADE_DO_SELO, PERFIS, TITULOS } from './dados.js';

/** As chaves do que fica guardado no navegador. */
const CHAVE = {
  perfil: 'condeplay:perfil',
  lista: 'condeplay:lista',
  progresso: 'condeplay:progresso',
};

/** Lê JSON do armazenamento local sem deixar um erro derrubar a tela. */
function guardado(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);

    return bruto ? JSON.parse(bruto) : padrao;
  } catch {
    // Navegação anônima, armazenamento bloqueado, JSON corrompido: em todos
    // os casos começar do zero é melhor do que não abrir.
    return padrao;
  }
}

/** Grava, ignorando falha de cota ou de permissão. */
function guardar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento a sessão simplesmente não persiste.
  }
}

/** O cliente do catálogo. */
export class Api {
  /**
   * @param {{base?: string|null}} opcoes a URL da API, ou nulo para embutido
   */
  constructor({ base = null } = {}) {
    this.base = base;
    this.online = false;
  }

  /**
   * Descobre se a API está no ar.
   *
   * O prazo é curto de propósito: quando não há API, esperar cinco segundos
   * antes de mostrar a tela é pior do que mostrar o catálogo embutido na hora.
   */
  async conectar({ prazo = 1200 } = {}) {
    if (!this.base) return false;

    try {
      const controle = new AbortController();
      const relogio = setTimeout(() => controle.abort(), prazo);
      const resposta = await fetch(`${this.base}/saude`, { signal: controle.signal });

      clearTimeout(relogio);
      this.online = resposta.ok;
    } catch {
      this.online = false;
    }

    return this.online;
  }

  async buscarJson(caminho) {
    const resposta = await fetch(`${this.base}${caminho}`);

    if (!resposta.ok) throw new Error(`${caminho} respondeu ${resposta.status}`);

    return resposta.json();
  }

  /** Os perfis. */
  async perfis() {
    if (this.online) return this.buscarJson('/perfis');

    return PERFIS;
  }

  /** Os gêneros. */
  async generos() {
    if (this.online) return this.buscarJson('/generos');

    return GENEROS;
  }

  /** Um título com tudo dentro. */
  async titulo(id) {
    if (this.online) return this.buscarJson(`/titulos/${id}`);

    return TITULOS.find((t) => t.id === Number(id)) ?? null;
  }

  /** O catálogo visível para um perfil. */
  async catalogo(perfil) {
    if (this.online) {
      const pagina = await this.buscarJson(`/titulos?tamanho=100&perfilId=${perfil.id}`);

      return pagina.itens;
    }

    return TITULOS.filter((t) => (IDADE_DO_SELO[t.classificacao] ?? 18) <= perfil.idadeMaxima);
  }

  /** A busca. */
  async buscar(texto, perfil) {
    if (this.online) {
      const pagina = await this.buscarJson(
        `/titulos?busca=${encodeURIComponent(texto)}&tamanho=50&perfilId=${perfil.id}`);

      return pagina.itens;
    }

    const alvo = normalizar(texto);
    const termos = alvo.split(' ').filter(Boolean);

    if (termos.length === 0) return [];

    return (await this.catalogo(perfil)).filter((titulo) => {
      const onde = normalizar(
        [titulo.nome, ...(titulo.elenco ?? []), ...(titulo.direcao ?? [])].join(' '));

      return termos.every((termo) => onde.includes(termo));
    });
  }

  // ------------------------------------------------ o que é pessoal

  /**
   * A lista, o progresso e o perfil escolhido ficam no navegador quando não
   * há API. É o suficiente para a demonstração e some se a pessoa limpar o
   * armazenamento — o que é honesto: sem servidor, não há onde guardar.
   */

  perfilEscolhido() {
    return guardado(CHAVE.perfil, null);
  }

  escolherPerfil(id) {
    guardar(CHAVE.perfil, id);
  }

  async lista(perfil) {
    if (this.online) return this.buscarJson(`/perfis/${perfil.id}/lista`);

    const ids = guardado(CHAVE.lista, {})[perfil.id] ?? [];
    const catalogo = await this.catalogo(perfil);

    return ids.map((id) => catalogo.find((t) => t.id === id)).filter(Boolean);
  }

  async naLista(perfil, tituloId) {
    return (await this.lista(perfil)).some((t) => t.id === Number(tituloId));
  }

  async alternarNaLista(perfil, tituloId) {
    const id = Number(tituloId);

    if (this.online) {
      const dentro = await this.naLista(perfil, id);
      const metodo = dentro ? 'DELETE' : 'POST';

      await fetch(`${this.base}/perfis/${perfil.id}/lista/${id}`, { method: metodo });

      return !dentro;
    }

    const tudo = guardado(CHAVE.lista, {});
    const atual = tudo[perfil.id] ?? [];
    const dentro = atual.includes(id);

    tudo[perfil.id] = dentro ? atual.filter((x) => x !== id) : [id, ...atual];
    guardar(CHAVE.lista, tudo);

    return !dentro;
  }

  /** Todo o progresso do perfil. */
  async progresso(perfil) {
    if (this.online) return this.buscarJson(`/perfis/${perfil.id}/progresso`);

    return guardado(CHAVE.progresso, {})[perfil.id] ?? [];
  }

  /** Grava onde a reprodução parou. */
  async gravarProgresso(perfil, { tituloId, episodioId = null, segundoAtual, duracaoEmSegundos }) {
    if (!(duracaoEmSegundos > 0)) return;

    const limitado = Math.min(Math.max(0, Math.round(segundoAtual)), Math.round(duracaoEmSegundos));

    if (this.online) {
      await fetch(`${this.base}/perfis/${perfil.id}/progresso`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tituloId, episodioId, segundoAtual: limitado, duracaoEmSegundos }),
      });

      return;
    }

    const tudo = guardado(CHAVE.progresso, {});
    const doPerfil = tudo[perfil.id] ?? [];
    const igual = (p) => p.tituloId === tituloId && (p.episodioId ?? null) === episodioId;
    const resto = doPerfil.filter((p) => !igual(p));

    resto.unshift({
      tituloId,
      episodioId,
      segundoAtual: limitado,
      duracaoEmSegundos,
      atualizadoEm: new Date().toISOString(),
    });

    tudo[perfil.id] = resto.slice(0, 60);
    guardar(CHAVE.progresso, tudo);
  }
}

/** A mesma normalização da API: sem acento, em minúsculas. */
export function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
