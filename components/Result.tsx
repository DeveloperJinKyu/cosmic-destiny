import React, { useEffect, useState } from 'react';
import { UserData, FortuneResult } from '../types';
import Button from './Button';
import { Share2, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface ResultProps {
  userData: UserData;
  onRestart: () => void;
}

const Result: React.FC<ResultProps> = ({ userData, onRestart }) => {
  const [loading, setLoading] = useState(true);
  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleShareImage = async () => {
    if (!fortune) return;

    try {
      const shareData = {
        title: `${userData.name}님의 2026년 운명`,
        text: `${userData.name}님의 2026년 운세를 확인해보세요!\n\n💰 금전운: ${fortune.wealth.substring(0, 50)}...\n💕 애정운: ${fortune.love.substring(0, 50)}...\n🏥 건강운: ${fortune.health.substring(0, 50)}...\n\n✨ 핵심 조언: ${fortune.advice}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Web Share API를 지원하지 않는 경우 클립보드에 복사
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('공유 실패:', err);
        // Fallback: 클립보드에 복사
        try {
          const shareText = `${userData.name}님의 2026년 운명\n\n${window.location.href}`;
          await navigator.clipboard.writeText(shareText);
          alert('링크가 클립보드에 복사되었습니다.');
        } catch (clipboardErr) {
          alert('공유에 실패했습니다.');
        }
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        
        // 1. Generate Text Fortune (Force Korean)
        const textPrompt = `
          당신은 2026년의 운명을 꿰뚫어 보는 신비로운 예언가입니다.
          
          [사용자 정보]
          이름: ${userData.name}
          성별: ${userData.gender}
          생년월일: ${userData.birthDate}
          
          위 사용자의 2026년 운세를 예언하십시오.
          
          [필수 요구사항]
          - 언어: 반드시 한국어(Korean)로 출력할 것.
          - 톤앤매너: 웅장하고, 진지하며, 약간은 냉소적이지만 정확한 통찰력을 보여주는 문체 (반말 사용 금지, 격식체 사용).
          - 내용: 추상적인 말보다는 구체적인 조언을 포함할 것.
          
          [출력 항목]
          - wealth: 금전운 (3문장 이상, 구체적 예언)
          - love: 애정운 (3문장 이상, 관계의 변화 중심)
          - health: 건강운 (3문장 이상, 주의할 점 포함)
          - advice: 이 사용자를 위한 단 한 줄의 핵심적인 조언 (비유적 표현 사용)
        `;

        const fortunePromise = ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: textPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                wealth: { type: Type.STRING },
                love: { type: Type.STRING },
                health: { type: Type.STRING },
                advice: { type: Type.STRING },
              },
              required: ["wealth", "love", "health", "advice"]
            }
          }
        });

        // 2. Generate Character Image
        const imagePrompt = `
          고품질 3D 현대적이고 매끈한 캐릭터, 전신 샷.
          성별: ${userData.gender}.
          외모 세부사항:
          - 머리: ${userData.character.hairStyle}
          - 눈: ${userData.character.eyeStyle}
          - 옷: ${userData.character.outfitStyle}
          
          배경: 어두운 배경, 캐릭터가 잘 보이도록 해주세요.
          스타일: 3D,복셀 아트, 8비트 미학적이지만 고화질 렌더링, 마법 같은, 신비로운.
        `;

        const imagePromise = ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: imagePrompt,
        });

        const [fortuneResponse, imageResponse] = await Promise.all([fortunePromise, imagePromise]);

        if (!isMounted) return;

        if (fortuneResponse.text) {
          setFortune(JSON.parse(fortuneResponse.text));
        }

        let imageUrl = null;
        if (imageResponse.candidates?.[0]?.content?.parts) {
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        
        if (imageUrl) {
          setCharacterImage(imageUrl);
        } else {
           setCharacterImage(`https://picsum.photos/seed/${userData.name}/400/400`);
        }

        setLoading(false);

      } catch (err) {
        if (!isMounted) return;
        console.error("AI Generation Error:", err);
        setError("운명의 주파수를 맞추지 못했습니다. 잠시 후 다시 시도하십시오.");
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-pulse">
        <div className="w-24 h-24 rounded-full border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-purple-900/20 animate-ping"></div>
           <div className="w-16 h-16 bg-white rounded-full blur-[40px] opacity-20"></div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-[0.2em] text-white uppercase">Synchronizing...</h3>
          <p className="text-gray-500 text-xs font-light tracking-wide max-w-xs mx-auto leading-relaxed">
            "{userData.name}님의 사주풀이를 진행하고 있습니다.<br/>
            잠시만 기다려주십시오."
          </p>
        </div>
      </div>
    );
  }

  if (error || !fortune) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <p className="text-red-400 font-light text-sm tracking-wide">{error || "SYSTEM ERROR"}</p>
        <Button onClick={onRestart}>다시 시도하기</Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] tracking-[0.4em] text-purple-400 font-bold uppercase block">
          Report 2026
        </span>
        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
          Fate Analysis
        </h2>
      </div>

      {/* Character Display */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative w-full aspect-square max-w-xs mx-auto rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl">
          {characterImage && (
            <img 
              src={characterImage} 
              alt="Generated Character" 
              className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
            />
          )}
          <div className="absolute bottom-4 left-0 right-0 text-center">
             <div className="inline-block px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                <span className="text-[10px] font-mono text-purple-200 tracking-widest uppercase">
                  {userData.name}
                  {userData.gender === 'male' ? '군' : userData.gender === 'female' ? '양' : '님'}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Fortune Content */}
      <div className="space-y-6">
        <div className="grid gap-6">
          <FortuneSection label="금전운" content={fortune.wealth} />
          <FortuneSection label="애정운" content={fortune.love} />
          <FortuneSection label="건강운" content={fortune.health} />
        </div>
        
        {/* Grand Advice */}
        <div className="mt-10 pt-10 border-t border-white/10 text-center relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-4 text-purple-500">
             ✦
           </div>
           <p className="text-sm font-medium text-purple-200 tracking-widest mb-4 uppercase">Master Key</p>
           <p className="text-xl md:text-2xl font-light text-white leading-relaxed italic opacity-90">
             "{fortune.advice}"
           </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-8 border-t border-white/5">
        <Button variant="outline" fullWidth onClick={onRestart} className="text-xs uppercase tracking-widest">
          <RefreshCw size={14} className="mr-2 inline" /> Reset
        </Button>
        <Button 
          fullWidth 
          onClick={handleShareImage} 
          disabled={!fortune}
          className="text-xs uppercase tracking-widest bg-white text-black hover:bg-gray-200 border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 size={14} className="mr-2 inline" /> 공유하기
        </Button>
      </div>
    </div>
  );
};

const FortuneSection = ({ label, content }: { label: string, content: string }) => (
  <div className="relative pl-6 border-l border-purple-900/50">
    <h3 className="text-sm font-bold text-purple-500 tracking-[0.2em] mb-2 uppercase">{label}</h3>
    <p className="text-sm text-gray-300 font-light leading-7 tracking-wide whitespace-pre-line text-justify">
      {content}
    </p>
  </div>
);

export default Result;