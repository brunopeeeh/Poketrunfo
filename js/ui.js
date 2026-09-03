/**
 * PokeTrunfo - UI Rendering, Event Handlers & Combat Animations
 */

import {
  TYPE_TRANSLATIONS,
  getTypeName,
  getPokemonArtwork,
  GEN1_POKEMON_BASE,
  createCardFromBase,
  RANK_CONFIG,
  drawSingleWeightedPokemon
} from './api.js';
import { state, DIFFICULTY_CONFIG } from './state.js';
import { sound } from './audio.js';
import { TYPE_CHART, calculateTypeAdvantage, getWeaknesses } from './types.js';
import {
  loadCollection,
  saveCollection,
  loadLifetimeStats,
  saveLifetimeStats,
  loadInventory,
  saveInventory,
  loadNextBoosterTime,
  saveNextBoosterTime,
  isBoosterAvailable
} from './storage.js';
import { t, getLang, setLang, applyStaticI18n } from './i18n.js';
import {
  startNewGame,
  startNewGameWithPlayerDeck,
  generateStarterPack,
  openBoosterPack,
  resolveWager,
  resolveCoinToss,
  playRound,
  chooseCpuAttribute,
  findEvolvablePokemon,
  performEvolution,
  checkGameOver
} from './game.js';

// Elementos do DOM
const screens = {
  menu: document.getElementById('screen-menu'),
  collection: document.getElementById('screen-collection'),
  deckbuilder: document.getElementById('screen-deckbuilder'),
  wager: document.getElementById('screen-wager'),
  coin: document.getElementById('screen-coin'),
  battle: document.getElementById('screen-battle')
};

const modals = {
  rules: document.getElementById('modal-rules'),
  evolve: document.getElementById('modal-evolve'),
  gameover: document.getElementById('modal-gameover'),
  pokedex: document.getElementById('modal-pokedex'),
  booster: document.getElementById('modal-booster'),
  starter: document.getElementById('modal-starter')
};

// Canvas para Confetti
let confettiCanvas = null;
let confettiCtx = null;
let confettiParticles = [];
let confettiAnimId = null;

// Timer de Booster
let boosterTimerInterval = null;

export function initUI() {
  applyStaticI18n();
  updateMuteButtonLabel();
  updateLangButtonLabel();
  setupEventListeners();
  setupConfetti();
  startBoosterTimer();

  // Verifica inventário do jogador; se estiver vazio/novo, entrega o Starter Pack de 20 cartas!
  const existingInventory = loadInventory();
  if (!existingInventory || existingInventory.length === 0) {
    const starterCards = generateStarterPack(20);
    state.playerInventory = starterCards;
    setupStarterModal(starterCards);
    openModal(modals.starter);
  } else {
    state.playerInventory = existingInventory;
  }

  showScreen('menu');
}

function updateMuteButtonLabel() {
  const muteBtn = document.getElementById('btn-mute');
  if (!muteBtn) return;
  muteBtn.innerHTML = `<span>${sound.isMuted ? '🔇' : '🔊'}</span> ${sound.isMuted ? t('header.soundOff') : t('header.soundOn')}`;
}

function updateLangButtonLabel() {
  const label = document.getElementById('btn-lang-label');
  if (label) label.textContent = getLang() === 'pt' ? 'EN' : 'PT';
}

// Re-renderiza só as partes dinâmicas (geradas via innerHTML em JS) que estão
// visíveis agora — não mexe na tela de batalha em si pra não quebrar animações
// de rodada em andamento; o texto de lá se atualiza no próximo renderArena().
function refreshVisibleDynamicText() {
  if (!modals.pokedex?.classList.contains('hidden')) {
    renderPokedexGrid(document.getElementById('pokedex-browse-search')?.value || '');
    renderPokedexSlots();
    renderPokedexChart();
    runPokedexQuery();
  }
  if (!screens.deckbuilder?.classList.contains('hidden')) {
    renderDeckBuilderGrid(document.getElementById('deckbuilder-search')?.value || '');
    renderDeckBuilderTray();
  }
  if (!screens.battle?.classList.contains('hidden')) {
    updateStatusBars();
    updateCenterControls();
    checkEvolutionAvailability();
  }
  if (!screens.collection?.classList.contains('hidden')) {
    updateCollectionDashboard();
    renderCollectionGridAndInspector();
  }
}

// Alterna telas
export function showScreen(screenKey) {
  Object.values(screens).forEach(s => s?.classList.add('hidden'));
  if (screens[screenKey]) {
    screens[screenKey].classList.remove('hidden');
  }
}

// ==========================================================================
// Modais: abrir com foco no primeiro elemento, Esc fecha, Tab não escapa do
// modal, e o foco volta pra quem abriu ao fechar (a11y básica de diálogo).
// ==========================================================================
let lastFocusedBeforeModal = null;

function getFocusableIn(container) {
  return Array.from(
    container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.disabled && el.offsetParent !== null);
}

function openModal(modalEl) {
  if (!modalEl) return;
  lastFocusedBeforeModal = document.activeElement;
  modalEl.classList.remove('hidden');
  getFocusableIn(modalEl)[0]?.focus();
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('hidden');
  lastFocusedBeforeModal?.focus?.();
}

document.addEventListener('keydown', (e) => {
  const openOverlay = Object.values(modals).find(m => m && !m.classList.contains('hidden'));
  if (!openOverlay) return;

  if (e.key === 'Escape') {
    sound.playClick();
    closeModal(openOverlay);
    return;
  }

  if (e.key === 'Tab') {
    const focusable = getFocusableIn(openOverlay);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// ==========================================================================
// Modo Rápido: encurta os delays de animação da batalha para quem já
// conhece o jogo e quer avançar rodadas mais rápido.
// ==========================================================================
let fastMode = false;
const wait = (ms) => fastMode ? Math.round(ms / 3) : ms;

// Dificuldade escolhida no menu, usada ao abrir o Deck Builder
let selectedDifficulty = 'easy';

// Configura ouvintes de eventos
function setupEventListeners() {
  // Controle de Áudio
  const muteBtn = document.getElementById('btn-mute');
  muteBtn?.addEventListener('click', () => {
    sound.toggleMute();
    updateMuteButtonLabel();
  });

  // Idioma
  const langBtn = document.getElementById('btn-lang');
  langBtn?.addEventListener('click', () => {
    sound.playClick();
    setLang(getLang() === 'pt' ? 'en' : 'pt');
    applyStaticI18n();
    updateMuteButtonLabel();
    updateLangButtonLabel();
    refreshVisibleDynamicText();
  });

  // Modal de Regras
  const rulesBtn = document.getElementById('btn-rules');
  rulesBtn?.addEventListener('click', () => {
    sound.playClick();
    openModal(modals.rules);
  });

  // Modal da Pokédex de Consulta
  const pokedexBtn = document.getElementById('btn-pokedex');
  pokedexBtn?.addEventListener('click', () => {
    sound.playClick();
    openModal(modals.pokedex);
  });
  setupPokedexModal();

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sound.playClick();
      closeModal(e.target.closest('.modal-overlay'));
    });
  });

  // Modo Rápido
  const fastBtn = document.getElementById('btn-fast');
  fastBtn?.addEventListener('click', () => {
    sound.playClick();
    fastMode = !fastMode;
    fastBtn.classList.toggle('active', fastMode);
    fastBtn.setAttribute('aria-pressed', String(fastMode));
  });

  // Volume
  const volumeSlider = document.getElementById('volume-slider');
  volumeSlider?.addEventListener('input', () => {
    sound.setVolume(Number(volumeSlider.value) / 100);
  });

  // Seleção de Dificuldade
  const diffCards = document.querySelectorAll('.difficulty-card');
  diffCards.forEach(card => {
    card.addEventListener('click', () => {
      sound.playClick();
      diffCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedDifficulty = card.dataset.diff;
    });
  });

  // Booster Claim Button (Header)
  const boosterClaimBtn = document.getElementById('btn-booster-claim');
  boosterClaimBtn?.addEventListener('click', () => {
    sound.playClick();
    openBoosterModal();
  });

  // Coleção (Header e Menu Principal)
  const inventoryBtn = document.getElementById('btn-inventory');
  inventoryBtn?.addEventListener('click', () => {
    sound.playClick();
    openCollectionScreen();
  });

  const menuCollectionBtn = document.getElementById('btn-menu-collection');
  menuCollectionBtn?.addEventListener('click', () => {
    sound.playClick();
    openCollectionScreen();
  });

  const collectionBackBtn = document.getElementById('btn-collection-back');
  collectionBackBtn?.addEventListener('click', () => {
    sound.playClick();
    showScreen('menu');
  });

  const colBoosterBtn = document.getElementById('btn-collection-booster-claim');
  colBoosterBtn?.addEventListener('click', () => {
    sound.playClick();
    openBoosterModal();
  });

  setupCollectionToolbar();

  // Botões do Modal do Booster
  const claimBoosterBtn = document.getElementById('btn-claim-booster');
  claimBoosterBtn?.addEventListener('click', () => {
    sound.playClick();
    closeModal(modals.booster);
    if (!screens.collection?.classList.contains('hidden')) {
      updateCollectionDashboard();
      renderCollectionGridAndInspector();
    }
  });

  const devBoosterBtn = document.getElementById('btn-booster-dev-reset');
  devBoosterBtn?.addEventListener('click', () => {
    sound.playClick();
    saveNextBoosterTime(0);
    updateBoosterButtonState();
    closeModal(modals.booster);
    setTimeout(() => openBoosterModal(), 200);
  });

  // Starter Pack Confirm
  const starterConfirmBtn = document.getElementById('btn-starter-confirm');
  starterConfirmBtn?.addEventListener('click', () => {
    sound.playClick();
    closeModal(modals.starter);
    openDeckBuilder(selectedDifficulty);
  });

  // Wager Screen Confirm & Back
  const wagerConfirmBtn = document.getElementById('btn-wager-confirm');
  wagerConfirmBtn?.addEventListener('click', () => {
    sound.playClick();
    const wagerCard = deckBuilderSelection[selectedWagerIndex] || deckBuilderSelection[0];
    startNewGameWithPlayerDeck(selectedDifficulty, deckBuilderSelection, wagerCard);
    setupCoinScreen();
    showScreen('coin');
  });

  const wagerBackBtn = document.getElementById('btn-wager-back');
  wagerBackBtn?.addEventListener('click', () => {
    sound.playClick();
    showScreen('deckbuilder');
  });

  // Iniciar Jogo -> Vai para o Deck Builder
  const startBtn = document.getElementById('btn-start-game');
  startBtn?.addEventListener('click', () => {
    sound.playClick();
    openDeckBuilder(selectedDifficulty);
  });

  setupDeckBuilder();

  // Cara ou Coroa - Escolha do Jogador
  const coinChoiceBtns = document.querySelectorAll('.coin-choice-btn');
  coinChoiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.isAnimating) return;
      sound.playClick();
      const choice = btn.dataset.choice; // 'cara' | 'coroa'
      handleCoinToss(choice);
    });
  });

  // Botão de Avançar da Moeda para Batalha
  const toBattleBtn = document.getElementById('btn-to-battle');
  toBattleBtn?.addEventListener('click', () => {
    sound.playClick();
    showScreen('battle');
    renderArena();
    if (state.currentTurn === 'cpu') {
      triggerCpuTurn();
    }
  });

  // Botão de Próxima Rodada
  const nextRoundBtn = document.getElementById('btn-next-round');
  nextRoundBtn?.addEventListener('click', () => {
    sound.playClick();
    nextRoundBtn.classList.add('hidden');
    renderArena();
    if (state.currentTurn === 'cpu') {
      triggerCpuTurn();
    }
  });

  // Botão de Analisar o Confronto Atual na Pokédex
  const analyzeBtn = document.getElementById('btn-analyze-matchup');
  analyzeBtn?.addEventListener('click', () => {
    sound.playClick();
    openMatchupInPokedex();
  });

  // Botão de Evoluir Pokémon
  const evolveTriggerBtn = document.getElementById('btn-evolve-trigger');
  evolveTriggerBtn?.addEventListener('click', () => {
    sound.playClick();
    openEvolveModal();
  });

  // Botão de Jogar Novamente no Game Over
  const restartBtn = document.getElementById('btn-restart');
  restartBtn?.addEventListener('click', () => {
    sound.playClick();
    closeModal(modals.gameover);
    stopConfetti();
    showScreen('menu');
  });
}

