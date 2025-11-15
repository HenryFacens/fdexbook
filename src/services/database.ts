import * as SQLite from 'expo-sqlite';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt?: string;
}

export interface Book {
  id: number;
  uuid?: string;     
  title: string;
  author: string;
  genre?: string;
  cover?: string;
  pages: number;      
  isbn?: string | null;
  description?: string | null;
  createdAt?: string;
}

export interface UserBook {
  id: number;
  userId: number;
  bookId: number;
  currentPage: number;
  status: 'reading' | 'completed' | 'wishlist';
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
}

export interface UserBookDetail extends Book {
  userBookId: number;
  currentPage: number;
  status: 'reading' | 'completed' | 'wishlist';
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;
  private readonly DB_VERSION = 2;
  private readonly DB_NAME = 'dexbook.db';

  constructor() {
    this.db = SQLite.openDatabaseSync?.(this.DB_NAME) ?? (SQLite as any).openDatabase(this.DB_NAME);

    try {
      this.db.execSync?.('PRAGMA foreign_keys = ON;');
    } catch {
      try { (this.db as any).exec('PRAGMA foreign_keys = ON;'); } catch {}
    }

    this.resetDatabase();
  }

    async resetDatabase(): Promise<boolean> {
      try {
        console.log('🗑️  Resetting database...');

        // Fechar conexão atual
        await this.db.closeAsync?.();

        // Deletar o banco de dados (funciona em versões mais recentes do Expo)
        try {
          await SQLite.deleteDatabaseAsync(this.DB_NAME);
          console.log('✅ Database deleted successfully');
        } catch (deleteError) {
          console.log('⚠️  Could not delete database file, continuing...');
        }

        // Recriar a conexão
        this.db = SQLite.openDatabaseSync?.(this.DB_NAME) ?? (SQLite as any).openDatabase(this.DB_NAME);

        // Reinicializar o banco
        await this.initDatabase();

        console.log('✅ Database reset completed');
        return true;
      } catch (error) {
        console.error('❌ Error resetting database:', error);
        return false;
      }
    }

  private async getDatabaseVersion(): Promise<number> {
    try {
      this.db.execSync?.(`
        CREATE TABLE IF NOT EXISTS db_version (
          version INTEGER PRIMARY KEY
        );
      `);
      const row = await this.db.getFirstAsync<{ version: number }>(
        'SELECT version FROM db_version LIMIT 1'
      );
      return row?.version ?? 0;
    } catch {
      return 0;
    }
  }

  private async setDatabaseVersion(version: number) {
    try {
      this.db.execSync?.('DELETE FROM db_version;');
      await this.db.runAsync?.('INSERT INTO db_version (version) VALUES (?)', [version]);
    } catch (error) {
      console.error('❌ Error setting database version:', error);
    }
  }

