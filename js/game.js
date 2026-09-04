/**
 * PokeTrunfo - Core Game Logic & Rules Engine
 */

import { GEN1_POKEMON_BASE, createCardFromBase, drawWeightedPokemonList } from './api.js';
import { buildNpcDeck, getAiProfile, expectedStatsFor } from './npcs.js';
import { calculateTypeAdvantage } from './types.js';
import { state, resetGameState } from './state.js';
import { sound } from './audio.js';
import { saveInventory, loadInventory, saveNextBoosterTime, BOOSTER_COOLDOWN_MS } from './storage.js';

// Embaralha um array com Fisher-Yates
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sorteia N cartas ponderadas por probabilidade de rank
export function drawRandomDeck(count) {
  const weightedPokemon = drawWeightedPokemonList(count);
  return weightedPokemon.map(p => createCardFromBase(p));
}

// Gera o Pacote Inicial (Starter Pack) com 20 cartas aleatórias ponderadas
export function generateStarterPack(count = 20) {
  const cards = drawWeightedPokemonList(count).map(p => createCardFromBase(p));
  state.playerInventory = cards;
  saveInventory(cards);
  return cards;
}

// Abre um Booster com 5 cartas aleatórias e define o próximo cooldown
export function openBoosterPack(count = 5) {
  const newCards = drawWeightedPokemonList(count).map(p => createCardFromBase(p));
  
  // Adiciona ao inventário do jogador
  if (!state.playerInventory) state.playerInventory = [];
  state.playerInventory.push(...newCards);
  saveInventory(state.playerInventory);

  // Define próximo horário de resgate do booster (4 horas a partir de agora)
  const nextClaim = Date.now() + BOOSTER_COOLDOWN_MS;
  saveNextBoosterTime(nextClaim);

  return newCards;
}

// Inicializa uma nova partida com base na dificuldade (sorteio aleatório)
export function startNewGame(difficulty = 'easy') {
  resetGameState(difficulty);
  state.playerDeck = drawRandomDeck(state.initialCardsCount);
  state.cpuDeck = drawRandomDeck(state.initialCardsCount);
  state.gameState = 'coin_toss';
  return state;
}

// Inicializa uma nova partida com o baralho montado a partir do inventário e com cartas em aposta
export function startNewGameWithPlayerDeck(difficulty, chosenCards, playerWagerCard = null, npc = null) {
  resetGameState(difficulty);
  // Garante que cada carta no baralho seja uma cópia ativa independente para o duelo
  state.playerDeck = chosenCards.map(c => ({ ...c }));

  // Contra um treinador o baralho da CPU é temático (tipo + teto de rank) e o
  // HP dele é escalado — é o que substitui um handicap artificial.
  if (npc) {
    state.activeNpc = npc;
    state.cpuDeck = buildNpcDeck(npc, state.initialCardsCount);
    state.initialCpuHp = Math.round(state.initialHp * (npc.hpMultiplier || 1));
    state.cpuHp = state.initialCpuHp;
  } else {
    state.cpuDeck = drawRandomDeck(state.initialCardsCount);
  }

  // Define a carta apostada pelo jogador
  const pWager = playerWagerCard || state.playerDeck[0];
  // CPU aposta uma carta aleatória de rank comparável do baralho dela
  const cpuWager = state.cpuDeck[Math.floor(Math.random() * state.cpuDeck.length)];

  state.activeWager = {
    playerCard: pWager,
    cpuCard: cpuWager
  };

  state.gameState = 'coin_toss';
  return state;
}

// Resolve a aposta de cartas no final da partida
export function resolveWager(playerWon) {
  if (!state.activeWager || !state.activeWager.playerCard || !state.activeWager.cpuCard) {
    return null;
  }

  let inventory = (state.playerInventory && state.playerInventory.length > 0)
    ? state.playerInventory
    : (loadInventory() || []);
  let cardWon = null;
  let cardLost = null;
  let rescueGranted = false;

  if (playerWon) {
    // Jogador GANHA a carta da CPU e adiciona ao seu inventário permanente
    cardWon = { ...state.activeWager.cpuCard, uid: `${state.activeWager.cpuCard.id}-${Date.now()}-won` };
    inventory.push(cardWon);
  } else {
    // Jogador PERDE a carta apostada do seu inventário permanente
    cardLost = state.activeWager.playerCard;
    const lostIdx = inventory.findIndex(c => c.uid === cardLost.uid || c.id === cardLost.id);
    if (lostIdx !== -1) {
      inventory.splice(lostIdx, 1);
    }

    // Mecanismo de segurança: se o inventário ficar abaixo de 5 cartas, dá um pacote de emergência
    if (inventory.length < 5) {
      const rescueCards = drawWeightedPokemonList(5).map(p => createCardFromBase(p));
      inventory.push(...rescueCards);
      rescueGranted = true;
    }
  }

  state.playerInventory = inventory;
  saveInventory(inventory);

  return {
    playerWon,
    cardWon,
    cardLost,
    rescueGranted,
    currentInventoryCount: inventory.length
  };
}

