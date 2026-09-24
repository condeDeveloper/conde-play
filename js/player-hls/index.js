/* Cópia de condeDeveloper/player-hls @ 5624c81. Este site não tem
   etapa de build, então a biblioteca vem embutida em vez de empacotada.
   Para alterar o player, altere lá e copie de novo. */

/**
 * player-hls — um player de HLS do zero, sobre MediaSource Extensions.
 */

export {
  ErroDeM3u8,
  ehMestra,
  ler,
  lerAtributos,
  lerMestra,
  lerMidia,
  lerResolucao,
  resolver,
  segmentoEm,
} from './m3u8.js';

export { Adaptador, EstimadorDeBanda } from './adaptacao.js';
export { ErroDeBuffer, FilaDeBuffer, bufferAdiante, estaCarregado, faixasComoLista } from './buffer.js';
export { ErroDePlayer, PlayerHls } from './player.js';
