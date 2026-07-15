export default function StarRating({ stars, attempted, max = 3 }) {
  if (!attempted) {
    return <span className="text-xs text-neutral-400">미도전</span>;
  }
  return (
    <span aria-label={`${stars}/${max}성`} className="text-sm tracking-wide text-amber-500">
      {'★'.repeat(stars)}
      <span className="text-neutral-300 dark:text-neutral-700">{'★'.repeat(max - stars)}</span>
    </span>
  );
}
