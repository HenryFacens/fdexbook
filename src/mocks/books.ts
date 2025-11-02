// src/mocks/books.ts

export type MockBook = {
  id: number;
  title: string;
  author: string;
  genre: string;
  pages: number;
  cover: string;
  description?: string;
};

export type MockQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

/**
 * IMPORTANTE: os IDs abaixo (1..10) precisam bater com o ID do catálogo/banco.
 * O Quiz recebe bookId pela rota e usa esse ID para buscar as perguntas.
 */

export const mockBooks: MockBook[] = [
  {
    id: 1,
    title: '1984',
    author: 'George Orwell',
    genre: 'Distopia',
    pages: 352,
    cover:
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1200&auto=format&fit=crop',
    description: 'Um mundo de vigilância total, manipulação e opressão estatal.',
  },
  {
    id: 2,
    title: 'A Culpa é das Estrelas',
    author: 'John Green',
    genre: 'Romance',
    pages: 288,
    cover:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    description: 'Hazel e Gus vivem uma história de amor tocante em meio a tratamentos e descobertas.',
  },
  {
    id: 3,
    title: 'As Crônicas de Nárnia',
    author: 'C. S. Lewis',
    genre: 'Fantasia',
    pages: 752,
    cover:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop',
    description: 'Viagens a um mundo mágico com leões, bruxas e guarda-roupas.',
  },
  {
    id: 4,
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    genre: 'Romance',
    pages: 288,
    cover:
      'https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=1200&auto=format&fit=crop',
    description:
      'As memórias de Bentinho — ciúme, ambiguidade e a eterna dúvida sobre Capitu.',
  },
  {
    id: 5,
    title: 'Harry Potter e a Pedra Filosofal',
    author: 'J.K. Rowling',
    genre: 'Fantasia',
    pages: 264,
    cover:
      'https://images.unsplash.com/photo-1544937950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop',
    description: 'O início da jornada de Harry no mundo da magia e em Hogwarts.',
  },
  {
    id: 6,
    title: 'O Código Da Vinci',
    author: 'Dan Brown',
    genre: 'Thriller',
    pages: 432,
    cover:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
    description:
      'Um enigma que conecta arte, história e sociedades secretas em uma corrida contra o tempo.',
  },
  {
    id: 7,
    title: 'O Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasia',
    pages: 320,
    cover:
      'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=1200&auto=format&fit=crop',
    description: 'A jornada de Bilbo Bolseiro com anões e um mago para retomar Erebor.',
  },
  {
    id: 8,
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    genre: 'Fábula',
    pages: 96,
    cover:
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=1200&auto=format&fit=crop',
    description: 'Uma fábula poética sobre amizade, afeto e o essencial invisível aos olhos.',
  },
  {
    id: 9,
    title: 'O Senhor dos Anéis',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasia épica',
    pages: 1216,
    cover:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    description: 'A épica saga da Sociedade do Anel contra o poder de Sauron.',
  },
  {
    id: 10,
    title: 'Percy Jackson: O Ladrão de Raios',
    author: 'Rick Riordan',
    genre: 'Aventura',
    pages: 400,
    cover:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
    description:
      'Percy descobre ser um semideus e parte numa missão para recuperar o raio de Zeus.',
  },
];

/* ===================== QUIZZES ===================== */

/** 1) 1984 */
const quiz1984: MockQuizQuestion[] = [
  { id: 'q1', question: 'Quem é o protagonista de "1984"?', options: ['Winston Smith', 'Gregor Samsa', 'Guy Montag', 'Holden Caulfield'], correctIndex: 0 },
  { id: 'q2', question: 'Qual destes faz parte do lema do Partido?', options: ['Guerra é paz', 'Conhecimento é poder', 'Trabalho liberta', 'Todos são iguais'], correctIndex: 0 },
  { id: 'q3', question: 'Qual ministério é responsável por tortura e repressão?', options: ['Ministério da Verdade', 'Ministério da Paz', 'Ministério do Amor', 'Ministério da Fartura'], correctIndex: 2 },
  { id: 'q4', question: 'Qual sala simboliza o ápice do terror e da doutrinação?', options: ['Sala 13', 'Sala 404', 'Sala 101', 'Sala 0'], correctIndex: 2 },
  { id: 'q5', question: 'Quem é a figura onipresente do regime?', options: ['Grande Irmão', 'Grande Irmã', 'O Ditador', 'O Chefe'], correctIndex: 0 },
];

/** 2) A Culpa é das Estrelas */
const quizCulpaEstrelas: MockQuizQuestion[] = [
  { id: 'q1', question: 'Quem narra a história?', options: ['Gus', 'Hazel Grace', 'Isaac', 'Sr. Lancaster'], correctIndex: 1 },
  { id: 'q2', question: 'Qual livro fictício eles procuram o autor?', options: ['A Dor é um Pássaro', 'Uma Aflição Imperial', 'Flores para Hazel', 'Cartas para Augustus'], correctIndex: 1 },
  { id: 'q3', question: 'Para qual cidade europeia eles viajam?', options: ['Paris', 'Amsterdã', 'Veneza', 'Berlim'], correctIndex: 1 },
  { id: 'q4', question: 'Qual tema central do livro?', options: ['Guerra e política', 'Amizade e aventura', 'Amor e finitude', 'Mistério policial'], correctIndex: 2 },
  { id: 'q5', question: 'Qual condição afeta Hazel?', options: ['Cegueira', 'Câncer', 'Surdez', 'Doença cardíaca'], correctIndex: 1 },
];

