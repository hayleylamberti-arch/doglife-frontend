import Logo from "./Logo";

export default function Brand() {
  return (
    <div className="flex items-center gap-4 justify-center">
      <Logo className="h-14 w-auto" />

      <div className="text-left">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">
          DogLife
        </div>

        <div className="text-sm text-gray-500 italic">
          Because they're family
        </div>
      </div>
    </div>
  );
}