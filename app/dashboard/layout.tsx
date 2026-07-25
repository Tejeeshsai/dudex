import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <div className="flex pt-[52px] min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-[240px] bg-[#f4f5f7] min-h-[calc(100vh-52px)]">
          {children}
        </main>
      </div>
    </>
  );
}
