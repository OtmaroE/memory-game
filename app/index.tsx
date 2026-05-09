import GameBoard from '@/components/GameBoard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const INITIAL_PAIRS_LEFT = 4;

export default function Game() {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [showAboutPage, setShowAboutPage] = useState<boolean>(false);
  const [pairsLeft, setPairsLeft] = useState<number>(INITIAL_PAIRS_LEFT);
  const [gameKey, setGameKey] = useState<number>(0);

  const startGame = () => {
    setPairsLeft(INITIAL_PAIRS_LEFT);
    setGameKey(prevKey => prevKey + 1);
    setShowAboutPage(false);
    setGameStarted(true);
  };

  const backToMenu = () => {
    setPairsLeft(INITIAL_PAIRS_LEFT);
    setGameStarted(false);
  };

  return (
    <View style={styles.container}>
      {gameStarted && <GameBoard key={gameKey} pairsLeft={pairsLeft} onPairLeftChange={setPairsLeft} />}

      {!gameStarted && !showAboutPage && (
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.button}
            onPress={startGame}
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => {
              setGameStarted(false);
              setShowAboutPage(true);
            }}
          >
            <Text style={styles.buttonText}>About</Text>
          </Pressable>
        </View>
      )}

      {showAboutPage && (
        <View style={styles.aboutContainer}>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Developed by otmaro</Text>
            <Text style={styles.aboutLink}>https://otmaro.dev</Text>
          </View>
          <Pressable style={styles.button} onPress={() => setShowAboutPage(false)}>
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>
        </View>
      )}

      {gameStarted && pairsLeft > 0 && (
        <View style={styles.gameButtonContainer}>
          <Pressable style={styles.button} onPress={backToMenu}>
            <Text style={styles.buttonText}>End Game</Text>
          </Pressable>
        </View>
      )}

      {gameStarted && pairsLeft === 0 && (
        <View style={styles.gameButtonContainer}>
          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>New Game</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={backToMenu}>
            <Text style={styles.buttonText}>Back to Menu</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  gameButtonContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  aboutContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  aboutCard: {
    backgroundColor: '#d7ebff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3b79b5',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#1f3f5a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#184a75',
    marginBottom: 8,
  },
  aboutLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f6799',
  },
  button: {
    backgroundColor: '#007bffbb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