  private createTables() {
    this.db.execSync?.(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.execSync?.(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE, -- pode ser NULL em bases antigas, mas com índice UNIQUE
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

    try {
      this.db.execSync?.('CREATE UNIQUE INDEX IF NOT EXISTS idx_books_title_author ON books(title, author);');
    } catch {}

    this.db.execSync?.(`
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

    console.log('✅ Tables created/ensured');
  }

  private async migrateDatabase(fromVersion: number) {
    console.log(`🔄 Migrating database from v${fromVersion} to v${this.DB_VERSION}`);

    if (fromVersion < 2) {
      try {
        const cols = await this.db.getAllAsync<{ name: string }>('PRAGMA table_info(books);');
        const hasIsbn = cols.some(c => c.name === 'isbn');
        const hasDescription = cols.some(c => c.name === 'description');
        const hasUuid = cols.some(c => c.name === 'uuid');

        if (!hasIsbn) {
          this.db.execSync?.('ALTER TABLE books ADD COLUMN isbn TEXT UNIQUE;');
          console.log('✅ Added books.isbn');
        }
        if (!hasDescription) {
          this.db.execSync?.('ALTER TABLE books ADD COLUMN description TEXT;');
          console.log('✅ Added books.description');
        }
        if (!hasUuid) {
          this.db.execSync?.('ALTER TABLE books ADD COLUMN uuid TEXT;');
          try {
            this.db.execSync?.('CREATE UNIQUE INDEX IF NOT EXISTS idx_books_uuid ON books(uuid);');
          } catch {}
          console.log('✅ Added books.uuid (+ unique index)');
        }
      } catch (error) {
        console.error('❌ Error migrating to v2:', error);
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
      this.createTables(); 
      await this.migrateDatabase(currentVersion);
    }

    await this.ensureBooksTableWithUuid();

    await this.setDatabaseVersion(this.DB_VERSION);
    console.log('✅ Database initialized');
  }

  private async seedInitialBooks() {
    console.log('🌱 Seeding initial books...');
    const count = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM books;');
    if ((count?.n ?? 0) > 0) {
      console.log('↩️  Seed skipped (already has data)');
      return;
    }

    const initialBooks: Omit<Book, 'id' | 'createdAt'>[] = [
      {
        uuid: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        title: 'Harry Potter e a Pedra Filosofal',
        author: 'J.K. Rowling',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/81ibfYk4qmL._AC_UF1000,1000_QL80_.jpg',
        pages: 264,
        isbn: '9788532530787',
        description:
          'Harry Potter é um garoto órfão que vive infeliz com seus tios, os Dursley. Ele recebe uma carta contendo um convite para ingressar em Hogwarts, uma famosa escola especializada em formar jovens bruxos.',
      },
      {
        uuid: 'c7d5a60a-8fcb-4c6c-a891-836ff3ed40f8',
        title: '1984',
        author: 'George Orwell',
        genre: 'Ficção Distópica',
        cover: 'https://m.media-amazon.com/images/I/819js3EQwbL._AC_UF1000,1000_QL80_.jpg',
        pages: 416,
        isbn: '9788535914849',
        description:
          'Winston Smith é um funcionário público cuja função é reescrever a história de forma a colocar os líderes de seu país sob uma luz positiva.',
      },
      {
        uuid: 'af9e1cf6-ec1f-4b74-8b2d-02cb72c1a6c5',
        title: 'O Senhor dos Anéis',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
        pages: 1178,
        isbn: '9788533613379',
        description:
          'Uma aventura épica na Terra-média, onde o hobbit Frodo Bolseiro deve destruir um anel mágico para salvar o mundo.',
      },
      {
        uuid: '5f64e6df-bc47-45b7-b5c8-89132ed5e073',
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        genre: 'Romance',
        cover: 'https://m.media-amazon.com/images/I/71Q0XW32yXL._AC_UF1000,1000_QL80_.jpg',
        pages: 256,
        isbn: '9788544001080',
        description:
          'Bentinho narra sua vida, desde a infância até a maturidade, e sua relação com Capitu.',
      },
      {
        uuid: '9c97b1a7-bdd8-42e3-b1b2-0db7a32a92cf',
        title: 'O Pequeno Príncipe',
        author: 'Antoine de Saint-Exupéry',
        genre: 'Fábula',
        cover: 'https://m.media-amazon.com/images/I/71OZY035FKL._AC_UF1000,1000_QL80_.jpg',
        pages: 96,
        isbn: '9788595081499',
        description:
          'Um piloto cai com seu avião no deserto e encontra um pequeno príncipe vindo de outro planeta.',
      },
      {
        uuid: 'b8e9ab2d-21a9-47ef-a2cb-1e9c90362a44',
        title: 'A Culpa é das Estrelas',
        author: 'John Green',
        genre: 'Romance',
        cover: 'https://m.media-amazon.com/images/I/71g6xZREFYL._AC_UF1000,1000_QL80_.jpg',
        pages: 288,
        isbn: '9788580573466',
        description:
          'Hazel e Gus compartilham humor ácido, um desprezo por tudo que é convencional e, acima de tudo, amor.',
      },
      {
        uuid: '682d7f86-f013-46e4-b4b9-601f23632c6a',
        title: 'O Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg',
        pages: 310,
        isbn: '9788595084742',
        description:
          'Bilbo Bolseiro é convocado pelo mago Gandalf para participar de uma aventura com treze anões.',
      },
      {
        uuid: '93710c3f-9d7a-4d5a-9b08-b6e4cfac5a9d',
        title: 'Percy Jackson: O Ladrão de Raios',
        author: 'Rick Riordan',
        genre: 'Aventura',
        cover: 'https://m.media-amazon.com/images/I/91WN6a6F3LL._AC_UF1000,1000_QL80_.jpg',
        pages: 400,
        isbn: '9788580575071',
        description:
          'Percy Jackson descobre ser um semideus e precisa impedir uma guerra entre os deuses do Olimpo.',
      },
      {
        uuid: 'edc8150e-dc54-4e3e-a939-cb45023166b1',
        title: 'As Crônicas de Nárnia',
        author: 'C.S. Lewis',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg',
        pages: 767,
        isbn: '9788578277123',
        description:
          'Quatro irmãos descobrem um mundo mágico dentro de um guarda-roupa.',
      },
      {
        uuid: '3b3e278d-dc6b-4cf7-bb7a-6e1a8156d51d',
        title: 'O Código Da Vinci',
        author: 'Dan Brown',
        genre: 'Suspense',
        cover: 'https://m.media-amazon.com/images/I/71y4V9RBs8L._AC_UF1000,1000_QL80_.jpg',
        pages: 432,
        isbn: '9788580411379',
        description:
          'Robert Langdon investiga um assassinato no Museu do Louvre que revela segredos históricos.',
      },
    ];

    for (const b of initialBooks) {
      try {
        await this.addBookToCatalog(b);
      } catch (e) {
        console.error(`❌ Error seeding book: ${b.title}`, e);
      }
    }
    console.log('✅ Initial books seeded successfully');
  }

  /** ===== Helpers ===== */
  private async ensureBooksTableWithUuid() {
    const cols = await this.db.getAllAsync<{ name: string }>('PRAGMA table_info(books);');
    const hasUuid = cols.some(c => c.name === 'uuid');
    if (!hasUuid) {
      await this.db.execAsync?.('ALTER TABLE books ADD COLUMN uuid TEXT;');
      try {
        await this.db.execAsync?.('CREATE UNIQUE INDEX IF NOT EXISTS idx_books_uuid ON books(uuid);');
      } catch {}
    }
  }

  /** ==================== USUÁRIO ==================== */
  async registerUser(username: string, email: string, password: string): Promise<boolean> {
    try {
      const res = await this.db.runAsync?.(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password]
      );
      console.log('✅ User registered:', { username, email, insertId: res?.lastInsertRowId });
      return (res?.changes ?? 0) > 0;
    } catch (error) {
      console.error('❌ Error registering user:', error);
      return false;
    }
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    try {
      const u = await this.db.getFirstAsync<User>(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );
      return u ?? null;
    } catch (error) {
      console.error('❌ Error during login:', error);
      return null;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const r = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM users WHERE email = ?',
        [email]
      );
      return (r?.count ?? 0) > 0;
    } catch (error) {
      console.error('❌ Error checking email:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.db.getAllAsync<User>('SELECT * FROM users ORDER BY createdAt DESC;');
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  async addBookToCatalog(book: Omit<Book, 'id' | 'createdAt'>): Promise<number | null> {
    try {
      await this.ensureBooksTableWithUuid();

      if (book.uuid) {
        const byUuid = await this.db.getFirstAsync<{ id: number }>(
          'SELECT id FROM books WHERE uuid = ? LIMIT 1;',
          [book.uuid]
        );
        if (byUuid) return byUuid.id;
      }

      if (book.isbn) {
        const byIsbn = await this.db.getFirstAsync<{ id: number }>(
          'SELECT id FROM books WHERE isbn = ? LIMIT 1;',
          [book.isbn]
        );
        if (byIsbn) return byIsbn.id;
      }

      const byTitleAuthor = await this.db.getFirstAsync<{ id: number }>(
        'SELECT id FROM books WHERE title = ? AND author = ? LIMIT 1;',
        [book.title, book.author]
      );
      if (byTitleAuthor) return byTitleAuthor.id;

      const res = await this.db.runAsync?.(
        `INSERT INTO books (uuid, title, author, genre, cover, pages, isbn, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          book.uuid ?? null,
          book.title,
          book.author,
          book.genre ?? null,
          book.cover ?? null,
          book.pages ?? 0,         
          book.isbn ?? null,
          book.description ?? null,
        ]
      );
      return Number(res?.lastInsertRowId ?? 0) || null;
    } catch (error) {
      console.error('❌ Error adding book to catalog:', error);
      return null;
    }
  }

  async upsertBookByUuid(book: Omit<Book, 'id' | 'createdAt'>): Promise<number | null> {
    await this.ensureBooksTableWithUuid();

    if (!book.uuid) {
      return this.addBookToCatalog(book);
    }

    const existing = await this.db.getFirstAsync<{ id: number }>(
      'SELECT id FROM books WHERE uuid = ? LIMIT 1;',
      [book.uuid]
    );

    if (existing?.id) {
      await this.db.runAsync?.(
        `UPDATE books
           SET title = ?, author = ?, genre = ?, cover = ?, pages = ?, isbn = ?, description = ?
         WHERE uuid = ?;`,
        [
          book.title,
          book.author,
          book.genre ?? null,
          book.cover ?? null,
          book.pages ?? 0,
          book.isbn ?? null,
          book.description ?? null,
          book.uuid,
        ]
      );
      return existing.id;
    }

    return this.addBookToCatalog(book);
  }

  async getBookFromCatalog(bookId: number): Promise<Book | null> {
    try {
      const b = await this.db.getFirstAsync<Book>(
        `SELECT id, uuid, title, author, genre, cover,
                COALESCE(pages, 0) as pages,               -- ✅ garante número
                isbn, description, createdAt
           FROM books WHERE id = ?`,
        [bookId]
      );
      return b ?? null;
    } catch (error) {
      console.error('❌ Error getting book from catalog:', error);
      return null;
    }
  }

  async getBookByUuid(uuid: string): Promise<Book | null> {
    try {
      const b = await this.db.getFirstAsync<Book>(
        `SELECT id, uuid, title, author, genre, cover,
                COALESCE(pages, 0) as pages,               -- ✅
                isbn, description, createdAt
           FROM books WHERE uuid = ? LIMIT 1;`,
        [uuid]
      );
      return b ?? null;
    } catch (error) {
      console.error('❌ Error getBookByUuid:', error);
      return null;
    }
  }

  async getAllBooksFromCatalog(): Promise<Book[]> {
    try {
      return await this.db.getAllAsync<Book>(
        `SELECT id, uuid, title, author, genre, cover,
                COALESCE(pages, 0) as pages,               -- ✅
           createdAt
           FROM books
           ORDER BY title ASC;`
      );
    } catch (error) {
      console.error('❌ Error getting catalog books:', error);
      return [];
    }
  }

  async searchBooksInCatalog(searchTerm: string): Promise<Book[]> {
    try {
      return await this.db.getAllAsync<Book>(
        `SELECT id, uuid, title, author, genre, cover,
                COALESCE(pages, 0) as pages,               -- ✅
                isbn, description, createdAt
           FROM books
           WHERE title LIKE ? OR author LIKE ?
           ORDER BY title ASC;`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
    } catch (error) {
      console.error('❌ Error searching books:', error);
      return [];
    }
  }

  async addBookToUserLibrary(
    userId: number,
    bookId: number,
    status: 'reading' | 'completed' | 'wishlist' = 'wishlist'
  ): Promise<number | null> {
    try {
      const res = await this.db.runAsync?.(
        `INSERT INTO user_books (userId, bookId, status, startedAt)
         VALUES (?, ?, ?, ?)`,
        [userId, bookId, status, status === 'reading' ? new Date().toISOString() : null]
      );
      return res?.lastInsertRowId ?? null;
    } catch (error: any) {
      if (error?.message?.includes('UNIQUE constraint')) {
        console.log('⚠️ Book already in user library');
        return null;
      }
      console.error('❌ Error adding book to user library:', error);
      return null;
    }
  }

  async getUserBookById(userBookId: number): Promise<UserBookDetail | null> {
    try {
      const row = await this.db.getFirstAsync<UserBookDetail>(
        `SELECT 
           ub.id as userBookId,
           ub.currentPage,
           ub.status,
           ub.notes,
           ub.startedAt,
           ub.completedAt,
           b.id,
           b.uuid,
           b.title,
           b.author,
           b.genre,
           b.cover,
           COALESCE(b.pages, 0) as pages,   -- ✅
           b.isbn,
           b.description,
           b.createdAt
         FROM user_books ub
         INNER JOIN books b ON ub.bookId = b.id
         WHERE ub.id = ?`,
        [userBookId]
      );
      return row ?? null;
    } catch (error) {
      console.error('❌ Error getting user book by id:', error);
      return null;
    }
  }

  async getUserBooks(userId: number): Promise<UserBookDetail[]> {
    try {
      return await this.db.getAllAsync<UserBookDetail>(
        `SELECT 
           ub.id as userBookId,
           ub.currentPage,
           ub.status,
           ub.notes,
           ub.startedAt,
           ub.completedAt,
           b.id,
           b.uuid,
           b.title,
           b.author,
           b.genre,
           b.cover,
           COALESCE(b.pages, 0) as pages,   -- ✅
           b.isbn,
           b.description,
           b.createdAt
         FROM user_books ub
         INNER JOIN books b ON ub.bookId = b.id
         WHERE ub.userId = ?
         ORDER BY ub.createdAt DESC`,
        [userId]
      );
    } catch (error) {
      console.error('❌ Error getting user books:', error);
      return [];
    }
  }

  async getUserBooksByStatus(
    userId: number,
    status: 'reading' | 'completed' | 'wishlist'
  ): Promise<UserBookDetail[]> {
    try {
      return await this.db.getAllAsync<UserBookDetail>(
        `SELECT 
           ub.id as userBookId,
           ub.currentPage,
           ub.status,
           ub.notes,
           ub.startedAt,
           ub.completedAt,
           b.id,
           b.uuid,
           b.title,
           b.author,
           b.genre,
           b.cover,
           COALESCE(b.pages, 0) as pages,   -- ✅
           b.isbn,
           b.description,
           b.createdAt
         FROM user_books ub
         INNER JOIN books b ON ub.bookId = b.id
         WHERE ub.userId = ? AND ub.status = ?
         ORDER BY ub.createdAt DESC`,
        [userId, status]
      );
    } catch (error) {
      console.error('❌ Error getting user books by status:', error);
      return [];
    }
  }

  async updateUserBook(userBookId: number, updates: Partial<UserBook>): Promise<boolean> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.currentPage !== undefined) {
        fields.push('currentPage = ?');
        values.push(updates.currentPage);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);

        if (updates.status === 'reading' && !updates.startedAt) {
          fields.push('startedAt = ?');
          values.push(new Date().toISOString());
        }
        if (updates.status === 'completed') {
          fields.push('completedAt = ?');
          values.push(new Date().toISOString());
        }
      }
      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
      }

      if (fields.length === 0) return false;

      values.push(userBookId);
      const res = await this.db.runAsync?.(
        `UPDATE user_books SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return (res?.changes ?? 0) > 0;
    } catch (error) {
      console.error('❌ Error updating user book:', error);
      return false;
    }
  }

  async removeBookFromUserLibrary(userBookId: number): Promise<boolean> {
    try {
      const res = await this.db.runAsync?.('DELETE FROM user_books WHERE id = ?', [userBookId]);
      return (res?.changes ?? 0) > 0;
    } catch (error) {
      console.error('❌ Error removing book from user library:', error);
      return false;
    }
  }

  async getUserStats(userId: number): Promise<{
    total: number;
    reading: number;
    completed: number;
    wishlist: number;
  }> {
    try {
      const r = await this.db.getFirstAsync<any>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'reading'  THEN 1 ELSE 0 END) as reading,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'wishlist' THEN 1 ELSE 0 END) as wishlist
         FROM user_books
         WHERE userId = ?`,
        [userId]
      );
      return {
        total: r?.total ?? 0,
        reading: r?.reading ?? 0,
        completed: r?.completed ?? 0,
        wishlist: r?.wishlist ?? 0,
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return { total: 0, reading: 0, completed: 0, wishlist: 0 };
    }
  }
}

