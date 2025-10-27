import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    TextInput,
    Share,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import {database, UserBookDetail} from '@/services/database';
import { useBooks } from '@/contexts/BooksContext';

export default function BookDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const viewShotRef = useRef<ViewShot>(null);
    const { refreshBooks } = useBooks();
    const [book, setBook] = useState<UserBookDetail | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [notes, setNotes] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadBook();
    }, []);

    const loadBook = async () => {
    if (params.userBookId) {
      const bookData = await database.getUserBookById(Number(params.userBookId));
      if (bookData) {
        setBook(bookData);
        setCurrentPage(bookData.currentPage);
        setNotes(bookData.notes || '');
        console.log('📖 Book loaded:', bookData.title, 'Status:', bookData.status);
      }
    }
  };

    const handleUpdateProgress = async () => {
    if (!book) return;

    const newStatus = currentPage >= book.pages ? 'completed' : 'reading';

    const success = await database.updateUserBook(book.userBookId, {
      currentPage: currentPage,
      status: newStatus,
    });

    if (success) {
      Alert.alert('Sucesso! 🎉', 'Progresso atualizado!');
      await loadBook();
      await refreshBooks(); // 👈 Atualiza o Context
    }
  };

   const handleSaveNotes = async () => {
    if (!book) return;

    const success = await database.updateUserBook(book.userBookId, { notes });
    if (success) {
      Alert.alert('Sucesso! 📝', 'Notas salvas!');
      setIsEditing(false);
      await loadBook();
    }
  };

    const handleDeleteBook = () => {
    Alert.alert('Excluir Livro', 'Tem certeza que deseja remover este livro da sua biblioteca?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (book) {
            const success = await database.removeBookFromUserLibrary(book.userBookId);
            if (success) {
              Alert.alert('Sucesso', 'Livro removido da biblioteca!');
              await refreshBooks(); // 👈 Atualiza o Context
              router.back();
            }
          }
        },
      },
    ]);
  };

    const handleChangeStatus = async (status: 'wishlist' | 'reading' | 'completed') => {
    if (!book) return;

    console.log('\n🎯 === CHANGE STATUS START ===');
    console.log('🎯 Current book:', {
      userBookId: book.userBookId,
      title: book.title,
      currentStatus: book.status,
    });
    console.log('🎯 Changing to:', status);

    const success = await database.updateUserBook(book.userBookId, { status });

    console.log('📊 Update returned:', success);

    if (success) {
      Alert.alert('Sucesso', 'Status atualizado!');

      console.log('🔄 Reloading book...');
      await loadBook();

      console.log('🔄 Refreshing books context...');
      await refreshBooks(); // 👈 USA A FUNÇÃO JÁ DECLARADA NO TOPO

      console.log('✅ === CHANGE STATUS END ===\n');
    } else {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
      console.log('❌ === CHANGE STATUS FAILED ===\n');
    }
  };

    const captureAndShareQRCode = async () => {
        try {
            if (viewShotRef.current) {
                const uri = await viewShotRef.current.capture?.();

                if (await Sharing.isAvailableAsync()) {
                    // await Sharing.shareAsync(uri);
                } else {
                    Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
                }
            }
        } catch (error) {
            console.error('Error capturing QR code:', error);
            Alert.alert('Erro', 'Não foi possível exportar o QR Code');
        }
    };

    const shareBookInfo = async () => {
        if (!book) return;

        try {
            await Share.share({
                message: `${book.title} por ${book.author}\n\nEstou lendo este livro no Dexbook! 📚`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (!book) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Carregando...</Text>
            </View>
        );
    }

    const progress = book.pages > 0 ? (currentPage / book.pages) * 100 : 0;
    const qrCodeData = JSON.stringify({
        bookId: book.id, // ID do livro no catálogo
        title: book.title,
        author: book.author,
        app: 'Dexbook',
    });

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff"/>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteBook} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={24} color="#fff"/>
                </TouchableOpacity>
            </View>

            {/* Book Cover */}
            <View style={styles.coverSection}>
                <Image source={{uri: book.cover}} style={styles.cover} resizeMode="cover"/>
                <View style={styles.overlay}/>
            </View>

            {/* Book Info */}
            <View style={styles.infoSection}>
                <Text style={styles.title}>{book.title}</Text>
                <Text style={styles.author}>
                    <Ionicons name="person" size={16} color="#666"/> {book.author}
                </Text>
                <View style={styles.metaInfo}>
                    <View style={styles.genreTag}>
                        <Ionicons name="pricetag" size={14} color="#007AFF"/>
                        <Text style={styles.genreText}>{book.genre}</Text>
                    </View>
                    <Text style={styles.pagesInfo}>
                        <Ionicons name="document-text" size={14} color="#666"/> {book.pages} páginas
                    </Text>
                </View>

                {/* Status Selector */}
                <View style={styles.statusContainer}>
                    <TouchableOpacity
                        style={[styles.statusChip, book.status === 'wishlist' && styles.statusChipActive]}
                        onPress={() => handleChangeStatus('wishlist')}
                    >
                        <Ionicons
                            name="bookmark"
                            size={16}
                            color={book.status === 'wishlist' ? '#fff' : '#666'}
                        />
                        <Text style={[styles.statusText, book.status === 'wishlist' && styles.statusTextActive]}>
                            Quero Ler
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statusChip, book.status === 'reading' && styles.statusChipActive]}
                        onPress={() => handleChangeStatus('reading')}
                    >
                        <Ionicons
                            name="book"
                            size={16}
                            color={book.status === 'reading' ? '#fff' : '#666'}
                        />
                        <Text style={[styles.statusText, book.status === 'reading' && styles.statusTextActive]}>
                            Lendo
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statusChip, book.status === 'completed' && styles.statusChipActive]}
                        onPress={() => handleChangeStatus('completed')}
                    >
                        <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={book.status === 'completed' ? '#fff' : '#666'}
                        />
                        <Text style={[styles.statusText, book.status === 'completed' && styles.statusTextActive]}>
                            Lido
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Progress Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progresso de Leitura</Text>
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressText}>
                            {currentPage} de {book.pages} páginas
                        </Text>
                        <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, {width: `${progress}%`}]}/>
                    </View>
                    <View style={styles.progressInput}>
                        <TextInput
                            style={styles.input}
                            value={currentPage.toString()}
                            onChangeText={(text) => setCurrentPage(Number(text) || 0)}
                            keyboardType="numeric"
                            placeholder="Página atual"
                        />
                        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProgress}>
                            <Text style={styles.updateButtonText}>Atualizar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Minhas Notas</Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Ionicons name={isEditing ? 'close' : 'create-outline'} size={24} color="#007AFF"/>
                    </TouchableOpacity>
                </View>
                <View style={styles.notesCard}>
                    {isEditing ? (
                        <>
                            <TextInput
                                style={styles.notesInput}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                placeholder="Adicione suas anotações sobre o livro..."
                                textAlignVertical="top"
                            />
                            <TouchableOpacity style={styles.saveNotesButton} onPress={handleSaveNotes}>
                                <Text style={styles.saveNotesText}>Salvar Notas</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={styles.notesText}>
                            {notes || 'Nenhuma nota adicionada ainda. Toque no ícone para adicionar.'}
                        </Text>
                    )}
                </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>QR Code do Livro</Text>
                <View style={styles.qrCodeCard}>
                    <ViewShot ref={viewShotRef} options={{format: 'png', quality: 1}}>
                        <View style={styles.qrCodeContainer}>
                            <QRCode value={qrCodeData} size={200} backgroundColor="white" color="black"/>
                            <Text style={styles.qrCodeLabel}>{book.title}</Text>
                            <Text style={styles.qrCodeSubLabel}>Dexbook</Text>
                        </View>
                    </ViewShot>

                    <View style={styles.qrCodeActions}>
                        <TouchableOpacity style={styles.qrCodeButton} onPress={captureAndShareQRCode}>
                            <Ionicons name="share-outline" size={20} color="#007AFF"/>
                            <Text style={styles.qrCodeButtonText}>Exportar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.qrCodeButton} onPress={shareBookInfo}>
                            <Ionicons name="paper-plane-outline" size={20} color="#007AFF"/>
                            <Text style={styles.qrCodeButtonText}>Compartilhar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{height: 40}}/>
        </ScrollView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,59,48,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverSection: {
        height: 300,
        position: 'relative',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    infoSection: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    author: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    genreTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 5,
    },
    genreText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    pagesInfo: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 15,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    progressCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 15,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
    },
    progressPercent: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 15,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
    },
    progressInput: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    updateButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: 'center',
    },
    updateButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    notesCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 15,
    },
    notesText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    notesInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        marginBottom: 10,
    },
    saveNotesButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveNotesText: {
        color: '#fff',
        fontWeight: '600',
    },
    qrCodeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    qrCodeContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    qrCodeLabel: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    qrCodeSubLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    qrCodeActions: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 20,
    },
    qrCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 8,
    },
    qrCodeButtonText: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 14,
    },

    statusContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        gap: 5,
    },
    statusChipActive: {
        backgroundColor: '#007AFF',
    },
    statusText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    statusTextActive: {
        color: '#fff',
    },
});