// import { NextRequest, NextResponse } from 'next/server';

// const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:4001';

// /**
//  * POST /api/auth/logout
//  * Forwards the JWT cookie to the auth service to invalidate it server-side,
//  * then clears the cookie on the browser by overwriting it with maxAge=0.
//  */
// export async function POST(request: NextRequest) {
//   try {
//     await fetch(`${USER_SERVICE_URL}/auth/logout`, {
//       method: 'POST',
//       headers: {
//         Cookie: request.headers.get('cookie') ?? '',
//         Authorization: request.headers.get('Authorization') ?? '',
//       },
//     });
//   } catch {
//     // Even if the auth service is unreachable, we still clear the cookie locally
//   }

//   const response = NextResponse.json({ success: true }, { status: 200 });

//   // Overwrite the JWT cookie with an expired one to remove it from the browser
//   response.cookies.set('token', '', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'lax',
//     maxAge: 0,
//     path: '/',
//   });

//   return response;
// }