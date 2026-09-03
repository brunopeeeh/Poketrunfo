/**
 * PokeTrunfo - Internacionalização (PT-BR / EN)
 */

import { loadLanguage, saveLanguage } from './storage.js';

const DICT = {
  pt: {
    header: {
      rules: 'Regras',
      fast: 'Rápido',
      soundOn: 'Som',
      soundOff: 'Mudo',
      inventory: 'Coleção',
      pokedex: 'Pokédex',
      boosterReady: 'Abrir Booster!',
      boosterCooldown: 'Booster: {{time}}',
      ariaRules: 'Regras do Jogo',
      ariaPokedex: 'Pokédex de Consulta',
      ariaFast: 'Acelerar animações',
      ariaSound: 'Alternar Som',
      ariaVolume: 'Volume do som',
      ariaLang: 'Alternar Idioma',
      ariaInventory: 'Ver minha coleção de cartas',
      ariaBooster: 'Abrir booster de cartas'
    },
    menu: {
      subtitle: 'Colecione, dispute atributos da 1ª Geração e evolua seus Pokémon!',
      badgeEasy: 'Iniciante',
      badgeMedium: 'Treinador',
      badgeHard: 'Mestre',
      titleEasy: 'Fácil',
      titleMedium: 'Médio',
      titleHard: 'Difícil',
      detailEasy: '10 Cartas no Baralho',
      detailMedium: '5 Cartas no Baralho',
      detailHard: '3 Cartas no Baralho',
      startBtn: 'MONTAR BARALHO ⚡'
    },
    deckbuilder: {
      title: 'MONTE SEU BARALHO',
      subtitle: 'Escolha {{count}} Pokémon da sua coleção para o baralho',
      progress: '{{picked}} / {{total}} selecionados',
      searchPlaceholder: '🔍 Buscar Pokémon por nome...',
      randomFill: '🎲 Preencher Aleatoriamente',
      clear: '🗑️ Limpar Baralho',
      confirm: 'CONFIRMAR BARALHO ⚔️',
      back: '← Voltar',
      add: 'Adicionar',
      full: 'Cheio',
      trayLabel: 'Seu Baralho:',
      trayEmpty: 'Nenhuma carta selecionada ainda.',
      owned: 'Possui: {{count}}'
    },
    coin: {
      title: 'SORTEIO DA MOEDA',
      instructions: 'Escolha Cara ou Coroa para definir quem faz a primeira jogada!',
      cara: 'CARA',
      coroa: 'COROA',
      resultWin: '🪙 Caiu <strong>{{result}}</strong>! Você acertou e <strong>COMEÇA O JOGO</strong>!',
      resultLose: '🪙 Caiu <strong>{{result}}</strong>! O Computador venceu o sorteio e <strong>COMEÇA O JOGO</strong>!',
      toBattle: 'ENTRAR NA ARENA ⚔️'
    },
    battle: {
      you: '🧑 Você (P1)',
      cpu: '🤖 Computador',
      cardsCount: 'Cartas: {{count}}',
      evolveAvailable: '✨ Evolução Disponível!',
      yourTurn: 'SEU TURNO',
      cpuTurn: 'TURNO DO COMPUTADOR',
      pot: '⚡ Pote de Disputa: {{count}} Cartas!',
      chooseAttribute: 'Escolha um atributo da sua carta para disputar!',
      cpuThinkingLong: 'O Computador está analisando sua melhor jogada...',
      cpuThinking: 'Computador pensando...',
      nextRound: 'PRÓXIMA RODADA ➔',
      analyzeMatchup: '🔍 Analisar Confronto',
      playerChose: 'Você escolheu disputar por {{attr}}!',
      cpuChose: 'O Computador escolheu disputar por {{attr}}!',
      playerWonRound: '✨ Você VENCEU a rodada!',
      cpuWonRound: '💥 O Computador VENCEU!',
      tieRound: '⚖️ EMPATE!',
      dealtDamage: '({{p}} vs {{c}}) - Causou {{dmg}} de dano!',
      tieResult: '({{p}} vs {{c}}) - Cartas foram para o Pote de Disputa!',
      bonusApplied: '✨ Bônus Elemental de +20% aplicado!',
      penaltyApplied: '⚠️ Penalidade de -20% por desvantagem!',
      strongAgainst: 'Forte contra',
      weakTo: 'Fraco contra'
    },
    stat: {
      hp: 'HP',
      attack: 'Ataque',
      defense: 'Defesa',
      spAttack: 'Atq. Especial',
      spDefense: 'Def. Especial',
      speed: 'Velocidade'
    },
    matchup: {
      advantage: '✨ Vantagem Elemental (+20%)',
      disadvantage: '⚠️ Desvantagem Elemental (-20%)',
      neutral: '⚖️ Confronto Neutro',
      descPlayerAttack: '{{p}} tem vantagem sobre {{c}}! Bônus de +20% no atributo!',
      descPlayerResist: '{{p}} resiste contra {{c}}! Oponente sofre -20% de penalidade!',
      descPlayerDefendDisadvantage: '{{c}} tem vantagem sobre {{p}}! Você sofre -20% de penalidade!',
      descCpuAttack: '{{c}} tem vantagem sobre {{p}}! Computador ganha +20% de bônus!',
      descNeutral: 'Confronto elemental neutro.'
    },
    evolve: {
      title: '✨ Super Fusão Pokémon!',
      have: 'Você possui <strong>{{count}} cartas</strong> de <strong>{{name}}</strong> no seu baralho!',
      willFuse: '⚡ A fusão consumirá 3 cópias e criará um <strong>{{name}} Super Evoluído</strong> com <strong>+1 em todos os atributos</strong>!',
      confirmBtn: 'FUSIONAR E EVOLUIR AGORA!',
      triggerBtn: '✨ Evoluir Pokémon ({{name}} x{{count}})!',
      badge: '★ Evoluído'
    },
    gameover: {
      win: '🏆 VITÓRIA SUPREMA!',
      lose: '☠️ DERROTA!',
      reasonCpuHpZero: 'O HP do Computador chegou a 0!',
      reasonCpuNoCards: 'O Computador ficou sem cartas no baralho!',
      reasonPlayerHpZero: 'Seu HP chegou a 0!',
      reasonPlayerNoCards: 'Você ficou sem cartas no baralho!',
      roundsWon: 'Rodadas Vencidas',
      roundsLost: 'Rodadas Perdidas',
      damageDealt: 'Dano Total Causado',
      evolutionsDone: 'Evoluções Feitas',
      pokedexTotal: 'Pokédex Total',
      lifetimeWins: 'Vitórias (histórico)',
      restart: 'JOGAR NOVAMENTE 🔄'
    },
    rules: {
      title: '📜 Regras do PokéTrunfo',
      objTitle: '🎯 Objetivo do Jogo',
      objText: 'Derrote seu oponente zerando todos os seus pontos de vida (HP) ou capturando todas as cartas do baralho dele!',
      diffTitle: '⚙️ Níveis de Dificuldade',
      diffEasy: '<strong>Fácil:</strong> 10 cartas e 1000 de HP.',
      diffMedium: '<strong>Médio:</strong> 5 cartas e 500 de HP.',
      diffHard: '<strong>Difícil:</strong> 3 cartas e 300 de HP.',
      coinTitle: '🪙 Cara ou Coroa',
      coinText: 'No início, você escolhe Cara ou Coroa. Quem acertar o resultado da moeda começa fazendo a primeira jogada.',
      battleTitle: '⚔️ Batalhas de Atributos',
      battleText: 'Quem tem a vez escolhe um dos 6 atributos da carta no topo do seu baralho: <strong>HP</strong>, <strong>Ataque</strong>, <strong>Defesa</strong>, <strong>Atq. Especial</strong>, <strong>Def. Especial</strong> ou <strong>Velocidade</strong>.',
      battleLi1: 'O jogador com maior valor vence a rodada.',
      battleLi2: 'O vencedor <strong>ganha a carta disputada</strong> do oponente.',
      battleLi3: 'O perdedor recebe <strong>dano de HP</strong> igual à diferença dos atributos.',
      battleLi4: 'Em caso de <strong>empate</strong>, as cartas vão para o Pote de Disputa e o vencedor da próxima rodada leva todas!',
      typeTitle: '🔥 Sistema de Vantagens e Desvantagens (Dual-Type)',
      typeText: 'A eficácia elemental oficial de Pokémon influencia diretamente o combate:',
      typeLi1: '<strong>✨ Vantagem Elemental:</strong> Quem ataca com vantagem ganha <strong>+20% de bônus</strong> no atributo escolhido!',
      typeLi2: '<strong>⚠️ Desvantagem Elemental:</strong> Quem ataca um oponente com vantagem sofre <strong>-20% de penalidade</strong> no atributo!',
      typeLi3: '<strong>⚡ Dual-Type:</strong> Pokémon com 2 tipos utilizam o melhor tipo ofensivo e defensivo no cálculo da vantagem.',
      evoTitle: '✨ Mecânica de Evolução (Fusão x3)',
      evoText: 'Se você acumular <strong>3 cartas do mesmo Pokémon</strong> no seu baralho, você poderá fundi-las em uma versão <strong>Super Evoluída</strong> com <strong>+1 em todos os 6 atributos</strong> (HP, Ataque, Defesa, Atq. Especial, Def. Especial e Velocidade) e moldura brilhante holográfica!',
      deckTitle: '🃏 Montagem de Baralho',
      deckText: 'Antes da partida, você escolhe manualmente os Pokémon do seu baralho — pode repetir a mesma espécie para já começar perto de uma evolução, ou preencher aleatoriamente se preferir surpresa.'
    },
    pokedex: {
      title: 'Pokédex de Consulta',
      subtitle: 'Roda a mesma função de vantagem elemental usada na batalha — o resultado aqui é sempre igual ao da arena.',
      progress: '{{count}} / {{total}} Pokémon',
      tabCatalog: '📖 Catálogo 151',
      tabVs: '⚖️ Simulador Elemental (VS)',
      tabChart: '📊 Tabela de Tipos',
      activeTurn: 'Turno ativo:',
      player: 'Jogador',
      cpu: 'CPU',
      searchPlaceholder: '🔍 Buscar Pokémon por nome...',
      empty: 'Nenhum Pokémon encontrado para "{{query}}".',
      slotPlayer: '🧑 Jogador',
      slotCpu: '🤖 CPU',
      bestAttack: 'Melhor ataque:',
      modifier: 'Modificador:',
      noChange: 'sem alteração',
      chartSummary: 'Ver tabela de efetividade completa (18 tipos)'
    },
    rank: {
      title: 'Rank',
      C: 'Comum',
      B: 'Incomum',
      A: 'Raro',
      S: 'Épico',
      SS: 'Lendário'
    },
    booster: {
      modalTitle: '🎁 Abertura de Booster!',
      subtitle: 'Você abriu um pacote com 5 cartas aleatórias!',
      claimBtn: 'GUARDAR NA COLEÇÃO ✨',
      readyTitle: 'Booster Pronto!',
      readyText: 'Seu pacote gratuito de 5 cartas está pronto!',
      cooldownText: 'Próximo booster em:',
      testBtn: '⚡ Booster Instantâneo (Dev)'
    },
    starter: {
      title: '🎒 Boas-vindas ao PokéTrunfo!',
      subtitle: 'Você recebeu seu Pacote Inicial de 20 cartas aleatórias para montar seu baralho!',
      btn: 'MONTAR MEU BARALHO ⚡'
    },
    wager: {
      title: '⚔️ Aposta da Partida (Ante)',
      subtitle: 'Escolha 1 carta do seu baralho para arriscar! O vencedor leva as duas cartas para sua coleção!',
      yourCard: 'Sua Carta Apostada:',
      cpuCard: 'Carta Apostada pela CPU:',
      confirmBtn: 'CONFIRMAR APOSTA E JOGAR ⚔️',
      wonNotice: '🏆 Você venceu o duelo e levou a carta {{card}}!',
      lostNotice: '💀 A CPU venceu e levou sua carta {{card}}!',
      rescueNotice: '🚨 Seu baralho estava baixo: Pacote de Resgate (+5 cartas) concedido!'
    },
    inventory: {
      title: '🎒 Minha Coleção de Cartas',
      subtitle: 'Visualize todas as cartas obtidas em boosters e duelos',
      total: 'Total: {{count}} cartas',
      filterAll: 'Todas',
      empty: 'Nenhuma carta nesta categoria.'
    },
    collection: {
      title: '🎒 ÁLBUM DE COLEÇÃO',
      subtitle: 'Gerencie suas cartas, acompanhe seu progresso na Pokédex e funda cópias para evoluir!',
      backBtn: '← Voltar ao Menu',
      modeOwned: 'Minhas Cartas',
      modeAlbum: 'Álbum Completo (151)',
      dexProgress: 'Progresso da Pokédex (Gen 1):',
      searchPlaceholder: '🔍 Buscar por nome ou número...',
      allTypes: 'Todos os Tipos',
      sortId: 'Nº Pokédex',
      sortRank: 'Raridade (Rank)',
      sortAtk: 'Maior Ataque',
      sortDef: 'Maior Defesa',
      sortSpeed: 'Maior Velocidade',
      sortCopies: 'Mais Cópias',
      fuseBtn: '⚡ Fundir 3x & Evoluir (+15%)',
      fuseSuccess: '✨ Fusão realizada com sucesso! {{name}} evoluiu!',
      ownedCount: 'Possui: {{count}} cópias',
      unownedNotice: 'Você ainda não possui este Pokémon. Consiga-o em Boosters ou vencendo Apostas!',
      empty: 'Nenhuma carta encontrada com os filtros selecionados.'
    }
  },
  en: {
    header: {
      rules: 'Rules',
      fast: 'Fast',
      soundOn: 'Sound',
      soundOff: 'Muted',
      inventory: 'Collection',
      pokedex: 'Pokédex',
      boosterReady: 'Open Booster!',
      boosterCooldown: 'Booster: {{time}}',
      ariaRules: 'Game Rules',
      ariaPokedex: 'Reference Pokédex',
      ariaFast: 'Speed up animations',
      ariaSound: 'Toggle Sound',
      ariaVolume: 'Sound volume',
      ariaLang: 'Switch Language',
      ariaInventory: 'View card collection',
      ariaBooster: 'Open card booster'
    },
    menu: {
      subtitle: 'Collect, battle 1st Gen attributes, and evolve your Pokémon!',
      badgeEasy: 'Beginner',
      badgeMedium: 'Trainer',
      badgeHard: 'Master',
      titleEasy: 'Easy',
      titleMedium: 'Medium',
      titleHard: 'Hard',
      detailEasy: '10 Cards in Deck',
      detailMedium: '5 Cards in Deck',
      detailHard: '3 Cards in Deck',
      startBtn: 'BUILD DECK ⚡'
    },
    deckbuilder: {
      title: 'BUILD YOUR DECK',
      subtitle: 'Pick {{count}} Pokémon from your collection for your deck',
      progress: '{{picked}} / {{total}} selected',
      searchPlaceholder: '🔍 Search Pokémon by name...',
      randomFill: '🎲 Fill Randomly',
      clear: '🗑️ Clear Deck',
      confirm: 'CONFIRM DECK ⚔️',
      back: '← Back',
      add: 'Add',
      full: 'Full',
      trayLabel: 'Your Deck:',
      trayEmpty: 'No cards selected yet.',
      owned: 'Owned: {{count}}'
    },
    coin: {
      title: 'COIN TOSS',
      instructions: 'Choose Heads or Tails to decide who plays first!',
      cara: 'HEADS',
      coroa: 'TAILS',
      resultWin: '🪙 It landed on <strong>{{result}}</strong>! You guessed right and <strong>START THE GAME</strong>!',
      resultLose: '🪙 It landed on <strong>{{result}}</strong>! The Computer won the toss and <strong>STARTS THE GAME</strong>!',
      toBattle: 'ENTER THE ARENA ⚔️'
    },
    battle: {
      you: '🧑 You (P1)',
      cpu: '🤖 Computer',
      cardsCount: 'Cards: {{count}}',
      evolveAvailable: '✨ Evolution Available!',
      yourTurn: 'YOUR TURN',
      cpuTurn: "COMPUTER'S TURN",
      pot: '⚡ Dispute Pot: {{count}} Cards!',
      chooseAttribute: 'Choose an attribute from your card to battle!',
      cpuThinkingLong: 'The Computer is analyzing its best move...',
      cpuThinking: 'Computer thinking...',
      nextRound: 'NEXT ROUND ➔',
      analyzeMatchup: '🔍 Analyze Matchup',
      playerChose: 'You chose to battle with {{attr}}!',
      cpuChose: 'The Computer chose to battle with {{attr}}!',
      playerWonRound: '✨ You WON the round!',
      cpuWonRound: '💥 The Computer WON!',
      tieRound: '⚖️ TIE!',
      dealtDamage: '({{p}} vs {{c}}) - Dealt {{dmg}} damage!',
      tieResult: '({{p}} vs {{c}}) - Cards went to the Dispute Pot!',
      bonusApplied: '✨ +20% Elemental Bonus applied!',
      penaltyApplied: '⚠️ -20% Penalty for disadvantage!',
      strongAgainst: 'Strong against',
      weakTo: 'Weak to'
    },
    stat: {
      hp: 'HP',
      attack: 'Attack',
      defense: 'Defense',
      spAttack: 'Sp. Atk',
      spDefense: 'Sp. Def',
      speed: 'Speed'
    },
    matchup: {
      advantage: '✨ Elemental Advantage (+20%)',
      disadvantage: '⚠️ Elemental Disadvantage (-20%)',
      neutral: '⚖️ Neutral Matchup',
      descPlayerAttack: '{{p}} has the advantage over {{c}}! +20% bonus on the attribute!',
      descPlayerResist: '{{p}} resists {{c}}! Opponent suffers a -20% penalty!',
      descPlayerDefendDisadvantage: '{{c}} has the advantage over {{p}}! You suffer a -20% penalty!',
      descCpuAttack: '{{c}} has the advantage over {{p}}! Computer gets a +20% bonus!',
      descNeutral: 'Neutral elemental matchup.'
    },
    evolve: {
      title: '✨ Super Pokémon Fusion!',
      have: 'You have <strong>{{count}} cards</strong> of <strong>{{name}}</strong> in your deck!',
      willFuse: '⚡ The fusion will consume 3 copies and create a <strong>Super Evolved {{name}}</strong> with <strong>+1 to every attribute</strong>!',
      confirmBtn: 'FUSE AND EVOLVE NOW!',
      triggerBtn: '✨ Evolve Pokémon ({{name}} x{{count}})!',
      badge: '★ Evolved'
    },
    gameover: {
      win: '🏆 SUPREME VICTORY!',
      lose: '☠️ DEFEAT!',
      reasonCpuHpZero: "The Computer's HP reached 0!",
      reasonCpuNoCards: 'The Computer ran out of deck cards!',
      reasonPlayerHpZero: 'Your HP reached 0!',
      reasonPlayerNoCards: 'You ran out of deck cards!',
      roundsWon: 'Rounds Won',
      roundsLost: 'Rounds Lost',
      damageDealt: 'Total Damage Dealt',
      evolutionsDone: 'Evolutions Made',
      pokedexTotal: 'Total Pokédex',
      lifetimeWins: 'Wins (lifetime)',
      restart: 'PLAY AGAIN 🔄'
    },
    rules: {
      title: '📜 PokéTrunfo Rules',
      objTitle: '🎯 Game Objective',
      objText: 'Defeat your opponent by zeroing their HP or capturing every card in their deck!',
      diffTitle: '⚙️ Difficulty Levels',
      diffEasy: '<strong>Easy:</strong> 10 cards and 1000 HP.',
      diffMedium: '<strong>Medium:</strong> 5 cards and 500 HP.',
      diffHard: '<strong>Hard:</strong> 3 cards and 300 HP.',
      coinTitle: '🪙 Heads or Tails',
      coinText: 'At the start, you choose Heads or Tails. Whoever guesses the coin result plays first.',
      battleTitle: '⚔️ Attribute Battles',
      battleText: 'Whoever has the turn picks one of the 6 attributes from the card on top of their deck: <strong>HP</strong>, <strong>Attack</strong>, <strong>Defense</strong>, <strong>Sp. Atk</strong>, <strong>Sp. Def</strong>, or <strong>Speed</strong>.',
      battleLi1: 'The player with the higher value wins the round.',
      battleLi2: 'The winner <strong>takes the disputed card</strong> from the opponent.',
      battleLi3: 'The loser takes <strong>HP damage</strong> equal to the difference between the attributes.',
      battleLi4: 'On a <strong>tie</strong>, both cards go to the Dispute Pot and the winner of the next round takes them all!',
      typeTitle: '🔥 Advantage & Disadvantage System (Dual-Type)',
      typeText: "Pokémon's official elemental effectiveness directly influences combat:",
      typeLi1: '<strong>✨ Elemental Advantage:</strong> Attacking with an advantage gives a <strong>+20% bonus</strong> to the chosen attribute!',
      typeLi2: '<strong>⚠️ Elemental Disadvantage:</strong> Attacking an opponent who has the advantage causes a <strong>-20% penalty</strong> to the attribute!',
      typeLi3: '<strong>⚡ Dual-Type:</strong> Pokémon with 2 types use whichever type gives the best offensive and defensive matchup.',
      evoTitle: '✨ Evolution Mechanic (x3 Fusion)',
      evoText: 'If you collect <strong>3 cards of the same Pokémon</strong> in your deck, you can fuse them into a <strong>Super Evolved</strong> version with <strong>+1 to all 6 attributes</strong> (HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed) and a shiny holographic frame!',
      deckTitle: '🃏 Deck Building & Card Wagers',
      deckText: 'Build your deck from your owned cards. Before the battle starts, wager 1 card from your deck against the CPU — the winner takes both cards home!'
    },
    pokedex: {
      title: 'Reference Pokédex',
      subtitle: 'Runs the exact same elemental advantage function used in battle — the result here always matches the arena.',
      progress: '{{count}} / {{total}} Pokémon',
      tabCatalog: '📖 151 Catalog',
      tabVs: '⚖️ Type Simulator (VS)',
      tabChart: '📊 Type Chart',
      activeTurn: 'Active turn:',
      player: 'Player',
      cpu: 'CPU',
      searchPlaceholder: '🔍 Search Pokémon by name...',
      empty: 'No Pokémon found for "{{query}}".',
      slotPlayer: '🧑 Player',
      slotCpu: '🤖 CPU',
      bestAttack: 'Best attack:',
      modifier: 'Modifier:',
      noChange: 'no change',
      chartSummary: 'View full effectiveness chart (18 types)'
    },
    rank: {
      title: 'Rank',
      C: 'Common',
      B: 'Uncommon',
      A: 'Rare',
      S: 'Epic',
      SS: 'Legendary'
    },
    booster: {
      modalTitle: '🎁 Booster Pack Opening!',
      subtitle: 'You opened a pack with 5 random cards!',
      claimBtn: 'SAVE TO COLLECTION ✨',
      readyTitle: 'Booster Ready!',
      readyText: 'Your free 5-card pack is ready to open!',
      cooldownText: 'Next booster in:',
      testBtn: '⚡ Instant Booster (Dev)'
    },
    starter: {
      title: '🎒 Welcome to PokéTrunfo!',
      subtitle: 'Here is your Starter Pack of 20 random cards to begin building your decks!',
      btn: 'BUILD MY DECK ⚡'
    },
    wager: {
      title: '⚔️ Match Wager (Ante)',
      subtitle: 'Choose 1 card from your deck to stake! The winner takes both cards into their permanent collection!',
      yourCard: 'Your Wagered Card:',
      cpuCard: 'CPU Wagered Card:',
      confirmBtn: 'CONFIRM WAGER & BATTLE ⚔️',
      wonNotice: '🏆 You won the match and captured {{card}}!',
      lostNotice: '💀 The CPU won the match and took your {{card}}!',
      rescueNotice: '🚨 Your deck was low: Rescue Pack (+5 cards) granted!'
    },
    inventory: {
      title: '🎒 My Card Collection',
      subtitle: 'View all cards obtained from boosters and battles',
      total: 'Total: {{count}} cards',
      filterAll: 'All',
      empty: 'No cards found in this category.'
    },
    collection: {
      title: '🎒 COLLECTION ALBUM',
      subtitle: 'Manage your cards, track your Pokédex progress, and fuse duplicates to evolve!',
      backBtn: '← Back to Menu',
      modeOwned: 'My Cards',
      modeAlbum: 'Full Album (151)',
      dexProgress: 'Pokédex Progress (Gen 1):',
      searchPlaceholder: '🔍 Search by name or number...',
      allTypes: 'All Types',
      sortId: 'Pokédex #',
      sortRank: 'Rarity (Rank)',
      sortAtk: 'Highest Attack',
      sortDef: 'Highest Defense',
      sortSpeed: 'Highest Speed',
      sortCopies: 'Most Copies',
      fuseBtn: '⚡ Fuse 3x & Evolve (+15%)',
      fuseSuccess: '✨ Fusion successful! {{name}} evolved!',
      ownedCount: 'Owned: {{count}} copies',
      unownedNotice: 'You do not own this Pokémon yet. Find it in Boosters or win it in Wagers!',
      empty: 'No cards found with the selected filters.'
    }
  }
};

let currentLang = loadLanguage();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = DICT[lang] ? lang : 'pt';
  saveLanguage(currentLang);
}

// Resolve "a.b.c" dentro do dicionário do idioma ativo, com fallback pt.
function resolve(key) {
  const path = key.split('.');
  let node = DICT[currentLang];
  for (const part of path) node = node?.[part];
  if (node !== undefined) return node;

  let fallback = DICT.pt;
  for (const part of path) fallback = fallback?.[part];
  return fallback !== undefined ? fallback : key;
}

export function t(key, vars = {}) {
  let text = resolve(key);
  Object.keys(vars).forEach(name => {
    text = text.replaceAll(`{{${name}}}`, vars[name]);
  });
  return text;
}

// Aplica t() em todo elemento marcado com data-i18n (texto), data-i18n-html
// (inner HTML, para strings com <strong>) e data-i18n-placeholder/data-i18n-aria.
export function applyStaticI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}
