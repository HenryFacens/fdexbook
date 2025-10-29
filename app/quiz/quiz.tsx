// app/quiz/quiz.tsx
import { getQuizByBookId, type MockQuizQuestion } from '@/src/mocks/books';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/** ===== Helpers ===== */
const PRIMARY = '#6C63FF';

// transforma múltipla escolha em “resposta aberta”
function toOpenAnswer(questions: MockQuizQuestion[]) {
  // mapeia emojis simples só para dar um charme visual
  const emojiPool = ['📘', '✨', '🪄', '🏰', '🧩', '📚', '🧠', '🌟', '🧪', '🗺️'];
  return questions.slice(0, 5).map((q, i) => {
    const correct = q.options[q.correctIndex] ?? '';
    return {
      id: q.id,
      question: q.question,
      correctAnswer: correct,
      image: emojiPool[i % emojiPool.length],
    };
  });
}

// normaliza texto para comparação: minúsculas, sem acento, trim
function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

type Params = {
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  userBookId?: string;
};

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  // carrega perguntas mockadas por bookId e converte para resposta aberta
  const QUIZ_QUESTIONS = useMemo(() => {
    const id = Number(params.bookId);
    if (!Number.isFinite(id)) return [];
    const choiceQs = getQuizByBookId(id);
    return toOpenAnswer(choiceQs);
  }, [params.bookId]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress =
    QUIZ_QUESTIONS.length > 0
      ? ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100
      : 0;

  const handleSkip = () => {
    Alert.alert('Sair do quiz?', 'Seu progresso atual será perdido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleNext = () => {
    if (!answer.trim()) return;

    // decide se acertou (tolerante a acentos/caso)
    const ok = norm(answer) === norm(question.correctAnswer);
    setIsCorrect(ok);
    setFeedbackVisible(true);
    if (ok) setScore((s) => s + 1);
  };

  const navigateToResult = (passed: boolean) => {
    const href: Href = {
      pathname: '/book/book-details',
      params: {
        quizResult: passed ? 'passed' : 'failed',
        userBookId: String(params.userBookId || ''),
      },
    };
    router.replace(href);
  };

  const handleContinue = () => {
    setFeedbackVisible(false);

    const isLast = currentQuestion === QUIZ_QUESTIONS.length - 1;
    if (isLast) {
      const passed = score >= 4; // regra 4/5
      navigateToResult(passed);
      return;
    }

    setCurrentQuestion((q) => q + 1);
    setAnswer('');
    setIsCorrect(null);
  };

  if (!QUIZ_QUESTIONS.length) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.emptyTitle}>Quiz</Text>
        <Text style={styles.emptySub}>
          {params.bookTitle
            ? `Ainda não temos perguntas para: ${params.bookTitle}`
            : 'Sem perguntas disponíveis.'}
        </Text>
        <TouchableOpacity style={[styles.nextButton, { marginTop: 16 }]} onPress={() => router.back()}>
          <Text style={styles.nextButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header com Progress Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Pergunta {currentQuestion + 1} de {QUIZ_QUESTIONS.length}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Informações do Livro */}
        <View style={styles.bookInfo}>
          {!!params.bookTitle && <Text style={styles.bookTitle}>{params.bookTitle}</Text>}
          {!!params.bookAuthor && <Text style={styles.bookAuthor}>por {params.bookAuthor}</Text>}
        </View>

        {/* Ícone/Imagem da Pergunta */}
        <View style={styles.questionImageContainer}>
          <Text style={styles.questionEmoji}>{question.image}</Text>
        </View>

        {/* Pergunta */}
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>Pergunta {currentQuestion + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Campo de Resposta */}
        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Sua Resposta:</Text>
          <TextInput
            style={styles.answerInput}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Digite sua resposta aqui..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit
          />
        </View>

        {/* Dica */}
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#666" />
          <Text style={styles.hintText}>
            Não se preocupe se errar, você pode continuar mesmo assim!
          </Text>
        </View>

        {/* Botão Próxima */}
        <TouchableOpacity
          style={[styles.nextButton, !answer.trim() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!answer.trim()}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Finalizar Quiz' : 'Verificar Resposta'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Feedback Modal (Bottom Sheet) */}
      <Modal
        visible={feedbackVisible}
        transparent
        animationType="slide"
        onRequestClose={handleContinue}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleContinue}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />

            {isCorrect ? (
              <>
                <View style={styles.feedbackIconContainer}>
                  <View style={[styles.feedbackIcon, styles.correctIcon]}>
                    <Ionicons name="checkmark-circle" size={60} color="#34C759" />
                  </View>
                </View>

                <Text style={styles.feedbackTitle}>Correto! 🎉</Text>
                <Text style={styles.feedbackMessage}>
                  Excelente! Você respondeu corretamente.
                </Text>

                <View style={styles.correctAnswerBox}>
                  <Text style={styles.correctAnswerLabel}>Sua resposta:</Text>
                  <Text style={styles.userAnswer}>{answer}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.feedbackIconContainer}>
                  <View style={[styles.feedbackIcon, styles.incorrectIcon]}>
                    <Ionicons name="close-circle" size={60} color="#FF3B30" />
                  </View>
                </View>

                <Text style={[styles.feedbackTitle, styles.incorrectTitle]}>
                  Ops! Não foi dessa vez 😅
                </Text>
                <Text style={styles.feedbackMessage}>
                  Não se preocupe! Você pode continuar o quiz.
                </Text>

                <View style={styles.answersComparison}>
                  <View style={styles.answerComparisonBox}>
                    <Text style={styles.answerComparisonLabel}>Sua resposta:</Text>
                    <Text style={styles.userAnswerIncorrect}>{answer}</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={20} color="#999" style={{ marginHorizontal: 10 }} />

                  <View style={styles.answerComparisonBox}>
                    <Text style={styles.answerComparisonLabel}>Resposta correta:</Text>
                    <Text style={styles.correctAnswerText}>
                      {question.correctAnswer.charAt(0).toUpperCase() + question.correctAnswer.slice(1)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.continueButton, isCorrect ? styles.correctButton : styles.incorrectButton]}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>
                {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Ver Resultado' : 'Próxima Pergunta'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/** ===== Styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  skipButton: { alignSelf: 'flex-end', marginBottom: 10 },
  progressContainer: { gap: 8 },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 4 },
  progressText: { fontSize: 14, color: '#666', textAlign: 'center', fontWeight: '600' },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  bookInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'center' },
  bookAuthor: { fontSize: 14, color: '#666' },

  questionImageContainer: { alignItems: 'center', marginVertical: 20 },
  questionEmoji: { fontSize: 80 },

  questionCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20 },
  questionNumber: { fontSize: 12, color: PRIMARY, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#333', lineHeight: 28 },

  answerSection: { marginBottom: 15 },
  answerLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  answerInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
    color: '#333',
  },

  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  hintText: { flex: 1, fontSize: 12, color: '#856404' },

  nextButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextButtonDisabled: { backgroundColor: '#ccc' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Bottom Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
    minHeight: 400,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },

  feedbackIconContainer: { alignItems: 'center', marginBottom: 15 },
  feedbackIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  correctIcon: { backgroundColor: '#E8F8EC' },
  incorrectIcon: { backgroundColor: '#FFE5E5' },

  feedbackTitle: { fontSize: 26, fontWeight: 'bold', color: '#34C759', textAlign: 'center', marginBottom: 10 },
  incorrectTitle: { color: '#FF3B30' },
  feedbackMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22 },

  correctAnswerBox: {
    backgroundColor: '#E8F8EC',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  correctAnswerLabel: { fontSize: 12, color: '#34C759', fontWeight: '600', marginBottom: 5 },
  userAnswer: { fontSize: 16, color: '#333', fontWeight: '600' },

  answersComparison: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  answerComparisonBox: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f9f9f9' },
  answerComparisonLabel: { fontSize: 11, color: '#666', marginBottom: 5 },
  userAnswerIncorrect: { fontSize: 14, color: '#FF3B30', fontWeight: '600' },
  correctAnswerText: { fontSize: 14, color: '#34C759', fontWeight: '600' },

  continueButton: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  correctButton: { backgroundColor: '#34C759' },
  incorrectButton: { backgroundColor: PRIMARY },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Empty
  emptyTitle: { fontSize: 22, fontWeight: '800', color: PRIMARY, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#444', textAlign: 'center' },
});
5