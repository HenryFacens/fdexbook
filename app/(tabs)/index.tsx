import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { User, database } from '@/services/database';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

// Dados mocados do livro
const MOCK_BOOK = {
  id: 1,
  title: 'Harry Potter e a Pedra Filosofal',
  author: 'J.K. Rowling',
  genre: 'Fantasia',
  cover: 'https://m.media-amazon.com/images/I/81ibfYk4qmL._AC_UF1000,1000_QL80_.jpg',
};

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [scannedBook, setScannedBook] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    loadUserData();
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
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Permitir', onPress: () => requestPermission() },
        ]
      );
      return;
    }

    setScanned(false);
    setScannerVisible(true);
  };

  // Função para simular scan bem-sucedido (TESTE)
  const handleFakeScan = () => {
    setScannerVisible(false);
    setScannedBook(MOCK_BOOK);
    setCelebrationVisible(true);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    setScannerVisible(false);

    try {
      const bookData = JSON.parse(data);

      if (bookData.app === 'Dexbook' && bookData.id) {
        setScannedBook(bookData);
        setCelebrationVisible(true);
      } else {
        Alert.alert('QR Code Inválido', 'Este QR Code não pertence ao Dexbook');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível ler este QR Code');
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

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.username}>{user?.username || 'Usuário'}!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Livros</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bookmark-outline" size={24} color="#34C759" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Lendo</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>0</Text>
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
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum livro em andamento</Text>
            <Text style={styles.emptySubtext}>Adicione um livro para começar!</Text>
          </View>
        </View>

        {/* Recent Books Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Adicionados Recentemente</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver tudo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Sua biblioteca está vazia</Text>
            <Text style={styles.emptySubtext}>Comece adicionando seus livros favoritos!</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenScanner}>
        <Ionicons name="qr-code-outline" size={28} color="#fff" />
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
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            <View style={styles.bottomOverlay}>
              <View style={styles.instructionsContainer}>
                <Ionicons name="qr-code" size={40} color="#fff" style={{ marginBottom: 10 }} />
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
                <Ionicons name="pricetag" size={14} color="#007AFF" />
                <Text style={styles.genreTextCelebration}>{scannedBook?.genre}</Text>
              </View>
            </View>

            {/* Mensagem */}
            <Text style={styles.celebrationMessage}>
              Responda algumas perguntas sobre o livro para adicioná-lo à sua biblioteca!
            </Text>

            {/* Botões */}
            <TouchableOpacity style={styles.quizButton} onPress={goToQuiz}>
              <Ionicons name="help-circle" size={20} color="#fff" />
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 4 },
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
  // Celebration Modal
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
});