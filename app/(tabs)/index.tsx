import { useBooks } from '@/src/contexts/BooksContext';
import {Book, database, getBookByUUID, getDb, saveOrUpdateBookByUUID, User} from '@/src/services/database';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const {width} = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const { books, loading, stats, refreshBooks } = useBooks();
    const [refreshing, setRefreshing] = useState(false);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [celebrationVisible, setCelebrationVisible] = useState(false);
    const [scannedBook, setScannedBook] = useState<any>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        loadUserData().then(
            () => console.log('👤 Carregando dados do usuário...'));
        const reading = books.filter(b => b.status === 'reading');
        console.log('📖 Reading books:', reading.length);
        console.log('📖 Reading books data:', reading);
    }, []);

    const loadUserData = async () => {
        try {
            const userSession = await AsyncStorage.getItem('user_session');
            if (userSession) {
                setUser(JSON.parse(userSession));
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUserData();
        await refreshBooks();
        setRefreshing(false);
    };

    const handleOpenScanner = async () => {
        if (!permission) {
            await requestPermission();
            return;
        }

        if (!permission.granted) {
            Alert.alert(
                'Permissão necessária',
                'Precisamos de acesso à câmera para escanear QR Codes',
                [
                    {text: 'Cancelar', style: 'cancel'},
                    {text: 'Permitir', onPress: () => requestPermission()},
                ]
            );
            return;
        }

        setScanned(false);
        setScannerVisible(true);
    };

    const handleFakeScan = () => {
        setScannerVisible(false);
        setCelebrationVisible(true);
    };



const debugLog = (...a: any[]) => console.log('[QR@Home]', ...a);

function stripBOM(s: string) {
  if (!s) return s;
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function htmlEntityDecode(s: string) {
  if (!s) return s;
  return s
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function getCurrentUser(): Promise<User | null> {
  const sessionRaw = await AsyncStorage.getItem('user_session');
  if (!sessionRaw) return null;

  try {
    const parsed = JSON.parse(sessionRaw);
    const u = parsed?.user ?? parsed;
    if (u && typeof u.id === 'number') return u as User;
  } catch {}
  return null;
}


function parseQRPayload(raw0: string) {
  let raw = stripBOM(String(raw0 || '')).trim();
  raw = htmlEntityDecode(raw);
  debugLog('raw=', raw.slice(0, 120) + (raw.length > 120 ? '…' : ''));
  return raw;
}

function normalizeMinimal(obj: any) {
  // if (!obj || typeof obj !== 'object') throw new Error('QR inválido');

  const candidate =
    obj.book && typeof obj.book === 'object' ? obj.book :
    obj.data && typeof obj.data === 'object' ? obj.data :
    obj;

  const uuidRaw = candidate.uuid ?? candidate.UUID ?? candidate.Uuid;
  const titleRaw = candidate.title ?? candidate.Title;
  const authorRaw = candidate.author ?? candidate.Author;

  const toCleanString = (v: any) =>
    (typeof v === 'string' ? v : v == null ? '' : String(v))
      .replace(/\u200B|\u200C|\u200D|\u2060|\uFEFF/g, '')
      .trim();

  const uuid = toCleanString(uuidRaw);
  const title = toCleanString(titleRaw);
  const author = toCleanString(authorRaw);

  if (!uuid || !title || !author) {
    throw new Error('QR deve conter uuid, title e author');
  }
  return { uuid, title, author };
}

const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
  if (scanned) return;
  setScanned(true);
  setScannerVisible(false);

  try {
    const uuid = parseQRPayload(data);

    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      Alert.alert('Sessão expirada', 'Faça login para adicionar livros.');
      setScanned(false);
      router.push('/(auth)/login');
      return;
    }

    // Busca pelo UUID e adiciona para o usuário
    const book = await saveOrUpdateBookByUUID(currentUser.id, {
      uuid: uuid,
    });

    if (!book) {
      Alert.alert(
        'Livro Não Encontrado',
        'Este QR Code não corresponde a nenhum livro cadastrado no Dexbook.'
      );
      setScanned(false);
      return;
    }

    // Atualiza a lista e mostra confirmação
    await refreshBooks?.();
    Alert.alert(
      '📖 Livro Adicionado!',
      `"${book.title}" foi adicionado à sua biblioteca como "Lendo".`
    );

  } catch (err: any) {
    debugLog('err=', err?.message || err);
    const msg = typeof err?.message === 'string'
      ? err.message
      : 'Não foi possível processar este QR Code.';
    Alert.alert('QR inválido', msg);
    setScanned(false);
  } finally {
    setTimeout(() => setScanned(false), 300);
  }
};

    const closeScanner = () => {
        setScannerVisible(false);
        setScanned(false);
    };

    const closeCelebration = () => {
        setCelebrationVisible(false);
        setScannedBook(null);
    };

    const goToQuiz = () => {
        setCelebrationVisible(false);
        router.push({
            pathname: '/quiz/quiz',
            params: {
                bookTitle: scannedBook?.title,
                bookAuthor: scannedBook?.author,
                bookGenre: scannedBook?.genre,
            },
        });
    };

    const readingBooks = books.filter(b => b.status === 'reading');
    const recentBooks = books.slice(0, 5);

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá,</Text>
                        <Text style={styles.username}>{user?.username || 'Usuário'}!</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Ionicons name="notifications-outline" size={24} color="#333"/>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Ionicons name="book-outline" size={24} color="#007AFF"/>
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Livros</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="bookmark-outline" size={24} color="#34C759"/>
                        <Text style={styles.statNumber}>{stats.reading}</Text>
                        <Text style={styles.statLabel}>Lendo</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#FF9500"/>
                        <Text style={styles.statNumber}>{stats.completed}</Text>
                        <Text style={styles.statLabel}>Lidos</Text>
                    </View>
                </View>

                {/* Continue Reading Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Continue Lendo</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Ver tudo</Text>
                        </TouchableOpacity>
                    </View>

                    {readingBooks.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {readingBooks.map((book) => (
                                <TouchableOpacity
                                    key={book.userBookId}
                                    style={styles.bookCard}
                                    onPress={() =>
                                        router.push(`/book/book-details?userBookId=${book.userBookId}`)
                                    }
                                >
                                    <Image source={{uri: book.cover}} style={styles.bookCover}/>
                                    <Text style={styles.bookCardTitle} numberOfLines={2}>
                                        {book.title}
                                    </Text>
                                    {/* 👇 BARRA DE PROGRESSO */}
                                    <View style={styles.progressMini}>
                                        <View
                                            style={[
                                                styles.progressBarMini,
                                                {
                                                    width: `${
                                                        book.pages > 0 ? (book.currentPage / book.pages) * 100 : 0
                                                    }%`,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {book.currentPage} / {book.pages} pág.
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="book-outline" size={48} color="#ccc"/>
                            <Text style={styles.emptyText}>Nenhum livro em andamento</Text>
                            <Text style={styles.emptySubtext}>Adicione um livro para começar!</Text>
                        </View>
                    )}
                </View>

                {/* Recent Books Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Adicionados Recentemente</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Ver tudo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 👇 MOSTRA OS LIVROS RECENTES */}
                    {recentBooks.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {recentBooks.map((book) => (
                                <TouchableOpacity
                                    key={book.userBookId}
                                    style={styles.bookCard}
                                    onPress={() =>
                                        router.push(`/book/book-details?userBookId=${book.userBookId}`)
                                    }
                                >
                                    <Image source={{uri: book.cover}} style={styles.bookCover}/>
                                    <Text style={styles.bookCardTitle} numberOfLines={2}>
                                        {book.title}
                                    </Text>
                                    {/* 👇 BADGE DE STATUS */}
                                    <View style={[
                                        styles.statusBadge,
                                        book.status === 'reading' && styles.statusReading,
                                        book.status === 'completed' && styles.statusCompleted,
                                        book.status === 'wishlist' && styles.statusWishlist,
                                    ]}>
                                        <Text style={styles.statusBadgeText}>
                                            {book.status === 'reading' && '📖 Lendo'}
                                            {book.status === 'completed' && '✅ Lido'}
                                            {book.status === 'wishlist' && '🔖 Quero Ler'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="library-outline" size={48} color="#ccc"/>
                            <Text style={styles.emptyText}>Sua biblioteca está vazia</Text>
                            <Text style={styles.emptySubtext}>Comece adicionando seus livros favoritos!</Text>
                        </View>
                    )}
                </View>

                <View style={{height: 100}}/>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={handleOpenScanner}>
                <Ionicons name="qr-code-outline" size={28} color="#fff"/>
            </TouchableOpacity>

            {/* QR Code Scanner Modal */}
            <Modal
                visible={scannerVisible}
                animationType="slide"
                onRequestClose={closeScanner}
            >
                <View style={styles.scannerContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                    >
                        <View style={styles.scannerHeader}>
                            <TouchableOpacity style={styles.closeButton} onPress={closeScanner}>
                                <Ionicons name="close" size={28} color="#fff"/>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.overlay}>
                            <View style={styles.scanArea}>
                                <View style={[styles.corner, styles.topLeft]}/>
                                <View style={[styles.corner, styles.topRight]}/>
                                <View style={[styles.corner, styles.bottomLeft]}/>
                                <View style={[styles.corner, styles.bottomRight]}/>
                            </View>
                        </View>

                        <View style={styles.bottomOverlay}>
                            <View style={styles.instructionsContainer}>
                                <Ionicons name="qr-code" size={40} color="#fff" style={{marginBottom: 10}}/>
                                <Text style={styles.instructionsText}>
                                    Posicione o QR Code dentro da área
                                </Text>
                                <Text style={styles.instructionsSubtext}>
                                    O código será lido automaticamente
                                </Text>

                                {/* Botão de Teste */}
                                <TouchableOpacity style={styles.testButton} onPress={handleFakeScan}>
                                    <Text style={styles.testButtonText}>🧪 Simular Scan (Teste)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </CameraView>
                </View>
            </Modal>

            {/* Celebration Modal */}
            <Modal
                visible={celebrationVisible}
                animationType="fade"
                transparent
                onRequestClose={closeCelebration}
            >
                <View style={styles.celebrationContainer}>
                    <View style={styles.celebrationCard}>
                        {/* Ícone de Celebração */}
                        <View style={styles.celebrationIcon}>
                            <Text style={styles.celebrationEmoji}>🎉</Text>
                        </View>

                        {/* Título */}
                        <Text style={styles.celebrationTitle}>Livro Encontrado!</Text>

                        {/* Informações do Livro */}
                        <View style={styles.bookInfoContainer}>
                            <Text style={styles.bookTitle}>{scannedBook?.title}</Text>
                            <Text style={styles.bookAuthor}>por {scannedBook?.author}</Text>
                            <View style={styles.genreTagCelebration}>
                                <Ionicons name="pricetag" size={14} color="#007AFF"/>
                                <Text style={styles.genreTextCelebration}>{scannedBook?.genre}</Text>
                            </View>
                        </View>

                        {/* Mensagem */}
                        <Text style={styles.celebrationMessage}>
                            Responda algumas perguntas sobre o livro para adicioná-lo à sua biblioteca!
                        </Text>

                        {/* Botões */}
                        <TouchableOpacity style={styles.quizButton} onPress={goToQuiz}>
                            <Ionicons name="help-circle" size={20} color="#fff"/>
                            <Text style={styles.quizButtonText}>Ir para Perguntas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeModalButton} onPress={closeCelebration}>
                            <Text style={styles.closeModalButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    greeting: {
        fontSize: 16,
        color: '#666',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAll: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 90,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    scannerHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 50,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    scanArea: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#007AFF',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    instructionsContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    instructionsText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    instructionsSubtext: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    testButton: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    celebrationContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    celebrationCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    celebrationIcon: {
        marginBottom: 20,
    },
    celebrationEmoji: {
        fontSize: 60,
    },
    celebrationTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    bookInfoContainer: {
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        width: '100%',
    },
    bookTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    bookAuthor: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    genreTagCelebration: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 5,
    },
    genreTextCelebration: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    celebrationMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20,
    },
    quizButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        paddingHorizontal: 30,
        borderRadius: 12,
        width: '100%',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    quizButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeModalButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        width: '100%',
        alignItems: 'center',
    },
    closeModalButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    bookCard: {
        width: 120,
        marginRight: 15,
    },
    bookCover: {
        width: 120,
        height: 180,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    bookCardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        textAlign: 'center',
    },
    progressMini: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginTop: 8,
        overflow: 'hidden',
    },
    progressBarMini: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
        textAlign: 'center',
    },
    statusBadge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'center',
    },
    statusReading: {
        backgroundColor: '#E3F2FD',
    },
    statusCompleted: {
        backgroundColor: '#E8F5E9',
    },
    statusWishlist: {
        backgroundColor: '#FFF3E0',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
    },
});