// Configuração da tela de Cara ou Coroa
function setupCoinScreen() {
  const coin = document.getElementById('coin-3d');
  const resultBanner = document.getElementById('coin-result-banner');
  const toBattleBtn = document.getElementById('btn-to-battle');
  const choiceBtns = document.getElementById('coin-choice-buttons');

  if (coin) {
    coin.className = 'coin';
    coin.style.transform = 'rotateY(0deg)';
  }
  resultBanner?.classList.add('hidden');
  toBattleBtn?.classList.add('hidden');
  choiceBtns?.classList.remove('hidden');
  state.isAnimating = false;
}

// Execução do Arremesso da Moeda
function handleCoinToss(playerChoice) {
  state.isAnimating = true;
  const choiceBtns = document.getElementById('coin-choice-buttons');
  choiceBtns?.classList.add('hidden');

  const coin = document.getElementById('coin-3d');
  const tossResult = resolveCoinToss(playerChoice);

  sound.playCoinToss();

  // Aplica classe de animação 3D correspondente
  if (coin) {
    coin.className = 'coin';
    void coin.offsetWidth; // Força reflow
    coin.classList.add(tossResult.result === 'cara' ? 'flipping-cara' : 'flipping-coroa');
  }

  setTimeout(() => {
    sound.playCoinLand();
    state.isAnimating = false;
    const resultBanner = document.getElementById('coin-result-banner');
    const toBattleBtn = document.getElementById('btn-to-battle');

    if (resultBanner) {
      resultBanner.classList.remove('hidden');
      const resultName = tossResult.result === 'cara' ? t('coin.cara') : t('coin.coroa');
      if (tossResult.playerStarts) {
        resultBanner.className = 'coin-result-banner win';
        resultBanner.innerHTML = t('coin.resultWin', { result: resultName });
      } else {
        resultBanner.className = 'coin-result-banner lose';
        resultBanner.innerHTML = t('coin.resultLose', { result: resultName });
      }
    }

    if (toBattleBtn) {
      toBattleBtn.classList.remove('hidden');
    }
  }, 2100);
}

// Renderiza a Arena de Combate
export function renderArena() {
  updateStatusBars();
  renderPlayerCard();
  revealPlayerCard();
  renderCpuCard(true); // CPU card face-down no início do turno
  updateCenterControls();
  document.getElementById('arena-matchup-container')?.classList.add('hidden');
  checkEvolutionAvailability();
  recordCapture(state.playerDeck);
}

// Vira a carta do jogador (efeito de "virar do baralho") a cada nova rodada,
// espelhando o flip que a carta da CPU já tinha. Trava clique durante o giro
// reaproveitando state.isAnimating, que os listeners de stat-row já respeitam.
function revealPlayerCard() {
  const cardEl = document.getElementById('p1-active-card');
  if (!cardEl) return;

  const wasPlayerTurn = state.currentTurn === 'player';
  cardEl.classList.add('flipped');
  if (wasPlayerTurn) state.isAnimating = true;

  setTimeout(() => {
    sound.playCardFlip();
    cardEl.classList.remove('flipped');
    if (wasPlayerTurn) {
      setTimeout(() => {
        state.isAnimating = false;
      }, 650);
    }
  }, wait(300));
}

// Atualiza barras de HP e contadores de baralho
function updateStatusBars() {
  // Player
  const playerHpBar = document.getElementById('player-hp-fill');
  const playerHpText = document.getElementById('player-hp-text');
  const playerDeckCount = document.getElementById('player-deck-count');
  
  const playerHpPct = Math.max(0, (state.playerHp / state.initialHp) * 100);
  if (playerHpBar) {
    playerHpBar.style.width = `${playerHpPct}%`;
    playerHpBar.className = 'hp-bar-fill';
    if (playerHpPct <= 25) playerHpBar.classList.add('critical');
    else if (playerHpPct <= 50) playerHpBar.classList.add('warning');
  }
  if (playerHpText) playerHpText.textContent = `${state.playerHp} / ${state.initialHp} HP`;
  if (playerDeckCount) playerDeckCount.textContent = t('battle.cardsCount', { count: state.playerDeck.length });

  // CPU
  const cpuHpBar = document.getElementById('cpu-hp-fill');
  const cpuHpText = document.getElementById('cpu-hp-text');
  const cpuDeckCount = document.getElementById('cpu-deck-count');

  const cpuHpPct = Math.max(0, (state.cpuHp / state.initialHp) * 100);
  if (cpuHpBar) {
    cpuHpBar.style.width = `${cpuHpPct}%`;
    cpuHpBar.className = 'hp-bar-fill';
    if (cpuHpPct <= 25) cpuHpBar.classList.add('critical');
    else if (cpuHpPct <= 50) cpuHpBar.classList.add('warning');
  }
  if (cpuHpText) cpuHpText.textContent = `${state.cpuHp} / ${state.initialHp} HP`;
  if (cpuDeckCount) cpuDeckCount.textContent = t('battle.cardsCount', { count: state.cpuDeck.length });
}

// Atualiza painel central
function updateCenterControls() {
  const turnBadge = document.getElementById('arena-turn-badge');
  const actionText = document.getElementById('arena-action-text');
  const potBadge = document.getElementById('arena-pot-badge');
  const nextRoundBtn = document.getElementById('btn-next-round');

  if (potBadge) {
    if (state.disputePot.length > 0) {
      potBadge.classList.remove('hidden');
      potBadge.textContent = t('battle.pot', { count: state.disputePot.length });
    } else {
      potBadge.classList.add('hidden');
    }
  }

  if (turnBadge) {
    if (state.currentTurn === 'player') {
      turnBadge.className = 'turn-pill player-turn';
      turnBadge.textContent = t('battle.yourTurn');
    } else {
      turnBadge.className = 'turn-pill cpu-turn';
      turnBadge.textContent = t('battle.cpuTurn');
    }
  }

  if (actionText) {
    if (state.currentTurn === 'player') {
      actionText.textContent = t('battle.chooseAttribute');
    } else {
      actionText.textContent = t('battle.cpuThinkingLong');
    }
  }

  nextRoundBtn?.classList.add('hidden');
}

// Indicador de fraqueza: lista os tipos que causam dano Super Efetivo (x2+)
// contra esta carta, independente do adversário (que pode estar oculto).
function renderWeaknessBadge(types) {
  const weaknesses = getWeaknesses(types);
  if (weaknesses.length === 0) return '';

  const lang = getLang();
  const pills = weaknesses.map(w => {
    const info = TYPE_TRANSLATIONS[w.type] || { name: w.type, color: '#666' };
    return `<span class="type-pill weakness-pill" style="background-color: ${info.color}">${getTypeName(w.type, lang)}</span>`;
  }).join('');

  return `<div class="card-weaknesses"><span class="card-weaknesses-label">⚠️ ${t('battle.weakTo')}:</span>${pills}</div>`;
}

// Os 6 atributos disputáveis de uma carta, na ordem canônica de exibição
const STAT_DEFS = [
  { attr: 'hp', icon: '❤️', i18nKey: 'stat.hp' },
  { attr: 'attack', icon: '⚔️', i18nKey: 'stat.attack' },
  { attr: 'defense', icon: '🛡️', i18nKey: 'stat.defense' },
  { attr: 'spAttack', icon: '✨', i18nKey: 'stat.spAttack' },
  { attr: 'spDefense', icon: '🌀', i18nKey: 'stat.spDefense' },
  { attr: 'speed', icon: '⚡', i18nKey: 'stat.speed' }
];

