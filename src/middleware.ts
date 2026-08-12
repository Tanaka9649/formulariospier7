import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname, searchParams } = req.nextUrl;

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/events");
  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Captura o link de divulgação (?ref=) e guarda em cookie por evento (24h),
  // para atribuir a origem mesmo se a pessoa preencher o formulário depois de fechar a aba.
  if (pathname.startsWith("/e/")) {
    const slug = pathname.split("/")[2];
    const ref = searchParams.get("ref");
    if (slug && ref) {
      const res = NextResponse.next();
      res.cookies.set(`pier7_ref_${slug}`, ref, {
        maxAge: 60 * 60 * 24,
        path: "/",
        sameSite: "lax",
      });
      return res;
    }
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/events/:path*", "/e/:path*"],
};
