import React, { useEffect, useState, useRef } from 'react';
import { UserData, FortuneResult } from '../types';
import Button from './Button';
import { Share2, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { FACE_OPTIONS, OUTFIT_OPTIONS } from '../constants';
import html2canvas from 'html2canvas';

interface ResultProps {
  userData: UserData;
  onRestart: () => void;
}

const Result: React.FC<ResultProps> = ({ userData, onRestart }) => {
  const [loading, setLoading] = useState(true);
  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleShareImage = async () => {
    if (!fortune || !resultRef.current) return;

    setCapturing(true);
    try {
      // 화면 전체 캡처
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#000000',
        scale: 2, // 고해상도
        useCORS: true,
        logging: false,
        width: resultRef.current.scrollWidth,
        height: resultRef.current.scrollHeight,
      });

      // Canvas를 Blob으로 변환
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setCapturing(false);
          alert('이미지 생성에 실패했습니다.');
          return;
        }

        const fileName = `${userData.name}_2026년_운세.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // Web Share API로 공유 시도
        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `${userData.name}님의 2026년 운세`,
              text: `${userData.name}님의 2026년 운세를 확인해보세요!`,
              files: [file],
            });
          } catch (shareErr) {
            if ((shareErr as Error).name !== 'AbortError') {
              // 공유 실패 시 다운로드로 대체
              downloadImage(canvas, fileName);
            }
          }
        } else {
          // Web Share API를 지원하지 않거나 파일 공유를 지원하지 않는 경우 다운로드
          downloadImage(canvas, fileName);
        }
        setCapturing(false);
      }, 'image/png', 0.95);
    } catch (err) {
      console.error('스크린샷 캡처 실패:', err);
      alert('이미지 저장에 실패했습니다.');
      setCapturing(false);
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement, fileName: string) => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 0.95);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          - 금전운: 금전운 (3문장 이상, 구체적 예언)
          - 애정운: 애정운 (3문장 이상, 관계의 변화 중심)
          - 건강운: 건강운 (3문장 이상, 주의할 점 포함)
          - 조언: 이 사용자를 위한 단 한 줄의 핵심적인 조언 (비유적 표현 사용)
        `;

        // 1. Generate Text Fortune first
        const fortuneResponse = await ai.models.generateContent({
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

        if (!isMounted) return;

        let parsedFortune = null;
        if (fortuneResponse.text) {
          parsedFortune = JSON.parse(fortuneResponse.text);
          setFortune(parsedFortune);
        }

        // 2. Analyze fortune to determine background
        const determineBackground = (fortune: FortuneResult | null): string => {
          if (!fortune) return '어두운 우주 배경, 성운과 별들';
          
          // 긍정적인 키워드로 운세 강도 판단
          const positiveKeywords = {
            love: ['사랑', '연인', '관계', '로맨스', '결혼', '만남', '인연', '애정', '행복', '기쁨', '만족', '성공', '좋은', '긍정', '발전', '향상'],
            wealth: ['돈', '재물', '재산', '수입', '이익', '부', '금전', '재정', '경제', '성공', '번영', '풍요', '풍부', '증가', '상승', '좋은'],
            health: ['건강', '활력', '체력', '운동', '단련', '기운', '원기', '튼튼', '강건', '좋은', '향상', '회복', '개선', '발전']
          };

          const countKeywords = (text: string, keywords: string[]): number => {
            return keywords.reduce((count, keyword) => {
              return count + (text.includes(keyword) ? 1 : 0);
            }, 0);
          };

          const loveScore = countKeywords(fortune.love, positiveKeywords.love);
          const wealthScore = countKeywords(fortune.wealth, positiveKeywords.wealth);
          const healthScore = countKeywords(fortune.health, positiveKeywords.health);

          if (loveScore >= wealthScore && loveScore >= healthScore) {
            return '핑크핑크한 하트가 가득한 로맨틱한 배경, 사랑의 분위기';
          } else if (wealthScore >= healthScore) {
            return '금색 돈과 금화가 가득한 부유한 배경, 번영의 상징';
          } else {
            return '헬스장 배경, 운동 기구와 활력 넘치는 공간';
          }
        };

        // 3. Get face and outfit labels from constants
        const getFaceLabel = (faceId: string): string => {
          const faceOption = FACE_OPTIONS.find(opt => opt.id === faceId);
          return faceOption ? faceOption.label : faceId;
        };

        const getOutfitLabel = (outfitId: string): string => {
          const outfitOption = OUTFIT_OPTIONS.find(opt => opt.id === outfitId);
          return outfitOption ? outfitOption.label : outfitId;
        };

        // 얼굴형 특징 설명
        const getFaceDescription = (faceId: string): string => {
          const faceDescriptions: { [key: string]: string } = {
            'puppy_face': '강아지 얼굴, 큰 눈, 귀여운 표정',
            'cat_face': '고양이 얼굴, 날카로운 눈, 우아한 표정',
            'dinosaur_face': '공룡 얼굴, 튼튼한 턱선',
            'bear_face': '곰 얼굴, 부드러운 인상',
            'fox_face': '여우 얼굴, 영리한 눈매',
            'rabbit_face': '토끼 얼굴, 큰 귀, 순수한 표정',
            'horse_face': '말 얼굴, 길고 우아한 얼굴 윤곽, 세련된 인상',
            'hamster_face': '햄스터 얼굴, 작고 귀여운 얼굴'
          };
          return faceDescriptions[faceId] || getFaceLabel(faceId);
        };

        // 옷 스타일 상세 설명
        const getOutfitDescription = (outfitId: string): string => {
          const outfitDescriptions: { [key: string]: string } = {
            'modern_chic': '현대적이고 세련된 스타일, 미니멀한 디자인, 깔끔한 실루엣',
            'street_hip': '스트릿 힙합 스타일, 캐주얼하고 트렌디한 의상',
            'casual_daily': '일상적인 캐주얼 스타일, 편안하고 실용적인 의상',
            'formal_suit': '정장 수트 스타일, 우아하고 격식 있는 의상',
            'vintage_retro': '빈티지 레트로 스타일, 복고풍의 의상',
            'sporty_look': '스포티 룩, 활동적이고 편안한 운동복 스타일',
            'romantic_look': '로맨틱 룩, 우아하고 여성스러운 의상',
            'minimal_look': '미니멀 룩, 심플하고 절제된 디자인'
          };
          return outfitDescriptions[outfitId] || getOutfitLabel(outfitId);
        };

        const background = determineBackground(parsedFortune);
        const faceLabel = getFaceLabel(userData.character.eyeStyle);
        const faceDescription = getFaceDescription(userData.character.eyeStyle);
        const outfitLabel = getOutfitLabel(userData.character.outfitStyle);
        const outfitDescription = getOutfitDescription(userData.character.outfitStyle);

        // 4. Generate Character Image with fortune-based background
        const imagePrompt = `
          날개가 달린 수호천사 캐릭터를 만들어 주세요.
          
          [필수 사항 - 반드시 정확히 반영해야 합니다]
          성별: ${userData.gender === 'male' ? '남성' : '여성'}.
          
          얼굴형: ${faceLabel} (${faceDescription}). 
          반드시 ${faceLabel}의 특징을 정확히 반영해야 합니다. 다른 동물의 얼굴이 아닌 ${faceLabel}의 얼굴형이어야 합니다.
          
          옷 스타일: ${outfitLabel} (${outfitDescription}).
          반드시 ${outfitLabel} 스타일의 의상을 입고 있어야 합니다.
          
          배경: ${background}.
          
          [스타일 요구사항]
          마인크래프트 스타일의 귀여운 수호천사 캐릭터.
          캐릭터는 큐브와 블록으로 이루어진 복셀(voxel) 형태.
          큰 정사각형 머리와 작은 블록형 몸을 가진 귀엽고 친근한 이미지.
          
          [표정 및 분위기]
          부드럽고 따뜻한 미소.
          보호자이자 수호신 같은 편안하고 긍정적인 느낌.
          
          [렌더링]
          3D 게임 렌더링 스타일.
          부드러운 빛과 깔끔한 마감.
          단순하면서 아이코닉한 마스코트 디자인.
          
          [중요] 얼굴형은 반드시 ${faceLabel}이어야 하며, 옷은 반드시 ${outfitLabel} 스타일이어야 합니다.
        `;

        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: imagePrompt,
        });

        if (!isMounted) return;

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
      <div className="relative flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-pulse">
        {/* 사이버볼 컨테이너 */}
        <div className="relative w-48 h-48 md:w-56 md:h-56">
          {/* 외부 글로우 링 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 opacity-30 blur-xl animate-pulse"></div>
          
          {/* 회전하는 링들 */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
          </div>
          <div className="absolute inset-2 rounded-full border border-pink-500/30 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
          </div>
          
          {/* 메인 사이버볼 */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 backdrop-blur-sm border border-purple-400/30 shadow-[inset_0_0_50px_rgba(168,85,247,0.3),0_0_60px_rgba(168,85,247,0.4)] relative overflow-hidden">
            {/* 내부 빛나는 코어 */}
            <div 
              className="absolute inset-8 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(236,72,153,0.3) 50%, transparent 100%)'
              }}
            ></div>
            
            {/* 회전하는 파티클들 */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-300 rounded-full shadow-[0_0_6px_rgba(168,85,247,0.8)]"
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: '0 60px',
                    transform: `rotate(${i * 45}deg) translateY(-60px)`,
                    animation: `float ${2 + i * 0.2}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
            
            {/* 중앙 빛나는 점 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9),0_0_40px_rgba(168,85,247,0.6)] animate-pulse"></div>
            
            {/* 홀로그램 효과 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/10 to-transparent animate-pulse" style={{ animationDuration: '2s' }}></div>
          </div>
          
          {/* 하단 반사광 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-t from-purple-500/20 to-transparent blur-2xl rounded-full"></div>
        </div>
        
        {/* 텍스트 영역 */}
        <div className="space-y-4 relative z-10">
          <h3 className="text-2xl md:text-xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 uppercase animate-pulse">
            Synchronizing...
          </h3>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-gray-300 text-sm md:text-xs font-light tracking-wide max-w-xs mx-auto leading-relaxed">
            <span className="text-purple-300 font-medium">{userData.name}</span>님의 운명을 읽는 중...<br/>
            <span className="text-gray-500 text-[10px]">잠시만 기다려주십시오</span>
          </p>
        </div>
        
        {/* 배경 파티클 효과 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
        
        <style>{`
          @keyframes float {
            0%, 100% { transform: rotate(var(--rotation, 0deg)) translateY(-60px) scale(1); opacity: 0.6; }
            50% { transform: rotate(var(--rotation, 0deg)) translateY(-70px) scale(1.2); opacity: 1; }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
        `}</style>
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
    <div ref={resultRef} className="w-full space-y-8 md:space-y-12 animate-fade-in pb-8 md:pb-12 px-4 md:px-0">
      
      {/* Header */}
      <div className="text-center space-y-3 md:space-y-2">
        <span className="text-xs md:text-[10px] tracking-[0.3em] md:tracking-[0.4em] text-purple-400 font-bold uppercase block">
          2026년 운세 리포트
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide md:tracking-widest uppercase">
          운명 분석 결과
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
          <div className="absolute bottom-3 md:bottom-4 left-0 right-0 text-center px-2">
             <div className="inline-block px-3 md:px-4 py-1.5 md:py-1 bg-black/70 backdrop-blur-md border border-white/20 rounded-full">
                <span className="text-xs md:text-[10px] font-medium md:font-mono text-purple-200 md:text-purple-200 tracking-wide md:tracking-widest uppercase">
                  {userData.name}
                  {userData.gender === 'male' ? '군' : userData.gender === 'female' ? '양' : '님'}의 수호천사
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Fortune Content */}
      <div className="space-y-6 md:space-y-6">
        <div className="grid gap-6 md:gap-6">
          <FortuneSection label="금전운" content={fortune.wealth} />
          <FortuneSection label="애정운" content={fortune.love} />
          <FortuneSection label="건강운" content={fortune.health} />
        </div>
        
        {/* Grand Advice */}
        <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-white/10 text-center relative px-4">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-4 text-purple-500 text-lg md:text-base">
             ✦
           </div>
           <p className="text-base md:text-sm font-medium text-purple-200 tracking-wide md:tracking-widest mb-4 md:mb-4 uppercase">Master Key</p>
           <p className="text-lg md:text-xl lg:text-2xl font-normal md:font-light text-white leading-relaxed md:leading-relaxed italic opacity-100 md:opacity-90 px-2">
             "{fortune.advice}"
           </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 md:gap-3 pt-6 md:pt-8 border-t border-white/5">
        <Button variant="outline" fullWidth onClick={onRestart} className="text-sm md:text-xs uppercase tracking-wide md:tracking-widest py-3 md:py-2">
          <RefreshCw size={16} className="md:size-[14px] mr-2 inline" /> Reset
        </Button>
        <Button 
          fullWidth 
          onClick={handleShareImage} 
          disabled={!fortune || capturing}
          className="text-sm md:text-xs uppercase tracking-wide md:tracking-widest bg-white text-black hover:bg-gray-200 border-none disabled:opacity-50 disabled:cursor-not-allowed py-3 md:py-2"
        >
          <Share2 size={16} className="md:size-[14px] mr-2 inline" /> {capturing ? '저장 중...' : '이미지 저장하기'}
        </Button>
      </div>
    </div>
  );
};

const FortuneSection = ({ label, content }: { label: string, content: string }) => (
  <div className="relative pl-5 md:pl-6 border-l-2 md:border-l border-purple-500/50 md:border-purple-900/50">
    <h3 className="text-base md:text-sm font-bold text-purple-400 md:text-purple-500 tracking-wide md:tracking-[0.2em] mb-3 md:mb-2 uppercase">{label}</h3>
    <p className="text-base md:text-sm text-gray-100 md:text-gray-300 font-normal md:font-light leading-8 md:leading-7 tracking-normal md:tracking-wide whitespace-pre-line text-left md:text-justify">
      {content}
    </p>
  </div>
);

export default Result;