// Executa o sorteio da moeda Cara ou Coroa
export function resolveCoinToss(playerChoice) {
  const result = Math.random() < 0.5 ? 'cara' : 'coroa';
  state.coinChoice = playerChoice;
  state.coinResult = result;
  
  const isPlayerWinner = playerChoice === result;
  state.currentTurn = isPlayerWinner ? 'player' : 'cpu';
  
  return {
    choice: playerChoice,
    result: result,
    playerStarts: isPlayerWinner
  };
}

// Verifica se existem 3 cartas iguais no deck para permitir evolução
export function findEvolvablePokemon(deck) {
  const counts = {};
  deck.forEach(card => {
    counts[card.id] = (counts[card.id] || 0) + 1;
  });

  const evolvableIds = Object.keys(counts)
    .filter(id => counts[id] >= 3)
    .map(id => Number(id));

  return evolvableIds.map(id => {
    const base = GEN1_POKEMON_BASE.find(p => p.id === id);
    return {
      id,
      name: base ? base.name : `Pokémon #${id}`,
      count: counts[id],
      base
    };
  });
}

// Executa a fusão/evolução de 3 cartas iguais
export function performEvolution(pokemonId) {
  // Encontra as 3 cartas correspondentes no deck do jogador
  const matchingIndices = [];
  state.playerDeck.forEach((card, index) => {
    if (card.id === pokemonId && matchingIndices.length < 3) {
      matchingIndices.push(index);
    }
  });

  if (matchingIndices.length < 3) {
    return { success: false, reasonCode: 'not_enough_cards' };
  }

  // Remove as 3 cartas do deck da partida (do maior índice para o menor)
  matchingIndices.sort((a, b) => b - a);
  matchingIndices.forEach(idx => {
    state.playerDeck.splice(idx, 1);
  });

  // Cria a carta aprimorada com +1 em todos os atributos
  const base = GEN1_POKEMON_BASE.find(p => p.id === pokemonId);
  const upgradedCard = createCardFromBase(base, true, 1);
  upgradedCard.name = `★ ${base.name} (Evoluído)`;

  // Adiciona a carta aprimorada no início/topo do deck
  state.playerDeck.unshift(upgradedCard);
  state.stats.evolutionsDone++;

  // Reflete a evolução no inventário permanente do jogador
  if (state.playerInventory && state.playerInventory.length > 0) {
    let removed = 0;
    const newInv = [];
    for (const card of state.playerInventory) {
      if (card.id === pokemonId && removed < 3 && !card.isEvolved) {
        removed++;
      } else {
        newInv.push(card);
      }
    }
    if (removed === 3) {
      newInv.unshift(upgradedCard);
      state.playerInventory = newInv;
      saveInventory(newInv);
    }
  }

  sound.playEvolution();

  return {
    success: true,
    card: upgradedCard,
    pokemonName: base.name
  };
}

// IA do Computador para escolher o melhor atributo
export function chooseCpuAttribute(cpuCard) {
  const stats = [
    { attr: 'hp', value: cpuCard.hp },
    { attr: 'attack', value: cpuCard.attack },
    { attr: 'defense', value: cpuCard.defense },
    { attr: 'spAttack', value: cpuCard.spAttack },
    { attr: 'spDefense', value: cpuCard.spDefense },
    { attr: 'speed', value: cpuCard.speed }
  ];

  const profile = getAiProfile(state.activeNpc);

  // Gary escolhe pela MARGEM esperada, não pelo maior número: para cada
  // atributo estima quanto o adversário provavelmente tem (média do tipo dele)
  // e disputa onde a folga é maior. Só usa informação pública — os tipos, que
  // estão visíveis na mesa. Aplicar o modificador elemental sozinho não
  // adiantaria nada: ele multiplica todos os atributos igualmente e não muda
  // qual é o maior.
  if (profile.usesTypeAdvantage && state.playerDeck.length > 0) {
    const playerCard = state.playerDeck[0];
    const adv = calculateTypeAdvantage(playerCard, cpuCard, 'cpu');
    const factor = adv?.cpuModifier ?? 1;
    const expected = expectedStatsFor(playerCard.types);
    stats.forEach(s => {
      s.score = expected ? (s.value * factor) - expected[s.attr] : s.value * factor;
    });
  } else {
    stats.forEach(s => { s.score = s.value; });
  }

  // Perfis com preferência (Brock, Misty) empurram seus atributos favoritos
  // pra frente da fila. O peso é forte o bastante pra criar um padrão que o
  // jogador aprende a ler e explorar, mas não a ponto de fazer o NPC escolher
  // um atributo fraco quando tem outro muito superior — aí seria só burrice.
  if (profile.priority) {
    stats.forEach(s => {
      const rank = profile.priority.indexOf(s.attr);
      if (rank !== -1) s.score *= 1.6 - rank * 0.15;
    });
  }

  stats.sort((a, b) => b.score - a.score);

  return Math.random() < profile.errorRate ? stats[1].attr : stats[0].attr;
}

