import React from 'react';

import foodIcon from '../../assets/food-icon.svg';
import beachIcon from '../../assets/beach-icon.svg';
import cultureIcon from '../../assets/culture-icon.svg';
import natureIcon from '../../assets/nature-icon.svg';
import exploreIcon from '../../assets/explore-icon.svg';
import nightlifeIcon from '../../assets/night-icon.svg';
import cafeIcon from '../../assets/cafe-icon.svg';

const AVAILABLE_TAGS = [
  { id: 'food', label: 'Ẩm thực (Food)', iconSrc: foodIcon },
  { id: 'beach', label: 'Bãi biển (Beach)', iconSrc: beachIcon },
  { id: 'culture', label: 'Văn hóa & Lịch sử', iconSrc: cultureIcon },
  { id: 'nature', label: 'Thiên nhiên (Nature)', iconSrc: natureIcon },
  { id: 'adventure', label: 'Mạo hiểm & Vui chơi', iconSrc: exploreIcon },
  { id: 'nightlife', label: 'Hoạt động về đêm', iconSrc: nightlifeIcon },
  { id: 'cafe', label: 'Check-in & Cà phê', iconSrc: cafeIcon }
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
              <span
								className="w-4 h-4 inline-block bg-current shrink-0"
								style={{
									WebkitMaskImage: `url(${tag.iconSrc})`,
									maskImage: `url(${tag.iconSrc})`,
									WebkitMaskRepeat: 'no-repeat',
									maskRepeat: 'no-repeat',
									WebkitMaskSize: 'contain',
									maskSize: 'contain',
									WebkitMaskPosition: 'center',
									maskPosition: 'center',
								}}
							/>
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
