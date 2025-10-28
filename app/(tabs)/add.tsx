import { useBooks } from '@/src/contexts/BooksContext';
import { Book, database } from '@/src/services/database';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AddScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allBooks, setAllBooks] = useState<Book[]>([]); // 👈 LIVROS DO BANCO
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true); // 👈 LOADING STATE
  const { books: userBooks, refreshBooks } = useBooks();

  // 👇 CARREGA LIVROS DO BANCO AO MONTAR A TELA
  useEffect(() => {
    loadBooksFromCatalog();
  }, []);

  const loadBooksFromCatalog = async () => {
    try {
      setLoading(true);
      const catalogBooks = await database.getAllBooksFromCatalog();
      setAllBooks(catalogBooks);
      setFilteredBooks(catalogBooks);
      console.log('📚 Loaded books from catalog:', catalogBooks.length);
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os livros');
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar livros
  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (text.trim() === '') {
      setFilteredBooks(allBooks);
    } else {
      const filtered = allBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(text.toLowerCase()) ||
          book.author.toLowerCase().includes(text.toLowerCase()) ||
          (book.genre && book.genre.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredBooks(filtered);
    }
  };

  // 👇 FUNÇÃO PARA VERIFICAR SE O LIVRO JÁ ESTÁ NA BIBLIOTECA
  const isBookInLibrary = (bookId: number): number | null => {
    const found = userBooks.find((userBook) => userBook.id === bookId);
    return found ? found.userBookId : null;
  };

  const handleAddBook = async (book: Book) => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (!userSession) {
        Alert.alert('Erro', 'Você precisa estar logado');
        return;
      }

      const user = JSON.parse(userSession);

      // O livro já está no catálogo, então só adiciona à biblioteca do usuário
      const userBookId = await database.addBookToUserLibrary(user.id, book.id, 'wishlist');

      if (userBookId === null) {
        Alert.alert('Atenção', 'Este livro já está na sua biblioteca!');
        return;
      }

      // Atualiza a lista de livros no Context
      await refreshBooks();

      Alert.alert('Sucesso! 🎉', 'Livro adicionado à sua biblioteca!', [
        {
          text: 'Ver Detalhes',
          onPress: () => router.push(`/book/book-details?userBookId=${userBookId}`),
        },
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o livro');
    }
  };

  // 👇 FUNÇÃO PARA LIDAR COM O CLIQUE NO CARD
  const handleCardPress = (book: Book) => {
    const userBookId = isBookInLibrary(book.id);

    if (userBookId) {
      // Livro já está na biblioteca → vai para detalhes
      router.push(`/book/book-details?userBookId=${userBookId}`);
    } else {
      // Livro não está na biblioteca → mostra opções
      Alert.alert(book.title, 'Este livro ainda não está na sua biblioteca.', [
        {
          text: 'Adicionar',
          onPress: () => handleAddBook(book),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]);
    }
  };

  // Componente de card de livro
  const BookCard = ({ book }: { book: Book }) => {
    const userBookId = isBookInLibrary(book.id);
    const isInLibrary = userBookId !== null;

    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => handleCardPress(book)}
      >
        <Image source={{ uri: book.cover }} style={styles.bookCover} resizeMode="cover" />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            <Ionicons name="person-outline" size={12} color="#666" /> {book.author}
          </Text>
          <View style={styles.bookMeta}>
            <View style={styles.genreTag}>
              <Text style={styles.genreText}>{book.genre || 'Geral'}</Text>
            </View>
            <Text style={styles.pagesText}>
              <Ionicons name="document-text-outline" size={12} color="#999" /> {book.pages} pág.
            </Text>
          </View>
        </View>

        {/* MOSTRA ÍCONE DIFERENTE SE JÁ ESTIVER NA BIBLIOTECA */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            if (isInLibrary) {
              router.push(`/book/book-details?userBookId=${userBookId}`);
            } else {
              handleAddBook(book);
            }
          }}
        >
          <Ionicons
            name={isInLibrary ? 'checkmark-circle' : 'add-circle'}
            size={32}
            color={isInLibrary ? '#34C759' : '#007AFF'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // 👇 MOSTRA LOADING ENQUANTO CARREGA OS LIVROS
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Carregando livros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adicionar Livro</Text>
        <Text style={styles.headerSubtitle}>Pesquise e adicione livros à sua biblioteca</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar por título, autor ou gênero..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Counter */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredBooks.length} {filteredBooks.length === 1 ? 'livro encontrado' : 'livros encontrados'}
        </Text>
      </View>

      {/* Books List */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <BookCard book={item} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum livro encontrado</Text>
            <Text style={styles.emptySubtext}>
              {allBooks.length === 0
                ? 'O catálogo está vazio'
                : 'Tente pesquisar com outros termos'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genreTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genreText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  pagesText: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});