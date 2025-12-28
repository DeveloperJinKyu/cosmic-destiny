import React, { useState, useRef } from 'react';
import { UserData } from '../types';
import Button from './Button';
import { HAIR_OPTIONS, EYE_OPTIONS, OUTFIT_OPTIONS } from '../constants';

interface CharacterInputProps {
  onSubmit: (data: Partial<UserData>) => void;
  onBack: () => void;
  initialData: UserData;
}

const CharacterInput: React.FC<CharacterInputProps> = ({ onSubmit, onBack, initialData }) => {
  const [hair, setHair] = useState(initialData.character.hairStyle || HAIR_OPTIONS[0].id);
  const [eyes, setEyes] = useState(initialData.character.eyeStyle || EYE_OPTIONS[0].id);
  const [outfit, setOutfit] = useState(initialData.character.outfitStyle || OUTFIT_OPTIONS[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    onSubmit({
      character: {
        hairStyle: hair,
        eyeStyle: eyes,
        outfitStyle: outfit
      }
    });
  };

  const Section = ({ title, options, selected, onSelect }: any) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>, optId: string) => {
      e.preventDefault();
      const scrollContainer = scrollContainerRef.current;
      const scrollTop = scrollContainer?.scrollTop ?? 0;
      
      onSelect(optId);
      
      // 상태 업데이트 후 스크롤 위치 복원
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
        }
      });
    };

    return (
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-400 tracking-wider uppercase border-l-2 border-purple-900 pl-2">
          {title}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt: any) => (
            <button
              type="button"
              key={opt.id}
              onClick={(e) => handleClick(e, opt.id)}
              className={`p-3 rounded-md border text-center transition-all duration-300 ${
                selected === opt.id
                  ? 'bg-purple-900/40 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-transparent border-white/5 hover:bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xs font-light tracking-wide">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 animate-fade-in pb-8 px-2">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-widest text-white uppercase">Visual Interface</h2>
        <p className="text-gray-300 text-xs font-light tracking-wide">당신의 운명을 표현하는 캐릭터를 선택하세요</p>
      </div>

      <div ref={scrollContainerRef} className="space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide pr-1">
        <Section 
          title="Hair" 
          options={HAIR_OPTIONS} 
          selected={hair} 
          onSelect={setHair} 
        />
        <Section 
          title="Eye" 
          options={EYE_OPTIONS} 
          selected={eyes} 
          onSelect={setEyes} 
        />
        <Section 
          title="Outfit" 
          options={OUTFIT_OPTIONS} 
          selected={outfit} 
          onSelect={setOutfit} 
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onBack} className="flex-1 text-xs uppercase tracking-widest">
          이전으로
        </Button>
        <Button onClick={handleSubmit} className="flex-[2] text-xs uppercase tracking-widest">
          완료하기
        </Button>
      </div>
    </div>
  );
};

export default CharacterInput;