import { getQuizByBookId, MockQuizQuestion } from '@/src/mocks/books';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function QuizScreen() {
  const router = useRouter();
  const { bookId, bookTitle, userBookId } = useLocalSearchParams<{
    bookId?: string;
    bookTitle?: string;
    userBookId?: string;
  }>();

  const questions: MockQuizQuestion[] = useMemo(() => {
    const id = Number(bookId);
    return Number.isFinite(id) ? getQuizByBookId(id) : [];
  }, [bookId]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const onSelect = (optionIndex: number) => {
    const clone = [...answers];
    clone[step] = optionIndex;
    setAnswers(clone);
  };

  const next = () => {
    if (answers[step] === -1) {
      Alert.alert('Ops!', 'Escolha uma alternativa antes de avançar.');
      return;
    }
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
    } else {

      const s = questions.reduce(
        (acc, q, i) => (q.correctIndex === answers[i] ? acc + 1 : acc),
        0
      );
      setScore(s);
      setFinished(true);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers(Array(questions.length).fill(-1));
    setFinished(false);
    setScore(0);
  };


  const conclude = () => {
    const passed = score >= 4; 
    const idParam = userBookId ? `&userBookId=${userBookId}` : '';
    const resultParam = `quizResult=${passed ? 'passed' : 'failed'}`;
    router.replace(`/book/book-details?${resultParam}${idParam}`);
  };

  if (!questions.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Quiz</Text>
        <Text style={styles.subtitle}>
          {bookTitle ? `Sem perguntas mockadas para: ${bookTitle}` : 'Sem perguntas disponíveis.'}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    const passed = score >= 4;
    return (
      <View style={styles.center}>
        <Ionicons
          name={passed ? 'trophy' : 'close-circle'}
          size={72}
          color={passed ? '#34C759' : '#FF3B30'}
        />
        <Text style={styles.title}>{passed ? 'Parabéns!' : 'Quase lá!'}</Text>
        <Text style={styles.subtitle}>
          Você acertou {score}/{questions.length}.
          {passed ? ' Livro capturado na DexBook!' : ' Tente novamente para capturar.'}
        </Text>

        <View style={{ height: 16 }} />

        {!passed && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={restart}>
            <Text style={styles.secondaryText}>Tentar novamente</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={conclude}>
          <Text style={styles.primaryText}>{passed ? 'Concluir' : 'Voltar'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = questions[step];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{bookTitle || 'Quiz'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.progressLabel}>
          Pergunta {step + 1} de {questions.length}
        </Text>

        <View style={styles.card}>
          <Text style={styles.question}>{q.question}</Text>
          <View style={{ height: 8 }} />
          {q.options.map((opt, idx) => {
            const selected = answers[step] === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => onSelect(idx)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
                {selected && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={next}>
          <Text style={styles.primaryText}>{step < questions.length - 1 ? 'Próxima' : 'Finalizar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const purple = '#6C63FF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FB' },
  header: {
    backgroundColor: purple,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  content: { padding: 16, gap: 16 },
  progressLabel: { color: '#666', fontSize: 13, marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10, elevation: 1 },
  question: { fontSize: 16, fontWeight: '700', color: '#222' },
  option: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12,
    backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8,
  },
  optionSelected: { backgroundColor: purple, borderColor: purple },
  optionText: { color: '#222' },
  optionTextSelected: { color: '#fff', fontWeight: '700' },
  primaryBtn: {
    backgroundColor: purple, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  secondaryText: { color: '#111', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 14, color: '#444', textAlign: 'center' },
});
