/**
 * PokeTrunfo - Persistência local (localStorage)
 * Guarda a coleção de Pokémon já capturados e estatísticas somadas entre partidas.
 * Não salva o estado de uma partida em andamento — só progresso entre jogos.
 */

import { GEN1_POKEMON_BASE } from './api.js';

const COLLECTION_KEY = 'poketrunfo_collection_v1';
const LIFETIME_KEY = 'poketrunfo_lifetime_v1';
const LANG_KEY = 'poketrunfo_lang_v1';
const INVENTORY_KEY = 'poketrunfo_inventory_v2';
const BOOSTER_NEXT_KEY = 'poketrunfo_booster_next_v1';

// Tempo padrão de recarga do booster: 4 horas (em milissegundos)
export const BOOSTER_COOLDOWN_MS = 4 * 60 * 60 * 1000;

const LIFETIME_DEFAULTS = {
  gamesPlayed: 0,
  gamesWon: 0,
  roundsWon: 0,
  roundsLost: 0,
  evolutionsDone: 0
};

// Cartas salvas antes da introdução de HP/Ataque Especial/Defesa Especial não têm
// esses campos. Preenche a partir do catálogo base, usando o mesmo bônus de
// evolução já aplicado ao ataque (createCardFromBase aplica o bônus a todos os stats).
function backfillCardStats(card) {
  if (card.hp !== undefined && card.spAttack !== undefined && card.spDefense !== undefined) {
    return card;
  }
  const base = GEN1_POKEMON_BASE.find(p => p.id === card.id);
  if (!base) return card;
  const bonus = (card.attack ?? base.attack) - base.attack;
  return {
    ...card,
    hp: card.hp ?? (base.hp + bonus),
    spAttack: card.spAttack ?? (base.spAttack + bonus),
    spDefense: card.spDefense ?? (base.spDefense + bonus)
  };
}

export function loadInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    return raw ? JSON.parse(raw).map(backfillCardStats) : null;
  } catch {
    return null;
  }
}

export function saveInventory(cards) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(cards));
  } catch {
    // localStorage indisponível
  }
}

export function loadNextBoosterTime() {
  try {
    const raw = localStorage.getItem(BOOSTER_NEXT_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function saveNextBoosterTime(timestamp) {
  try {
    localStorage.setItem(BOOSTER_NEXT_KEY, String(timestamp));
  } catch {
    // localStorage indisponível
  }
}

export function isBoosterAvailable() {
  const nextTime = loadNextBoosterTime();
  return Date.now() >= nextTime;
}

export function loadCollection() {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveCollection(idsSet) {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify([...idsSet]));
  } catch {
    // localStorage indisponível (modo privado, storage bloqueado etc.) — segue sem persistir
  }
}

export function loadLifetimeStats() {
  try {
    const raw = localStorage.getItem(LIFETIME_KEY);
    return raw ? { ...LIFETIME_DEFAULTS, ...JSON.parse(raw) } : { ...LIFETIME_DEFAULTS };
  } catch {
    return { ...LIFETIME_DEFAULTS };
  }
}

export function saveLifetimeStats(stats) {
  try {
    localStorage.setItem(LIFETIME_KEY, JSON.stringify(stats));
  } catch {
    // idem
  }
}

export function loadLanguage() {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // idem
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export function saveLanguage(lang) {
  try {
    localStorage.setItem(LANG_KEY, JSON.stringify(lang));
  } catch {
    // idem
  }
}
