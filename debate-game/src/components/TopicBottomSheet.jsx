import { useNavigate } from 'react-router-dom';
import { PERSONA_DESCRIPTIONS, TIER_LABELS } from '../data/constants.js';

export default function TopicBottomSheet({ topic, persona, onClose }) {
  const navigate = useNavigate();
  if (!topic) return null;

  function handleStart() {
    navigate(`/round/${topic.id}`, { state: { persona } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-t-2xl bg-white p-6 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="text-xs font-medium text-violet-600">{TIER_LABELS[topic.tier]}</span>
        <h2 className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {topic.title}
        </h2>
        {topic.description && (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{topic.description}</p>
        )}

        <div className="mt-4 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            상대 논객: {persona}
          </p>
          <p className="mt-1 text-sm text-neutral-500">{PERSONA_DESCRIPTIONS[persona]}</p>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-neutral-300 py-3 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 rounded bg-violet-600 py-3 font-medium text-white"
          >
            대결 시작
          </button>
        </div>
      </div>
    </div>
  );
}
