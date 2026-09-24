/**
 * O CondePlay.
 *
 * Junta as três peças: o catálogo (da API `catalogo`, ou embutido), as capas
 * desenhadas por código e o player HLS escrito do zero.
 *
 * Sem framework e sem etapa de build: são módulos ES carregados direto pelo
 * navegador. O que organiza o código não é uma biblioteca, é a separação entre
 * *de onde vêm os dados* (`api.js`), *como as coisas são desenhadas*
 * (`capa.js`) e *o que acontece quando se clica* — que é este arquivo.
 */

import { Api } from './api.js';
import { avatarComoUrl, banner, capaComoUrl } from './capa.js';
import { PlayerHls } from './player-hls/index.js';
import {
  montarFileiras,
  nomeDoGenero,
  relogio,
  retomarDe,
  rotuloDoEpisodio,
} from './fileiras.js';

/** A API local, quando estiver no ar. */
const BASE_DA_API = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : null;

const api = new Api({ base: BASE_DA_API });

const $ = (id) => document.getElementById(id);

const estado = {
  perfil: null,
  catalogo: [],
  progresso: [],
  lista: [],
  secao: 'inicio',
  tocando: null,
  player: null,
};

// ------------------------------------------------------------------ início

async function comecar() {
  await api.conectar();

  $('aviso-fonte').textContent = api.online
    ? 'Conectado à API local do catálogo.'
    : 'Catálogo de demonstração embutido — a API não está no ar.';

  $('credito-midia').textContent =
    'Conteúdo do catálogo é fictício. As mídias são fluxos HLS públicos de teste, publicados para desenvolvimento de player.';

  const escolhido = api.perfilEscolhido();
  const perfis = await api.perfis();

  if (escolhido && perfis.some((p) => p.id === escolhido)) {
    await entrar(perfis.find((p) => p.id === escolhido));

    return;
  }

  mostrarPerfis(perfis);
}

function mostrarPerfis(perfis) {
  const lista = $('perfis');

  lista.innerHTML = '';

  for (const perfil of perfis) {
    const item = document.createElement('li');
    const botao = document.createElement('button');

    botao.type = 'button';
    botao.className = perfil.infantil ? 'infantil' : '';
    botao.innerHTML = `<img src="${avatarComoUrl(perfil)}" alt=""><span>${escapar(perfil.nome)}</span>`;
    botao.addEventListener('click', () => entrar(perfil));

    item.append(botao);
    lista.append(item);
  }

  $('tela-perfis').hidden = false;
  $('app').hidden = true;
}

async function entrar(perfil) {
  estado.perfil = perfil;
  api.escolherPerfil(perfil.id);

  $('tela-perfis').hidden = true;
  $('app').hidden = false;
  $('trocar-perfil').style.backgroundImage = `url("${avatarComoUrl(perfil, 68)}")`;

  await recarregar();
  irPara('inicio');
}

/** Rebusca tudo que depende do perfil. */
async function recarregar() {
  const [catalogo, progresso, lista] = await Promise.all([
    api.catalogo(estado.perfil),
    api.progresso(estado.perfil),
    api.lista(estado.perfil),
  ]);

  estado.catalogo = catalogo;
  estado.progresso = progresso;
  estado.lista = lista;
}

// -------------------------------------------------------------- desenho

function cartao(titulo) {
  const botao = document.createElement('button');

  botao.type = 'button';
  botao.className = 'cartao';
  botao.title = titulo.nome;

  const barra = titulo.fracao > 0
    ? `<span class="barra"><i style="width:${Math.round(titulo.fracao * 100)}%"></i></span>`
    : '';

  const rotulo = titulo.episodioId
    ? `<span class="rotulo">${escapar(rotuloDoEpisodio(titulo, titulo.episodioId))}</span>`
    : '';

  botao.innerHTML = `<img src="${capaComoUrl(titulo)}" alt="${escapar(titulo.nome)}" loading="lazy">${rotulo}${barra}`;
  botao.addEventListener('click', () => abrirFicha(titulo.id));

  return botao;
}

function desenharFileiras() {
  const alvo = $('fileiras');

  alvo.innerHTML = '';

  const fileiras = montarFileiras({
    catalogo: estado.catalogo,
    progressos: estado.progresso,
    lista: estado.lista,
  });

  for (const fileira of fileiras) {
    const secao = document.createElement('section');

    secao.className = 'fileira';

    const titulo = document.createElement('h3');

    titulo.textContent = fileira.nome;

    const trilho = document.createElement('div');

    trilho.className = 'trilho';

    for (const item of fileira.itens) trilho.append(cartao(item));

    secao.append(titulo, trilho);
    alvo.append(secao);
  }
}

