import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

async function loginAction(formData: FormData) {
  "use server";

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw err;
  }

  redirect(callbackUrl);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-lg font-semibold mb-1">Pier7</h1>
        <p className="text-sm text-slate-500 mb-6">Acesso administrativo</p>

        {searchParams.error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md mb-4">
            E-mail ou senha inválidos.
          </div>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={searchParams.callbackUrl ?? "/dashboard"} />
          <Input label="E-mail" name="email" type="email" required />
          <Input label="Senha" name="password" type="password" required />
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
