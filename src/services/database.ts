import * as SQLite from 'expo-sqlite';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

// 📚 Livro no catálogo geral
interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  cover: string;
  pages: number;
  isbn?: string;
  description?: string;
  createdAt: string;
}

// 📖 Livro na biblioteca do usuário
interface UserBook {
  id: number;
  userId: number;
  bookId: number;
  currentPage: number;
  status: 'reading' | 'completed' | 'wishlist';
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// 📕 Livro completo (com dados do catálogo + dados do usuário)
interface UserBookDetail extends Book {
  userBookId: number;
  currentPage: number;
  status: 'reading' | 'completed' | 'wishlist';
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;
  private readonly DB_VERSION = 2;

  constructor() {
    this.db = SQLite.openDatabaseSync('dexbook.db');
    this.initDatabase();
  }

  private async getDatabaseVersion(): Promise<number> {
    try {
      // Cria tabela de versão se não existir
      this.db.execSync(`
        CREATE TABLE IF NOT EXISTS db_version (
          version INTEGER PRIMARY KEY
        );
      `);

      const result = await this.db.getFirstAsync<{ version: number }>(
        'SELECT version FROM db_version LIMIT 1'
      );

      return result?.version ?? 0;
    } catch (error) {
      return 0;
    }
  }

  private async setDatabaseVersion(version: number) {
    try {
      this.db.execSync('DELETE FROM db_version;');
      await this.db.runAsync('INSERT INTO db_version (version) VALUES (?)', [version]);
    } catch (error) {
      console.error('❌ Error setting database version:', error);
    }
  }

