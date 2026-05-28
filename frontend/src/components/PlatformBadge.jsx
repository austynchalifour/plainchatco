const PLATFORMS = {
  twitter: { label: 'X / Twitter', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
  facebook: { label: 'Facebook', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  linkedin: { label: 'LinkedIn', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-700' },
  tiktok: { label: 'TikTok', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-800' },
  youtube: { label: 'YouTube', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export default function PlatformBadge({ platform, showLabel = true }) {
  const info = PLATFORMS[platform] || { label: platform, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
      {showLabel && info.label}
    </span>
  );
}

export { PLATFORMS };