/** 3) As Crônicas de Nárnia (geral) */
const quizNarnia: MockQuizQuestion[] = [
  { id: 'q1', question: 'Como as crianças entram em Nárnia pela primeira vez?', options: ['Porta mágica', 'Guarda-roupa', 'Mapa encantado', 'Espelho'], correctIndex: 1 },
  { id: 'q2', question: 'Quem é o grande leão?', options: ['Mufasa', 'Aslam', 'Aslan', 'Arslan'], correctIndex: 2 },
  { id: 'q3', question: 'Quem é a principal antagonista no início da saga?', options: ['Bela Feiticeira Branca', 'Morgana', 'Saruman', 'Rainha Vermelha'], correctIndex: 0 },
  { id: 'q4', question: 'Qual símbolo representa Aslan?', options: ['Árvore', 'Sol', 'Leão', 'Águia'], correctIndex: 2 },
  { id: 'q5', question: 'Qual tema é recorrente?', options: ['Viagens espaciais', 'Redenção e coragem', 'Política moderna', 'Tecnologia'], correctIndex: 1 },
];

/** 4) Dom Casmurro */
const quizDomCasmurro: MockQuizQuestion[] = [
  { id: 'q1', question: 'Quem é o narrador de "Dom Casmurro"?', options: ['Escobar', 'Bentinho (Dom Casmurro)', 'Capitu', 'Prudêncio'], correctIndex: 1 },
  { id: 'q2', question: 'Qual o nome da esposa de Bentinho?', options: ['Capitu', 'Virgília', 'Helena', 'Rita'], correctIndex: 0 },
  { id: 'q3', question: 'Qual amigo de Bentinho é central na suspeita de traição?', options: ['Ezequiel', 'Escobar', 'José Dias', 'Quincas Borba'], correctIndex: 1 },
  { id: 'q4', question: 'Tema central do romance:', options: ['Viagem no tempo', 'Ciúme e ambiguidade', 'Guerra e política', 'Ficção científica'], correctIndex: 1 },
  { id: 'q5', question: 'O romance é narrado em:', options: ['3ª pessoa objetiva', '1ª pessoa memorialista', '2ª pessoa epistolar', '3ª pessoa onisciente'], correctIndex: 1 },
];

/** 5) Harry Potter e a Pedra Filosofal */
const quizHP1: MockQuizQuestion[] = [
  { id: 'q1', question: 'Em qual casa Harry é selecionado?', options: ['Lufa-Lufa', 'Grifinória', 'Corvinal', 'Sonserina'], correctIndex: 1 },
  { id: 'q2', question: 'Quem dirige Hogwarts?', options: ['Snape', 'McGonagall', 'Dumbledore', 'Hagrid'], correctIndex: 2 },
  { id: 'q3', question: 'Esporte em vassouras:', options: ['Quadribol', 'Explosim', 'Pega-varinha', 'Bruxobol'], correctIndex: 0 },
  { id: 'q4', question: 'Quem leva Harry ao Beco Diagonal?', options: ['Dursley', 'Hagrid', 'Snape', 'Hermione'], correctIndex: 1 },
  { id: 'q5', question: 'Onde a Pedra fica escondida?', options: ['Gringotes', 'Casa dos Weasley', 'Câmara Secreta', 'Hogwarts'], correctIndex: 3 },
];

/** 6) O Código Da Vinci */
const quizCodigoDaVinci: MockQuizQuestion[] = [
  { id: 'q1', question: 'Quem é o protagonista?', options: ['Robert Langdon', 'Jason Bourne', 'Jack Reacher', 'Tom Sawyer'], correctIndex: 0 },
  { id: 'q2', question: 'O enredo começa em qual cidade?', options: ['Veneza', 'Londres', 'Paris', 'Roma'], correctIndex: 2 },
  { id: 'q3', question: 'Qual obra de arte é central no mistério?', options: ['A Noite Estrelada', 'A Última Ceia', 'O Grito', 'Guernica'], correctIndex: 1 },
  { id: 'q4', question: 'Sophie Neveu é…', options: ['Criminóloga', 'Criptóloga', 'Historiadora', 'Repórter'], correctIndex: 1 },
  { id: 'q5', question: 'Tema recorrente:', options: ['Mitologia nórdica', 'Códigos e simbologia', 'Viagens no tempo', 'Biografias'], correctIndex: 1 },
];