  private createTables() {
    // Tabela de usuários
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 📚 Tabela de livros (catálogo geral)
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        genre TEXT,
        cover TEXT,
        pages INTEGER DEFAULT 0,
        isbn TEXT UNIQUE,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 📖 Tabela de livros do usuário (vínculo)
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS user_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        bookId INTEGER NOT NULL,
        currentPage INTEGER DEFAULT 0,
        status TEXT DEFAULT 'wishlist',
        notes TEXT,
        startedAt DATETIME,
        completedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE CASCADE,
        UNIQUE(userId, bookId)
      );
    `);

    console.log('✅ Tables created');
  }

  private async migrateDatabase(fromVersion: number) {
    console.log(`🔄 Migrating database from version ${fromVersion} to ${this.DB_VERSION}`);

    if (fromVersion < 2) {
      // Migration de v1 para v2: adiciona colunas isbn e description
      try {
        const tableInfo = await this.db.getAllAsync<any>('PRAGMA table_info(books)');
        const hasIsbn = tableInfo.some((col: any) => col.name === 'isbn');
        const hasDescription = tableInfo.some((col: any) => col.name === 'description');

        if (!hasIsbn) {
          this.db.execSync('ALTER TABLE books ADD COLUMN isbn TEXT UNIQUE;');
          console.log('✅ Added isbn column');
        }

        if (!hasDescription) {
          this.db.execSync('ALTER TABLE books ADD COLUMN description TEXT;');
          console.log('✅ Added description column');
        }
      } catch (error) {
        console.error('❌ Error in migration v1 to v2:', error);
      }
    }
  }

  private async initDatabase() {
    const currentVersion = await this.getDatabaseVersion();
    console.log('📊 Current DB version:', currentVersion);

    if (currentVersion === 0) {
      this.createTables();
      await this.seedInitialBooks();
    } else if (currentVersion < this.DB_VERSION) {
      await this.migrateDatabase(currentVersion);
    }

    await this.setDatabaseVersion(this.DB_VERSION);
    console.log('✅ Database initialized');
  }

  private async seedInitialBooks() {
    console.log('🌱 Seeding initial books...');

    const initialBooks = [
      {
        title: 'Harry Potter e a Pedra Filosofal',
        author: 'J.K. Rowling',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/81ibfYk4qmL._AC_UF1000,1000_QL80_.jpg',
        pages: 264,
        isbn: '9788532530787',
        description: 'Harry Potter é um garoto órfão que vive infeliz com seus tios, os Dursley. Ele recebe uma carta contendo um convite para ingressar em Hogwarts, uma famosa escola especializada em formar jovens bruxos.',
      },
      {
        title: '1984',
        author: 'George Orwell',
        genre: 'Ficção Distópica',
        cover: 'https://m.media-amazon.com/images/I/819js3EQwbL._AC_UF1000,1000_QL80_.jpg',
        pages: 416,
        isbn: '9788535914849',
        description: 'Winston Smith é um funcionário público cuja função é reescrever a história de forma a colocar os líderes de seu país sob uma luz positiva.',
      },
      {
        title: 'O Senhor dos Anéis',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
        pages: 1178,
        isbn: '9788533613379',
        description: 'Uma aventura épica na Terra-média, onde o hobbit Frodo Bolseiro deve destruir um anel mágico para salvar o mundo.',
      },
      {
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        genre: 'Romance',
        cover: 'https://m.media-amazon.com/images/I/71Q0XW32yXL._AC_UF1000,1000_QL80_.jpg',
        pages: 256,
        isbn: '9788544001080',
        description: 'Bentinho narra sua vida, desde a infância até a maturidade, e sua relação com Capitu.',
      },
      {
        title: 'O Pequeno Príncipe',
        author: 'Antoine de Saint-Exupéry',
        genre: 'Fábula',
        cover: 'https://m.media-amazon.com/images/I/71OZY035FKL._AC_UF1000,1000_QL80_.jpg',
        pages: 96,
        isbn: '9788595081499',
        description: 'Um piloto cai com seu avião no deserto e encontra um pequeno príncipe vindo de outro planeta.',
      },
      {
        title: 'A Culpa é das Estrelas',
        author: 'John Green',
        genre: 'Romance',
        cover: 'https://m.media-amazon.com/images/I/71g6xZREFYL._AC_UF1000,1000_QL80_.jpg',
        pages: 288,
        isbn: '9788580573466',
        description: 'Hazel e Gus compartilham humor ácido, um desprezo por tudo que é convencional e, acima de tudo, amor.',
      },
      {
        title: 'O Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg',
        pages: 310,
        isbn: '9788595084742',
        description: 'Bilbo Bolseiro é convocado pelo mago Gandalf para participar de uma aventura com treze anões.',
      },
      {
        title: 'Percy Jackson: O Ladrão de Raios',
        author: 'Rick Riordan',
        genre: 'Aventura',
        cover: 'https://m.media-amazon.com/images/I/91WN6a6F3LL._AC_UF1000,1000_QL80_.jpg',
        pages: 400,
        isbn: '9788580575071',
        description: 'Percy Jackson descobre ser um semideus e precisa impedir uma guerra entre os deuses do Olimpo.',
      },
      {
        title: 'As Crônicas de Nárnia',
        author: 'C.S. Lewis',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg',
        pages: 767,
        isbn: '9788578277123',
        description: 'Quatro irmãos descobrem um mundo mágico dentro de um guarda-roupa.',
      },
      {
        title: 'O Código Da Vinci',
        author: 'Dan Brown',
        genre: 'Suspense',
        cover: 'https://m.media-amazon.com/images/I/71y4V9RBs8L._AC_UF1000,1000_QL80_.jpg',
        pages: 432,
        isbn: '9788580411379',
        description: 'Robert Langdon investiga um assassinato no Museu do Louvre que revela segredos históricos.',
      },
    ];

    for (const book of initialBooks) {
      try {
        await this.addBookToCatalog(book);
      } catch (error) {
        console.error(`❌ Error seeding book: ${book.title}`, error);
      }
    }

    console.log('✅ Initial books seeded successfully');
  }

  // ==================== MÉTODOS DE USUÁRIO ====================

  async registerUser(username: string, email: string, password: string): Promise<boolean> {
    try {
      const result = await this.db.runAsync(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password]
      );
      console.log('✅ User registered:', { username, email, insertId: result.lastInsertRowId });
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error registering user:', error);
      return false;
    }
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    try {
      const result = await this.db.getFirstAsync<User>(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );
      console.log('🔑 Login attempt:', { email, found: !!result });
      return result || null;
    } catch (error) {
      console.error('❌ Error during login:', error);
      return null;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM users WHERE email = ?',
        [email]
      );
      const exists = (result?.count ?? 0) > 0;
      console.log('📧 Email check:', { email, exists });
      return exists;
    } catch (error) {
      console.error('❌ Error checking email:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.db.getAllAsync<User>('SELECT * FROM users');
      console.log('👥 All users:', users);
      return users;
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  // ==================== MÉTODOS DE LIVROS (CATÁLOGO) ====================

  async addBookToCatalog(book: Omit<Book, 'id' | 'createdAt'>): Promise<number | null> {
    try {
      // Verifica se o livro já existe pelo ISBN ou título+autor
      if (book.isbn) {
        const existing = await this.db.getFirstAsync<Book>(
          'SELECT id FROM books WHERE isbn = ?',
          [book.isbn]
        );
        if (existing) {
          console.log('📚 Book already exists in catalog:', existing.id);
          return existing.id;
        }
      }

      const result = await this.db.runAsync(
        `INSERT INTO books (title, author, genre, cover, pages, isbn, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [book.title, book.author, book.genre, book.cover, book.pages, book.isbn || null, book.description || '']
      );
      console.log('✅ Book added to catalog:', { title: book.title, insertId: result.lastInsertRowId });
      return result.lastInsertRowId ?? null;
    } catch (error) {
      console.error('❌ Error adding book to catalog:', error);
      return null;
    }
  }

  async getBookFromCatalog(bookId: number): Promise<Book | null> {
    try {
      const book = await this.db.getFirstAsync<Book>(
        'SELECT * FROM books WHERE id = ?',
        [bookId]
      );
      return book || null;
    } catch (error) {
      console.error('❌ Error getting book from catalog:', error);
      return null;
    }
  }

  async getAllBooksFromCatalog(): Promise<Book[]> {
    try {
      const books = await this.db.getAllAsync<Book>(
        'SELECT * FROM books ORDER BY title ASC'
      );
      console.log('📚 Catalog books retrieved:', books.length);
      return books;
    } catch (error) {
      console.error('❌ Error getting catalog books:', error);
      return [];
    }
  }

  async getUserBookById(userBookId: number): Promise<UserBookDetail | null> {
    try {
      const book = await this.db.getFirstAsync<UserBookDetail>(
        `SELECT 
          ub.id as userBookId,
          ub.currentPage,
          ub.status,
          ub.notes,
          ub.startedAt,
          ub.completedAt,
          b.*
         FROM user_books ub
         INNER JOIN books b ON ub.bookId = b.id
         WHERE ub.id = ?`,
        [userBookId]
      );
      return book || null;
    } catch (error) {
      console.error('❌ Error getting user book by id:', error);
      return null;
    }
  }

  async searchBooksInCatalog(searchTerm: string): Promise<Book[]> {
    try {
      const books = await this.db.getAllAsync<Book>(
        'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? ORDER BY title',
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
      console.log('🔍 Books found:', books.length);
      return books;
    } catch (error) {
      console.error('❌ Error searching books:', error);
      return [];
    }
  }

  // ==================== MÉTODOS DE BIBLIOTECA DO USUÁRIO ====================

  async addBookToUserLibrary(userId: number, bookId: number, status: 'reading' | 'completed' | 'wishlist' = 'wishlist'): Promise<number | null> {
    try {
      const result = await this.db.runAsync(
        `INSERT INTO user_books (userId, bookId, status, startedAt) 
         VALUES (?, ?, ?, ?)`,
        [userId, bookId, status, status === 'reading' ? new Date().toISOString() : null]
      );
      console.log('✅ Book added to user library:', { userId, bookId, insertId: result.lastInsertRowId });
      return result.lastInsertRowId ?? null;
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        console.log('⚠️ Book already in user library');
        return null;
      }
      console.error('❌ Error adding book to user library:', error);
      return null;
    }
  }

  async getUserBooks(userId: number): Promise<UserBookDetail[]> {
    try {
      const books = await this.db.getAllAsync<UserBookDetail>(
        `SELECT 
          ub.id as userBookId,
          ub.currentPage,
          ub.status,
          ub.notes,
          ub.startedAt,
          ub.completedAt,
          b.*
         FROM user_books ub
         INNER JOIN books b ON ub.bookId = b.id
         WHERE ub.userId = ?
         ORDER BY ub.createdAt DESC`,
        [userId]
      );
      console.log('📚 User books retrieved:', books.length);
      return books;
    } catch (error) {
      console.error('❌ Error getting user books:', error);
      return [];
    }
  }

  async getUserBooksByStatus(userId: number, status: 'reading' | 'completed' | 'wishlist'): Promise<UserBookDetail[]> {
    try {
      const books = await this.db.getAllAsync<UserBookDetail>(
        `SELECT 
          ub.id as userBookId,
          ub.currentPage,
          ub.status,
          ub.notes,
          ub.startedAt,
          ub.completedAt,
          b.*
         FROM user_books ub
         INNER JOIN books b ON ub.bookId = b.id
         WHERE ub.userId = ? AND ub.status = ?
         ORDER BY ub.createdAt DESC`,
        [userId, status]
      );
      console.log(`📚 User books (${status}):`, books.length);
      return books;
    } catch (error) {
      console.error('❌ Error getting user books by status:', error);
      return [];
    }
  }

  async updateUserBook(userBookId: number, updates: Partial<UserBook>): Promise<boolean> {
  try {
    console.log('🔄 === UPDATE USER BOOK START ===');
    console.log('📝 userBookId:', userBookId);
    console.log('📝 updates:', JSON.stringify(updates, null, 2));

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.currentPage !== undefined) {
      fields.push('currentPage = ?');
      values.push(updates.currentPage);
      console.log('✏️ Adding currentPage:', updates.currentPage);
    }

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
      console.log('✏️ Adding status:', updates.status);

      // Atualiza datas automaticamente
      if (updates.status === 'reading' && !updates.startedAt) {
        fields.push('startedAt = ?');
        values.push(new Date().toISOString());
        console.log('✏️ Adding startedAt (auto)');
      }
      if (updates.status === 'completed') {
        fields.push('completedAt = ?');
        values.push(new Date().toISOString());
        console.log('✏️ Adding completedAt (auto)');
      }
    }

    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
      console.log('✏️ Adding notes');
    }

    if (fields.length === 0) {
      console.log('⚠️ No fields to update!');
      return false;
    }

    values.push(userBookId);

    const query = `UPDATE user_books SET ${fields.join(', ')} WHERE id = ?`;
    console.log('📋 SQL Query:', query);
    console.log('📋 SQL Values:', values);

    const result = await this.db.runAsync(query, values);

    console.log('✅ User book updated:', { userBookId, changes: result.changes });

    // 👇 VERIFICA SE REALMENTE SALVOU NO BANCO
    const verification = await this.db.getFirstAsync<any>(
      'SELECT * FROM user_books WHERE id = ?',
      [userBookId]
    );
    console.log('🔍 Verification - Book after update:', verification);
    console.log('🔍 Verification - Status is:', verification?.status);
    console.log('🔄 === UPDATE USER BOOK END ===\n');

    return result.changes > 0;
  } catch (error) {
    console.error('❌ Error updating user book:', error);
    return false;
  }
}

  async removeBookFromUserLibrary(userBookId: number): Promise<boolean> {
    try {
      const result = await this.db.runAsync(
        'DELETE FROM user_books WHERE id = ?',
        [userBookId]
      );
      console.log('✅ Book removed from user library:', { userBookId });
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error removing book from user library:', error);
      return false;
    }
  }

  // ==================== MÉTODOS DE ESTATÍSTICAS ====================

  async getUserStats(userId: number): Promise<{
    total: number;
    reading: number;
    completed: number;
    wishlist: number;
  }> {
    try {
      const result = await this.db.getFirstAsync<any>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'reading' THEN 1 ELSE 0 END) as reading,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'wishlist' THEN 1 ELSE 0 END) as wishlist
         FROM user_books
         WHERE userId = ?`,
        [userId]
      );

      return {
        total: result?.total ?? 0,
        reading: result?.reading ?? 0,
        completed: result?.completed ?? 0,
        wishlist: result?.wishlist ?? 0,
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return { total: 0, reading: 0, completed: 0, wishlist: 0 };
    }
  }
}

export const database = new DatabaseService();
export type { User, Book, UserBook, UserBookDetail };