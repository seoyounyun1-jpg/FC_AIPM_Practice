import StarRating from './StarRating.jsx';

export default function TopicCard({ topic, persona, clearInfo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{topic.title}</h3>
      <div className="flex flex-wrap gap-1">
        {(topic.interest_tags ?? []).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-950 dark:text-violet-300"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between pt-2 text-sm text-neutral-500">
        <span>상대: {persona}</span>
        <StarRating stars={clearInfo?.stars ?? 0} attempted={clearInfo?.attempted ?? false} />
      </div>
    </button>
  );
}