export const database = new DatabaseService();

export type SaveOrUpdateBookByUUIDInput =
  Omit<Book, 'id' | 'createdAt' | 'genre' | 'cover' | 'pages' | 'isbn' | 'description'> &
  Partial<
    Pick<
      UserBook,
      'userId' | 'currentPage' | 'status' | 'notes' | 'startedAt' | 'completedAt'
    >
  >;

  export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  return SQLite.openDatabaseAsync('dexbook.db');
}

export async function getAvailableBookUUIDs(): Promise<string[]> {
  try {
    const db = await getDb();
    const books = await db.getAllAsync<{ uuid: string }>(
      `SELECT uuid FROM books WHERE uuid IS NOT NULL`
    );
    return books.map(book => book.uuid).filter(Boolean) as string[];
  } catch (error) {
    console.error('❌ Erro ao buscar UUIDs:', error);
    return [];
  }
}

export async function saveOrUpdateBookByUUID(
  userId: number,
  bookData: { uuid: string }
): Promise<Book | null> {
  try {
    const db = await getDb();

    // 1. Busca APENAS o livro pelo UUID (não cria se não existir)
    const existingBook = await db.getFirstAsync<Book>(
      `SELECT * FROM books WHERE uuid = ?`,
      [bookData.uuid]
    );

    // 2. Se não encontrou, retorna null
    if (!existingBook) {
      console.log('❌ Livro não encontrado no catálogo para UUID:', bookData.uuid);
      return null;
    }

    console.log('📖 Livro encontrado:', existingBook.title);

    // 3. Verifica se o usuário já tem este livro
    const existingUserBook = await db.getFirstAsync<UserBook>(
      `SELECT * FROM user_books WHERE userId = ? AND bookId = ?`,
      [userId, existingBook.id]
    );

    // 4. Adiciona ou atualiza para o usuário
    if (existingUserBook) {
      // Atualiza se já existe
      await db.runAsync(
        `UPDATE user_books 
         SET status = 'reading', startedAt = datetime("now")
         WHERE id = ?`,
        [existingUserBook.id]
      );
      console.log('✅ Livro atualizado para "lendo"');
    } else {
      // Adiciona novo
      await db.runAsync(
        `INSERT INTO user_books 
         (userId, bookId, status, currentPage, startedAt, createdAt) 
         VALUES (?, ?, 'reading', 0, datetime("now"), datetime("now"))`,
        [userId, existingBook.id]
      );
      console.log('✅ Livro adicionado à biblioteca como "lendo"');
    }

    return existingBook;

  } catch (error) {
    console.error('❌ Erro em saveOrUpdateBookByUUID:', error);
    return null;
  }
}


export async function getBookByUUID(uuid: string): Promise<Book | null> {
  try {
    const db = await getDb();
    const book = await db.getFirstAsync<Book>(
      `SELECT * FROM books WHERE uuid = ?`,
      [uuid]
    );
    return book;
  } catch (error) {
    console.error('❌ Erro em getBookByUUID:', error);
    return null;
  }
}

export async function getAllBooks(): Promise<Book[]> {
  return database.getAllBooksFromCatalog();
}
