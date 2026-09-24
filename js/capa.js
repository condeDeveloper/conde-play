/**
 * As capas, desenhadas por código.
 *
 * O catálogo não guarda arte: guarda o nome e o id. A capa sai daí — um
 * degradê cuja matiz vem do id e a tipografia vem do nome.
 *
 * A decisão não é só estética. Um catálogo de demonstração com pôster de
 * verdade traz arte de terceiro para dentro do repositório sem necessidade
 * nenhuma, e ainda pesa alguns megabytes por título. Desenhar resolve os dois,
 * e de quebra a capa nunca fica quebrada: não há imagem para falhar.
 */

/** A paleta da marca, em vinho e grafite. */
export const PALETA = {
  vinho: '#A52A45',
  vinhoEscuro: '#541525',
  grafite: '#161B22',
  painel: '#1C2129',
  texto: '#F0F6FC',
  apagado: '#8B949E',
};

/**
 * Uma matiz estável a partir do id.
 *
 * O mesmo título tem sempre a mesma cor, entre recarregamentos e entre
 * dispositivos — uma cor sorteada a cada render faria a fileira "piscar" de
 * cores diferentes a cada visita, e a memória visual do catálogo se perderia.
 *
 * Os 137,5 graus são o ângulo áureo: ele espalha as matizes de modo que ids
 * vizinhos fiquem bem distantes no círculo cromático, em vez de saírem quase
 * iguais.
 */
export function matizDe(id) {
  return (Number(id) * 137.508) % 360;
}

/** As duas cores do degradê de uma capa. */
export function coresDe(id) {
  const matiz = matizDe(id);

  return {
    clara: `hsl(${matiz.toFixed(1)}, 42%, 34%)`,
    escura: `hsl(${((matiz + 24) % 360).toFixed(1)}, 48%, 14%)`,
  };
}

/** Quebra o nome em linhas que caibam na largura. */
function quebrar(nome, porLinha = 13) {
  const palavras = String(nome).split(/\s+/).filter(Boolean);
  const linhas = [];

  let atual = '';

  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;

    if (tentativa.length > porLinha && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }

  if (atual) linhas.push(atual);

  return linhas.slice(0, 4);
}

/** Escapa texto para entrar em SVG sem quebrar a marcação. */
function escapar(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Desenha a capa vertical de um título.
 *
 * @param {{id: number, nome: string, ano?: number, classificacao?: string}} titulo
 * @param {{largura?: number, altura?: number}} tamanho
 * @returns {string} um SVG
 */
export function capa(titulo, { largura = 300, altura = 450 } = {}) {
  const { clara, escura } = coresDe(titulo.id);
  const linhas = quebrar(titulo.nome);
  const alturaDaLinha = 34;
  const primeiraLinha = altura / 2 - ((linhas.length - 1) * alturaDaLinha) / 2;
  const id = `c${titulo.id}`;

  const textos = linhas
    .map((linha, i) =>
      `<text x="24" y="${primeiraLinha + i * alturaDaLinha}" class="n">${escapar(linha)}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="${escapar(titulo.nome)}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${clara}"/>
      <stop offset="1" stop-color="${escura}"/>
    </linearGradient>
  </defs>
  <style>
    .n { fill: #F0F6FC; font: 700 27px/1 system-ui, sans-serif; }
    .m { fill: rgba(240,246,252,.62); font: 500 15px system-ui, sans-serif; }
    .s { fill: rgba(240,246,252,.9); font: 700 13px system-ui, sans-serif; }
  </style>
  <rect width="${largura}" height="${altura}" fill="url(#${id})"/>
  <rect x="24" y="${primeiraLinha - 46}" width="46" height="4" fill="#F0F6FC" opacity=".85"/>
  ${textos}
  <text x="24" y="${altura - 30}" class="m">${escapar(titulo.ano ?? '')}</text>
  <rect x="${largura - 62}" y="${altura - 48}" width="38" height="24" rx="4" fill="rgba(0,0,0,.42)"/>
  <text x="${largura - 43}" y="${altura - 31}" class="s" text-anchor="middle">${escapar(titulo.classificacao ?? 'L')}</text>
</svg>`;
}

/** A mesma capa como URL, para entrar num `src` ou num `background-image`. */
export function capaComoUrl(titulo, tamanho) {
  // `encodeURIComponent` em vez de base64: o SVG continua legível no
  // inspetor, e o texto é curto o bastante para não importar.
  return `data:image/svg+xml,${encodeURIComponent(capa(titulo, tamanho))}`;
}

/** A arte horizontal do destaque. */
export function banner(titulo, { largura = 1280, altura = 620 } = {}) {
  const { clara, escura } = coresDe(titulo.id);
  const id = `b${titulo.id}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="${id}" x1="0.1" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${escura}"/>
      <stop offset="0.55" stop-color="${clara}"/>
      <stop offset="1" stop-color="${escura}"/>
    </linearGradient>
  </defs>
  <rect width="${largura}" height="${altura}" fill="url(#${id})"/>
  <circle cx="${largura * 0.76}" cy="${altura * 0.34}" r="${altura * 0.42}" fill="rgba(255,255,255,.05)"/>
  <circle cx="${largura * 0.62}" cy="${altura * 0.72}" r="${altura * 0.3}" fill="rgba(0,0,0,.12)"/>
</svg>`;
}

/** O banner como URL. */
export function bannerComoUrl(titulo, tamanho) {
  return `data:image/svg+xml,${encodeURIComponent(banner(titulo, tamanho))}`;
}

/** O avatar de um perfil: a inicial sobre a cor dele. */
export function avatar(perfil, tamanho = 120) {
  const inicial = escapar(String(perfil.nome ?? '?').trim().charAt(0).toUpperCase() || '?');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tamanho} ${tamanho}" role="img" aria-label="${escapar(perfil.nome)}">
  <rect width="${tamanho}" height="${tamanho}" rx="10" fill="${escapar(perfil.cor ?? PALETA.vinho)}"/>
  <text x="50%" y="50%" dy=".35em" text-anchor="middle"
        fill="#F0F6FC" font="700 ${Math.round(tamanho * 0.42)}px system-ui, sans-serif"
        style="font: 700 ${Math.round(tamanho * 0.42)}px system-ui, sans-serif">${inicial}</text>
</svg>`;
}

/** O avatar como URL. */
export function avatarComoUrl(perfil, tamanho) {
  return `data:image/svg+xml,${encodeURIComponent(avatar(perfil, tamanho))}`;
}
