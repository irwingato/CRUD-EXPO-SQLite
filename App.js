import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

const db = SQLite.openDatabase('tarefas.db');

export default function App() {
  const [tarefasFazer, setTarefasFazer] = useState([]);
  const [tarefasFeitas, setTarefasFeitas] = useState([]);
  const [texto, setTexto] = useState('');
  const [tarefaClicada, setTarefaClicada] = useState(null);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS tarefas (id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT, concluido INT)'
      );
    }, errorHandler, fetchTarefas);
  }, []);

  const errorHandler = (error) => {
    console.error(error);
  };

  const fetchTarefas = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM tarefas;',
        [],
        (_, { rows }) => {
          const tarefas = rows._array;
          const tarefasFazer = tarefas.filter(({ concluido }) => !concluido);
          const tarefasFeitas = tarefas.filter(({ concluido }) => concluido);
          setTarefasFazer(tarefasFazer);
          setTarefasFeitas(tarefasFeitas);
        },
        errorHandler
      );
    });
  };

  const adicionarTarefa = () => {
    if (texto === '') return;

    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO tarefas (texto, concluido) VALUES (?, ?);',
        [texto, 0],
        () => {
          setTexto('');
          fetchTarefas();
        },
        errorHandler
      );
    });
  };

  const atualizarTarefa = (id, concluido) => {
    if (tarefaClicada === id) {
      excluirTarefa(id);
      setTarefaClicada(null);
    } else {
      setTarefaClicada(id);
      if (concluido) {
        moverParaFazer(id);
      } else {
        moverParaFeitas(id);
      }
    }
  };

  const excluirTarefa = (id) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM tarefas WHERE id = ?;',
        [id],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            fetchTarefas();
          }
        },
        errorHandler
      );
    });
  };

  const moverParaFeitas = (id) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE tarefas SET concluido = ? WHERE id = ?;',
        [1, id],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            fetchTarefas();
          }
        },
        errorHandler
      );
    });
  };

  const moverParaFazer = (id) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE tarefas SET concluido = ? WHERE id = ?;',
        [0, id],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            fetchTarefas();
          }
        },
        errorHandler
      );
    });
  };

  const removerFeitas = (id) => {
    excluirTarefa(id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Lista de Tarefas</Text>
      <View style={styles.flexRow}>
        <TextInput
          onChangeText={setTexto}
          onSubmitEditing={adicionarTarefa}
          placeholder="Próxima tarefa"
          style={styles.input}
          value={texto}
        />
        <TouchableOpacity style={styles.addButton} onPress={adicionarTarefa}>
          <Text style={styles.buttonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.listArea}>
        <Text style={styles.classificacao}>Fazer</Text>
        {tarefasFazer.map(({ id, texto, concluido }) => (
          <TouchableOpacity
            key={id}
            style={[styles.item, tarefaClicada === id && styles.clicado]}
            onPress={() => atualizarTarefa(id, concluido)}
            onLongPress={() => excluirTarefa(id)}
          >
            <Text>{texto}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.classificacao}>Feitas</Text>
        {tarefasFeitas.map(({ id, texto, concluido }) => (
          <TouchableOpacity
            key={id}
            style={[styles.item, tarefaClicada === id && styles.clicado]}
            onPress={() => removerFeitas(id)}
            onLongPress={() => excluirTarefa(id)}
          >
            <Text>{texto}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flexRow: {
    flexDirection: 'row',
  },
  clicado: {
    backgroundColor: '#18ba2e',
    color: '#ffffff',
  },
  input: {
    borderColor: '#4630eb',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
  listArea: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    paddingTop: 16,
  },
  item: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 16,
  },
  addButton: {
    backgroundColor: '#4630eb',
    borderRadius: 4,
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  classificacao: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
});
