interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function ChipStack({
  amount,
  size = 'md',
  showLabel = true,
  className = ''
}: ChipStackProps) {
  const formatAmount = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const getChipColors = (value: number): string[] => {
    const colors = [];
    
    // 根据金额分配不同颜色的筹码
    if (value >= 10000) colors.push('bg-purple-600'); // 紫色 - 10000
    if (value >= 5000) colors.push('bg-orange-600');  // 橙色 - 5000
    if (value >= 1000) colors.push('bg-yellow-500');  // 黄色 - 1000
    if (value >= 500) colors.push('bg-blue-600');     // 蓝色 - 500
    if (value >= 100) colors.push('bg-green-600');    // 绿色 - 100
    if (value >= 25) colors.push('bg-red-600');        // 红色 - 25
    if (value >= 5) colors.push('bg-gray-800');        // 黑色 - 5
    colors.push('bg-white');                           // 白色 - 1
    
    return colors.slice(0, 5); // 最多显示5个筹码
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const chips = getChipColors(amount);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {chips.map((color, index) => (
          <div
            key={index}
            className={`${sizeClasses[size]} ${color} rounded-full border-2 border-white absolute shadow-md`}
            style={{
              bottom: `${index * 4}px`,
              zIndex: chips.length - index
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-dashed border-white/50" />
          </div>
        ))}
        <div
          className={`${sizeClasses[size]} invisible`}
          style={{ marginBottom: `${(chips.length - 1) * 4}px` }}
        />
      </div>
      {showLabel && (
        <div className="mt-2 text-sm font-bold text-gray-700">
          ${formatAmount(amount)}
        </div>
      )}
    </div>
  );
}