import React from 'react';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

const AVAILABLE_TAGS = [
  { id: 'food', label: 'Ẩm thực (Food)', icon: '🍜' },
  { id: 'beach', label: 'Bãi biển (Beach)', icon: '🏖️' },
  { id: 'culture', label: 'Văn hóa & Lịch sử', icon: '🏛️' },
  { id: 'nature', label: 'Thiên nhiên (Nature)', icon: '🌲' },
  { id: 'adventure', label: 'Mạo hiểm & Vui chơi', icon: '🎢' },
  { id: 'nightlife', label: 'Hoạt động về đêm', icon: '🌃' },
  { id: 'cafe', label: 'Check-in & Cà phê', icon: '☕' }
];

export const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onChange }) => {
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(t => t !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        Sở thích trải nghiệm
      </label>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map(tag => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
