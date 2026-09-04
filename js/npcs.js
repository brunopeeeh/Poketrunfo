/**
 * PokeTrunfo - Treinadores (NPCs) desafiáveis
 *
 * Cada NPC é só dados: um tema de tipo, um teto de rank e um perfil de IA.
 * O tema de tipo é o que dá sentido ao deck builder — contra um oponente de
 * tipo conhecido, montar o baralho vira decisão estratégica em vez de enfeite.
 * O teto de rank faz o papel de curva de dificuldade, então não é preciso
 * inventar handicap artificial.
 */

import { GEN1_POKEMON_BASE, createCardFromBase, getPokemonRank } from './api.js';

// Ordem de força dos ranks, para comparar contra o teto de cada NPC
const RANK_ORDER = { C: 0, B: 1, A: 2, S: 3, SS: 4 };

export const NPCS = [
  {
    id: 'brock',
    // Avatar é o Pokémon-símbolo do treinador: a PokéAPI serve sprites de
    // Pokémon, não retratos de personagens, então nada de asset externo novo.
    avatarId: 95,          // Onix
    types: ['rock', 'ground'],
    maxRank: 'B',
    hpMultiplier: 1.15,
    ai: 'defensive',
    accent: '#a1887f'
  },
  {
    id: 'misty',
    avatarId: 121,         // Starmie
    types: ['water'],
    maxRank: 'A',
    hpMultiplier: 1.25,
    ai: 'special',
    accent: '#4fa4d8'
  },
  {
    id: 'gary',
    avatarId: 9,           // Blastoise
    types: null,           // baralho misto: sem tipo pra explorar
    maxRank: 'SS',
    hpMultiplier: 1.4,
    ai: 'smart',
    accent: '#a855f7'
  }
];

export function getNpcById(id) {
  return NPCS.find(n => n.id === id) || null;
}

/**
 * Monta o baralho temático do NPC: Pokémon do(s) tipo(s) dele, limitados ao
 * teto de rank. Se o pool temático não encher o baralho (Brock tem poucas
 * opções em rank C/B), completa com o pool geral dentro do mesmo teto — assim
 * a promessa de "oponente de Pedra" se mantém sem travar a montagem.
 */
export function buildNpcDeck(npc, count) {
  const ceiling = RANK_ORDER[npc.maxRank] ?? RANK_ORDER.SS;
  const withinRank = GEN1_POKEMON_BASE.filter(p => (RANK_ORDER[getPokemonRank(p)] ?? 0) <= ceiling);

  const themed = npc.types
    ? withinRank.filter(p => p.types.some(t => npc.types.includes(t)))
    : withinRank;

  const picked = [];
  const pool = [...themed];

  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }

  // Pool temático menor que o baralho: completa dentro do teto de rank.
  const filler = withinRank.length > 0 ? withinRank : GEN1_POKEMON_BASE;
  while (picked.length < count) {
    picked.push(filler[Math.floor(Math.random() * filler.length)]);
  }

  return picked.map(p => createCardFromBase(p));
}

// Cada perfil define a ordem de preferência dos atributos e o quanto o NPC
// erra (chance de não pegar a melhor opção). É isso que faz um treinador
// parecer diferente do outro — sem isso seriam três skins da mesma CPU.
export const AI_PROFILES = {
  // Padrão histórico da CPU: maior atributo 85% das vezes.
  balanced: { priority: null, errorRate: 0.15 },
  // Brock joga de muro: aposta em Defesa e HP mesmo quando não é o maior.
  defensive: { priority: ['defense', 'spDefense', 'hp'], errorRate: 0.25 },
  // Misty ataca pelo lado especial.
  special: { priority: ['spAttack', 'spDefense', 'speed'], errorRate: 0.15 },
  // Gary não tem atributo favorito: escolhe pela margem esperada contra o tipo
  // do adversário (ver chooseCpuAttribute) e quase não erra.
  smart: { priority: null, errorRate: 0.05, usesTypeAdvantage: true }
};

export function getAiProfile(npc) {
  return AI_PROFILES[npc?.ai] || AI_PROFILES.balanced;
}

const STAT_KEYS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];

/**
 * Média de cada atributo por tipo, no catálogo inteiro.
 *
 * É a única "leitura" que o Gary faz do adversário, e ela é justa: os tipos da
 * carta do jogador estão visíveis na mesa e essas médias são consultáveis na
 * Pokédex do próprio jogo. Espiar os números exatos da carta dele seria
 * trapaça — isto aqui é o que um jogador experiente faz de cabeça ("contra
 * Elétrico eu não disputo Velocidade").
 */
export const TYPE_STAT_AVERAGES = (() => {
  const acc = {};
  for (const p of GEN1_POKEMON_BASE) {
    for (const ty of p.types) {
      if (!acc[ty]) acc[ty] = { n: 0, ...Object.fromEntries(STAT_KEYS.map(k => [k, 0])) };
      acc[ty].n++;
      for (const k of STAT_KEYS) acc[ty][k] += p[k] || 0;
    }
  }
  const out = {};
  for (const [ty, v] of Object.entries(acc)) {
    out[ty] = Object.fromEntries(STAT_KEYS.map(k => [k, v[k] / v.n]));
  }
  return out;
})();

// Para um Pokémon de 2 tipos, assume o maior valor esperado entre os dois —
// é a leitura conservadora (respeita o lado mais forte do adversário).
export function expectedStatsFor(types) {
  const rows = (types || []).map(t => TYPE_STAT_AVERAGES[t]).filter(Boolean);
  if (rows.length === 0) return null;
  return Object.fromEntries(STAT_KEYS.map(k => [k, Math.max(...rows.map(r => r[k]))]));
}