// Executa uma rodada da disputa com regras de vantagens elementais
export function playRound(selectedAttribute) {
  if (state.playerDeck.length === 0 || state.cpuDeck.length === 0) {
    return checkGameOver();
  }

  state.selectedAttribute = selectedAttribute;
  
  // Pega as cartas ativas no topo dos baralhos
  const playerCard = state.playerDeck[0];
  const cpuCard = state.cpuDeck[0];

  // Calcula a vantagem elemental entre as cartas (com suporte a Dual-Type)
  const typeAdvantage = calculateTypeAdvantage(playerCard, cpuCard, state.currentTurn);

  const rawPlayerVal = playerCard[selectedAttribute];
  const rawCpuVal = cpuCard[selectedAttribute];

  // Aplica os modificadores (+20% para vantagem, -20% para penalidade)
  const playerVal = Math.round(rawPlayerVal * typeAdvantage.playerModifier);
  const cpuVal = Math.round(rawCpuVal * typeAdvantage.cpuModifier);

  const rawDiff = Math.abs(playerVal - cpuVal);
  // Dano mínimo de 5 para garantir progresso da partida
  const damage = Math.max(rawDiff, 5);

  let winner = null; // 'player' | 'cpu' | 'tie'
  let damageDealt = 0;
  let cardsWon = [];

  if (playerVal > cpuVal) {
    winner = 'player';
    damageDealt = damage;
    state.cpuHp = Math.max(0, state.cpuHp - damage);
    state.stats.damageDealt += damage;
    state.stats.roundsWon++;

    // Jogador ganha a carta do oponente + a sua própria + pote de disputa
    const wonCpuCard = state.cpuDeck.shift();
    const myCard = state.playerDeck.shift();
    cardsWon = [wonCpuCard, myCard, ...state.disputePot];
    
    // Adiciona cartas ganhas ao fim do deck do jogador
    state.playerDeck.push(...cardsWon);
    state.disputePot = [];

  } else if (cpuVal > playerVal) {
    winner = 'cpu';
    damageDealt = damage;
    state.playerHp = Math.max(0, state.playerHp - damage);
    state.stats.damageTaken += damage;
    state.stats.roundsLost++;

    // CPU ganha a carta do jogador + a sua própria + pote de disputa
    const wonPlayerCard = state.playerDeck.shift();
    const myCpuCard = state.cpuDeck.shift();
    cardsWon = [wonPlayerCard, myCpuCard, ...state.disputePot];

    // Adiciona cartas ganhas ao fim do deck da CPU
    state.cpuDeck.push(...cardsWon);
    state.disputePot = [];

  } else {
    winner = 'tie';
    state.stats.ties++;

    // Em caso de empate, ambas as cartas vão para o pote de disputa
    const pCard = state.playerDeck.shift();
    const cCard = state.cpuDeck.shift();
    state.disputePot.push(pCard, cCard);
  }

  // O turno sempre alterna a cada rodada, independente de quem venceu
  state.currentTurn = state.currentTurn === 'player' ? 'cpu' : 'player';

  // Embaralha levemente o restante do baralho para manter a aleatoriedade
  state.playerDeck = shuffle(state.playerDeck);
  state.cpuDeck = shuffle(state.cpuDeck);

  state.roundNumber++;

  const roundResult = {
    round: state.roundNumber - 1,
    attribute: selectedAttribute,
    playerCard,
    cpuCard,
    rawPlayerVal,
    rawCpuVal,
    playerVal,
    cpuVal,
    typeAdvantage,
    winner,
    damage: damageDealt,
    disputePotCount: state.disputePot.length,
    gameOver: isGameOver()
  };

  state.lastRoundInfo = roundResult;
  return roundResult;
}

// Verifica se o jogo acabou
export function isGameOver() {
  return (
    state.playerHp <= 0 ||
    state.cpuHp <= 0 ||
    state.playerDeck.length === 0 ||
    state.cpuDeck.length === 0
  );
}

// Retorna informações detalhadas do fim de jogo
export function checkGameOver() {
  if (!isGameOver()) return null;

  let playerWon = false;
  let reasonCode = '';

  if (state.cpuHp <= 0) {
    playerWon = true;
    reasonCode = 'cpu_hp_zero';
  } else if (state.cpuDeck.length === 0) {
    playerWon = true;
    reasonCode = 'cpu_no_cards';
  } else if (state.playerHp <= 0) {
    playerWon = false;
    reasonCode = 'player_hp_zero';
  } else if (state.playerDeck.length === 0) {
    playerWon = false;
    reasonCode = 'player_no_cards';
  }

  state.gameState = 'game_over';

  return {
    isGameOver: true,
    playerWon,
    reasonCode,
    stats: { ...state.stats },
    playerFinalHp: state.playerHp,
    cpuFinalHp: state.cpuHp,
    playerCardsRemaining: state.playerDeck.length,
    cpuCardsRemaining: state.cpuDeck.length
  };
}
