import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-purple-900 selection:text-white">
      {/* Main Content Container */}
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in-up">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;