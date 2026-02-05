interface TokenProgressProps {
  current: number;
  limit: number;
  resetCountdown: number;
}

export default function TokenProgress({ current, limit, resetCountdown }: TokenProgressProps) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;

  const barColor =
    percentage >= 100
      ? "bg-red-500"
      : percentage > 80
        ? "bg-orange-500"
        : percentage > 50
          ? "bg-yellow-500"
          : "bg-green-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span>Token Usage {resetCountdown > 0 && `(resets in ${resetCountdown}s)`}</span>
        <span>
          {current} / {limit} ({percentage.toFixed(2)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
