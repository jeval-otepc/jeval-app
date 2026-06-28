import { NextResponse } from 'next/server';


const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL!;


export async function POST(req: Request) {
const { identifier, password } = await req.json();
const res = await fetch(`${STRAPI_BASE_URL}/api/auth/local`, {
method: 'POST',
headers: { 'Content-Type': 'application/json; charset=utf-8' },
body: JSON.stringify({ identifier, password })
});
const data = await res.json();
if (!res.ok) return NextResponse.json(data, { status: res.status });


const resp = NextResponse.json({ ok: true });
resp.cookies.set('jwt', data.jwt, {
httpOnly: true,
sameSite: 'lax',
secure: true,
path: '/',
maxAge: 60 * 60 * 8, // 8 ชม.
});
return resp;
}