function desenharHeroi() {
  const destaque = estado.catalogo.find((t) => t.destaque) ?? estado.catalogo[0];

  if (!destaque) {
    $('heroi').hidden = true;

    return;
  }

  $('heroi').hidden = false;
  $('heroi-arte').innerHTML = banner(destaque);
  $('heroi-tipo').textContent = destaque.tipo === 'Serie' ? 'Série' : 'Filme';
  $('heroi-nome').textContent = destaque.nome;
  $('heroi-meta').innerHTML = metaDe(destaque);
  $('heroi-sinopse').textContent = destaque.sinopse ?? '';

  $('heroi-assistir').onclick = () => tocar(destaque.id);
  $('heroi-detalhes').onclick = () => abrirFicha(destaque.id);
}

function metaDe(titulo) {
  const partes = [`<span class="selo">${escapar(titulo.classificacao ?? 'L')}</span>`, String(titulo.ano ?? '')];

  if (titulo.tipo === 'Filme' && titulo.duracaoEmMinutos) {
    partes.push(`${titulo.duracaoEmMinutos} min`);
  }

  if (titulo.tipo === 'Serie' && titulo.temporadas) {
    const quantas = titulo.temporadas.length;

    partes.push(`${quantas} temporada${quantas > 1 ? 's' : ''}`);
  }

  partes.push((titulo.generos ?? []).map(nomeDoGenero).join(' · '));

  return partes.filter(Boolean).join('<span> </span>');
}

// ---------------------------------------------------------------- seções

function irPara(secao, texto = null) {
  estado.secao = secao;

  for (const botao of document.querySelectorAll('.menu button')) {
    botao.classList.toggle('ativo', botao.dataset.secao === secao);
  }

  const inicio = secao === 'inicio';

  $('heroi').hidden = !inicio;
  $('fileiras').hidden = !inicio;
  $('resultados').hidden = inicio;

  if (inicio) {
    desenharHeroi();
    desenharFileiras();

    return;
  }

  const porSecao = {
    series: () => ({ titulo: 'Séries', itens: estado.catalogo.filter((t) => t.tipo === 'Serie') }),
    filmes: () => ({ titulo: 'Filmes', itens: estado.catalogo.filter((t) => t.tipo === 'Filme') }),
    lista: () => ({ titulo: 'Minha lista', itens: estado.lista }),
    busca: () => ({ titulo: `Resultados para "${texto}"`, itens: [] }),
  };

  const { titulo, itens } = (porSecao[secao] ?? porSecao.filmes)();

  desenharGrade(titulo, itens);
}

function desenharGrade(titulo, itens) {
  $('resultados-titulo').textContent = titulo;
  $('resultados-vazio').hidden = itens.length > 0;

  const grade = $('resultados-grade');

  grade.innerHTML = '';

  for (const item of itens) grade.append(cartao(item));
}

// ----------------------------------------------------------------- ficha

async function abrirFicha(id) {
  const titulo = await api.titulo(id);

  if (!titulo) return;

  $('ficha-arte').innerHTML = banner(titulo, { largura: 720, altura: 320 });
  $('ficha-nome').textContent = titulo.nome;
  $('ficha-meta').innerHTML = metaDe(titulo);
  $('ficha-sinopse').textContent = titulo.sinopse ?? '';

  const creditos = $('ficha-creditos');

  creditos.innerHTML = '';

  const elenco = (titulo.elenco ?? []).map((e) => (typeof e === 'string' ? e : e.nome));

  for (const [rotulo, valor] of [
    ['Direção', (titulo.direcao ?? []).join(', ')],
    ['Elenco', elenco.join(', ')],
    ['Classificação', titulo.classificacaoPorExtenso ?? ''],
  ]) {
    if (!valor) continue;

    const dt = document.createElement('dt');
    const dd = document.createElement('dd');

    dt.textContent = rotulo;
    dd.textContent = valor;
    creditos.append(dt, dd);
  }

  await desenharBotaoDeLista(titulo);
  desenharTemporadas(titulo);

  $('ficha-assistir').onclick = () => {
    $('ficha').close();
    tocar(titulo.id);
  };

  $('ficha').showModal();
}

async function desenharBotaoDeLista(titulo) {
  const botao = $('ficha-lista');
  const dentro = await api.naLista(estado.perfil, titulo.id);

  botao.textContent = dentro ? '✓ Na minha lista' : '+ Minha lista';

  botao.onclick = async () => {
    await api.alternarNaLista(estado.perfil, titulo.id);
    estado.lista = await api.lista(estado.perfil);

    await desenharBotaoDeLista(titulo);

    if (estado.secao === 'inicio') desenharFileiras();
    else if (estado.secao === 'lista') irPara('lista');
  };
}

