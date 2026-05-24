import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import IrabMode from './components/IrabMode';
import NounMode from './components/NounMode';
import RoleMode from './components/RoleMode';
import VocabMode from './components/VocabMode';
import './App.css';

export default function App() {
  const [currentMode, setCurrentMode] = useState(null);
  const [scores, setScores] = useState({
    irab: 0,
    noun: 0,
    role: 0,
    vocab: 0,
  });

  const handleSelectMode = (mode) => {
    setCurrentMode(mode);
  };

  const handleBack = () => {
    setCurrentMode(null);
  };

  const setModeScore = (mode) => (newScore) => {
    setScores((prev) => ({ ...prev, [mode]: newScore }));
  };

  if (!currentMode) {
    return <HomeScreen onSelectMode={handleSelectMode} />;
  }

  switch (currentMode) {
    case 'irab':
      return (
        <IrabMode
          onBack={handleBack}
          score={scores.irab}
          setScore={setModeScore('irab')}
        />
      );
    case 'noun':
      return (
        <NounMode
          onBack={handleBack}
          score={scores.noun}
          setScore={setModeScore('noun')}
        />
      );
    case 'role':
      return (
        <RoleMode
          onBack={handleBack}
          score={scores.role}
          setScore={setModeScore('role')}
        />
      );
    case 'vocab':
      return (
        <VocabMode
          onBack={handleBack}
          score={scores.vocab}
          setScore={setModeScore('vocab')}
        />
      );
    default:
      return <HomeScreen onSelectMode={handleSelectMode} />;
  }
}
