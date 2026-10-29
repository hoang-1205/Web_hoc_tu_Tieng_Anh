'use client';

import React from 'react';
import { GameCode, PlayMode } from '@/types';
import { FlipCardBoard } from './FlipCardBoard';
import { FillBlankBoard } from './FillBlankBoard';
import { SentenceBuilderBoard } from './SentenceBuilderBoard';
import { SpeedQuizBoard } from './SpeedQuizBoard';
import { WordBasketBoard } from './WordBasketBoard';
import { FamilyMorphBoard } from './FamilyMorphBoard';
import { AudioShooterBoard } from './AudioShooterBoard';
import { TopicExpressBoard } from './TopicExpressBoard';

interface GameBoardProps {
  gameCode: GameCode;
  question: any;
  allQuestions: any[];
  playMode: PlayMode;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  onFlipCardComplete: (accuracy: number, mismatches: number, events: any[]) => void;
  onShowExplain: (data: any) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameCode,
  question,
  allQuestions,
  playMode,
  onAnswer,
  onFlipCardComplete,
  onShowExplain,
}) => {
  if (gameCode === 'flip_card') {
    return (
      <FlipCardBoard
        questions={allQuestions}
        onComplete={onFlipCardComplete}
        playMode={playMode}
      />
    );
  }

  if (gameCode === 'fill_blank') {
    return (
      <FillBlankBoard
        question={question}
        onAnswer={onAnswer}
        playMode={playMode}
        onShowExplain={onShowExplain}
      />
    );
  }

  if (gameCode === 'sentence_builder') {
    return (
      <SentenceBuilderBoard
        question={question}
        onAnswer={onAnswer}
        playMode={playMode}
        onShowExplain={onShowExplain}
      />
    );
  }

  if (gameCode === 'speed_quiz') {
    return (
      <SpeedQuizBoard
        question={question}
        onAnswer={onAnswer}
        playMode={playMode}
        onShowExplain={onShowExplain}
      />
    );
  }

  if (gameCode === 'word_basket') {
    return (
      <WordBasketBoard
        question={question}
        onAnswer={onAnswer}
        playMode={playMode}
        onShowExplain={onShowExplain}
      />
    );
  }

  if (gameCode === 'family_morph') {
    return (
      <FamilyMorphBoard
        question={question}
        onAnswer={onAnswer}
        playMode={playMode}
        onShowExplain={onShowExplain}
      />
    );
  }

  if (gameCode === 'audio_shooter') {
    return (
      <AudioShooterBoard
        question={question}
        onAnswer={onAnswer}
        playMode={playMode}
        onShowExplain={onShowExplain}
      />
    );
  }

  if (gameCode === 'topic_express') {
    return (
      <TopicExpressBoard
        question={question}
        onAnswer={onAnswer}
        playMode={playMode}
        onShowExplain={onShowExplain}
      />
    );
  }

  return (
    <div className="text-center p-8 text-slate-500">
      Đang tải trò chơi...
    </div>
  );
};
