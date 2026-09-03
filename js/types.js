/**
 * PokeTrunfo - Type System & Elemental Effectiveness Matrix
 * Suporte completo a cálculo de vantagens/desvantagens e Pokémon Dual-Type (1 ou 2 tipos).
 *
 * Esta camada é puramente numérica — nomes/cores de tipo (que variam por
 * idioma) são responsabilidade de quem consome o resultado (ui.js), não daqui.
 */

// Tabela de Efetividade de Tipos (Atacante -> Defensor)
// 2 = Super Efetivo, 0.5 = Pouco Efetivo, 0 = Imune/Sem Efeito, 1 = Dano Normal (padrão)
export const TYPE_CHART = {
  normal: {
    rock: 0.5,
    ghost: 0,
    steel: 0.5
  },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    steel: 2,
    fairy: 0.5
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    steel: 0.5
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    steel: 0.5,
    fairy: 0.5
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5
  },
  ghost: {
    normal: 0,
    psychic: 2,
    ghost: 2
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    steel: 0.5
  }
};

/**
 * Calcula a eficácia de um único tipo de ataque contra a combinação de tipos do defensor (1 ou 2 tipos).
 */
export function getSingleTypeMultiplier(attackType, defenderTypes) {
  if (!TYPE_CHART[attackType]) return 1;
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const eff = TYPE_CHART[attackType][defType];
    if (eff !== undefined) {
      multiplier *= eff;
    }
  }
  return multiplier;
}

/**
 * Calcula a melhor eficácia de um Pokémon atacante (usando qualquer um de seus tipos) contra o defensor.
 * Retorna o maior multiplicador obtido e qual tipo gerou essa vantagem.
 */
export function getBestAttackEffectiveness(attackerTypes, defenderTypes) {
  let bestMultiplier = 1;
  let bestAttackType = attackerTypes[0] || 'normal';

  for (const atkType of attackerTypes) {
    const mult = getSingleTypeMultiplier(atkType, defenderTypes);
    if (mult > bestMultiplier || (mult > 1 && bestMultiplier <= 1)) {
      bestMultiplier = mult;
      bestAttackType = atkType;
    }
  }

  return { multiplier: bestMultiplier, bestType: bestAttackType };
}

/**
 * Avalia o confronto elemental completo entre duas cartas (Jogador vs CPU).
 * Identifica se há Vantagem, Desvantagem ou Neutralidade, levando em conta Dual Types.
 * 
 * Regra:
 * - Se o Jogador tem maior eficácia de tipo sobre a CPU -> Jogador Vantagem (+20%)
 * - Se a CPU tem maior eficácia de tipo sobre o Jogador -> Jogador Desvantagem (-20%)
 * - Se ambos se anulam ou nenhum tem vantagem -> Neutro (1.0x)
 */
export function calculateTypeAdvantage(playerCard, cpuCard, activeTurn = 'player') {
  if (!playerCard || !cpuCard) {
    return {
      advantage: 'neutral',
      playerModifier: 1.0,
      cpuModifier: 1.0,
      comparisonSymbol: '=',
      playerType: 'normal',
      cpuType: 'normal',
      playerMultiplier: 1,
      cpuMultiplier: 1,
      caseId: 'neutral'
    };
  }

  const pTypes = playerCard.types || ['normal'];
  const cTypes = cpuCard.types || ['normal'];

  const playerAttack = getBestAttackEffectiveness(pTypes, cTypes);
  const cpuAttack = getBestAttackEffectiveness(cTypes, pTypes);

  const chosenPlayerType = playerAttack.bestType || pTypes[0];
  const chosenCpuType = cpuAttack.bestType || cTypes[0];

  let advantage = 'neutral'; // 'player' | 'cpu' | 'neutral'
  let comparisonSymbol = '=';
  let playerModifier = 1.0;
  let cpuModifier = 1.0;
  let caseId = 'neutral';

  if (playerAttack.multiplier > cpuAttack.multiplier && playerAttack.multiplier > 1) {
    advantage = 'player';
    comparisonSymbol = '>';
    if (activeTurn === 'player') {
      // Jogador atacou com vantagem -> Bônus +20%
      playerModifier = 1.20;
      caseId = 'player_attack_advantage';
    } else {
      // CPU atacou em desvantagem contra o Jogador -> CPU sofre penalidade -20%
      cpuModifier = 0.80;
      caseId = 'player_resist';
    }
  } else if (cpuAttack.multiplier > playerAttack.multiplier && cpuAttack.multiplier > 1) {
    advantage = 'cpu';
    comparisonSymbol = '<';
    if (activeTurn === 'player') {
      // Jogador atacou um oponente com vantagem -> Jogador sofre penalidade -20%
      playerModifier = 0.80;
      caseId = 'player_defend_disadvantage';
    } else {
      // CPU atacou com vantagem contra o Jogador -> CPU ganha bônus +20%
      cpuModifier = 1.20;
      caseId = 'cpu_attack_advantage';
    }
  }

  return {
    advantage,
    comparisonSymbol,
    playerModifier,
    cpuModifier,
    playerType: chosenPlayerType,
    cpuType: chosenCpuType,
    playerMultiplier: playerAttack.multiplier,
    cpuMultiplier: cpuAttack.multiplier,
    caseId
  };
}

/**
 * Lista os tipos que causam Super Efetivo (x2 ou mais) contra um Pokémon,
 * usado pelo indicador de fraqueza exibido na própria carta.
 */
export function getWeaknesses(types) {
  const defenderTypes = types || ['normal'];
  return Object.keys(TYPE_CHART)
    .map(atkType => ({ type: atkType, multiplier: getSingleTypeMultiplier(atkType, defenderTypes) }))
    .filter(w => w.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier);
}

/**
 * Lista os tipos contra os quais este Pokémon causa dano Super Efetivo (x2),
 * combinando os tipos de ataque do Pokémon (se for Dual-Type, une ambos).
 */
export function getStrengths(types) {
  const attackerTypes = types || ['normal'];
  const targets = new Map();

  for (const atkType of attackerTypes) {
    const chart = TYPE_CHART[atkType] || {};
    for (const [defType, mult] of Object.entries(chart)) {
      if (mult > 1) {
        const current = targets.get(defType) || 1;
        if (mult > current) {
          targets.set(defType, mult);
        }
      }
    }
  }

  return Array.from(targets.entries())
    .map(([type, multiplier]) => ({ type, multiplier }))
    .sort((a, b) => b.multiplier - a.multiplier);
}
