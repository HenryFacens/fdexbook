import * as SQLite from 'expo-sqlite';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

interface Book {
  id: number;
  userId: number;
  title: string;
  author: string;
  genre: string;
  cover: string;
  pages: number;
  currentPage: number;
  status: 'reading' | 'completed' | 'wishlist';
  notes?: string;
  createdAt: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('dexbook.db');
    this.initDatabase();
  }

  private initDatabase() {
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

    // Tabela de livros
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        genre TEXT,
        cover TEXT,
        pages INTEGER DEFAULT 0,
        currentPage INTEGER DEFAULT 0,
        status TEXT DEFAULT 'wishlist',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      );
    `);

    console.log('✅ Database initialized');
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

  // ==================== MÉTODOS DE LIVROS ====================

  async addBook(userId: number, book: Omit<Book, 'id' | 'userId' | 'createdAt'>): Promise<number | null> {
    try {
      const result = await this.db.runAsync(
        `INSERT INTO books (userId, title, author, genre, cover, pages, currentPage, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, book.title, book.author, book.genre, book.cover, book.pages, book.currentPage, book.status, book.notes || '']
      );
      console.log('✅ Book added:', { title: book.title, insertId: result.lastInsertRowId });
      return result.lastInsertRowId ?? null;
    } catch (error) {
      console.error('❌ Error adding book:', error);
      return null;
    }
  }

  async getBooksByUser(userId: number): Promise<Book[]> {
    try {
      const books = await this.db.getAllAsync<Book>(
        'SELECT * FROM books WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );
      console.log('📚 Books retrieved:', books.length);
      return books;
    } catch (error) {
      console.error('❌ Error getting books:', error);
      return [];
    }
  }

  async getBookById(bookId: number): Promise<Book | null> {
    try {
      const book = await this.db.getFirstAsync<Book>(
        'SELECT * FROM books WHERE id = ?',
        [bookId]
      );
      return book || null;
    } catch (error) {
      console.error('❌ Error getting book:', error);
      return null;
    }
  }

  async updateBook(bookId: number, updates: Partial<Book>): Promise<boolean> {
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
      }
      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
      }

      if (fields.length === 0) return false;

      values.push(bookId);
      const result = await this.db.runAsync(
        `UPDATE books SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error updating book:', error);
      return false;
    }
  }

  async deleteBook(bookId: number): Promise<boolean> {
    try {
      const result = await this.db.runAsync(
        'DELETE FROM books WHERE id = ?',
        [bookId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error deleting book:', error);
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
}

export const database = new DatabaseService();
export type { User, Book };