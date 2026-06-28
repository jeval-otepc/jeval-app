import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { NextAuthOptions } from 'next-auth';

const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 24, // expire 24 h ( seconds )
        updateAge: 5 * 60 * 60, // update always frequency 1 hr
    },
    jwt: {
        maxAge: 2 * 60 * 60 * 24, // jwt expire in 2* 24 h
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            if (account && user) {
                // First time signing in
                try {
                    // Call Strapi to authenticate/register user with Google
                    const strapiResponse = await fetch(
                        `${
                            process.env.NEXT_PUBLIC_BACKEND_SERVICES_PROD_URL ||
                            process.env.NEXT_PUBLIC_STRAPI_URL ||
                            process.env.NEXT_PUBLIC_BACKEND_SERVICES_URL ||
                            'http://jeval-strapi-app:1337'
                        }/api/auth/google/callback`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':
                                    'application/json; charset=utf-8',
                            },
                            body: JSON.stringify({
                                access_token: account.access_token,
                                id_token: account.id_token,
                            }),
                        },
                    );

                    if (strapiResponse.ok) {
                        const strapiData = await strapiResponse.json();
                        token.strapiJwt = strapiData.jwt;
                        token.strapiUser = strapiData.user;
                    }
                } catch (error) {
                    console.error('Error authenticating with Strapi:', error);
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Send properties to the client
            session.strapiJwt = token.strapiJwt as string;
            session.strapiUser = token.strapiUser as any;
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
