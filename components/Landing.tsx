import React from 'react';
import Button from './Button';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center text-center space-y-12 relative w-full">
      
      {/* 3D Visual - Borderless and blended */}
      <div className="w-full h-[450px] relative overflow-hidden -mt-10 mb-[-20px]">
        {/* Top Fade Gradient for blending */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
        
        <div className="absolute inset-0 z-0 opacity-90 scale-105">
           <iframe 
            src='https://my.spline.design/rememberallrobot-m9Z1gbw106XZfjPIAt5xWS78/' 
            frameBorder='0' 
            width='100%' 
            height='100%'
            className="w-full h-full"
            title="Spline 3D Robot"
            style={{ border: 'none' }}
          ></iframe>
        </div>
        
        {/* Bottom Fade Gradient for seamless blend */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none" />
      </div>

      <div className="space-y-6 z-20 relative">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] font-medium text-purple-400 uppercase">
            Project 2026<br/>
            copyright by jin.kyu_kim
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            2026년 운세<br />
            사주풀이
          </h1>
        </div>
      </div>

      <div className="w-full z-20 px-6">
        <Button onClick={onStart} fullWidth className="group tracking-widest text-sm font-semibold uppercase bg-white text-black hover:bg-gray-200 border-none">
          시작하기
        </Button>
      </div>
    </div>
  );
};

export default Landing;