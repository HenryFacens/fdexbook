import React, {useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    FlatList, Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {database} from "@/services/database";
import {router} from "expo-router";

// Interface para o tipo de livro
interface Book {
    id: string;
    title: string;
    author: string;
    genre: string;
    cover: string;
    pages: number;
}

// Dados mocados de livros
const MOCK_BOOKS: Book[] = [
    {
        id: '1',
        title: 'Harry Potter e a Pedra Filosofal',
        author: 'J.K. Rowling',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/81ibfYk4qmL._AC_UF1000,1000_QL80_.jpg',
        pages: 264,
    },
    {
        id: '2',
        title: '1984',
        author: 'George Orwell',
        genre: 'Ficção Distópica',
        cover: 'https://m.media-amazon.com/images/I/819js3EQwbL._AC_UF1000,1000_QL80_.jpg',
        pages: 416,
    },
    {
        id: '3',
        title: 'O Senhor dos Anéis',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
        pages: 1178,
    },
    {
        id: '4',
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        genre: 'Romance',
        cover: 'https://m.media-amazon.com/images/I/71Q0XW32yXL._AC_UF1000,1000_QL80_.jpg',
        pages: 256,
    },
    {
        id: '5',
        title: 'O Pequeno Príncipe',
        author: 'Antoine de Saint-Exupéry',
        genre: 'Fábula',
        cover: 'https://m.media-amazon.com/images/I/71OZY035FKL._AC_UF1000,1000_QL80_.jpg',
        pages: 96,
    },
    {
        id: '6',
        title: 'A Culpa é das Estrelas',
        author: 'John Green',
        genre: 'Romance',
        cover: 'https://m.media-amazon.com/images/I/71g6xZREFYL._AC_UF1000,1000_QL80_.jpg',
        pages: 288,
    },
    {
        id: '7',
        title: 'O Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg',
        pages: 310,
    },
    {
        id: '8',
        title: 'Percy Jackson: O Ladrão de Raios',
        author: 'Rick Riordan',
        genre: 'Aventura',
        cover: 'https://m.media-amazon.com/images/I/91WN6a6F3LL._AC_UF1000,1000_QL80_.jpg',
        pages: 400,
    },
    {
        id: '9',
        title: 'As Crônicas de Nárnia',
        author: 'C.S. Lewis',
        genre: 'Fantasia',
        cover: 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg',
        pages: 767,
    },
    {
        id: '10',
        title: 'O Código Da Vinci',
        author: 'Dan Brown',
        genre: 'Suspense',
        cover: 'https://m.media-amazon.com/images/I/71y4V9RBs8L._AC_UF1000,1000_QL80_.jpg',
        pages: 432,
    },
];

export default function AddScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredBooks, setFilteredBooks] = useState<Book[]>(MOCK_BOOKS);

    // Função para filtrar livros
    const handleSearch = (text: string) => {
        setSearchQuery(text);

        if (text.trim() === '') {
            setFilteredBooks(MOCK_BOOKS);
        } else {
            const filtered = MOCK_BOOKS.filter(book =>
                book.title.toLowerCase().includes(text.toLowerCase()) ||
                book.author.toLowerCase().includes(text.toLowerCase()) ||
                book.genre.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredBooks(filtered);
        }
    };

    const handleAddBook = async (book: Book) => {
        try {
            const userSession = await AsyncStorage.getItem('user_session');
            if (!userSession) return;

            const user = JSON.parse(userSession);

            const bookId = await database.addBook(user.id, {
                title: book.title,
                author: book.author,
                genre: book.genre,
                cover: book.cover,
                pages: book.pages,
                currentPage: 0,
                status: 'wishlist',
            });

            if (bookId) {
                Alert.alert('Sucesso', 'Livro adicionado à sua biblioteca!', [
                    {
                        text: 'Ver Detalhes',
                        onPress: () => router.push(`/book/book-details?bookId=${bookId}`),
                    },
                    {text: 'OK'},
                ]);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível adicionar o livro');
        }
    };

    // Componente de card de livro
    const BookCard = ({book}: { book: Book }) => (
        <TouchableOpacity style={styles.bookCard}
        onPress={()=> router.push(`/book/book-details?bookId=${book.id}`)}>
            <Image
                source={{uri: book.cover}}
                style={styles.bookCover}
                resizeMode="cover"
            />
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                </Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                    <Ionicons name="person-outline" size={12} color="#666"/> {book.author}
                </Text>
                <View style={styles.bookMeta}>
                    <View style={styles.genreTag}>
                        <Text style={styles.genreText}>{book.genre}</Text>
                    </View>
                    <Text style={styles.pagesText}>
                        <Ionicons name="document-text-outline" size={12} color="#999"/> {book.pages} pág.
                    </Text>
                </View>
            </View>
            <TouchableOpacity style={styles.addButton}
                              onPress={() => handleAddBook(book)}>
                <Ionicons name="add-circle" size={32} color="#007AFF"/>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Adicionar Livro</Text>
                <Text style={styles.headerSubtitle}>Pesquise e adicione livros à sua biblioteca</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon}/>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar por título, autor ou gênero..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#999"/>
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
                keyExtractor={(item) => item.id}
                renderItem={({item}) => <BookCard book={item}/>}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={64} color="#ccc"/>
                        <Text style={styles.emptyText}>Nenhum livro encontrado</Text>
                        <Text style={styles.emptySubtext}>Tente pesquisar com outros termos</Text>
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
        shadowOffset: {width: 0, height: 2},
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
        shadowOffset: {width: 0, height: 2},
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