// Renderiza as linhas de atributo (stat-row) de uma carta na arena de batalha.
// Compartilhado entre a carta do jogador (selecionável) e a da CPU (somente exibição).
function renderStatRows(card, { selectable = false, highlightAttr = null, resultType = null, modifiedStatVal = null, modFactor = 1.0 } = {}) {
  const formatStatValue = (attrKey, baseVal) => {
    if (highlightAttr === attrKey && modifiedStatVal !== null && modFactor !== 1.0) {
      const modTag = modFactor > 1.0
        ? `<span class="stat-mod-pill buff">+20%</span>`
        : `<span class="stat-mod-pill nerf">-20%</span>`;
      return `<div class="stat-val-wrapper"><span>${modifiedStatVal}</span>${modTag}</div>`;
    }
    return baseVal;
  };

  return STAT_DEFS.map(({ attr, icon, i18nKey }) => `
    <div class="stat-row ${selectable ? 'selectable' : ''} ${highlightAttr === attr ? `selected highlight-${resultType}` : ''}" data-attr="${attr}">
      <div class="stat-info">
        <span class="stat-icon">${icon}</span>
        <span class="stat-label">${t(i18nKey)}</span>
      </div>
      <span class="stat-value">${formatStatValue(attr, card[attr])}</span>
    </div>
  `).join('');
}

// Renderiza a Carta do Jogador com suporte a modificadores elementais
function renderPlayerCard(highlightAttr = null, resultType = null, cardOverride = null, modifiedStatVal = null, modFactor = 1.0) {
  const slot = document.getElementById('player-card-slot');
  if (!slot || (!cardOverride && state.playerDeck.length === 0)) return;

  const card = cardOverride || state.playerDeck[0];
  const rank = card.rank || 'C';
  const primaryType = card.types[0] || 'normal';
  const typeStyle = TYPE_TRANSLATIONS[primaryType] || TYPE_TRANSLATIONS.normal;

  const isPlayerTurn = state.currentTurn === 'player' && !state.isAnimating && !highlightAttr;

  slot.innerHTML = `
    <div class="deck-stack-effect"></div>
    <div class="pokemon-card rank-${rank.toLowerCase()} ${card.isEvolved ? 'evolved' : ''} ${isPlayerTurn ? 'interactive' : ''}" id="p1-active-card">
      <div class="card-face card-front" style="border-color: ${typeStyle.color}">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-name">${card.name}</span>
            ${card.isEvolved ? `<span class="evolved-badge">${t('evolve.badge')}</span>` : ''}
            <span class="card-rank-badge rank-${rank.toLowerCase()}">${rank}</span>
          </div>
          <span class="card-id">#${String(card.id).padStart(3, '0')}</span>
        </div>

        <div class="card-artwork-box" style="background: ${typeStyle.bg}">
          <img src="${card.image}" alt="${card.name}" class="card-artwork" onload="this.classList.add('loaded')" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.id}.png'">
          <div class="card-types">
            ${card.types.map(ty => {
              const info = TYPE_TRANSLATIONS[ty] || { name: ty, color: '#666' };
              return `<span class="type-pill" style="background-color: ${info.color}">${getTypeName(ty, getLang())}</span>`;
            }).join('')}
          </div>
          ${renderWeaknessBadge(card.types)}
        </div>

        <div class="card-stats">
          ${renderStatRows(card, { selectable: isPlayerTurn, highlightAttr, resultType, modifiedStatVal, modFactor })}
        </div>
      </div>

      <!-- Face Traseira (Verso) -->
      <div class="card-face card-back"></div>
    </div>
  `;

  if (isPlayerTurn) {
    const rows = slot.querySelectorAll('.stat-row.selectable');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        if (state.isAnimating) return;
        const attr = row.dataset.attr;
        handlePlayerChoice(attr);
      });
    });
  }
}

// Renderiza a Carta da CPU com suporte a modificadores elementais
function renderCpuCard(isFacedown = true, highlightAttr = null, resultType = null, cardOverride = null, modifiedStatVal = null, modFactor = 1.0) {
  const slot = document.getElementById('cpu-card-slot');
  if (!slot || (!cardOverride && state.cpuDeck.length === 0)) return;

  const card = cardOverride || state.cpuDeck[0];
  const rank = card.rank || 'C';
  const primaryType = card.types[0] || 'normal';
  const typeStyle = TYPE_TRANSLATIONS[primaryType] || TYPE_TRANSLATIONS.normal;

  slot.innerHTML = `
    <div class="deck-stack-effect"></div>
    <div class="pokemon-card rank-${rank.toLowerCase()} ${card.isEvolved ? 'evolved' : ''} ${isFacedown ? 'flipped' : ''}" id="cpu-active-card">
      <!-- Face Frontal -->
      <div class="card-face card-front" style="border-color: ${typeStyle.color}">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-name">${card.name}</span>
            ${card.isEvolved ? `<span class="evolved-badge">${t('evolve.badge')}</span>` : ''}
            <span class="card-rank-badge rank-${rank.toLowerCase()}">${rank}</span>
          </div>
          <span class="card-id">#${String(card.id).padStart(3, '0')}</span>
        </div>

        <div class="card-artwork-box" style="background: ${typeStyle.bg}">
          <img src="${card.image}" alt="${card.name}" class="card-artwork" onload="this.classList.add('loaded')" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.id}.png'">
          <div class="card-types">
            ${card.types.map(ty => {
              const info = TYPE_TRANSLATIONS[ty] || { name: ty, color: '#666' };
              return `<span class="type-pill" style="background-color: ${info.color}">${getTypeName(ty, getLang())}</span>`;
            }).join('')}
          </div>
          ${renderWeaknessBadge(card.types)}
        </div>

        <div class="card-stats">
          ${renderStatRows(card, { highlightAttr, resultType, modifiedStatVal, modFactor })}
        </div>
      </div>

      <!-- Face Traseira (Verso) -->
      <div class="card-face card-back"></div>
    </div>
  `;
}

// Renderiza o badge em pílula de vantagem elemental (Feedback Visual)
function renderTypeMatchup(typeAdvantage) {
  const container = document.getElementById('arena-matchup-container');
  if (!container || !typeAdvantage) return;

  const symClass = typeAdvantage.advantage === 'player'
    ? 'advantage'
    : (typeAdvantage.advantage === 'cpu' ? 'disadvantage' : 'neutral');

  const labelText = typeAdvantage.advantage === 'player'
    ? t('matchup.advantage')
    : (typeAdvantage.advantage === 'cpu' ? t('matchup.disadvantage') : t('matchup.neutral'));

  const lang = getLang();
  const playerColor = TYPE_TRANSLATIONS[typeAdvantage.playerType]?.color || '#9fa19f';
  const cpuColor = TYPE_TRANSLATIONS[typeAdvantage.cpuType]?.color || '#9fa19f';

  container.innerHTML = `
    <div class="type-matchup-pill">
      <span class="type-badge-pill" style="background-color: ${playerColor};">
        ${getTypeName(typeAdvantage.playerType, lang)}
      </span>
      <span class="type-matchup-symbol ${symClass}">
        ${typeAdvantage.comparisonSymbol}
      </span>
      <span class="type-badge-pill" style="background-color: ${cpuColor};">
        ${getTypeName(typeAdvantage.cpuType, lang)}
      </span>
    </div>
    <div class="type-matchup-label ${symClass}">
      ${labelText}
    </div>
  `;
  container.classList.remove('hidden');
}

// Jogada do Jogador
function handlePlayerChoice(attribute) {
  state.isAnimating = true;
  sound.playClick();

  const actionText = document.getElementById('arena-action-text');
  if (actionText) {
    actionText.textContent = t('battle.playerChose', { attr: t(`stat.${attribute}`) });
  }

  processCombatRound(attribute);
}

// Turno da CPU
function triggerCpuTurn() {
  state.isAnimating = true;
  const actionText = document.getElementById('arena-action-text');
  if (actionText) actionText.textContent = t('battle.cpuThinking');

  setTimeout(() => {
    if (state.cpuDeck.length === 0) return;
    const cpuCard = state.cpuDeck[0];
    const chosenAttr = chooseCpuAttribute(cpuCard);

    if (actionText) {
      actionText.textContent = t('battle.cpuChose', { attr: t(`stat.${chosenAttr}`) });
    }

    processCombatRound(chosenAttr);
  }, wait(1200));
}

