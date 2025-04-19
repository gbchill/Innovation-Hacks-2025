import { ReactNode, MouseEventHandler } from 'react';

function Button({ children, onClick }: { children: ReactNode; onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      onClick={onClick}
      className="px-8 py-3 rounded-full bg-[#1B3B29] text-white font-medium shadow-md transition-all duration-300 
                 hover:bg-[#145A32] 
                 active:bg-[#0B3D1C] 
                 hover:shadow-lg 
                 active:shadow-inner"
    >
      {children}
    </button>
  );
}

export default Button;
