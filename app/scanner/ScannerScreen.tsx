import { saveOrUpdateBookByUUID } from '@/src/services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

const debugLog = (...a: any[]) => console.log('[QR]', ...a);

/** ==== Utils ==== */
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

function parseQRPayload(raw0: string) {

  let raw = stripBOM(String(raw0 || '')).trim();
  raw = htmlEntityDecode(raw);
  debugLog('raw=', raw.slice(0, 120) + (raw.length > 120 ? '…' : ''));
  console.log('raw=', raw)
  if (raw.startsWith('data:')) {
    const comma = raw.indexOf(',');
    if (comma > 0) {
      const payload = decodeURIComponent(raw.slice(comma + 1));
      return JSON.parse(payload);
    }
  }

  const i0 = raw.indexOf('{');
  const i1 = raw.lastIndexOf('}');
  if (i0 >= 0 && i1 > i0) {
    const maybe = raw.slice(i0, i1 + 1);
    return JSON.parse(maybe);
  }

  return JSON.parse(raw);
}

function normalizeMinimal(obj: any) {
  if (!obj || typeof obj !== 'object') throw new Error('QR inválido');
  const uuid = String(obj.uuid || '').trim();
  const title = String(obj.title || '').trim();
  const author = String(obj.author || '').trim();
  if (!uuid || !title || !author) {
    throw new Error('QR deve conter uuid, title e author');
  }
  return { uuid, title, author };
}

/** ==== Screen ==== */
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!permission) await requestPermission();
    })();
  }, [permission, requestPermission]);

const handleBarCodeScanned = useCallback(
  async (result: BarcodeScanningResult) => {
    if (scanned || busy) return;

    try {
      setScanned(true);
      setBusy(true);

      const raw = result?.data ?? '';
      let parsed: any;

      try {
        parsed = parseQRPayload(raw);
      } catch (e: any) {
        debugLog('parse error:', e?.message);
        throw new Error('Falha ao interpretar o conteúdo do QR (JSON).');
      }

      let book: { uuid: string; title: string; author: string };
      try {
        book = normalizeMinimal(parsed);
      } catch (e: any) {
        debugLog('normalize error:', e?.message);
        throw new Error(e?.message || 'Conteúdo do QR inválido.');
      }

      const userSession = await AsyncStorage.getItem('user_session');
      if (!userSession) {
        Alert.alert('Sessão expirada', 'Faça login para adicionar livros.');
        setScanned(false);
        return;
      }

      const user = JSON.parse(userSession);

      try {
        await saveOrUpdateBookByUUID(user.id, {
          uuid: book.uuid,
          title: book.title,
          author: book.author,
        });
      } catch (e: any) {
        debugLog('db error:', e?.message || e);
        throw new Error('Falha ao salvar no banco de dados.');
      }

      Alert.alert('📖 Livro adicionado', `Agora você está lendo "${book.title}"!`);
      router.push({ pathname: '/book/book-details', params: { uuid: book.uuid } });
    } catch (err: any) {
      Alert.alert('QR inválido', err?.message || 'Não foi possível ler este QR.');
      setScanned(false);
    } finally {
      setBusy(false);
    }
  },
  [scanned, busy, router]
);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Verificando permissões…</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Permita o acesso à câmera para ler o QR.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      {busy && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" />
          <Text style={{ color: 'white', marginTop: 8 }}>Processando QR…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
});
