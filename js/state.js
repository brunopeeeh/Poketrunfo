/**
 * PokeTrunfo - State Management
 */

export const DIFFICULTY_CONFIG = {
  easy: {
    name: 'Fácil',
    cardsCount: 10,
    hp: 1000,
    badgeColor: '#10b981',
    description: '10 Cartas & 1000 HP'
  },
  medium: {
    name: 'Médio',
    cardsCount: 5,
    hp: 500,
    badgeColor: '#f59e0b',
    description: '5 Cartas & 500 HP'
  },
  hard: {
    name: 'Difícil',
    cardsCount: 3,
    hp: 300,
    badgeColor: '#ef4444',
    description: '3 Cartas & 300 HP'
  }
};

export const state = {
  difficulty: 'easy',
  initialHp: 1000,
  initialCardsCount: 10,
  playerHp: 1000,
  cpuHp: 1000,
  playerDeck: [],
  cpuDeck: [],
  playerInventory: [], // Coleção completa de cartas do jogador
  activeWager: { playerCard: null, cpuCard: null }, // Cartas em aposta para esta partida
  disputePot: [], // Cartas acumuladas em caso de empate
  currentTurn: 'player', // 'player' | 'cpu'
  coinChoice: null, // 'cara' | 'coroa'
  coinResult: null, // 'cara' | 'coroa'
  gameState: 'difficulty_select', // 'difficulty_select' | 'deck_builder' | 'wager_select' | 'coin_toss' | 'battle' | 'round_result' | 'game_over'
  roundNumber: 1,
  selectedAttribute: null,
  isAnimating: false,
  stats: {
    roundsWon: 0,
    roundsLost: 0,
    ties: 0,
    evolutionsDone: 0,
    damageDealt: 0,
    damageTaken: 0
  },
  lastRoundInfo: null
};

export function resetGameState(difficultyKey = 'easy') {
  const config = DIFFICULTY_CONFIG[difficultyKey] || DIFFICULTY_CONFIG.easy;
  state.difficulty = difficultyKey;
  state.initialHp = config.hp;
  state.initialCardsCount = config.cardsCount;
  state.playerHp = config.hp;
  state.cpuHp = config.hp;
  state.playerDeck = [];
  state.cpuDeck = [];
  state.activeWager = { playerCard: null, cpuCard: null };
  state.disputePot = [];
  state.currentTurn = 'player';
  state.coinChoice = null;
  state.coinResult = null;
  state.gameState = 'coin_toss';
  state.roundNumber = 1;
  state.selectedAttribute = null;
  state.isAnimating = false;
  state.stats = {
    roundsWon: 0,
    roundsLost: 0,
    ties: 0,
    evolutionsDone: 0,
    damageDealt: 0,
    damageTaken: 0
  };
  state.lastRoundInfo = null;
}
