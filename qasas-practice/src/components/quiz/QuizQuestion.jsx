import IrabQuizRenderer from './renderers/IrabQuizRenderer';
import NounFeaturesQuizRenderer from './renderers/NounFeaturesQuizRenderer';
import RolesQuizRenderer from './renderers/RolesQuizRenderer';
import MorphologyQuizRenderer from './renderers/MorphologyQuizRenderer';
import VocabQuizRenderer from './renderers/VocabQuizRenderer';
import FiqhQuizRenderer from './renderers/FiqhQuizRenderer';
import HadithQuizRenderer from './renderers/HadithQuizRenderer';
import TafsirQuizRenderer from './renderers/TafsirQuizRenderer';

const QUIZ_RENDERERS = {
  irab: IrabQuizRenderer,
  nounFeatures: NounFeaturesQuizRenderer,
  roles: RolesQuizRenderer,
  morphology: MorphologyQuizRenderer,
  vocab: VocabQuizRenderer,
  fiqh: FiqhQuizRenderer,
  hadith: HadithQuizRenderer,
  tafsir: TafsirQuizRenderer,
};

export default function QuizQuestion({
  mode,
  question,
  showFeedback,
  currentAnswer,
  isCorrect,
  onAnswer,
}) {
  const Renderer = QUIZ_RENDERERS[mode];
  if (!Renderer) return null;

  return (
    <Renderer
      key={`${mode}:${question?.id || question?.topic || ''}`}
      question={question}
      showFeedback={showFeedback}
      currentAnswer={currentAnswer}
      isCorrect={isCorrect}
      onAnswer={onAnswer}
    />
  );
}
