import { GameProvider } from "@/lib/game/provider";
import { NavigationBar } from "@/components/NavigationBar";
import { GenerationForm } from "@/components/GenerationForm";
import { RoomView } from "@/components/RoomView";
import { ActionsBar } from "@/components/ActionsBar";
import { MinigameOverlay } from "@/components/MinigameOverlay";

export default function Home() {
  return (
    <GameProvider>
      <div className="min-h-screen">
        <RoomView />
        <NavigationBar />
        <ActionsBar />
        <GenerationForm />
        <MinigameOverlay />
        <h1 className="fixed top-2 left-4 z-20 text-white/90 text-xl font-semibold drop-shadow">Virtual Pet</h1>
      </div>
    </GameProvider>
  );
}
