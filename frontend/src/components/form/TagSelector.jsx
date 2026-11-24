import React from 'react';
import { Coffee, Drum, Landmark, Moon, Mountain, Sparkles, Utensils } from 'lucide-react';

const AVAILABLE_TAGS = [
  { id: 'food', label: 'Ẩm thực (Food)', Icon: Utensils },
  { id: 'beach', label: 'Bãi biển (Beach)', Icon: Sparkles },
  { id: 'culture', label: 'Văn hóa & Lịch sử', Icon: Landmark },
  { id: 'nature', label: 'Thiên nhiên (Nature)', Icon: Mountain },
  { id: 'adventure', label: 'Mạo hiểm & Vui chơi', Icon: Drum },
  { id: 'nightlife', label: 'Hoạt động về đêm', Icon: Moon },
  { id: 'cafe', label: 'Check-in & Cà phê', Icon: Coffee }
];

export const TagSelector = ({ selectedTags, onChange }) => {
  const toggleTag = (tagId) => {
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
      {selectedTags.length > 0 && (
        <button
          type="button"
          className="gz-clear-tags"
          onClick={() => onChange([])}
        >
          Bỏ chọn tất cả
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map(tag => {
          const isSelected = selectedTags.includes(tag.id);
          const Icon = tag.Icon;
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
              <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