function desenharTemporadas(titulo) {
  const alvo = $('ficha-temporadas');

  alvo.innerHTML = '';

  if (titulo.tipo !== 'Serie' || !titulo.temporadas?.length) return;

  const seletor = document.createElement('select');

  for (const temporada of titulo.temporadas) {
    const opcao = document.createElement('option');

    opcao.value = String(temporada.numero);
    opcao.textContent = temporada.nome ?? `Temporada ${temporada.numero}`;
    seletor.append(opcao);
  }

  const lista = document.createElement('ul');

  lista.className = 'episodios';

  const desenhar = (numero) => {
    const temporada = titulo.temporadas.find((t) => t.numero === Number(numero));

    lista.innerHTML = '';

    for (const episodio of temporada?.episodios ?? []) {
      const item = document.createElement('li');
      const botao = document.createElement('button');

      botao.type = 'button';
      botao.innerHTML = `<span class="numero">${episodio.numero}</span>`
        + `<span class="nome">${escapar(episodio.nome)}</span>`
        + `<span class="duracao">${episodio.duracaoEmMinutos} min</span>`;

      botao.addEventListener('click', () => {
        $('ficha').close();
        tocar(titulo.id, episodio.id);
      });

      item.append(botao);
      lista.append(item);
    }
  };

  seletor.addEventListener('change', (e) => desenhar(e.target.value));
  desenhar(titulo.temporadas[0].numero);

  alvo.append(seletor, lista);
}

// -------------------------------------------------------------- reprodução

async function tocar(tituloId, episodioId = null) {
  const titulo = await api.titulo(tituloId);

  if (!titulo) return;

  let episodio = null;

  if (titulo.tipo === 'Serie') {
    const todos = (titulo.temporadas ?? []).flatMap((t) => t.episodios.map((e) => ({ ...e, temporada: t.numero })));

    episodio = todos.find((e) => e.id === episodioId) ?? todos[0];
  }

  const url = episodio?.midiaUrl ?? titulo.midiaUrl;

  if (!url) return;

  estado.tocando = { titulo, episodio };

  $('tocando-nome').textContent = titulo.nome;
  $('tocando-episodio').textContent = episodio ? `T${episodio.temporada}:E${episodio.numero} · ${episodio.nome}` : '';
  $('reprodutor').hidden = false;
  $('carregando').hidden = false;

  const video = $('video');

  estado.player?.parar();
  estado.player = new PlayerHls(video, { bufferAlvo: 30 });

  estado.player.addEventListener('qualidades', ({ detail }) => {
    const seletor = $('qualidade');

    seletor.innerHTML = '<option value="auto">Automática</option>';

    for (const q of detail.qualidades) {
      const opcao = document.createElement('option');

      opcao.value = String(q.indice);
      opcao.textContent = q.nome;
      seletor.append(opcao);
    }
  });

  estado.player.addEventListener('segmento', ({ detail }) => {
    $('medidor-banda').textContent = `${(detail.banda / 1e6).toFixed(1)} Mbps`;
    $('carregando').hidden = true;
  });

  estado.player.addEventListener('erro', ({ detail }) => {
    $('carregando').hidden = false;
    $('carregando').textContent = `não consegui tocar: ${detail.erro?.message ?? detail.erro}`;
  });

  try {
    await estado.player.carregar(url);
    await estado.player.prender(PlayerHls.tipoDe(estado.player.adaptador.variante));

    estado.player.iniciar();

    const retomar = retomarDe(estado.progresso, titulo.id, episodio?.id ?? null);

    if (retomar > 5) estado.player.saltarPara(retomar);

    await video.play().catch(() => {});
  } catch (erro) {
    $('carregando').textContent = `não consegui tocar: ${erro.message}`;
  }
}

function fecharReprodutor() {
  estado.player?.parar();
  estado.player = null;
  estado.tocando = null;

  $('reprodutor').hidden = true;
  $('carregando').textContent = 'carregando…';

  recarregar().then(() => irPara(estado.secao));
}

// -------------------------------------------------------------- controles

