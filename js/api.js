/**
 * PokeTrunfo - API & Pokémon Data Service (1ª Geração: 1 a 151)
 * Consome a PokéAPI oficial e possui catálogo pré-configurado para carregamento instantâneo.
 */

// Tipos elementais em Português e cores associadas
export const TYPE_TRANSLATIONS = {
  normal: { name: 'Normal', color: '#9fa19f', bg: 'linear-gradient(135deg, #A8A878, #8A8A59)' },
  fire: { name: 'Fogo', color: '#e62829', bg: 'linear-gradient(135deg, #F08030, #C03028)' },
  water: { name: 'Água', color: '#2980ef', bg: 'linear-gradient(135deg, #6890F0, #386CEB)' },
  grass: { name: 'Planta', color: '#3fa129', bg: 'linear-gradient(135deg, #78C850, #4E8234)' },
  electric: { name: 'Elétrico', color: '#fac000', bg: 'linear-gradient(135deg, #F8D030, #C7A008)' },
  ice: { name: 'Gelo', color: '#3dcef3', bg: 'linear-gradient(135deg, #98D8D8, #69C6C6)' },
  fighting: { name: 'Lutador', color: '#ff8000', bg: 'linear-gradient(135deg, #C03028, #7D1F1A)' },
  poison: { name: 'Veneno', color: '#8f41cb', bg: 'linear-gradient(135deg, #A040A0, #682A68)' },
  ground: { name: 'Terra', color: '#915121', bg: 'linear-gradient(135deg, #E0C068, #B88E2A)' },
  flying: { name: 'Voador', color: '#81b9ef', bg: 'linear-gradient(135deg, #A890F0, #7450E7)' },
  psychic: { name: 'Psíquico', color: '#ef4179', bg: 'linear-gradient(135deg, #F85888, #D11A54)' },
  bug: { name: 'Inseto', color: '#91a119', bg: 'linear-gradient(135deg, #A8B820, #6D7815)' },
  rock: { name: 'Pedra', color: '#afa981', bg: 'linear-gradient(135deg, #B8A038, #786824)' },
  ghost: { name: 'Fantasma', color: '#704170', bg: 'linear-gradient(135deg, #705898, #493963)' },
  dragon: { name: 'Dragão', color: '#5060e1', bg: 'linear-gradient(135deg, #7038F8, #4411C7)' },
  steel: { name: 'Aço', color: '#60a1b8', bg: 'linear-gradient(135deg, #B8B8D0, #8A8AA3)' },
  fairy: { name: 'Fada', color: '#ef70ef', bg: 'linear-gradient(135deg, #EE99AC, #D4637B)' }
};

// Nomes de tipo em inglês — só o nome muda por idioma, cor/bg ficam em TYPE_TRANSLATIONS
const TYPE_NAMES_EN = {
  normal: 'Normal', fire: 'Fire', water: 'Water', grass: 'Grass', electric: 'Electric',
  ice: 'Ice', fighting: 'Fighting', poison: 'Poison', ground: 'Ground', flying: 'Flying',
  psychic: 'Psychic', bug: 'Bug', rock: 'Rock', ghost: 'Ghost', dragon: 'Dragon',
  steel: 'Steel', fairy: 'Fairy'
};

// Nome do tipo no idioma pedido ('pt' | 'en'); cor/gradiente seguem sempre TYPE_TRANSLATIONS
export function getTypeName(typeKey, lang = 'pt') {
  if (lang === 'en') return TYPE_NAMES_EN[typeKey] || typeKey;
  return TYPE_TRANSLATIONS[typeKey]?.name || typeKey;
}