/** 7) O Hobbit */
const quizHobbit: MockQuizQuestion[] = [
  { id: 'q1', question: 'Protagonista de "O Hobbit":', options: ['Frodo', 'Bilbo', 'Thorin', 'Sam'], correctIndex: 1 },
  { id: 'q2', question: 'Quem recruta Bilbo?', options: ['Saruman', 'Gandalf', 'Elrond', 'Radagast'], correctIndex: 1 },
  { id: 'q3', question: 'Montanha a reconquistar:', options: ['Perdição', 'Erebor', 'Orthanc', 'Minas Tirith'], correctIndex: 1 },
  { id: 'q4', question: 'Guardião do tesouro:', options: ['Balrog', 'Troll', 'Smaug', 'Nazgûl'], correctIndex: 2 },
  { id: 'q5', question: 'Objeto mágico crucial:', options: ['Égide', 'Um Anel', 'Palantír', 'Silmaril'], correctIndex: 1 },
];

/** 8) O Pequeno Príncipe */
const quizPequenoPrincipe: MockQuizQuestion[] = [
  { id: 'q1', question: 'De qual astro vem o Pequeno Príncipe?', options: ['B-612', 'B-12', 'A-612', 'C-612'], correctIndex: 0 },
  { id: 'q2', question: 'Quem ensina sobre “cativar”?', options: ['A Rosa', 'A Raposa', 'O Rei', 'O Acendedor'], correctIndex: 1 },
  { id: 'q3', question: 'Quem narra a história?', options: ['Um piloto', 'Um marinheiro', 'Um rei', 'O geógrafo'], correctIndex: 0 },
  { id: 'q4', question: 'A Rosa pede…', options: ['Que viaje', 'Proteção com o globo', 'Que encontre o rei', 'Regar o baobá'], correctIndex: 1 },
  { id: 'q5', question: 'Tema central:', options: ['Guerra', 'Ciência', 'Amizade e afeto', 'Política'], correctIndex: 2 },
];

/** 9) O Senhor dos Anéis (geral) */
const quizSenhorAneis: MockQuizQuestion[] = [
  { id: 'q1', question: 'Quem carrega o Um Anel na missão?', options: ['Bilbo', 'Frodo', 'Aragorn', 'Boromir'], correctIndex: 1 },
  { id: 'q2', question: 'Qual o objetivo da Sociedade?', options: ['Coronar Aragorn', 'Destruir o Um Anel', 'Tomar Minas Tirith', 'Encontrar Smaug'], correctIndex: 1 },
  { id: 'q3', question: 'Onde o Anel deve ser destruído?', options: ['Erebor', 'Mordor', 'Valfenda', 'Gondor'], correctIndex: 1 },
  { id: 'q4', question: 'Quem é o mago cinzento?', options: ['Saruman', 'Radagast', 'Gandalf', 'Elrond'], correctIndex: 2 },
  { id: 'q5', question: 'Principal antagonista:', options: ['Sauron', 'Saruman', 'Smaug', 'Morgoth'], correctIndex: 0 },
];

/** 10) Percy Jackson: O Ladrão de Raios */
const quizPercy: MockQuizQuestion[] = [
  { id: 'q1', question: 'Percy é filho de qual deus?', options: ['Zeus', 'Hades', 'Poseidon', 'Ares'], correctIndex: 2 },
  { id: 'q2', question: 'Qual objeto foi roubado?', options: ['Raio-mestre', 'Elmo das trevas', 'Égide', 'Tridente'], correctIndex: 0 },
  { id: 'q3', question: 'Amigos que o acompanham:', options: ['Hermione e Rony', 'Annabeth e Grover', 'Clarisse e Luke', 'Thalia e Nico'], correctIndex: 1 },
  { id: 'q4', question: 'Onde fica o Acampamento Meio-Sangue?', options: ['Texas', 'Califórnia', 'Long Island', 'Flórida'], correctIndex: 2 },
  { id: 'q5', question: 'A missão envolve viagem até…', options: ['O Olimpo', 'O Submundo', 'Mar Egeu', 'Amazonas'], correctIndex: 1 },
];

/* ===== MAPEAMENTO bookId -> quiz =====
 * Garanta que seu bookId de catálogo/banco corresponda a estas chaves.
 */
const quizzesByBookId: Record<number, MockQuizQuestion[]> = {
  1: quiz1984,
  2: quizCulpaEstrelas,
  3: quizNarnia,
  4: quizDomCasmurro,
  5: quizHP1,
  6: quizCodigoDaVinci,
  7: quizHobbit,
  8: quizPequenoPrincipe,
  9: quizSenhorAneis,
  10: quizPercy,
};

export function getQuizByBookId(bookId: number): MockQuizQuestion[] {
  return quizzesByBookId[bookId] ?? [];
}

/**
 * Filtro seguro por título (normaliza acentos/caixa) — útil se quiser evitar
 * de propósito exibir quiz quando o título do livro não bater.
 */
export function getQuizSafe(bookId: number, bookTitle?: string) {
  const quiz = getQuizByBookId(bookId);
  if (!quiz || quiz.length === 0) return [];

  if (!bookTitle) return quiz;

  const byId = mockBooks.find((b) => b.id === bookId);
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (byId && norm(byId.title) === norm(bookTitle)) {
    return quiz;
  }
  return [];
}
