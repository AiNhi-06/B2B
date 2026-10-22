// Visual SVG fruit illustrations for agricultural B2B presentation
// Fully vector, offline, crisp and colorful

interface FruitImageProps {
  id?: string;
  name?: string;
  size?: number;
}

export function FruitImage({ id = '', name = '', size = 80 }: FruitImageProps) {
  const normalized = (id + ' ' + name).toLowerCase();

  if (normalized.includes('avocado') || normalized.includes('bơ')) {
    // Avocado 034 illustration
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="16" fill="#f0fdf4" />
        {/* Avocado skin */}
        <path
          d="M50 16C37 16 28 32 26 48C24 64 34 82 50 82C66 82 76 64 74 48C72 32 63 16 50 16Z"
          fill="#2d5a27"
        />
        {/* Avocado flesh */}
        <path
          d="M50 20C39 20 31 34 29 48C27 62 36 78 50 78C64 78 73 62 71 48C69 34 61 20 50 20Z"
          fill="#a3e635"
        />
        {/* Inner light flesh */}
        <ellipse cx="50" cy="54" rx="17" ry="20" fill="#fef08a" />
        {/* Seed */}
        <ellipse cx="50" cy="56" rx="11" ry="13" fill="#78350f" />
        <ellipse cx="48" cy="53" rx="4" ry="5" fill="#92400e" />
      </svg>
    );
  }

  if (normalized.includes('mango') || normalized.includes('xoài')) {
    // Mango Cat Hoa Loc illustration
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="16" fill="#fffbeb" />
        {/* Mango body */}
        <path
          d="M48 20C34 20 25 32 24 50C23 68 36 82 52 82C68 82 78 68 76 52C74 36 62 20 48 20Z"
          fill="#f59e0b"
        />
        {/* Mango blush gradient */}
        <path
          d="M48 22C38 22 30 32 28 48C26 64 36 76 50 76C56 76 66 70 70 58C66 38 56 22 48 22Z"
          fill="#fbbf24"
        />
        {/* Leaf */}
        <path
          d="M50 16C50 16 56 10 64 12C72 14 70 24 70 24C70 24 62 22 56 20L50 16Z"
          fill="#15803d"
        />
      </svg>
    );
  }

  if (normalized.includes('dragon') || normalized.includes('thanh long')) {
    // Dragonfruit illustration
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="16" fill="#fdf2f8" />
        {/* Dragonfruit body */}
        <ellipse cx="50" cy="54" rx="24" ry="28" fill="#e11d48" />
        {/* Scales */}
        <path d="M42 28C44 24 48 22 52 24C50 28 46 30 42 28Z" fill="#22c55e" />
        <path d="M28 46C24 44 22 40 24 36C28 38 30 42 28 46Z" fill="#22c55e" />
        <path d="M72 46C76 44 78 40 76 36C72 38 70 42 72 46Z" fill="#22c55e" />
        <path d="M32 68C28 68 26 64 28 60C32 62 34 66 32 68Z" fill="#22c55e" />
        <path d="M68 68C72 68 74 64 72 60C68 62 66 66 68 68Z" fill="#22c55e" />
        {/* Highlight inner cut preview */}
        <circle cx="50" cy="55" r="14" fill="#ffffff" />
        <circle cx="50" cy="55" r="12" fill="#be123c" opacity="0.8" />
        <circle cx="48" cy="53" r="1" fill="#000000" />
        <circle cx="52" cy="52" r="1" fill="#000000" />
        <circle cx="50" cy="57" r="1" fill="#000000" />
        <circle cx="46" cy="56" r="1" fill="#000000" />
        <circle cx="53" cy="57" r="1" fill="#000000" />
      </svg>
    );
  }

  // Generic fresh fruit crate / produce fallback
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#f1f5f9" />
      <circle cx="42" cy="46" r="16" fill="#ea580c" />
      <circle cx="58" cy="48" r="15" fill="#f59e0b" />
      <circle cx="50" cy="56" r="16" fill="#16a34a" />
      <path d="M50 36C50 32 54 30 56 32C55 35 53 36 50 36Z" fill="#15803d" />
    </svg>
  );
}