// Processa a rodada e suas animações
function processCombatRound(attribute) {
  // 1. Revela a carta da CPU virando o node já renderizado
  sound.playCardFlip();
  document.getElementById('cpu-active-card')?.classList.remove('flipped');

  setTimeout(() => {
    // 2. Executa a rodada no motor de regras
    const result = playRound(attribute);

    // Efeitos sonoros e visuais
    sound.playClash();

    // Renderiza a Pílula de Vantagem Elemental
    if (result.typeAdvantage) {
      renderTypeMatchup(result.typeAdvantage);
      if (result.typeAdvantage.advantage === 'player') {
        sound.playSuperEffective();
      } else if (result.typeAdvantage.advantage === 'cpu') {
        sound.playNotVeryEffective();
      }
    }

    const pCardEl = document.getElementById('p1-active-card');
    const cCardEl = document.getElementById('cpu-active-card');

    pCardEl?.classList.add('clash-anim');
    cCardEl?.classList.add('clash-anim');

    let pResultType = 'tie';
    let cResultType = 'tie';

    if (result.winner === 'player') {
      pResultType = 'winner';
      cResultType = 'loser';
      sound.playRoundWin();
      pCardEl?.classList.add('winner-anim');
      cCardEl?.classList.add('damage-shake');
      showFloatingDamage('cpu-card-slot', `-${result.damage} HP`);
    } else if (result.winner === 'cpu') {
      pResultType = 'loser';
      cResultType = 'winner';
      sound.playRoundLoss();
      cCardEl?.classList.add('winner-anim');
      pCardEl?.classList.add('damage-shake');
      showFloatingDamage('player-card-slot', `-${result.damage} HP`);
    }

    // Mensagem de resultado da rodada
    const actionText = document.getElementById('arena-action-text');

    if (actionText) {
      let effectDetail = '';
      if (result.typeAdvantage.advantage === 'player') {
        effectDetail = `<div style="font-size:0.75rem; color:#34d399; margin-top:2px;">${t('battle.bonusApplied')}</div>`;
      } else if (result.typeAdvantage.advantage === 'cpu') {
        effectDetail = `<div style="font-size:0.75rem; color:#f87171; margin-top:2px;">${t('battle.penaltyApplied')}</div>`;
      }

      if (result.winner === 'player') {
        actionText.innerHTML = `<span style="color:#10b981">${t('battle.playerWonRound')}</span> ${t('battle.dealtDamage', { p: result.playerVal, c: result.cpuVal, dmg: result.damage })}${effectDetail}`;
      } else if (result.winner === 'cpu') {
        actionText.innerHTML = `<span style="color:#ef4444">${t('battle.cpuWonRound')}</span> ${t('battle.dealtDamage', { p: result.cpuVal, c: result.playerVal, dmg: result.damage })}${effectDetail}`;
      } else {
        actionText.innerHTML = `<span style="color:#f59e0b">${t('battle.tieRound')}</span> ${t('battle.tieResult', { p: result.playerVal, c: result.cpuVal })}${effectDetail}`;
      }
    }

    // 3. Só re-renderiza (com highlights e modificadores) depois que o choque terminou de tocar
    setTimeout(() => {
      // Usa as cartas que efetivamente disputaram a rodada
      renderPlayerCard(attribute, pResultType, result.playerCard, result.playerVal, result.typeAdvantage.playerModifier);
      renderCpuCard(false, attribute, cResultType, result.cpuCard, result.cpuVal, result.typeAdvantage.cpuModifier);
      updateStatusBars();
      recordCapture(state.playerDeck);

      // 4. Verifica Fim de Jogo
      const overInfo = checkGameOver();
      if (overInfo) {
        setTimeout(() => {
          handleGameOver(overInfo);
        }, wait(1500));
        return;
      }

      // Libera próxima rodada
      setTimeout(() => {
        state.isAnimating = false;
        const nextRoundBtn = document.getElementById('btn-next-round');
        nextRoundBtn?.classList.remove('hidden');
        checkEvolutionAvailability();
      }, wait(1200));
    }, 650);

  }, 800);
}

// Exibe dano flutuante na tela
function showFloatingDamage(containerId, text) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const dmgEl = document.createElement('div');
  dmgEl.className = 'floating-damage';
  dmgEl.textContent = text;
  container.appendChild(dmgEl);

  setTimeout(() => {
    dmgEl.remove();
  }, 1200);
}

// Verifica se há cartas para evoluir e ativa o botão correspondente
function checkEvolutionAvailability() {
  const evolvable = findEvolvablePokemon(state.playerDeck);
  const btn = document.getElementById('btn-evolve-trigger');
  
  if (evolvable.length > 0) {
    btn?.classList.remove('hidden');
    if (btn) {
      btn.innerHTML = t('evolve.triggerBtn', { name: evolvable[0].name, count: evolvable[0].count });
    }
  } else {
    btn?.classList.add('hidden');
  }
}

// Abre o Modal de Evolução
function openEvolveModal() {
  const evolvable = findEvolvablePokemon(state.playerDeck);
  if (evolvable.length === 0) return;

  const target = evolvable[0];
  const modal = modals.evolve;
  const content = document.getElementById('evolve-modal-content');

  if (content && modal) {
    content.innerHTML = `
      <p style="color: #cbd5e1; margin-bottom: 1.2rem;">
        ${t('evolve.have', { count: target.count, name: target.name })}
      </p>
      <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 1.5rem;">
        <img src="${getPokemonArtwork(target.id)}" style="width: 80px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
        <img src="${getPokemonArtwork(target.id)}" style="width: 80px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
        <img src="${getPokemonArtwork(target.id)}" style="width: 80px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
      </div>
      <p style="color: #ffcb05; font-size: 0.95rem; margin-bottom: 1.5rem;">
        ${t('evolve.willFuse', { name: target.name })}
      </p>
      <button class="action-btn-main" id="btn-confirm-evolve" style="width: 100%;">
        ${t('evolve.confirmBtn')}
      </button>
    `;

    openModal(modal);

    document.getElementById('btn-confirm-evolve')?.addEventListener('click', () => {
      const res = performEvolution(target.id);
      closeModal(modal);
      if (res.success) {
        renderArena();
      }
    });
  }
}

