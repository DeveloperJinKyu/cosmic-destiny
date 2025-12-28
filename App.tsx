import React, { useState } from 'react';
import { AppStep, UserData } from './types';
import Layout from './components/Layout';
import Landing from './components/Landing';
import FortuneInput from './components/FortuneInput';
import CharacterInput from './components/CharacterInput';
import Result from './components/Result';

const INITIAL_USER_DATA: UserData = {
  name: '',
  gender: 'male',
  birthDate: '',
  character: {
    hairStyle: '',
    eyeStyle: '',
    outfitStyle: ''
  }
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const restart = () => {
    setUserData(INITIAL_USER_DATA);
    setStep(AppStep.LANDING);
  };

  return (
    <Layout>
      {step === AppStep.LANDING && (
        <Landing onStart={nextStep} />
      )}
      
      {step === AppStep.FORTUNE_INPUT && (
        <FortuneInput 
          onSubmit={(data) => {
            updateUserData(data);
            nextStep();
          }} 
          initialData={userData} 
        />
      )}

      {step === AppStep.CHARACTER_INPUT && (
        <CharacterInput 
          onSubmit={(data) => {
            updateUserData(data);
            nextStep();
          }}
          onBack={prevStep}
          initialData={userData}
        />
      )}

      {step === AppStep.RESULT && (
        <Result 
          userData={userData} 
          onRestart={restart} 
        />
      )}
    </Layout>
  );
};

export default App;