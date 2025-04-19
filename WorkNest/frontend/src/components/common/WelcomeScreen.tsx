import Button from "./Button";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="relative h-screen flex flex-col items-center justify-center bg-[#F7F5EF] px-6 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-[#1B3B29]/30 via-transparent to-[#1B3B29]/30"></div>
      </div>

      <div className="z-10 max-w-xl text-center">
        <h1 className="text-5xl font-bold text-[#1B3B29] mb-6 leading-tight">
          Welcome to WorkNest 🧘‍♂️
        </h1>
        <p className="text-lg text-[#4F4F4F] mb-10">
          Find your flow. Organize your mind.  
          Enter your calm productivity zone.
        </p>
        <Button onClick={onGetStarted}>Get Started</Button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