// Trata tela de Fim de Jogo
function handleGameOver(overInfo) {
  const modal = modals.gameover;
  const banner = document.getElementById('gameover-banner');
  const reasonText = document.getElementById('gameover-reason');
  const statsContainer = document.getElementById('gameover-stats');

  if (overInfo.playerWon) {
    sound.playVictoryFanfare();
    startConfetti();
    if (banner) {
      banner.className = 'gameover-banner win';
      banner.textContent = t('gameover.win');
    }
  } else {
    sound.playRoundLoss();
    if (banner) {
      banner.className = 'gameover-banner lose';
      banner.textContent = t('gameover.lose');
    }
  }

  const reasonKeys = {
    cpu_hp_zero: 'gameover.reasonCpuHpZero',
    cpu_no_cards: 'gameover.reasonCpuNoCards',
    player_hp_zero: 'gameover.reasonPlayerHpZero',
    player_no_cards: 'gameover.reasonPlayerNoCards'
  };

  // Resolve a aposta de cartas da partida
  const wagerResult = resolveWager(overInfo.playerWon);
  let wagerFeedback = '';
  if (wagerResult) {
    if (wagerResult.playerWon && wagerResult.cardWon) {
      wagerFeedback = `<div style="color: #34d399; font-weight: 700; margin-top: 10px; font-size: 1rem;">${t('wager.wonNotice', { card: wagerResult.cardWon.name })}</div>`;
    } else if (!wagerResult.playerWon && wagerResult.cardLost) {
      wagerFeedback = `<div style="color: #f87171; font-weight: 700; margin-top: 10px; font-size: 1rem;">${t('wager.lostNotice', { card: wagerResult.cardLost.name })}</div>`;
    }
    if (wagerResult.rescueGranted) {
      wagerFeedback += `<div style="color: #fbbf24; font-size: 0.85rem; margin-top: 4px;">${t('wager.rescueNotice')}</div>`;
    }
  }

  if (reasonText) {
    reasonText.innerHTML = (t(reasonKeys[overInfo.reasonCode] || '')) + wagerFeedback;
  }

  // Soma o resultado desta partida às estatísticas persistidas entre partidas
  lifetimeStats.gamesPlayed++;
  if (overInfo.playerWon) lifetimeStats.gamesWon++;
  lifetimeStats.roundsWon += overInfo.stats.roundsWon;
  lifetimeStats.roundsLost += overInfo.stats.roundsLost;
  lifetimeStats.evolutionsDone += overInfo.stats.evolutionsDone;
  saveLifetimeStats(lifetimeStats);

  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-box">
        <div class="stat-box-label">${t('gameover.roundsWon')}</div>
        <div class="stat-box-value">${overInfo.stats.roundsWon}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">${t('gameover.roundsLost')}</div>
        <div class="stat-box-value">${overInfo.stats.roundsLost}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">${t('gameover.damageDealt')}</div>
        <div class="stat-box-value">${overInfo.stats.damageDealt}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">${t('gameover.evolutionsDone')}</div>
        <div class="stat-box-value">${overInfo.stats.evolutionsDone}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">${t('gameover.pokedexTotal')}</div>
        <div class="stat-box-value">${collectedIds.size} / ${GEN1_POKEMON_BASE.length}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">${t('gameover.lifetimeWins')}</div>
        <div class="stat-box-value">${lifetimeStats.gamesWon} / ${lifetimeStats.gamesPlayed}</div>
      </div>
    `;
  }

  openModal(modal);
}

// ==========================================================================
// Pokédex de Consulta — verificação manual de vantagem/desvantagem elemental
// ==========================================================================

let pokedexActiveTurn = 'player';
let pokedexPlayerId = GEN1_POKEMON_BASE[0].id; // Bulbasaur
let pokedexCpuId = GEN1_POKEMON_BASE[1].id; // Ivysaur — confronto inicial não-trivial

// ==========================================================================
// Persistência: coleção de Pokémon já jogados e estatísticas somadas entre
// partidas (localStorage). Não é o estado de uma partida em andamento.
// ==========================================================================
let collectedIds = loadCollection();
let lifetimeStats = loadLifetimeStats();

// Marca como "capturados" todos os Pokémon atualmente no baralho do jogador.
// Chamado sempre que o baralho pode ter mudado (nova rodada, carta ganha).
function recordCapture(deck) {
  let changed = false;
  deck.forEach(card => {
    if (!collectedIds.has(card.id)) {
      collectedIds.add(card.id);
      changed = true;
    }
  });
  if (changed) saveCollection(collectedIds);
}

const padPokedexId = (id) => String(id).padStart(3, '0');
const fmtPokedexTypes = (types) => types.map(ty => {
  const info = TYPE_TRANSLATIONS[ty] || { name: ty, color: '#666' };
  return `<span class="type-pill" style="background-color: ${info.color}">${getTypeName(ty, getLang())}</span>`;
}).join('');

// Abre a Pokédex já carregada com o confronto que está na tela de batalha
// agora: carta ativa do jogador vs carta ativa da CPU, com o turno atual.
function openMatchupInPokedex() {
  if (state.playerDeck[0]) pokedexPlayerId = state.playerDeck[0].id;
  if (state.cpuDeck[0]) pokedexCpuId = state.cpuDeck[0].id;
  pokedexActiveTurn = state.currentTurn;

  // Ativa a aba do simulador VS diretamente
  const vsTabBtn = document.querySelector('.pokedex-tab-btn[data-tab="pokedex-tab-vs"]');
  if (vsTabBtn) vsTabBtn.click();

  document.querySelectorAll('.pokedex-turn-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.turn === pokedexActiveTurn);
  });

  renderPokedexGrid(document.getElementById('pokedex-browse-search')?.value || '');
  renderPokedexSlots();
  runPokedexQuery();
  openModal(modals.pokedex);
}

function setupPokedexModal() {
  const grid = document.getElementById('pokedex-grid');
  const searchInput = document.getElementById('pokedex-browse-search');
  if (!grid || !searchInput) return; // modal não presente nesta página

  // Alternador de Abas da Pokédex
  const tabBtns = document.querySelectorAll('.pokedex-tab-btn');
  const tabPanels = document.querySelectorAll('.pokedex-tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.remove('hidden');
    });
  });

  searchInput.addEventListener('input', () => renderPokedexGrid(searchInput.value));

  // Delegação de clique: um único listener no grid cobre os 151 pares de botões
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.pokedex-pick-btn');
    if (!btn) return;
    sound.playClick();
    const id = Number(btn.dataset.id);
    if (btn.dataset.slot === 'player') {
      pokedexPlayerId = id;
    } else {
      pokedexCpuId = id;
    }
    // Só troca as classes de destaque nos cards já renderizados — reconstruir a
    // grid inteira faria as 151 <img> recarregarem e piscarem à toa.
    syncPokedexGridHighlights();
    renderPokedexSlots();
    runPokedexQuery();

    // Transiciona suavemente para a aba de simulador VS
    const vsTabBtn = document.querySelector('.pokedex-tab-btn[data-tab="pokedex-tab-vs"]');
    if (vsTabBtn && !vsTabBtn.classList.contains('active')) {
      vsTabBtn.click();
    }
  });

  document.querySelectorAll('.pokedex-turn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pokedex-turn-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      pokedexActiveTurn = btn.dataset.turn;
      runPokedexQuery();
    });
  });

  renderPokedexGrid('');
  renderPokedexSlots();
  renderPokedexChart();
  runPokedexQuery();
}

// Desenha a grade navegável: imagem, nome, tipos e atributos dos 151 Pokémon,
// cada um com botões para jogá-lo no confronto (slot Jogador ou CPU).
function renderPokedexGrid(filterText) {
  const grid = document.getElementById('pokedex-grid');
  if (!grid) return;

  const query = filterText.trim().toLowerCase();
  const list = query
    ? GEN1_POKEMON_BASE.filter(p => p.name.toLowerCase().includes(query))
    : GEN1_POKEMON_BASE;

  if (list.length === 0) {
    grid.innerHTML = `<p class="pokedex-grid-empty">${t('pokedex.empty', { query: filterText })}</p>`;
    return;
  }

  const progressEl = document.getElementById('pokedex-progress');
  if (progressEl) progressEl.textContent = t('pokedex.progress', { count: collectedIds.size, total: GEN1_POKEMON_BASE.length });

  grid.innerHTML = list.map(p => {
    const isPlayer = p.id === pokedexPlayerId;
    const isCpu = p.id === pokedexCpuId;
    const isCaptured = collectedIds.has(p.id);
    return `
      <div class="pokedex-mini-card ${isPlayer ? 'is-player' : ''} ${isCpu ? 'is-cpu' : ''}" data-id="${p.id}">
        ${isCaptured ? '<span class="pokedex-mini-badge" title="Capturado">✓</span>' : ''}
        <img loading="lazy" src="${getPokemonArtwork(p.id)}" alt="${p.name}" class="pokedex-mini-art"
             onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
        <div class="pokedex-mini-id">#${padPokedexId(p.id)}</div>
        <div class="pokedex-mini-name">${p.name}</div>
        <div class="pokedex-mini-types">${fmtPokedexTypes(p.types)}</div>
        <div class="pokedex-mini-stats">
          <span>⚔️ ${p.attack}</span><span>🛡️ ${p.defense}</span><span>⚡ ${p.speed}</span>
        </div>
        <div class="pokedex-mini-actions">
          <button type="button" class="pokedex-pick-btn pick-player ${isPlayer ? 'active' : ''}" data-slot="player" data-id="${p.id}">${t('pokedex.player')}</button>
          <button type="button" class="pokedex-pick-btn pick-cpu ${isCpu ? 'active' : ''}" data-slot="cpu" data-id="${p.id}">${t('pokedex.cpu')}</button>
        </div>
      </div>
    `;
  }).join('');
}

// Atualiza só o destaque (borda + botão ativo) dos cards já no DOM, sem
// recriar as <img> — usado após um clique de "Jogador"/"CPU".
function syncPokedexGridHighlights() {
  document.querySelectorAll('.pokedex-mini-card').forEach(card => {
    const id = Number(card.dataset.id);
    const isPlayer = id === pokedexPlayerId;
    const isCpu = id === pokedexCpuId;
    card.classList.toggle('is-player', isPlayer);
    card.classList.toggle('is-cpu', isCpu);
    card.querySelector('.pick-player')?.classList.toggle('active', isPlayer);
    card.querySelector('.pick-cpu')?.classList.toggle('active', isCpu);
  });
}

// Atualiza os dois cartões de slot (Jogador/CPU) com a seleção atual
function renderPokedexSlots() {
  const playerBase = GEN1_POKEMON_BASE.find(p => p.id === pokedexPlayerId);
  const cpuBase = GEN1_POKEMON_BASE.find(p => p.id === pokedexCpuId);

  const slotHtml = (base, label) => `
    <span class="pokedex-slot-label">${label}</span>
    <img src="${getPokemonArtwork(base.id)}" alt="${base.name}" class="pokedex-slot-art">
    <span class="pokedex-slot-name">${base.name}</span>
  `;

  const slotPlayer = document.getElementById('pokedex-slot-player');
  const slotCpu = document.getElementById('pokedex-slot-cpu');
  if (slotPlayer) slotPlayer.innerHTML = slotHtml(playerBase, t('pokedex.slotPlayer'));
  if (slotCpu) slotCpu.innerHTML = slotHtml(cpuBase, t('pokedex.slotCpu'));
}

// Executa calculateTypeAdvantage — a MESMA função usada em playRound() — para
// que a consulta aqui nunca divirja do resultado real da batalha.
function runPokedexQuery() {
  const resultEl = document.getElementById('pokedex-result');
  if (!resultEl) return;

  const playerBase = GEN1_POKEMON_BASE.find(p => p.id === pokedexPlayerId);
  const cpuBase = GEN1_POKEMON_BASE.find(p => p.id === pokedexCpuId);
  if (!playerBase || !cpuBase) return;

  const playerCard = createCardFromBase(playerBase);
  const cpuCard = createCardFromBase(cpuBase);
  const result = calculateTypeAdvantage(playerCard, cpuCard, pokedexActiveTurn);

  const lang = getLang();
  const playerTypeName = getTypeName(result.playerType, lang);
  const cpuTypeName = getTypeName(result.cpuType, lang);

  const fmtMod = (mod) => {
    if (mod > 1) return `<span class="pokedex-mod buff">+${Math.round((mod - 1) * 100)}%</span>`;
    if (mod < 1) return `<span class="pokedex-mod nerf">-${Math.round((1 - mod) * 100)}%</span>`;
    return `<span class="pokedex-mod neutral">${t('pokedex.noChange')}</span>`;
  };

  const descKeys = {
    player_attack_advantage: 'matchup.descPlayerAttack',
    player_resist: 'matchup.descPlayerResist',
    player_defend_disadvantage: 'matchup.descPlayerDefendDisadvantage',
    cpu_attack_advantage: 'matchup.descCpuAttack',
    neutral: 'matchup.descNeutral'
  };
  const description = t(descKeys[result.caseId] || 'matchup.descNeutral', { p: playerTypeName, c: cpuTypeName });

  resultEl.innerHTML = `
    <div class="pokedex-result-row">
      <div class="pokedex-result-col">
        <strong>${playerBase.name}</strong>
        <div class="pokedex-result-types">${fmtPokedexTypes(playerCard.types)}</div>
        <div class="pokedex-result-line">${t('pokedex.bestAttack')} <strong>${playerTypeName}</strong> (x${result.playerMultiplier})</div>
        <div class="pokedex-result-line">${t('pokedex.modifier')} ${fmtMod(result.playerModifier)}</div>
      </div>
      <div class="pokedex-result-symbol">${result.comparisonSymbol}</div>
      <div class="pokedex-result-col">
        <strong>${cpuBase.name}</strong>
        <div class="pokedex-result-types">${fmtPokedexTypes(cpuCard.types)}</div>
        <div class="pokedex-result-line">${t('pokedex.bestAttack')} <strong>${cpuTypeName}</strong> (x${result.cpuMultiplier})</div>
        <div class="pokedex-result-line">${t('pokedex.modifier')} ${fmtMod(result.cpuModifier)}</div>
      </div>
    </div>
    <div class="pokedex-result-desc pokedex-${result.advantage}">${description}</div>
  `;
}

// Desenha a tabela completa TYPE_CHART (atacante nas linhas, defensor nas colunas)
// para conferência visual direta contra a tabela oficial.
function renderPokedexChart() {
  const wrap = document.getElementById('pokedex-chart');
  if (!wrap) return;

  const types = Object.keys(TYPE_TRANSLATIONS);
  const cellLabel = (mult) => {
    if (mult === 2) return { text: '2×', cls: 'super' };
    if (mult === 0.5) return { text: '½×', cls: 'resist' };
    if (mult === 0) return { text: '0×', cls: 'immune' };
    return { text: '—', cls: 'normal' };
  };

  const lang = getLang();
  let html = '<table class="pokedex-chart-table"><thead><tr><th>Atk \\ Def</th>';
  types.forEach(def => {
    const name = getTypeName(def, lang);
    html += `<th title="${name}">${name.slice(0, 3)}</th>`;
  });
  html += '</tr></thead><tbody>';

  types.forEach(atk => {
    html += `<tr><th>${getTypeName(atk, lang)}</th>`;
    types.forEach(def => {
      const mult = TYPE_CHART[atk]?.[def] ?? 1;
      const { text, cls } = cellLabel(mult);
      html += `<td class="pokedex-chart-cell ${cls}">${text}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// ==========================================================================
// Deck Builder — montagem manual do baralho do jogador antes da partida.
// Alimentado exclusivamente pelas cartas que o jogador possui em seu inventário.
// ==========================================================================
let deckBuilderSelection = [];

function requiredDeckSize() {
  return (DIFFICULTY_CONFIG[selectedDifficulty] || DIFFICULTY_CONFIG.easy).cardsCount;
}

function openDeckBuilder(difficulty) {
  selectedDifficulty = difficulty;
  deckBuilderSelection = [];
  const subtitle = document.getElementById('deckbuilder-subtitle');
  if (subtitle) subtitle.textContent = t('deckbuilder.subtitle', { count: requiredDeckSize() });
  renderDeckBuilderGrid('');
  renderDeckBuilderTray();
  showScreen('deckbuilder');
}

function setupDeckBuilder() {
  const grid = document.getElementById('deckbuilder-grid');
  const searchInput = document.getElementById('deckbuilder-search');
  const tray = document.getElementById('deckbuilder-tray');
  if (!grid || !searchInput) return;

  searchInput.addEventListener('input', () => renderDeckBuilderGrid(searchInput.value));

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.deckbuilder-add-btn');
    if (!btn || btn.disabled) return;
    if (deckBuilderSelection.length >= requiredDeckSize()) return;

    const id = Number(btn.dataset.id);
    const inventory = state.playerInventory || loadInventory() || [];
    const selectedUids = new Set(deckBuilderSelection.map(c => c.uid));
    const availableCard = inventory.find(c => c.id === id && !selectedUids.has(c.uid));

    if (availableCard) {
      sound.playClick();
      deckBuilderSelection.push(availableCard);
      renderDeckBuilderGrid(searchInput.value);
      renderDeckBuilderTray();
    }
  });

  tray?.addEventListener('click', (e) => {
    const chip = e.target.closest('.deckbuilder-chip-remove');
    if (!chip) return;
    sound.playClick();
    deckBuilderSelection.splice(Number(chip.dataset.index), 1);
    renderDeckBuilderGrid(searchInput.value);
    renderDeckBuilderTray();
  });

  document.getElementById('btn-deckbuilder-random')?.addEventListener('click', () => {
    sound.playClick();
    const inventory = state.playerInventory || loadInventory() || [];
    const selectedUids = new Set(deckBuilderSelection.map(c => c.uid));
    const pool = inventory.filter(c => !selectedUids.has(c.uid));

    while (deckBuilderSelection.length < requiredDeckSize() && pool.length > 0) {
      const randIdx = Math.floor(Math.random() * pool.length);
      const picked = pool.splice(randIdx, 1)[0];
      deckBuilderSelection.push(picked);
    }
    renderDeckBuilderGrid(searchInput.value);
    renderDeckBuilderTray();
  });

  document.getElementById('btn-deckbuilder-clear')?.addEventListener('click', () => {
    sound.playClick();
    deckBuilderSelection = [];
    renderDeckBuilderGrid(searchInput.value);
    renderDeckBuilderTray();
  });

  document.getElementById('btn-deckbuilder-back')?.addEventListener('click', () => {
    sound.playClick();
    showScreen('menu');
  });

  document.getElementById('btn-deckbuilder-confirm')?.addEventListener('click', () => {
    if (deckBuilderSelection.length !== requiredDeckSize()) return;
    sound.playClick();
    openWagerScreen(deckBuilderSelection);
  });
}

