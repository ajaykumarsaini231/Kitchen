export default function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="card-img-wrap skeleton-block" />
      <div className="card-body">
        <div className="skeleton-line skeleton-line-lg" />
        <div className="skeleton-line skeleton-line-sm" />
        <div className="skeleton-line skeleton-btn" />
      </div>
    </div>
  );
}
