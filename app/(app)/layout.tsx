import { Sidebar } from "@/components/sidebar";
import { logout } from "@/lib/actions/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <div className="flex justify-end border-b border-border px-8 py-3">
          <form action={logout}>
            <button
              type="submit"
              className="text-[12.5px] font-medium text-text-dim hover:text-text"
            >
              Çıkış Yap
            </button>
          </form>
        </div>
        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