function renderDeckBuilderGrid(filterText) {
  const grid = document.getElementById('deckbuilder-grid');
  if (!grid) return;

  const inventory = state.playerInventory || loadInventory() || [];
  const grouped = {};
  inventory.forEach(card => {
    if (!grouped[card.id]) {
      grouped[card.id] = { base: card, count: 0, cards: [] };
    }
    grouped[card.id].count++;
    grouped[card.id].cards.push(card);
  });

  const query = filterText.trim().toLowerCase();
  let list = Object.values(grouped);
  if (query) {
    list = list.filter(item => item.base.name.toLowerCase().includes(query));
  }

  const isFull = deckBuilderSelection.length >= requiredDeckSize();
  const lang = getLang();

  if (list.length === 0) {
    grid.innerHTML = `<p class="pokedex-grid-empty" style="grid-column: 1/-1;">Nenhuma carta encontrada no seu inventário.</p>`;
    return;
  }

  grid.innerHTML = list.map(item => {
    const p = item.base;
    const rank = p.rank || 'C';
    const inDeckCount = deckBuilderSelection.filter(c => c.id === p.id).length;
    const ownedCount = item.count;
    const canAdd = inDeckCount < ownedCount && !isFull;

    return `
      <div class="pokedex-mini-card rank-${rank.toLowerCase()} ${inDeckCount > 0 ? 'in-deck' : ''}" data-id="${p.id}">
        <span class="card-rank-badge rank-${rank.toLowerCase()}" style="position: absolute; top: 4px; left: 4px; font-size: 0.5rem; padding: 1px 4px;">${rank}</span>
        <span class="pokedex-mini-badge" title="Possui / No Deck">${inDeckCount}/${ownedCount}</span>
        <img loading="lazy" src="${getPokemonArtwork(p.id)}" alt="${p.name}" class="pokedex-mini-art"
             onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
        <div class="pokedex-mini-id">#${padPokedexId(p.id)}</div>
        <div class="pokedex-mini-name">${p.name}</div>
        <div class="pokedex-mini-types">${p.types.map(ty => {
          const tInfo = TYPE_TRANSLATIONS[ty] || { name: ty, color: '#666' };
          return `<span class="type-pill" style="background-color: ${tInfo.color}">${getTypeName(ty, lang)}</span>`;
        }).join('')}</div>
        <div class="pokedex-mini-stats">
          <span>⚔️ ${p.attack}</span><span>🛡️ ${p.defense}</span><span>⚡ ${p.speed}</span>
        </div>
        <div class="pokedex-mini-actions">
          <button type="button" class="pokedex-pick-btn deckbuilder-add-btn" data-id="${p.id}" ${canAdd ? '' : 'disabled'}>
            ${isFull ? t('deckbuilder.full') : t('deckbuilder.add')}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderDeckBuilderTray() {
  const tray = document.getElementById('deckbuilder-tray');
  const progress = document.getElementById('deckbuilder-progress');
  const confirmBtn = document.getElementById('btn-deckbuilder-confirm');
  const needed = requiredDeckSize();

  if (progress) progress.textContent = t('deckbuilder.progress', { picked: deckBuilderSelection.length, total: needed });
  if (confirmBtn) confirmBtn.disabled = deckBuilderSelection.length !== needed;

  if (!tray) return;
  if (deckBuilderSelection.length === 0) {
    tray.innerHTML = `<p class="pokedex-grid-empty">${t('deckbuilder.trayEmpty')}</p>`;
    return;
  }

  tray.innerHTML = deckBuilderSelection.map((card, index) => {
    const rank = card.rank || 'C';
    return `
      <div class="deckbuilder-chip">
        <img src="${card.image}" alt="${card.name}" class="deckbuilder-chip-art">
        <span class="deckbuilder-chip-name">${card.name}</span>
        <span class="card-rank-badge rank-${rank.toLowerCase()}" style="font-size: 0.5rem; padding: 1px 4px;">${rank}</span>
        <button type="button" class="deckbuilder-chip-remove" data-index="${index}" aria-label="Remove">✕</button>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Tela de Aposta Pré-Partida (Wager / Ante)
// ==========================================================================
let selectedWagerIndex = 0;

function openWagerScreen(chosenDeckCards) {
  selectedWagerIndex = 0;
  showScreen('wager');
  renderWagerScreen(chosenDeckCards);
}

function renderWagerMiniCardHtml(card) {
  if (!card) return '<p style="color: #64748b;">Nenhuma carta</p>';
  const rank = card.rank || 'C';
  const primaryType = card.types?.[0] || 'normal';
  const typeStyle = TYPE_TRANSLATIONS[primaryType] || TYPE_TRANSLATIONS.normal;

  return `
    <div class="pokemon-card rank-${rank.toLowerCase()} ${card.isEvolved ? 'evolved' : ''}" style="width: 180px; height: 260px; cursor: default;">
      <div class="card-face card-front" style="border-color: ${typeStyle.color}; padding: 8px;">
        <div class="card-header" style="margin-bottom: 4px;">
          <div class="card-title-group">
            <span class="card-name" style="font-size: 0.85rem;">${card.name}</span>
            <span class="card-rank-badge rank-${rank.toLowerCase()}">${rank}</span>
          </div>
          <span class="card-id" style="font-size: 0.55rem;">#${String(card.id).padStart(3, '0')}</span>
        </div>
        <div class="card-artwork-box" style="height: 105px; background: ${typeStyle.bg}">
          <img src="${card.image}" alt="${card.name}" class="card-artwork loaded">
        </div>
        <div class="card-stats" style="gap: 2px;">
          <div class="stat-row" style="padding: 2px 4px;"><span class="stat-label">⚔️ Ataque</span><span class="stat-value">${card.attack}</span></div>
          <div class="stat-row" style="padding: 2px 4px;"><span class="stat-label">🛡️ Defesa</span><span class="stat-value">${card.defense}</span></div>
          <div class="stat-row" style="padding: 2px 4px;"><span class="stat-label">⚡ Velocidade</span><span class="stat-value">${card.speed}</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderWagerScreen(chosenDeckCards) {
  const playerPreview = document.getElementById('wager-player-preview');
  const cpuPreview = document.getElementById('wager-cpu-preview');
  const tray = document.getElementById('wager-selection-tray');

  if (!chosenDeckCards || chosenDeckCards.length === 0) return;

  const playerCard = chosenDeckCards[selectedWagerIndex] || chosenDeckCards[0];
  
  if (!state.activeWager?.cpuCard) {
    state.activeWager = {
      playerCard,
      cpuCard: createCardFromBase(drawSingleWeightedPokemon())
    };
  } else {
    state.activeWager.playerCard = playerCard;
  }

  if (playerPreview) playerPreview.innerHTML = renderWagerMiniCardHtml(playerCard);
  if (cpuPreview) cpuPreview.innerHTML = renderWagerMiniCardHtml(state.activeWager.cpuCard);

  if (tray) {
    tray.innerHTML = chosenDeckCards.map((card, idx) => `
      <div class="wager-chip ${idx === selectedWagerIndex ? 'selected' : ''}" data-idx="${idx}">
        <img src="${card.image}" alt="${card.name}">
        <span>${card.name}</span>
        <span class="card-rank-badge rank-${(card.rank || 'c').toLowerCase()}">${card.rank || 'C'}</span>
      </div>
    `).join('');

    tray.querySelectorAll('.wager-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sound.playClick();
        selectedWagerIndex = Number(chip.dataset.idx);
        renderWagerScreen(chosenDeckCards);
      });
    });
  }
}

// ==========================================================================
// Booster Periódico por Tempo (Cooldown & Abertura)
// ==========================================================================
function startBoosterTimer() {
  if (boosterTimerInterval) clearInterval(boosterTimerInterval);
  updateBoosterButtonState();
  boosterTimerInterval = setInterval(updateBoosterButtonState, 1000);
}

function updateBoosterButtonState() {
  const btn = document.getElementById('btn-booster-claim');
  const text = document.getElementById('booster-timer-text');
  const colBtn = document.getElementById('btn-collection-booster-claim');
  const colText = document.getElementById('collection-booster-timer-text');

  const nextTime = loadNextBoosterTime();
  const now = Date.now();

  let ready = false;
  let displayStr = '';

  if (now >= nextTime) {
    ready = true;
    displayStr = t('header.boosterReady');
  } else {
    ready = false;
    const remainingMs = nextTime - now;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);
    displayStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (btn) btn.classList.toggle('ready', ready);
  if (text) text.textContent = displayStr;
  if (colBtn) colBtn.classList.toggle('ready', ready);
  if (colText) colText.textContent = displayStr;
}

function openBoosterModal() {
  const modal = modals.booster;
  const grid = document.getElementById('booster-cards-grid');
  const claimBtn = document.getElementById('btn-claim-booster');
  if (!modal || !grid) return;

  claimBtn?.classList.add('hidden');
  sound.playBoosterOpen();

  // Sorteia 5 cartas do booster
  const boosterCards = openBoosterPack(5);
  updateBoosterButtonState();

  grid.innerHTML = boosterCards.map((card, idx) => {
    const rank = card.rank || 'C';
    return `
      <div class="booster-card-wrapper" data-idx="${idx}">
        <div class="booster-card-inner flipped" id="booster-card-${idx}">
          <div class="booster-card-face front rank-${rank.toLowerCase()}">
            <span class="card-rank-badge rank-${rank.toLowerCase()}" style="align-self: flex-end;">${rank}</span>
            <img src="${card.image}" alt="${card.name}" class="booster-mini-art">
            <div style="font-weight: 800; font-size: 0.85rem; margin-bottom: 2px;">${card.name}</div>
            <div style="font-size: 0.7rem; color: #94a3b8;">⚔️ ${card.attack} | 🛡️ ${card.defense} | ⚡ ${card.speed}</div>
          </div>
          <div class="booster-card-face back"></div>
        </div>
      </div>
    `;
  }).join('');

  openModal(modal);

  // Revelação sequencial automática com som proporcional à raridade
  boosterCards.forEach((card, idx) => {
    setTimeout(() => {
      const cardEl = document.getElementById(`booster-card-${idx}`);
      if (cardEl) {
        cardEl.classList.remove('flipped');
        sound.playRarityReveal(card.rank);
      }
      if (idx === boosterCards.length - 1) {
        setTimeout(() => {
          claimBtn?.classList.remove('hidden');
        }, 500);
      }
    }, 450 + idx * 450);
  });
}

// ==========================================================================
// Nova Tela de Coleção (Página Dedicada - Álbum / Binder)
// ==========================================================================
const collectionState = {
  mode: 'owned', // 'owned' | 'album'
  rankFilter: 'all',
  typeFilter: 'all',
  sortCriterion: 'id',
  searchQuery: '',
  selectedPokemonId: null
};

export function openCollectionScreen() {
  populateCollectionTypeFilter();
  updateCollectionDashboard();
  renderCollectionGridAndInspector();
  showScreen('collection');
}

function populateCollectionTypeFilter() {
  const typeSelect = document.getElementById('collection-type-filter');
  if (!typeSelect || typeSelect.children.length > 1) return;

  const lang = getLang();
  Object.keys(TYPE_TRANSLATIONS).forEach(ty => {
    const opt = document.createElement('option');
    opt.value = ty;
    opt.textContent = getTypeName(ty, lang);
    typeSelect.appendChild(opt);
  });
}

function setupCollectionToolbar() {
  // Alternador de Modo: Minhas Cartas vs Álbum Completo
  const btnOwned = document.getElementById('btn-col-mode-owned');
  const btnAlbum = document.getElementById('btn-col-mode-album');

  btnOwned?.addEventListener('click', () => {
    sound.playClick();
    collectionState.mode = 'owned';
    btnOwned.classList.add('active');
    btnAlbum?.classList.remove('active');
    renderCollectionGridAndInspector();
  });

  btnAlbum?.addEventListener('click', () => {
    sound.playClick();
    collectionState.mode = 'album';
    btnAlbum.classList.add('active');
    btnOwned?.classList.remove('active');
    renderCollectionGridAndInspector();
  });

  // Busca por Texto
  const searchInput = document.getElementById('collection-search-input');
  searchInput?.addEventListener('input', () => {
    collectionState.searchQuery = searchInput.value.trim().toLowerCase();
    renderCollectionGridAndInspector();
  });

  // Filtros de Rank
  const rankBtns = document.querySelectorAll('#collection-rank-filter .filter-btn');
  rankBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      rankBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      collectionState.rankFilter = btn.dataset.rank;
      renderCollectionGridAndInspector();
    });
  });

  // Filtro de Tipo Elemental
  const typeSelect = document.getElementById('collection-type-filter');
  typeSelect?.addEventListener('change', () => {
    collectionState.typeFilter = typeSelect.value;
    renderCollectionGridAndInspector();
  });

  // Ordenação
  const sortSelect = document.getElementById('collection-sort');
  sortSelect?.addEventListener('change', () => {
    collectionState.sortCriterion = sortSelect.value;
    renderCollectionGridAndInspector();
  });
}

function updateCollectionDashboard() {
  const inventory = state.playerInventory || loadInventory() || [];
  const uniqueIds = new Set(inventory.map(c => c.id));
  const totalGen1 = GEN1_POKEMON_BASE.length;
  const percentage = ((uniqueIds.size / totalGen1) * 100).toFixed(1);

  const dexCountEl = document.getElementById('col-dex-count');
  const dexBarEl = document.getElementById('col-dex-bar');

  if (dexCountEl) dexCountEl.textContent = `${uniqueIds.size} / ${totalGen1} (${percentage}%)`;
  if (dexBarEl) dexBarEl.style.width = `${percentage}%`;

  const counts = { SS: 0, S: 0, A: 0, B: 0, C: 0 };
  inventory.forEach(c => {
    const r = c.rank || 'C';
    if (counts[r] !== undefined) counts[r]++;
  });

  const ssEl = document.getElementById('col-count-ss');
  const sEl = document.getElementById('col-count-s');
  const aEl = document.getElementById('col-count-a');
  const bEl = document.getElementById('col-count-b');
  const cEl = document.getElementById('col-count-c');
  const totalEl = document.getElementById('col-count-total');

  if (ssEl) ssEl.textContent = counts.SS;
  if (sEl) sEl.textContent = counts.S;
  if (aEl) aEl.textContent = counts.A;
  if (bEl) bEl.textContent = counts.B;
  if (cEl) cEl.textContent = counts.C;
  if (totalEl) totalEl.textContent = inventory.length;

  updateBoosterButtonState();
}

function renderCollectionGridAndInspector() {
  const grid = document.getElementById('collection-cards-grid');
  if (!grid) return;

  const inventory = state.playerInventory || loadInventory() || [];

  // Agrupa cópias do inventário
  const grouped = {};
  inventory.forEach(card => {
    if (!grouped[card.id]) {
      grouped[card.id] = { base: card, count: 0, cards: [] };
    }
    grouped[card.id].count++;
    grouped[card.id].cards.push(card);
  });

  let items = [];

  if (collectionState.mode === 'owned') {
    items = Object.values(grouped).map(g => ({
      ...g.base,
      ownedCount: g.count,
      isOwned: true,
      hasEvolved: g.cards.some(c => c.isEvolved),
      unevolvedCount: g.cards.filter(c => !c.isEvolved).length
    }));
  } else {
    // Modo Álbum Completo (151)
    items = GEN1_POKEMON_BASE.map(p => {
      const g = grouped[p.id];
      const rank = p.rank || 'C';
      return {
        ...p,
        rank,
        image: getPokemonArtwork(p.id),
        ownedCount: g ? g.count : 0,
        isOwned: !!g,
        hasEvolved: g ? g.cards.some(c => c.isEvolved) : false,
        unevolvedCount: g ? g.cards.filter(c => !c.isEvolved).length : 0
      };
    });
  }

  // Filtro por Rank
  if (collectionState.rankFilter !== 'all') {
    items = items.filter(card => (card.rank || 'C') === collectionState.rankFilter);
  }

  // Filtro por Tipo Elemental
  if (collectionState.typeFilter !== 'all') {
    items = items.filter(card => card.types?.includes(collectionState.typeFilter));
  }

  // Filtro por Busca de Texto
  if (collectionState.searchQuery) {
    const q = collectionState.searchQuery;
    items = items.filter(card => 
      card.name.toLowerCase().includes(q) || String(card.id).includes(q)
    );
  }

  // Ordenação
  const rankOrder = { SS: 5, S: 4, A: 3, B: 2, C: 1 };
  items.sort((a, b) => {
    switch (collectionState.sortCriterion) {
      case 'rank':
        return (rankOrder[b.rank || 'C'] || 0) - (rankOrder[a.rank || 'C'] || 0);
      case 'attack':
        return (b.attack || 0) - (a.attack || 0);
      case 'defense':
        return (b.defense || 0) - (a.defense || 0);
      case 'speed':
        return (b.speed || 0) - (a.speed || 0);
      case 'copies':
        return (b.ownedCount || 0) - (a.ownedCount || 0);
      case 'id':
      default:
        return a.id - b.id;
    }
  });

  if (items.length === 0) {
    grid.innerHTML = `<p class="pokedex-grid-empty" style="grid-column: 1/-1;">${t('collection.empty')}</p>`;
    renderCollectionInspector(null, false, 0);
    return;
  }

  // Mantém ou seleciona o primeiro item para o Inspetor
  if (!collectionState.selectedPokemonId || !items.some(it => it.id === collectionState.selectedPokemonId)) {
    collectionState.selectedPokemonId = items[0].id;
  }

  const selectedItem = items.find(it => it.id === collectionState.selectedPokemonId) || items[0];

  grid.innerHTML = items.map(card => {
    const rank = card.rank || 'C';
    const isSelected = card.id === collectionState.selectedPokemonId;
    return `
      <div class="col-card-item rank-${rank.toLowerCase()} ${card.isOwned ? '' : 'unowned'} ${isSelected ? 'selected' : ''}" data-id="${card.id}">
        <span class="card-rank-badge rank-${rank.toLowerCase()}" style="position: absolute; top: 5px; left: 5px; font-size: 0.5rem; padding: 1px 4px;">${rank}</span>
        ${card.isOwned ? `<span class="col-card-badge">x${card.ownedCount}</span>` : `<span class="col-card-badge" style="color: #94a3b8;">🔒</span>`}
        ${card.hasEvolved ? `<span class="col-card-evolved">★</span>` : ''}
        <img loading="lazy" src="${getPokemonArtwork(card.id)}" alt="${card.name}" class="pokedex-mini-art"
             style="width: 86px; height: 86px; object-fit: contain; ${card.isOwned ? '' : 'filter: grayscale(1) brightness(0.35);'}">
        <div class="pokedex-mini-id" style="font-size: 0.68rem;">#${String(card.id).padStart(3, '0')}</div>
        <div class="pokedex-mini-name" style="font-size: 0.8rem;">${card.isOwned ? card.name : '???'}</div>
        <div class="pokedex-mini-stats" style="font-size: 0.7rem; gap: 6px; white-space: nowrap;">
          <span title="HP">❤️${card.hp}</span><span title="${t('stat.attack')}">⚔️${card.attack}</span><span title="${t('stat.defense')}">🛡️${card.defense}</span><span title="${t('stat.speed')}">⚡${card.speed}</span>
        </div>
      </div>
    `;
  }).join('');

  // Eventos de clique nas cartas da grade
  grid.querySelectorAll('.col-card-item').forEach(el => {
    el.addEventListener('click', () => {
      sound.playClick();
      collectionState.selectedPokemonId = Number(el.dataset.id);
      grid.querySelectorAll('.col-card-item').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      const clickedItem = items.find(it => it.id === collectionState.selectedPokemonId);
      if (clickedItem) {
        renderCollectionInspector(clickedItem, clickedItem.isOwned, clickedItem.unevolvedCount);
      }
    });
  });

  renderCollectionInspector(selectedItem, selectedItem.isOwned, selectedItem.unevolvedCount);
}

function renderCollectionInspector(card, isOwned, unevolvedCount) {
  const container = document.getElementById('collection-inspector-container');
  if (!container) return;

  if (!card) {
    container.innerHTML = `<p style="color: #64748b; text-align: center; margin-top: 2rem;">Selecione uma carta na grade para inspecionar.</p>`;
    return;
  }

  const rank = card.rank || 'C';
  const primaryType = card.types?.[0] || 'normal';
  const typeStyle = TYPE_TRANSLATIONS[primaryType] || TYPE_TRANSLATIONS.normal;
  const lang = getLang();
  const weaknesses = getWeaknesses(card.types || ['normal']);
  const totalStats = (card.hp || 0) + (card.attack || 0) + (card.defense || 0)
    + (card.spAttack || 0) + (card.spDefense || 0) + (card.speed || 0);

  let fusionHtml = '';
  if (isOwned && unevolvedCount >= 3) {
    fusionHtml = `
      <button type="button" class="btn-collection-fuse" id="btn-inspect-fuse" data-id="${card.id}">
        ${t('collection.fuseBtn')}
      </button>
      <p style="font-size: 0.72rem; color: #fbbf24; text-align: center; margin-top: 4px;">
        Você possui ${unevolvedCount} cópias! Funda 3 cópias para criar uma versão Shiny com +15% de poder!
      </p>
    `;
  }

  container.innerHTML = `
    <!-- Prévia Ampliada da Carta no estilo TCG / Holo -->
    <div class="col-inspect-preview">
      <div class="pokemon-card rank-${rank.toLowerCase()} ${card.hasEvolved || card.isEvolved ? 'evolved' : ''}" style="width: 200px; height: 350px; cursor: default; ${isOwned ? '' : 'filter: grayscale(1) brightness(0.6);'}">
        <div class="card-face card-front" style="border-color: ${typeStyle.color}; padding: 10px;">
          <div class="card-header" style="margin-bottom: 6px;">
            <div class="card-title-group">
              <span class="card-name" style="font-size: 0.95rem;">${isOwned ? card.name : '???'}</span>
              ${card.hasEvolved || card.isEvolved ? `<span class="evolved-badge">${t('evolve.badge')}</span>` : ''}
              <span class="card-rank-badge rank-${rank.toLowerCase()}">${rank}</span>
            </div>
            <span class="card-id" style="font-size: 0.65rem;">#${String(card.id).padStart(3, '0')}</span>
          </div>
          <div class="card-artwork-box" style="height: 115px; background: ${typeStyle.bg}">
            <img src="${getPokemonArtwork(card.id)}" alt="${card.name}" class="card-artwork loaded" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card.id}.png'">
            <div class="card-types">
              ${(card.types || []).map(ty => {
                const info = TYPE_TRANSLATIONS[ty] || { name: ty, color: '#666' };
                return `<span class="type-pill" style="background-color: ${info.color}">${getTypeName(ty, lang)}</span>`;
              }).join('')}
            </div>
          </div>
          <div class="card-stats" style="gap: 3px; margin-top: 6px;">
            ${STAT_DEFS.map(({ attr, icon, i18nKey }) => `
              <div class="stat-row" style="padding: 3px 6px;"><span class="stat-label">${icon} ${t(i18nKey)}</span><span class="stat-value">${card[attr]}</span></div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Detalhes e Status de Coleção -->
    <div class="col-inspect-details">
      <div class="col-inspect-meta">
        <span>Poder Total (BST):</span>
        <strong style="color: #ffcb05;">${totalStats}</strong>
      </div>
      <div class="col-inspect-meta">
        <span>Coleção:</span>
        <strong style="color: ${isOwned ? '#34d399' : '#f87171'};">${isOwned ? t('collection.ownedCount', { count: card.ownedCount }) : 'Não obtida'}</strong>
      </div>

      <div style="margin-top: 8px;">
        <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 700;">⚠️ ${t('battle.weakTo')}:</span>
        <div class="col-inspect-weaknesses">
          ${weaknesses.length > 0 
            ? weaknesses.map(w => {
                const info = TYPE_TRANSLATIONS[w.type] || { name: w.type, color: '#666' };
                return `<span class="type-pill" style="background-color: ${info.color}; font-size: 0.65rem; padding: 2px 6px;">${getTypeName(w.type, lang)} (x${w.multiplier})</span>`;
              }).join('')
            : '<span style="font-size: 0.75rem; color: #64748b;">Nenhuma</span>'}
        </div>
      </div>

      ${fusionHtml}
    </div>
  `;

  // Bind do botão de fusão direta
  const fuseBtn = container.querySelector('#btn-inspect-fuse');
  fuseBtn?.addEventListener('click', () => {
    sound.playEvolution();
    const res = performEvolution(card.id);
    if (res && res.success) {
      startConfetti();
      setTimeout(() => stopConfetti(), 2500);
      updateCollectionDashboard();
      renderCollectionGridAndInspector();
    }
  });
}

// ==========================================================================
// Starter Pack Modal (Boas-vindas com 20 cartas)
// ==========================================================================
function setupStarterModal(starterCards) {
  const grid = document.getElementById('starter-cards-grid');
  if (!grid) return;

  grid.innerHTML = starterCards.map(card => {
    const rank = card.rank || 'C';
    return `
      <div class="pokedex-mini-card rank-${rank.toLowerCase()}">
        <span class="card-rank-badge rank-${rank.toLowerCase()}" style="position: absolute; top: 4px; left: 4px; font-size: 0.5rem; padding: 1px 4px;">${rank}</span>
        <img src="${card.image}" alt="${card.name}" class="pokedex-mini-art">
        <div class="pokedex-mini-name" style="font-size: 0.75rem;">${card.name}</div>
        <div class="pokedex-mini-stats" style="font-size: 0.65rem;">
          <span>⚔️${card.attack}</span><span>🛡️${card.defense}</span><span>⚡${card.speed}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Efeito de Confetti com HTML5 Canvas
// ==========================================================================
function setupConfetti() {
  confettiCanvas = document.getElementById('confetti-canvas');
  if (confettiCanvas) {
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);
  }
}

function resizeConfetti() {
  if (confettiCanvas) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
}

function startConfetti() {
  if (!confettiCtx || !confettiCanvas) return;
  confettiParticles = [];
  const colors = ['#ffcb05', '#2a75bb', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#ffffff'];

  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      angle: Math.random() * 360,
      spin: Math.random() * 10 - 5
    });
  }

  function loop() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.angle += p.spin;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.angle * Math.PI) / 180);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      confettiCtx.restore();

      if (p.y > confettiCanvas.height) {
        p.y = -10;
        p.x = Math.random() * confettiCanvas.width;
      }
    });

    confettiAnimId = requestAnimationFrame(loop);
  }

  loop();
}

function stopConfetti() {
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  if (confettiCtx && confettiCanvas) {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}