function ligarControlesDoPlayer() {
  const video = $('video');
  const linha = $('linha');

  $('voltar').addEventListener('click', fecharReprodutor);
  $('tocar').addEventListener('click', () => (video.paused ? video.play() : video.pause()));
  $('voltar-10').addEventListener('click', () => (video.currentTime -= 10));
  $('avancar-10').addEventListener('click', () => (video.currentTime += 10));

  $('tela-cheia').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else $('reprodutor').requestFullscreen?.();
  });

  video.addEventListener('play', () => ($('tocar').textContent = '❚❚'));
  video.addEventListener('pause', () => ($('tocar').textContent = '▶'));

  $('qualidade').addEventListener('change', (e) => {
    const valor = e.target.value;

    estado.player?.adaptador?.travar(valor === 'auto' ? null : Number(valor));
  });

  linha.addEventListener('input', () => {
    const duracao = duracaoAtual();

    if (duracao > 0) estado.player?.saltarPara((Number(linha.value) / 1000) * duracao);
  });

  // O progresso vai para o servidor a cada cinco segundos, não a cada quadro:
  // gravar em todo `timeupdate` faria umas quatro requisições por segundo.
  let ultimoEnvio = 0;

  video.addEventListener('timeupdate', () => {
    const duracao = duracaoAtual();

    if (duracao > 0) {
      linha.value = String(Math.round((video.currentTime / duracao) * 1000));
      $('tempo').textContent = `${relogio(video.currentTime)} / ${relogio(duracao)}`;
    }

    const abertura = estado.tocando?.episodio;

    $('pular-abertura').hidden = !(
      abertura?.aberturaComecaEm != null &&
      video.currentTime >= abertura.aberturaComecaEm &&
      video.currentTime < abertura.aberturaTerminaEm);

    const agora = Date.now();

    if (agora - ultimoEnvio > 5000 && estado.tocando) {
      ultimoEnvio = agora;

      api.gravarProgresso(estado.perfil, {
        tituloId: estado.tocando.titulo.id,
        episodioId: estado.tocando.episodio?.id ?? null,
        segundoAtual: video.currentTime,
        duracaoEmSegundos: duracao,
      });
    }
  });

  $('pular-abertura').addEventListener('click', () => {
    const fim = estado.tocando?.episodio?.aberturaTerminaEm;

    if (fim != null) estado.player?.saltarPara(fim);
  });

  // A camada some sozinha e volta ao primeiro movimento.
  let relogioDaCamada = null;

  const acordar = () => {
    $('camada').classList.remove('escondida');
    clearTimeout(relogioDaCamada);
    relogioDaCamada = setTimeout(() => {
      if (!video.paused) $('camada').classList.add('escondida');
    }, 3000);
  };

  $('reprodutor').addEventListener('mousemove', acordar);
  $('reprodutor').addEventListener('touchstart', acordar, { passive: true });
  video.addEventListener('pause', () => $('camada').classList.remove('escondida'));
}

/** A duração da mídia em reprodução, pela playlist. */
function duracaoAtual() {
  return estado.player?.midia?.duracaoTotal ?? $('video').duration ?? 0;
}

// -------------------------------------------------------------- ligações

function ligarInterface() {
  for (const botao of document.querySelectorAll('.menu button')) {
    botao.addEventListener('click', () => irPara(botao.dataset.secao));
  }

  $('ir-inicio').addEventListener('click', (e) => {
    e.preventDefault();
    irPara('inicio');
  });

  $('trocar-perfil').addEventListener('click', async () => {
    api.escolherPerfil(null);
    mostrarPerfis(await api.perfis());
  });

  $('ficha-fechar').addEventListener('click', () => $('ficha').close());

  // Uma busca por tecla dispararia uma consulta por letra digitada; o atraso
  // junta a rajada numa só.
  let relogioDaBusca = null;

  $('busca').addEventListener('input', (evento) => {
    clearTimeout(relogioDaBusca);

    relogioDaBusca = setTimeout(async () => {
      const texto = evento.target.value.trim();

      if (texto.length === 0) {
        irPara('inicio');

        return;
      }

      const achados = await api.buscar(texto, estado.perfil);

      estado.secao = 'busca';
      $('heroi').hidden = true;
      $('fileiras').hidden = true;
      $('resultados').hidden = false;

      for (const botao of document.querySelectorAll('.menu button')) botao.classList.remove('ativo');

      desenharGrade(`Resultados para "${texto}"`, achados);
    }, 220);
  });

  document.addEventListener('scroll', () => {
    $('topo').classList.toggle('rolado', window.scrollY > 10);
  }, { passive: true });

  document.addEventListener('keydown', (evento) => {
    if ($('reprodutor').hidden) return;

    if (evento.key === 'Escape') fecharReprodutor();

    if (evento.key === ' ') {
      evento.preventDefault();

      const video = $('video');

      video.paused ? video.play() : video.pause();
    }
  });

  ligarControlesDoPlayer();
}

/** Escapa texto antes de entrar em HTML. */
function escapar(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

ligarInterface();
comecar();

