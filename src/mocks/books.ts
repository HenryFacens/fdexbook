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

export const mockBooks: MockBook[] = [
  {
    id: 1,
    title: 'Harry Potter e a Pedra Filosofal',
    author: 'J.K. Rowling',
    genre: 'Fantasia',
    pages: 264,
    cover:
      'https://images.unsplash.com/photo-1544937950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop',
    description:
      'O início da jornada de Harry no mundo da magia e em Hogwarts.',
  },
  {
    id: 2,
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    genre: 'Fábula',
    pages: 96,
    cover:
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Percy Jackson e o Ladrão de Raios',
    author: 'Rick Riordan',
    genre: 'Aventura',
    pages: 400,
    cover:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
  },
];

const hpQuiz: MockQuizQuestion[] = [
  {
    id: 'q1',
    question: 'Qual é a casa em que Harry foi selecionado?',
    options: ['Lufa-Lufa', 'Grifinória', 'Corvinal', 'Sonserina'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    question: 'Quem é o diretor de Hogwarts neste livro?',
    options: ['Severo Snape', 'Minerva McGonagall', 'Alvo Dumbledore', 'Hagrid'],
    correctIndex: 2,
  },
  {
    id: 'q3',
    question: 'Qual o esporte mágico praticado em vassouras?',
    options: ['Quadribol', 'Explosim', 'Pega-varinha', 'Bruxobol'],
    correctIndex: 0,
  },
  {
    id: 'q4',
    question: 'Quem dá a Harry seus primeiros óculos?',
    options: ['Os Dursley', 'Hagrid', 'Snape', 'Hermione'],
    correctIndex: 1,
  },
  {
    id: 'q5',
    question: 'A pedra filosofal estava escondida em…',
    options: ['Gringotes', 'A casa dos Weasley', 'A Câmara Secreta', 'Hogwarts'],
    correctIndex: 3,
  },
];

const pequenoPrincipeQuiz: MockQuizQuestion[] = [
  {
    id: 'q1',
    question: 'O Pequeno Príncipe vem de qual astro?',
    options: ['B-612', 'B-12', 'A-612', 'C-612'],
    correctIndex: 0,
  },
  {
    id: 'q2',
    question: 'Qual personagem ensina sobre “cativar”?',
    options: ['A Rosa', 'A Raposa', 'O Rei', 'O ACendedor de Lampiões'],
    correctIndex: 1,
  },
  {
    id: 'q3',
    question: 'Qual é o narrador da história?',
    options: ['Um piloto', 'Um marinheiro', 'Um rei', 'O geógrafo'],
    correctIndex: 0,
  },
  {
    id: 'q4',
    question: 'O que a Rosa pede ao Pequeno Príncipe?',
    options: ['Que viaje', 'Que a proteja com o globo', 'Que encontre o rei', 'Que regue o baobá'],
    correctIndex: 1,
  },
  {
    id: 'q5',
    question: 'Tema central do livro:',
    options: ['Guerra', 'Ciência', 'Amizade e afeto', 'Política'],
    correctIndex: 2,
  },
];

const percyQuiz: MockQuizQuestion[] = [
  {
    id: 'q1',
    question: 'Percy é filho de qual deus?',
    options: ['Zeus', 'Hades', 'Poseidon', 'Ares'],
    correctIndex: 2,
  },
  {
    id: 'q2',
    question: 'Qual objeto foi roubado?',
    options: ['O raio-mestre', 'O elmo das trevas', 'A Égide', 'O tridente'],
    correctIndex: 0,
  },
  {
    id: 'q3',
    question: 'Quem são os amigos que o acompanham?',
    options: [
      'Hermione e Rony',
      'Annabeth e Grover',
      'Clarisse e Luke',
      'Thalia e Nico',
    ],
    correctIndex: 1,
  },
  {
    id: 'q4',
    question: 'Onde fica o Acampamento Meio-Sangue?',
    options: ['Texas', 'Califórnia', 'Long Island', 'Florida'],
    correctIndex: 2,
  },
  {
    id: 'q5',
    question: 'A missão envolve uma viagem até…',
    options: ['O Olimpo', 'O Submundo', 'O Mar Egeu', 'As Amazonas'],
    correctIndex: 1,
  },
];

const quizzesByBookId: Record<number, MockQuizQuestion[]> = {
  1: hpQuiz,
  2: pequenoPrincipeQuiz,
  3: percyQuiz,
};

export function getQuizByBookId(bookId: number): MockQuizQuestion[] {
  return quizzesByBookId[bookId] ?? [];
}