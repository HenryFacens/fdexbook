import { database, UserBookDetail } from '@/src/services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface BooksContextData {
  books: UserBookDetail[];
  loading: boolean;
  stats: {
    total: number;
    reading: number;
    completed: number;
    wishlist: number;
  };
  loadBooks: () => Promise<void>;
  refreshBooks: () => Promise<void>;
}

const BooksContext = createContext<BooksContextData>({} as BooksContextData);

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<UserBookDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    reading: 0,
    completed: 0,
    wishlist: 0,
  });

  const loadBooks = async () => {
    try {
      setLoading(true);
      const userSession = await AsyncStorage.getItem('user_session');

      if (userSession) {
        const user = JSON.parse(userSession);

        const userBooks = await database.getUserBooks(user.id);
        console.log('📚 Books loaded in Context:', userBooks);
        console.log('📚 Books with reading status:', userBooks.filter(b => b.status === 'reading'));

        setBooks(userBooks);

        const userStats = await database.getUserStats(user.id);
        setStats(userStats);

        console.log('📚 Books loaded:', userBooks.length);
        console.log('📊 Stats:', userStats);
      }
    } catch (error) {
      console.error('❌ Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBooks = async () => {
    await loadBooks();
  };

  useEffect(() => {
    loadBooks();
  }, []);

  return (
    <BooksContext.Provider value={{ books, loading, stats, loadBooks, refreshBooks }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (!context) {
    throw new Error('useBooks must be used within BooksProvider');
  }
  return context;
}