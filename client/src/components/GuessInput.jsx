import { useState } from 'react';
import { Button } from './Button';

export const GuessInput = ({ onSubmit, isCorrect }) => {
  const [guess, setGuess] = useState('');

  const handleSubmit = () => {
    if (!guess.trim()) return;
    onSubmit(guess);
    setGuess('');
  };

  return (
    <div className="mt-6">
      <input
        className="border p-2 rounded w-64"
        placeholder="Type your guess..."
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
      />
      <Button className="ml-2 bg-blue-500 text-white" onClick={handleSubmit}>
        Submit
      </Button>
      {isCorrect === true && <p className="text-green-600 font-bold mt-4">🎉 You guessed it right!</p>}
      {isCorrect === false && <p className="text-red-500 font-bold mt-4">❌ Wrong guess!</p>}
    </div>
  );
};