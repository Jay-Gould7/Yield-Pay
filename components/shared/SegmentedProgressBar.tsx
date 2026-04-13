const SEGMENTS = Array.from({ length: 100 }, (_, index) => index);

type SegmentedProgressBarProps = {
  className?: string;
  value: number;
};

export function SegmentedProgressBar({
  className = "",
  value,
}: SegmentedProgressBarProps) {
  const filledSegments = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={`pixel-progress-track ${className}`.trim()}
      role="progressbar"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={filledSegments}
    >
      {SEGMENTS.map((segment) => {
        const isFilled = segment < filledSegments;
        const isHead = isFilled && segment === filledSegments - 1;

        return (
          <span
            key={segment}
            className={`pixel-progress-segment ${
              isFilled ? "is-filled" : "is-empty"
            } ${isHead ? "is-head" : ""}`.trim()}
          />
        );
      })}
    </div>
  );
}
