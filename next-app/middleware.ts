import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RefreshResponse {
  jwt?: string;
  user?: any;
  refreshed?: boolean;
  message?: string;
  refreshNeeded?: boolean;
  timeUntilExpiry?: number;
}

async function validateJWT(token: string): Promise<{ isValid: boolean; needsRefresh: boolean; expiry?: number }> {
  try {
    // Check JWT structure first
    if (!token || token.split('.').length !== 3) {
      console.log('🚫 Middleware: Invalid JWT structure');
      return { isValid: false, needsRefresh: false };
    }

    // Decode JWT to check expiry
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    const exp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Token expired
    if (now > exp) {
      console.log('🚫 Middleware: Token expired');
      return { isValid: false, needsRefresh: false };
    }
    
    // Token needs refresh (less than 2 hours remaining)
    const twoHours = 2 * 60 * 60 * 1000;
    const needsRefresh = (exp - now) < twoHours;
    
    if (needsRefresh) {
      console.log('⚠️ Middleware: Token needs refresh');
    } else {
      console.log('✅ Middleware: Token valid');
    }
    
    return { isValid: true, needsRefresh, expiry: exp };
  } catch (error) {
    console.log('🚫 Middleware: JWT validation failed:', error);
    return { isValid: false, needsRefresh: false };
  }
}

async function attemptTokenRefresh(token: string): Promise<string | null> {
  try {
    console.log('🔄 Middleware: Attempting token refresh');
    
    // Use dynamic import to avoid issues in edge runtime
    const { config } = await import('./lib/config');
    const response = await fetch(`${config.getBackendServicesUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data: RefreshResponse = await response.json();
      
      if (data.refreshed && data.jwt) {
        console.log('✅ Middleware: Token refreshed successfully');
        return data.jwt;
      } else if (data.refreshNeeded === false) {
        console.log('ℹ️ Middleware: Token refresh not needed yet');
        return token; // Return original token
      }
    } else if (response.status === 401) {
      console.log('🚫 Middleware: Token refresh failed - unauthorized');
      return null;
    }
  } catch (error) {
    console.error('❌ Middleware: Token refresh error:', error);
  }
  
  return null;
}

export async function middleware(req: NextRequest) {
  const jwt = req.cookies.get('jwt')?.value;
  const pathname = req.nextUrl.pathname;
  
  console.log(`🛡️  Middleware: Processing ${pathname}, JWT: ${jwt ? 'Present' : 'Missing'}`);
  
  // Define protected paths
  const protectedPaths = ['/dashboard'];
  const publicPaths = ['/login', '/api/auth', '/api/login'];
  
  // Skip middleware for public paths and static assets
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  
  // Handle root path
  if (pathname === '/') {
    if (jwt) {
      const tokenValidation = await validateJWT(jwt);
      if (tokenValidation.isValid) {
        let tokenToUse = jwt;
        
        // Attempt refresh if needed
        if (tokenValidation.needsRefresh) {
          const refreshedToken = await attemptTokenRefresh(jwt);
          if (refreshedToken && refreshedToken !== jwt) {
            tokenToUse = refreshedToken;
          }
        }
        
        const response = NextResponse.redirect(new URL('/dashboard', req.url));
        if (tokenToUse !== jwt) {
          response.cookies.set('jwt', tokenToUse, {
            path: '/',
            maxAge: 24 * 60 * 60, // 1 day
            sameSite: 'strict',
            httpOnly: false
          });
        }
        return response;
      } else {
        // Clear invalid token
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete('jwt');
        return response;
      }
    } else {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Handle protected paths
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    if (!jwt) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Validate JWT token
    const tokenValidation = await validateJWT(jwt);
    if (!tokenValidation.isValid) {
      console.log('Invalid JWT token found, redirecting to login');
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('jwt');
      return response;
    }
    
    let tokenToUse = jwt;
    
    // Attempt refresh if needed
    if (tokenValidation.needsRefresh) {
      const refreshedToken = await attemptTokenRefresh(jwt);
      if (refreshedToken && refreshedToken !== jwt) {
        tokenToUse = refreshedToken;
        console.log('🔄 Middleware: Token refreshed in protected route');
      }
    }
    
    // Add user info to request headers for dashboard to use
    const response = NextResponse.next();
    response.headers.set('x-jwt-valid', 'true');
    
    // Update cookie if token was refreshed
    if (tokenToUse !== jwt) {
      response.cookies.set('jwt', tokenToUse, {
        path: '/',
        maxAge: 24 * 60 * 60, // 1 day
        sameSite: 'strict',
        httpOnly: false
      });
    }
    
    return response;
  }
  
  // Handle login page when user is already authenticated
  if (pathname === '/login' && jwt) {
    const tokenValidation = await validateJWT(jwt);
    if (tokenValidation.isValid) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};