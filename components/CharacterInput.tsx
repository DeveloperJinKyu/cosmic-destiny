import React, { useState, useRef } from 'react';
import { UserData } from '../types';
import Button from './Button';
import { FACE_OPTIONS, OUTFIT_OPTIONS } from '../constants';

interface CharacterInputProps {
  onSubmit: (data: Partial<UserData>) => void;
  onBack: () => void;
  initialData: UserData;
}

const CharacterInput: React.FC<CharacterInputProps> = ({ onSubmit, onBack, initialData }) => {
  const [face, setFace] = useState(initialData.character.eyeStyle || FACE_OPTIONS[0].id);
  const [outfit, setOutfit] = useState(initialData.character.outfitStyle || OUTFIT_OPTIONS[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    onSubmit({
      character: {
        hairStyle: '',
        eyeStyle: face,
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
        <h3 className="text-sm md:text-xs font-medium text-gray-300 tracking-wider uppercase border-l-2 border-purple-900 pl-2">
          {title}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt: any) => (
            <button
              type="button"
              key={opt.id}
              onClick={(e) => handleClick(e, opt.id)}
              className={`p-3 md:p-3 rounded-md border text-center transition-all duration-300 ${
                selected === opt.id
                  ? 'bg-purple-900/40 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-transparent border-white/5 hover:bg-white/5 text-gray-300 hover:text-gray-100'
              }`}
            >
              <span className="text-sm md:text-xs font-normal tracking-wide">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 animate-fade-in pb-8 px-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl md:text-xl font-bold tracking-widest text-white uppercase">수호신 선택</h2>
        <p className="text-gray-200 text-sm md:text-xs font-normal tracking-wide leading-relaxed">나와 닮은 수호신을 만들어보세요!</p>
      </div>

      <div ref={scrollContainerRef} className="space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide pr-1">
        <Section 
          title="얼굴상" 
          options={FACE_OPTIONS} 
          selected={face} 
          onSelect={setFace} 
        />
        <Section 
          title="옷 스타일" 
          options={OUTFIT_OPTIONS} 
          selected={outfit} 
          onSelect={setOutfit} 
        />
      </div>

      <div className="flex gap-6 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1 text-base md:text-xs uppercase tracking-widest">
          이전으로
        </Button>
        <Button onClick={handleSubmit} className="flex-[2] text-base md:text-xs uppercase tracking-widest">
          완료하기
        </Button>
      </div>
    </div>
  );
};

export default CharacterInput;