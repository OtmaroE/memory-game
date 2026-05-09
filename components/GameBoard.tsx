import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
const GRID_SIZE = 9;
const PAIRS_COUNT = 4;
const DELAY_MS = 1000;

interface GameItem {
  value: number;
  solved: boolean;
  index: number;
  visible: boolean;
}

type TurnResolution =
  | { kind: 'pair'; indexes: [number, number] }
  | { kind: 'skull'; indexes: number[] };

function orderGenerator(): GameItem[] {
  const numbers: number[] = [];
  for (let i = 0; i < PAIRS_COUNT; i++) {
    const number = Math.floor(Math.random() * 100) + 1;
    numbers.push(number, number);
  }
  numbers.push(-1); // Empty space

  return numbers
    .sort(() => Math.random() - 0.5)
    .map((value, index): GameItem => ({
      value,
      solved: false,
      index,
      visible: false
    }));
}

export default function GameBoard({ pairsLeft, onPairLeftChange }: { pairsLeft: number, onPairLeftChange: (pairsLeft: number) => void }) {
  const [boardState, setBoardState] = useState<GameItem[]>(() => orderGenerator());
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [isResolvingTurn, setIsResolvingTurn] = useState<boolean>(false);
  const [turnResolution, setTurnResolution] = useState<TurnResolution | null>(null);
  const [numberOfAttempts, setNumberOfAttempts] = useState<number>(0);
  const pulseValue = useRef(new Animated.Value(0)).current;

  const solvedPairs = boardState.filter(item => item.solved).length / 2;
  const remainingPairs = PAIRS_COUNT - solvedPairs;
  const hasWon = remainingPairs === 0;
  const resolvingPairMatched =
    turnResolution?.kind === 'pair' &&
    boardState[turnResolution.indexes[0]].value === boardState[turnResolution.indexes[1]].value;
  const statusMessage = (() => {
    if (hasWon) return 'All pairs found';
    if (turnResolution?.kind === 'skull') return 'Skull found! Turn lost';
    if (isResolvingTurn && turnResolution?.kind === 'pair') {
      return resolvingPairMatched ? 'Match!' : 'No match';
    }
    if (selectedIndexes.length === 1) return 'Pick one more card';
    return 'Pick two cards';
  })();

  useEffect(() => {
    onPairLeftChange(remainingPairs);
  }, [remainingPairs, onPairLeftChange]);

  useEffect(() => {
    const shouldPulse = selectedIndexes.length > 0 || turnResolution !== null;

    if (!shouldPulse) {
      pulseValue.stopAnimation();
      pulseValue.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulseValue, selectedIndexes.length, turnResolution]);

  useEffect(() => {
    if (!isResolvingTurn || turnResolution === null) return;

    const matched =
      turnResolution.kind === 'pair' &&
      boardState[turnResolution.indexes[0]].value === boardState[turnResolution.indexes[1]].value;

    const timer = setTimeout(() => {
      setBoardState(prevState =>
        prevState.map((item, index) => {
          if (!turnResolution.indexes.includes(index)) return item;
          return {
            ...item,
            solved: matched,
            visible: matched
          };
        })
      );
      setSelectedIndexes([]);
      setIsResolvingTurn(false);
      setTurnResolution(null);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [boardState, isResolvingTurn, turnResolution]);

  const tryToggle = (touchedIndex: number) => {
    if (hasWon || isResolvingTurn || selectedIndexes.length >= 2) return false;

    const foundItem = boardState[touchedIndex];
    if (foundItem.solved || foundItem.visible) return false;

    if (foundItem.value === -1) {
      setBoardState(prevState =>
        prevState.map((item, index) =>
          index === touchedIndex ? { ...item, visible: true } : item
        )
      );
      setNumberOfAttempts(prev => prev + 1);
      setIsResolvingTurn(true);
      setTurnResolution({ kind: 'skull', indexes: [...selectedIndexes, touchedIndex] });
      return true;
    }

    const nextSelectedIndexes = [...selectedIndexes, touchedIndex];

    setBoardState(prevState =>
      prevState.map((item, index) =>
        index === touchedIndex ? { ...item, visible: true } : item
      )
    );
    setSelectedIndexes(nextSelectedIndexes);

    if (nextSelectedIndexes.length === 2) {
      setNumberOfAttempts(prev => prev + 1);
      setIsResolvingTurn(true);
      setTurnResolution({ kind: 'pair', indexes: [nextSelectedIndexes[0], nextSelectedIndexes[1]] });
    }

    return true;
  };

  const getBoxContent = (item: GameItem) => {
    if (!item.visible && !item.solved) return null;
    if (item.value === -1) {
      return (
        <View style={styles.imageWrapper}>
          <Image
            source={require('../assets/images/death.png')}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel="death"
          />
        </View>
      );
    }
    return (
      <div
        style={item.solved ? styles.solvedBoxText : styles.boxText}
        id={`number-${item.index}`}
      >
        {item.value}
      </div>
    );
  };

  const getBoxStyle = (item: GameItem, index: number) => {
    if (turnResolution?.indexes.includes(index)) {
      if (turnResolution.kind === 'skull') {
        return item.value === -1 ? styles.skullPreviewBox : styles.mismatchPreviewBox;
      }
      if (resolvingPairMatched) return styles.matchPreviewBox;
      return styles.mismatchPreviewBox;
    }
    if (item.solved) return styles.solvedBox;
    if (selectedIndexes.includes(index)) return styles.selectedBox;
    if (item.visible) return styles.visibleBox;
    return styles.box;
  };

  const getBoxAnimationStyle = (index: number) => {
    const isActiveCard = selectedIndexes.includes(index) || turnResolution?.indexes.includes(index);

    if (!isActiveCard) return null;

    return {
      transform: [
        {
          scale: pulseValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.04],
          }),
        },
      ],
    };
  };

  return (
    <View>
      <Text style={styles.title}>
        {pairsLeft === 0 ? `You Won in ${numberOfAttempts} attempts!` : `${pairsLeft} pairs left to find`}
      </Text>
      <View style={styles.infoBar}>
        <Text style={styles.status}>{statusMessage}</Text>
        <Text style={styles.attempts}>Attempts: {numberOfAttempts}</Text>
      </View>
      <View style={styles.container}>
        {Array.from({ length: GRID_SIZE }).map((_, idx) => (
          <Pressable
            key={`cell-${idx}`}
            onPress={() => tryToggle(idx)}
          >
            <Animated.View style={[getBoxStyle(boardState[idx], idx), getBoxAnimationStyle(idx)]}>
              {getBoxContent(boardState[idx])}
            </Animated.View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
  },
  infoBar: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 356,
    paddingHorizontal: 16,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  status: {
    color: 'white',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  attempts: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    padding: 50,
    width: '100%',
    maxWidth: 356, // (80px box width * 3) + (8px gap * 2) + (50px padding * 2)
    alignSelf: 'center', // Centers the container itself
  },
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#132cd9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solvedBox: {
    width: 80,
    height: 80,
    backgroundColor: '#acf383ff',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#28aee2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibleBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgb(131, 202, 243)',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'rgb(13, 55, 170)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgb(131, 202, 243)',
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: '#f4d35e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchPreviewBox: {
    width: 80,
    height: 80,
    backgroundColor: '#acf383ff',
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: '#1f9d55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mismatchPreviewBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgb(131, 202, 243)',
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: '#d62828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skullPreviewBox: {
    width: 80,
    height: 80,
    backgroundColor: '#2b2d42',
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: '#ffb703',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solvedBoxText: {
    fontSize: 24,
    color: 'gray',
  },
  boxText: {
    fontSize: 24,
    color: 'black',
  }
  ,
  imageWrapper: {
    width: '100%',
    height: '100%',
    padding: 6,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
});
