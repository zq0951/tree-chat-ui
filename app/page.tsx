import TreeChat from '@/components/TreeChat';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main className="flex h-screen w-full flex-col bg-[#050505] text-white overflow-hidden">
      <Header />
      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative mt-24">
        <TreeChat />
      </div>
    </main>
  );
}

