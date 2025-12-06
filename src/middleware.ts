import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // const { pathname } = request.nextUrl;

  // if (isPublicPath(pathname)) {
  //   return NextResponse.next();
  // }

  // const session = request.cookies.get("vk_session")?.value;

  // if (!session) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/login";
  //   url.searchParams.set("redirect", pathname);
  //   return NextResponse.redirect(url);
  // }

  // if (pathname === "/login") {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/";
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth/vk/callback).*)"],
};
