import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div>
      {session?.user && (
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="font-semibold text-slate-900">
              Pier7
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="text-sm text-slate-500 hover:text-slate-800">
                Sair ({session.user.email})
              </button>
            </form>
          </div>
        </header>
      )}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