// Base com os 151 Pokémon da 1ª Geração para carregamento instantâneo e offline
// Dados baseados nos stats oficiais da Geração 1
export const GEN1_POKEMON_BASE = [
  { id: 1, name: "Bulbasaur", types: ["grass", "poison"], hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 },
  { id: 2, name: "Ivysaur", types: ["grass", "poison"], hp: 60, attack: 62, defense: 63, spAttack: 80, spDefense: 80, speed: 60 },
  { id: 3, name: "Venusaur", types: ["grass", "poison"], hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 },
  { id: 4, name: "Charmander", types: ["fire"], hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
  { id: 5, name: "Charmeleon", types: ["fire"], hp: 58, attack: 64, defense: 58, spAttack: 80, spDefense: 65, speed: 80 },
  { id: 6, name: "Charizard", types: ["fire", "flying"], hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 },
  { id: 7, name: "Squirtle", types: ["water"], hp: 44, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 },
  { id: 8, name: "Wartortle", types: ["water"], hp: 59, attack: 63, defense: 80, spAttack: 65, spDefense: 80, speed: 58 },
  { id: 9, name: "Blastoise", types: ["water"], hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 },
  { id: 10, name: "Caterpie", types: ["bug"], hp: 45, attack: 30, defense: 35, spAttack: 20, spDefense: 20, speed: 45 },
  { id: 11, name: "Metapod", types: ["bug"], hp: 50, attack: 20, defense: 55, spAttack: 25, spDefense: 25, speed: 30 },
  { id: 12, name: "Butterfree", types: ["bug", "flying"], hp: 60, attack: 45, defense: 50, spAttack: 90, spDefense: 80, speed: 70 },
  { id: 13, name: "Weedle", types: ["bug", "poison"], hp: 40, attack: 35, defense: 30, spAttack: 20, spDefense: 20, speed: 50 },
  { id: 14, name: "Kakuna", types: ["bug", "poison"], hp: 45, attack: 25, defense: 50, spAttack: 25, spDefense: 25, speed: 35 },
  { id: 15, name: "Beedrill", types: ["bug", "poison"], hp: 65, attack: 90, defense: 40, spAttack: 45, spDefense: 80, speed: 75 },
  { id: 16, name: "Pidgey", types: ["normal", "flying"], hp: 40, attack: 45, defense: 40, spAttack: 35, spDefense: 35, speed: 56 },
  { id: 17, name: "Pidgeotto", types: ["normal", "flying"], hp: 63, attack: 60, defense: 55, spAttack: 50, spDefense: 50, speed: 71 },
  { id: 18, name: "Pidgeot", types: ["normal", "flying"], hp: 83, attack: 80, defense: 75, spAttack: 70, spDefense: 70, speed: 101 },
  { id: 19, name: "Rattata", types: ["normal"], hp: 30, attack: 56, defense: 35, spAttack: 25, spDefense: 35, speed: 72 },
  { id: 20, name: "Raticate", types: ["normal"], hp: 55, attack: 81, defense: 60, spAttack: 50, spDefense: 70, speed: 97 },
  { id: 21, name: "Spearow", types: ["normal", "flying"], hp: 40, attack: 60, defense: 30, spAttack: 31, spDefense: 31, speed: 70 },
  { id: 22, name: "Fearow", types: ["normal", "flying"], hp: 65, attack: 90, defense: 65, spAttack: 61, spDefense: 61, speed: 100 },
  { id: 23, name: "Ekans", types: ["poison"], hp: 35, attack: 60, defense: 44, spAttack: 40, spDefense: 54, speed: 55 },
  { id: 24, name: "Arbok", types: ["poison"], hp: 60, attack: 95, defense: 69, spAttack: 65, spDefense: 79, speed: 80 },
  { id: 25, name: "Pikachu", types: ["electric"], hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
  { id: 26, name: "Raichu", types: ["electric"], hp: 60, attack: 90, defense: 55, spAttack: 90, spDefense: 80, speed: 110 },
  { id: 27, name: "Sandshrew", types: ["ground"], hp: 50, attack: 75, defense: 85, spAttack: 20, spDefense: 30, speed: 40 },
  { id: 28, name: "Sandslash", types: ["ground"], hp: 75, attack: 100, defense: 110, spAttack: 45, spDefense: 55, speed: 65 },
  { id: 29, name: "Nidoran♀", types: ["poison"], hp: 55, attack: 47, defense: 52, spAttack: 40, spDefense: 40, speed: 41 },
  { id: 30, name: "Nidorina", types: ["poison"], hp: 70, attack: 62, defense: 67, spAttack: 55, spDefense: 55, speed: 56 },
  { id: 31, name: "Nidoqueen", types: ["poison", "ground"], hp: 90, attack: 92, defense: 87, spAttack: 75, spDefense: 85, speed: 76 },
  { id: 32, name: "Nidoran♂", types: ["poison"], hp: 46, attack: 57, defense: 40, spAttack: 40, spDefense: 40, speed: 50 },
  { id: 33, name: "Nidorino", types: ["poison"], hp: 61, attack: 72, defense: 57, spAttack: 55, spDefense: 55, speed: 65 },
  { id: 34, name: "Nidoking", types: ["poison", "ground"], hp: 81, attack: 102, defense: 77, spAttack: 85, spDefense: 75, speed: 85 },
  { id: 35, name: "Clefairy", types: ["fairy"], hp: 70, attack: 45, defense: 48, spAttack: 60, spDefense: 65, speed: 35 },
  { id: 36, name: "Clefable", types: ["fairy"], hp: 95, attack: 70, defense: 73, spAttack: 95, spDefense: 90, speed: 60 },
  { id: 37, name: "Vulpix", types: ["fire"], hp: 38, attack: 41, defense: 40, spAttack: 50, spDefense: 65, speed: 65 },
  { id: 38, name: "Ninetales", types: ["fire"], hp: 73, attack: 76, defense: 75, spAttack: 81, spDefense: 100, speed: 100 },
  { id: 39, name: "Jigglypuff", types: ["normal", "fairy"], hp: 115, attack: 45, defense: 20, spAttack: 45, spDefense: 25, speed: 20 },
  { id: 40, name: "Wigglytuff", types: ["normal", "fairy"], hp: 140, attack: 70, defense: 45, spAttack: 85, spDefense: 50, speed: 45 },
  { id: 41, name: "Zubat", types: ["poison", "flying"], hp: 40, attack: 45, defense: 35, spAttack: 30, spDefense: 40, speed: 55 },
  { id: 42, name: "Golbat", types: ["poison", "flying"], hp: 75, attack: 80, defense: 70, spAttack: 65, spDefense: 75, speed: 90 },
  { id: 43, name: "Oddish", types: ["grass", "poison"], hp: 45, attack: 50, defense: 55, spAttack: 75, spDefense: 65, speed: 30 },
  { id: 44, name: "Gloom", types: ["grass", "poison"], hp: 60, attack: 65, defense: 70, spAttack: 85, spDefense: 75, speed: 40 },
  { id: 45, name: "Vileplume", types: ["grass", "poison"], hp: 75, attack: 80, defense: 85, spAttack: 110, spDefense: 90, speed: 50 },
  { id: 46, name: "Paras", types: ["bug", "grass"], hp: 35, attack: 70, defense: 55, spAttack: 45, spDefense: 55, speed: 25 },
  { id: 47, name: "Parasect", types: ["bug", "grass"], hp: 60, attack: 95, defense: 80, spAttack: 60, spDefense: 80, speed: 30 },
  { id: 48, name: "Venonat", types: ["bug", "poison"], hp: 60, attack: 55, defense: 50, spAttack: 40, spDefense: 55, speed: 45 },
  { id: 49, name: "Venomoth", types: ["bug", "poison"], hp: 70, attack: 65, defense: 60, spAttack: 90, spDefense: 75, speed: 90 },
  { id: 50, name: "Diglett", types: ["ground"], hp: 10, attack: 55, defense: 25, spAttack: 35, spDefense: 45, speed: 95 },
  { id: 51, name: "Dugtrio", types: ["ground"], hp: 35, attack: 100, defense: 50, spAttack: 50, spDefense: 70, speed: 120 },
  { id: 52, name: "Meowth", types: ["normal"], hp: 40, attack: 45, defense: 35, spAttack: 40, spDefense: 40, speed: 90 },
  { id: 53, name: "Persian", types: ["normal"], hp: 65, attack: 70, defense: 60, spAttack: 65, spDefense: 65, speed: 115 },
  { id: 54, name: "Psyduck", types: ["water"], hp: 50, attack: 52, defense: 48, spAttack: 65, spDefense: 50, speed: 55 },
  { id: 55, name: "Golduck", types: ["water"], hp: 80, attack: 82, defense: 78, spAttack: 95, spDefense: 80, speed: 85 },
  { id: 56, name: "Mankey", types: ["fighting"], hp: 40, attack: 80, defense: 35, spAttack: 35, spDefense: 45, speed: 70 },
  { id: 57, name: "Primeape", types: ["fighting"], hp: 65, attack: 105, defense: 60, spAttack: 60, spDefense: 70, speed: 95 },
  { id: 58, name: "Growlithe", types: ["fire"], hp: 55, attack: 70, defense: 45, spAttack: 70, spDefense: 50, speed: 60 },
  { id: 59, name: "Arcanine", types: ["fire"], hp: 90, attack: 110, defense: 80, spAttack: 100, spDefense: 80, speed: 95 },
  { id: 60, name: "Poliwag", types: ["water"], hp: 40, attack: 50, defense: 40, spAttack: 40, spDefense: 40, speed: 90 },
  { id: 61, name: "Poliwhirl", types: ["water"], hp: 65, attack: 65, defense: 65, spAttack: 50, spDefense: 50, speed: 90 },
  { id: 62, name: "Poliwrath", types: ["water", "fighting"], hp: 90, attack: 95, defense: 95, spAttack: 70, spDefense: 90, speed: 70 },
  { id: 63, name: "Abra", types: ["psychic"], hp: 25, attack: 20, defense: 15, spAttack: 105, spDefense: 55, speed: 90 },
  { id: 64, name: "Kadabra", types: ["psychic"], hp: 40, attack: 35, defense: 30, spAttack: 120, spDefense: 70, speed: 105 },
  { id: 65, name: "Alakazam", types: ["psychic"], hp: 55, attack: 50, defense: 45, spAttack: 135, spDefense: 95, speed: 120 },
  { id: 66, name: "Machop", types: ["fighting"], hp: 70, attack: 80, defense: 50, spAttack: 35, spDefense: 35, speed: 35 },
  { id: 67, name: "Machoke", types: ["fighting"], hp: 80, attack: 100, defense: 70, spAttack: 50, spDefense: 60, speed: 45 },
  { id: 68, name: "Machamp", types: ["fighting"], hp: 90, attack: 130, defense: 80, spAttack: 65, spDefense: 85, speed: 55 },
  { id: 69, name: "Bellsprout", types: ["grass", "poison"], hp: 50, attack: 75, defense: 35, spAttack: 70, spDefense: 30, speed: 40 },
  { id: 70, name: "Weepinbell", types: ["grass", "poison"], hp: 65, attack: 90, defense: 50, spAttack: 85, spDefense: 45, speed: 55 },
  { id: 71, name: "Victreebel", types: ["grass", "poison"], hp: 80, attack: 105, defense: 65, spAttack: 100, spDefense: 70, speed: 70 },
  { id: 72, name: "Tentacool", types: ["water", "poison"], hp: 40, attack: 40, defense: 35, spAttack: 50, spDefense: 100, speed: 70 },
  { id: 73, name: "Tentacruel", types: ["water", "poison"], hp: 80, attack: 70, defense: 65, spAttack: 80, spDefense: 120, speed: 100 },
  { id: 74, name: "Geodude", types: ["rock", "ground"], hp: 40, attack: 80, defense: 100, spAttack: 30, spDefense: 30, speed: 20 },
  { id: 75, name: "Graveler", types: ["rock", "ground"], hp: 55, attack: 95, defense: 115, spAttack: 45, spDefense: 45, speed: 35 },
  { id: 76, name: "Golem", types: ["rock", "ground"], hp: 80, attack: 120, defense: 130, spAttack: 55, spDefense: 65, speed: 45 },
  { id: 77, name: "Ponyta", types: ["fire"], hp: 50, attack: 85, defense: 55, spAttack: 65, spDefense: 65, speed: 90 },
  { id: 78, name: "Rapidash", types: ["fire"], hp: 65, attack: 100, defense: 70, spAttack: 80, spDefense: 80, speed: 105 },
  { id: 79, name: "Slowpoke", types: ["water", "psychic"], hp: 90, attack: 65, defense: 65, spAttack: 40, spDefense: 40, speed: 15 },
  { id: 80, name: "Slowbro", types: ["water", "psychic"], hp: 95, attack: 75, defense: 110, spAttack: 100, spDefense: 80, speed: 30 },
  { id: 81, name: "Magnemite", types: ["electric", "steel"], hp: 25, attack: 35, defense: 70, spAttack: 95, spDefense: 55, speed: 45 },
  { id: 82, name: "Magneton", types: ["electric", "steel"], hp: 50, attack: 60, defense: 95, spAttack: 120, spDefense: 70, speed: 70 },
  { id: 83, name: "Farfetch'd", types: ["normal", "flying"], hp: 52, attack: 90, defense: 55, spAttack: 58, spDefense: 62, speed: 60 },
  { id: 84, name: "Doduo", types: ["normal", "flying"], hp: 35, attack: 85, defense: 45, spAttack: 35, spDefense: 35, speed: 75 },
  { id: 85, name: "Dodrio", types: ["normal", "flying"], hp: 60, attack: 110, defense: 70, spAttack: 60, spDefense: 60, speed: 110 },
  { id: 86, name: "Seel", types: ["water"], hp: 65, attack: 45, defense: 55, spAttack: 45, spDefense: 70, speed: 45 },
  { id: 87, name: "Dewgong", types: ["water", "ice"], hp: 90, attack: 70, defense: 80, spAttack: 70, spDefense: 95, speed: 70 },
  { id: 88, name: "Grimer", types: ["poison"], hp: 80, attack: 80, defense: 50, spAttack: 40, spDefense: 50, speed: 25 },
  { id: 89, name: "Muk", types: ["poison"], hp: 105, attack: 105, defense: 75, spAttack: 65, spDefense: 100, speed: 50 },
  { id: 90, name: "Shellder", types: ["water"], hp: 30, attack: 65, defense: 100, spAttack: 45, spDefense: 25, speed: 40 },
  { id: 91, name: "Cloyster", types: ["water", "ice"], hp: 50, attack: 95, defense: 180, spAttack: 85, spDefense: 45, speed: 70 },
  { id: 92, name: "Gastly", types: ["ghost", "poison"], hp: 30, attack: 35, defense: 30, spAttack: 100, spDefense: 35, speed: 80 },
  { id: 93, name: "Haunter", types: ["ghost", "poison"], hp: 45, attack: 50, defense: 45, spAttack: 115, spDefense: 55, speed: 95 },
  { id: 94, name: "Gengar", types: ["ghost", "poison"], hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 },
  { id: 95, name: "Onix", types: ["rock", "ground"], hp: 35, attack: 45, defense: 160, spAttack: 30, spDefense: 45, speed: 70 },
  { id: 96, name: "Drowzee", types: ["psychic"], hp: 60, attack: 48, defense: 45, spAttack: 43, spDefense: 90, speed: 42 },
  { id: 97, name: "Hypno", types: ["psychic"], hp: 85, attack: 73, defense: 70, spAttack: 73, spDefense: 115, speed: 67 },
  { id: 98, name: "Krabby", types: ["water"], hp: 30, attack: 105, defense: 90, spAttack: 25, spDefense: 25, speed: 50 },
  { id: 99, name: "Kingler", types: ["water"], hp: 55, attack: 130, defense: 115, spAttack: 50, spDefense: 50, speed: 75 },
  { id: 100, name: "Voltorb", types: ["electric"], hp: 40, attack: 30, defense: 50, spAttack: 55, spDefense: 55, speed: 100 },
  { id: 101, name: "Electrode", types: ["electric"], hp: 60, attack: 50, defense: 70, spAttack: 80, spDefense: 80, speed: 150 },
  { id: 102, name: "Exeggcute", types: ["grass", "psychic"], hp: 60, attack: 40, defense: 80, spAttack: 60, spDefense: 45, speed: 40 },
  { id: 103, name: "Exeggutor", types: ["grass", "psychic"], hp: 95, attack: 95, defense: 85, spAttack: 125, spDefense: 75, speed: 55 },
  { id: 104, name: "Cubone", types: ["ground"], hp: 50, attack: 50, defense: 95, spAttack: 40, spDefense: 50, speed: 35 },
  { id: 105, name: "Marowak", types: ["ground"], hp: 60, attack: 80, defense: 110, spAttack: 50, spDefense: 80, speed: 45 },
  { id: 106, name: "Hitmonlee", types: ["fighting"], hp: 50, attack: 120, defense: 53, spAttack: 35, spDefense: 110, speed: 87 },
  { id: 107, name: "Hitmonchan", types: ["fighting"], hp: 50, attack: 105, defense: 79, spAttack: 35, spDefense: 110, speed: 76 },
  { id: 108, name: "Lickitung", types: ["normal"], hp: 90, attack: 55, defense: 75, spAttack: 60, spDefense: 75, speed: 30 },
  { id: 109, name: "Koffing", types: ["poison"], hp: 40, attack: 65, defense: 95, spAttack: 60, spDefense: 45, speed: 35 },
  { id: 110, name: "Weezing", types: ["poison"], hp: 65, attack: 90, defense: 120, spAttack: 85, spDefense: 70, speed: 60 },
  { id: 111, name: "Rhyhorn", types: ["ground", "rock"], hp: 80, attack: 85, defense: 95, spAttack: 30, spDefense: 30, speed: 25 },
  { id: 112, name: "Rhydon", types: ["ground", "rock"], hp: 105, attack: 130, defense: 120, spAttack: 45, spDefense: 45, speed: 40 },
  { id: 113, name: "Chansey", types: ["normal"], hp: 250, attack: 5, defense: 5, spAttack: 35, spDefense: 105, speed: 50 },
  { id: 114, name: "Tangela", types: ["grass"], hp: 65, attack: 55, defense: 115, spAttack: 100, spDefense: 40, speed: 60 },
  { id: 115, name: "Kangaskhan", types: ["normal"], hp: 105, attack: 95, defense: 80, spAttack: 40, spDefense: 80, speed: 90 },
  { id: 116, name: "Horsea", types: ["water"], hp: 30, attack: 40, defense: 70, spAttack: 70, spDefense: 25, speed: 60 },
  { id: 117, name: "Seadra", types: ["water"], hp: 55, attack: 65, defense: 95, spAttack: 95, spDefense: 45, speed: 85 },
  { id: 118, name: "Goldeen", types: ["water"], hp: 45, attack: 67, defense: 60, spAttack: 35, spDefense: 50, speed: 63 },
  { id: 119, name: "Seaking", types: ["water"], hp: 80, attack: 92, defense: 65, spAttack: 65, spDefense: 80, speed: 68 },
  { id: 120, name: "Staryu", types: ["water"], hp: 30, attack: 45, defense: 55, spAttack: 70, spDefense: 55, speed: 85 },
  { id: 121, name: "Starmie", types: ["water", "psychic"], hp: 60, attack: 75, defense: 85, spAttack: 100, spDefense: 85, speed: 115 },
  { id: 122, name: "Mr. Mime", types: ["psychic", "fairy"], hp: 40, attack: 45, defense: 65, spAttack: 100, spDefense: 120, speed: 90 },
  { id: 123, name: "Scyther", types: ["bug", "flying"], hp: 70, attack: 110, defense: 80, spAttack: 55, spDefense: 80, speed: 105 },
  { id: 124, name: "Jynx", types: ["ice", "psychic"], hp: 65, attack: 50, defense: 35, spAttack: 115, spDefense: 95, speed: 95 },
  { id: 125, name: "Electabuzz", types: ["electric"], hp: 65, attack: 83, defense: 57, spAttack: 95, spDefense: 85, speed: 105 },
  { id: 126, name: "Magmar", types: ["fire"], hp: 65, attack: 95, defense: 57, spAttack: 100, spDefense: 85, speed: 93 },
  { id: 127, name: "Pinsir", types: ["bug"], hp: 65, attack: 125, defense: 100, spAttack: 55, spDefense: 70, speed: 85 },
  { id: 128, name: "Tauros", types: ["normal"], hp: 75, attack: 100, defense: 95, spAttack: 40, spDefense: 70, speed: 110 },
  { id: 129, name: "Magikarp", types: ["water"], hp: 20, attack: 10, defense: 55, spAttack: 15, spDefense: 20, speed: 80 },
  { id: 130, name: "Gyarados", types: ["water", "flying"], hp: 95, attack: 125, defense: 79, spAttack: 60, spDefense: 100, speed: 81 },
  { id: 131, name: "Lapras", types: ["water", "ice"], hp: 130, attack: 85, defense: 80, spAttack: 85, spDefense: 95, speed: 60 },
  { id: 132, name: "Ditto", types: ["normal"], hp: 48, attack: 48, defense: 48, spAttack: 48, spDefense: 48, speed: 48 },
  { id: 133, name: "Eevee", types: ["normal"], hp: 55, attack: 55, defense: 50, spAttack: 45, spDefense: 65, speed: 55 },
  { id: 134, name: "Vaporeon", types: ["water"], hp: 130, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 65 },
  { id: 135, name: "Jolteon", types: ["electric"], hp: 65, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 130 },
  { id: 136, name: "Flareon", types: ["fire"], hp: 65, attack: 130, defense: 60, spAttack: 95, spDefense: 110, speed: 65 },
  { id: 137, name: "Porygon", types: ["normal"], hp: 65, attack: 60, defense: 70, spAttack: 85, spDefense: 75, speed: 40 },
  { id: 138, name: "Omanyte", types: ["rock", "water"], hp: 35, attack: 40, defense: 100, spAttack: 90, spDefense: 55, speed: 35 },
  { id: 139, name: "Omastar", types: ["rock", "water"], hp: 70, attack: 60, defense: 125, spAttack: 115, spDefense: 70, speed: 55 },
  { id: 140, name: "Kabuto", types: ["rock", "water"], hp: 30, attack: 80, defense: 90, spAttack: 55, spDefense: 45, speed: 55 },
  { id: 141, name: "Kabutops", types: ["rock", "water"], hp: 60, attack: 115, defense: 105, spAttack: 65, spDefense: 70, speed: 80 },
  { id: 142, name: "Aerodactyl", types: ["rock", "flying"], hp: 80, attack: 105, defense: 65, spAttack: 60, spDefense: 75, speed: 130 },
  { id: 143, name: "Snorlax", types: ["normal"], hp: 160, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 },
  { id: 144, name: "Articuno", types: ["ice", "flying"], hp: 90, attack: 85, defense: 100, spAttack: 95, spDefense: 125, speed: 85 },
  { id: 145, name: "Zapdos", types: ["electric", "flying"], hp: 90, attack: 90, defense: 85, spAttack: 125, spDefense: 90, speed: 100 },
  { id: 146, name: "Moltres", types: ["fire", "flying"], hp: 90, attack: 100, defense: 90, spAttack: 125, spDefense: 85, speed: 90 },
  { id: 147, name: "Dratini", types: ["dragon"], hp: 41, attack: 64, defense: 45, spAttack: 50, spDefense: 50, speed: 50 },
  { id: 148, name: "Dragonair", types: ["dragon"], hp: 61, attack: 84, defense: 65, spAttack: 70, spDefense: 70, speed: 70 },
  { id: 149, name: "Dragonite", types: ["dragon", "flying"], hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 },
  { id: 150, name: "Mewtwo", types: ["psychic"], hp: 106, attack: 110, defense: 90, spAttack: 154, spDefense: 90, speed: 130 },
  { id: 151, name: "Mew", types: ["psychic"], hp: 100, attack: 100, defense: 100, spAttack: 100, spDefense: 100, speed: 100 }
];

// Configuração dos Ranks e Raridade
export const RANK_CONFIG = {
  C: { id: 'C', name: 'Comum', color: '#94a3b8', bg: 'linear-gradient(135deg, #475569, #334155)', rate: 0.50, badge: 'C' },
  B: { id: 'B', name: 'Incomum', color: '#10b981', bg: 'linear-gradient(135deg, #059669, #047857)', rate: 0.30, badge: 'B' },
  A: { id: 'A', name: 'Raro', color: '#3b82f6', bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)', rate: 0.14, badge: 'A' },
  S: { id: 'S', name: 'Épico', color: '#a855f7', bg: 'linear-gradient(135deg, #9333ea, #7e22ce)', rate: 0.05, badge: 'S' },
  SS: { id: 'SS', name: 'Lendário', color: '#f59e0b', bg: 'linear-gradient(135deg, #d97706, #b45309)', rate: 0.01, badge: 'SS' }
};

const LEGENDARY_IDS = new Set([144, 145, 146, 149, 150, 151]); // Articuno, Zapdos, Moltres, Dragonite, Mewtwo, Mew

export function getPokemonRank(pokemonBase) {
  if (!pokemonBase) return 'C';
  if (LEGENDARY_IDS.has(pokemonBase.id)) return 'SS';
  
  const total = (pokemonBase.hp || 0) + (pokemonBase.attack || 0) + (pokemonBase.defense || 0)
    + (pokemonBase.spAttack || 0) + (pokemonBase.spDefense || 0) + (pokemonBase.speed || 0);
  if (total >= 545) return 'SS';
  if (total >= 525) return 'S';
  if (total >= 495) return 'A';
  if (total >= 405) return 'B';
  return 'C';
}

// Catálogo agrupado por rank para sorteios rápidos
export const POKEMON_BY_RANK = {
  C: GEN1_POKEMON_BASE.filter(p => getPokemonRank(p) === 'C'),
  B: GEN1_POKEMON_BASE.filter(p => getPokemonRank(p) === 'B'),
  A: GEN1_POKEMON_BASE.filter(p => getPokemonRank(p) === 'A'),
  S: GEN1_POKEMON_BASE.filter(p => getPokemonRank(p) === 'S'),
  SS: GEN1_POKEMON_BASE.filter(p => getPokemonRank(p) === 'SS')
};

// Sorteia um Pokémon com base nas probabilidades de rank (Gacha ponderado)
export function drawSingleWeightedPokemon() {
  const r = Math.random();
  let pool = POKEMON_BY_RANK.C;
  if (r < 0.01) {
    pool = POKEMON_BY_RANK.SS;
  } else if (r < 0.06) {
    pool = POKEMON_BY_RANK.S;
  } else if (r < 0.20) {
    pool = POKEMON_BY_RANK.A;
  } else if (r < 0.50) {
    pool = POKEMON_BY_RANK.B;
  } else {
    pool = POKEMON_BY_RANK.C;
  }

  // Fallback caso algum pool esteja vazio
  if (!pool || pool.length === 0) pool = GEN1_POKEMON_BASE;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Sorteia N cartas ponderadas por probabilidade de rank
export function drawWeightedPokemonList(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push(drawSingleWeightedPokemon());
  }
  return list;
}

// Helper para obter URL da imagem oficial de alta definição
export function getPokemonArtwork(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Fallback de sprite clássico caso a artwork não carregue
export function getPokemonSpriteFallback(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Cria uma carta formatada a partir do ID do Pokémon
export function createCardFromBase(pokemonBase, isEvolved = false, evolveBonus = 0) {
  if (!pokemonBase) return null;
  const bonus = evolveBonus;
  const rank = getPokemonRank(pokemonBase);
  return {
    uid: `${pokemonBase.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    id: pokemonBase.id,
    name: pokemonBase.name,
    types: [...pokemonBase.types],
    hp: pokemonBase.hp + bonus,
    attack: pokemonBase.attack + bonus,
    defense: pokemonBase.defense + bonus,
    spAttack: pokemonBase.spAttack + bonus,
    spDefense: pokemonBase.spDefense + bonus,
    speed: pokemonBase.speed + bonus,
    isEvolved: isEvolved,
    evolveBonus: bonus,
    rank: rank,
    image: getPokemonArtwork(pokemonBase.id)
  };
}

// Tenta enriquecer dados via PokéAPI ao vivo, com fallback transparente
export async function fetchLivePokemonData(id) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    const hpStat = data.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
    const attackStat = data.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
    const defenseStat = data.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
    const spAttackStat = data.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50;
    const spDefenseStat = data.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50;
    const speedStat = data.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    const types = data.types.map(t => t.type.name);

    return {
      id: data.id,
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      types,
      hp: hpStat,
      attack: attackStat,
      defense: defenseStat,
      spAttack: spAttackStat,
      spDefense: spDefenseStat,
      speed: speedStat,
      rank: getPokemonRank(data),
      image: data.sprites.other?.['official-artwork']?.front_default || getPokemonArtwork(data.id)
    };
  } catch (err) {
    console.warn(`[PokéAPI] Usando dados locais para o Pokémon #${id}:`, err.message);
    const local = GEN1_POKEMON_BASE.find(p => p.id === id);
    return local ? { ...local, rank: getPokemonRank(local), image: getPokemonArtwork(local.id) } : null;
  }
}
