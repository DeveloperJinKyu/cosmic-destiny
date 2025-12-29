import React, { useState, useEffect } from 'react';
import { UserData } from '../types';
import Button from './Button';

interface FortuneInputProps {
  onSubmit: (data: Partial<UserData>) => void;
  onBack: () => void;
  initialData: UserData;
}

const FortuneInput: React.FC<FortuneInputProps> = ({ onSubmit, onBack, initialData }) => {
  const [name, setName] = useState(initialData.name);
  const [gender, setGender] = useState(initialData.gender);
  const [birthTime, setBirthTime] = useState(initialData.birthTime || '');

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  useEffect(() => {
    if (initialData.birthDate) {
      const [y, m, d] = initialData.birthDate.split('-');
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [initialData.birthDate]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  const isFormValid = name.trim().length > 0 && year && month && day;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      const birthDate = `${year}-${month}-${day}`;
      onSubmit({ name, gender, birthDate, birthTime });
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 md:py-4 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder-gray-500 text-base md:text-sm font-normal tracking-wide";
  const labelClass = "text-sm md:text-xs font-medium text-gray-400 tracking-wider uppercase mb-3 md:mb-2 block";

  return (
    <div className="w-full space-y-10 animate-fade-in px-2">
      <div className="text-center space-y-3">
        <h2 className="text-2xl md:text-xl font-bold tracking-widest text-white uppercase">사주풀이</h2>
        <p className="text-gray-200 text-sm md:text-xs font-normal tracking-wide leading-relaxed">운명 예언을 위해 당신의 정보를 입력해주세요</p>
      </div>

      <form className="space-y-8 px-6 overflow-hidden" onSubmit={handleSubmit}>
        
        {/* Name Input */}
        <div>
          <label className={labelClass}>이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className={inputClass}
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className={labelClass}>성별</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-3 md:py-3 rounded-lg border text-sm md:text-xs tracking-wider transition-all font-medium ${
                  gender === g
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-transparent border-white/10 text-gray-300 hover:border-white/30 hover:text-gray-100'
                }`}
              >
                {g === 'male' ? '남성' : '여성'}
              </button>
            ))}
          </div>
        </div>

        {/* Birth Date Picker */}
        <div>
          <label className={labelClass}>생년월일</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <select value={year} onChange={(e) => setYear(e.target.value)} className={inputClass}>
                <option value="" disabled>년</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass}>
                <option value="" disabled>월</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={day} onChange={(e) => setDay(e.target.value)} className={inputClass}>
                <option value="" disabled>일</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Birth Time */}
        <div className="w-full">
          <label className={labelClass}>출생 시간 (선택사항)</label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className={`${inputClass} [color-scheme:dark] w-full`}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 text-base md:text-sm uppercase tracking-widest">
            취소
          </Button>
          <Button type="submit" onClick={handleSubmit} className="flex-[2] text-base md:text-sm uppercase tracking-widest">
            진행하기
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FortuneInput;