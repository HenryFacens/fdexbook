import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { database } from '@/services/database';
import { useState } from 'react';

export default function DebugScreen() {
  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = async () => {
    const allUsers = await database.getAllUsers();
    setUsers(allUsers);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Debug Database</Text>

      <TouchableOpacity style={styles.button} onPress={loadUsers}>
        <Text style={styles.buttonText}>Carregar Usuários</Text>
      </TouchableOpacity>

      <View style={styles.usersContainer}>
        <Text style={styles.subtitle}>Usuários cadastrados: {users.length}</Text>
        {users.map((user, index) => (
          <View key={user.id} style={styles.userCard}>
            <Text style={styles.userText}>#{index + 1}</Text>
            <Text style={styles.userText}>ID: {user.id}</Text>
            <Text style={styles.userText}>Username: {user.username}</Text>
            <Text style={styles.userText}>Email: {user.email}</Text>
            <Text style={styles.userText}>Criado: {user.createdAt}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  usersContainer: {
    marginTop: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
});
//
//
// ## 3. Teste o Fluxo Completo
//
// **Passo a passo para testar:**
//
// 1. **Abra o app** - deve mostrar a tela de login
// 2. **Clique em "Cadastre-se"** - vai para tela de registro
// 3. **Preencha os dados:**
//    - Username: `teste`
//    - Email: `teste@email.com`
//    - Senha: `123456`
//    - Confirmar senha: `123456`
// 4. **Clique em "Criar Conta"**
// 5. **Deve mostrar alerta** "Conta criada com sucesso!"
// 6. **Voltar para login** e faça login com:
//    - Email: `teste@email.com`
//    - Senha: `123456`
// 7. **Deve redirecionar** para a área de tabs
//
// ## 4. Verifique os Logs
//
// No terminal do Expo, você deve ver logs como:
// ```
// ✅ Database initialized
// ✅ User registered: {username: "teste", email: "teste@email.com", insertId: 1}
// 🔑 Login attempt: {email: "teste@email.com", found: true}