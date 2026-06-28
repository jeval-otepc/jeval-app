import { config } from './config';

export interface ServiceTestResult {
  service: string;
  endpoint?: string;
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
  status?: number;
  responseTime?: number;
}

export interface BackendServicesTestResults {
  healthCheck: ServiceTestResult;
  apiStatus: ServiceTestResult;
  databaseConnection: ServiceTestResult;
  authService: ServiceTestResult;
  formService: ServiceTestResult;
  analysisService: ServiceTestResult;
  summary: {
    totalServices: number;
    onlineServices: number;
    offlineServices: number;
    totalDuration: number;
    overallStatus: 'healthy' | 'degraded' | 'down';
  };
}

export class BackendServicesTestService {
  private static readonly TIMEOUT = config.network.connectionTimeout || 5000;
  private static readonly API_TIMEOUT = config.network.apiTimeout || 30000;

  // Get the appropriate backend services URL based on environment
  private static getBackendUrl(): string {
    return config.getBackendServicesUrl();
  }

  private static getApiUrl(): string {
    return config.backendServices.apiUrl;
  }

  // Utility method for making HTTP requests with timeout
  private static async makeRequest(
    url: string, 
    options: RequestInit = {},
    timeout: number = this.TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': `${config.app.name}/${config.app.version}`,
    };

    // Add authentication token if available
    if (config.backendServices.apiToken) {
      defaultHeaders['Authorization'] = `Bearer ${config.backendServices.apiToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Test backend reachability against a real Strapi endpoint.
  //
  // This deployment has no separate "backend services" server — Strapi IS the
  // backend, reachable only under /api. The old probe hit `{host}/health`, which
  // does not exist (it lands on the Next.js app and 404s), so the card was always
  // red even though the backend was healthy. We instead probe a real, public
  // Strapi endpoint and treat any server response (status < 500) as reachable;
  // only a network error / timeout / 5xx counts as offline.
  static async testHealthCheck(): Promise<ServiceTestResult> {
    const startTime = Date.now();
    const service = 'Backend Reachability (Strapi)';
    const url = `${this.getApiUrl()}/questions`;

    try {
      config.log('debug', '🏥 Probing backend reachability via Strapi API...');

      const response = await this.makeRequest(url, { method: 'GET' });
      const duration = Date.now() - startTime;

      // Server answered (2xx/3xx/4xx) => backend is up. Only 5xx is a real fault.
      const reachable = response.status < 500;
      const data = await response.json().catch(() => ({}));

      if (reachable) {
        config.log('debug', '✅ Backend reachable');
        return {
          service,
          endpoint: url,
          success: true,
          data,
          duration,
          status: response.status,
          responseTime: duration,
        };
      }

      config.log('warn', '⚠️ Backend returned a server error');
      return {
        service,
        endpoint: url,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        data,
        duration,
        status: response.status,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      config.log('error', '❌ Backend unreachable:', error);

      return {
        service,
        endpoint: url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  // Test API status endpoint
  static async testApiStatus(): Promise<ServiceTestResult> {
    const startTime = Date.now();
    const service = 'Backend API Status';
    
    try {
      config.log('debug', '🔌 Testing Backend API Status...');
      const url = `${this.getApiUrl()}/status`;
      
      const response = await this.makeRequest(url, { method: 'GET' });
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json().catch(() => ({ api: 'online' }));
        config.log('debug', '✅ Backend API Status check successful');
        
        return {
          service,
          endpoint: url,
          success: true,
          data,
          duration,
          status: response.status,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        config.log('warn', '⚠️ Backend API Status check returned error');
        
        return {
          service,
          endpoint: url,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
          duration,
          status: response.status,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      config.log('error', '❌ Backend API Status check failed:', error);
      
      return {
        service,
        endpoint: `${this.getApiUrl()}/status`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  // Test database connection endpoint
  static async testDatabaseConnection(): Promise<ServiceTestResult> {
    const startTime = Date.now();
    const service = 'Database Connection';
    
    try {
      config.log('debug', '🗄️ Testing Database Connection...');
      const url = `${this.getApiUrl()}/db/ping`;
      
      const response = await this.makeRequest(url, { method: 'GET' });
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json().catch(() => ({ database: 'connected' }));
        config.log('debug', '✅ Database Connection test successful');
        
        return {
          service,
          endpoint: url,
          success: true,
          data,
          duration,
          status: response.status,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        config.log('warn', '⚠️ Database Connection test returned error');
        
        return {
          service,
          endpoint: url,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
          duration,
          status: response.status,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      config.log('error', '❌ Database Connection test failed:', error);
      
      return {
        service,
        endpoint: `${this.getApiUrl()}/db/ping`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  // Test authentication service
  static async testAuthService(): Promise<ServiceTestResult> {
    const startTime = Date.now();
    const service = 'Authentication Service';
    
    try {
      config.log('debug', '🔐 Testing Authentication Service...');
      const url = `${this.getApiUrl()}/auth/verify`;
      
      const response = await this.makeRequest(url, { method: 'POST', body: JSON.stringify({}) });
      const duration = Date.now() - startTime;
      
      // For auth service, we expect either 200 (valid token) or 401 (no/invalid token)
      // Both indicate the service is working
      if (response.status === 200 || response.status === 401) {
        const data = await response.json().catch(() => ({ auth: 'service_online' }));
        config.log('debug', '✅ Authentication Service test successful');
        
        return {
          service,
          endpoint: url,
          success: true,
          data: { ...data, note: 'Service is responding (401 expected without valid token)' },
          duration,
          status: response.status,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        config.log('warn', '⚠️ Authentication Service returned unexpected status');
        
        return {
          service,
          endpoint: url,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
          duration,
          status: response.status,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      config.log('error', '❌ Authentication Service test failed:', error);
      
      return {
        service,
        endpoint: `${this.getApiUrl()}/auth/verify`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  // Test form service
  static async testFormService(): Promise<ServiceTestResult> {
    const startTime = Date.now();
    const service = 'Form Service';
    
    try {
      config.log('debug', '📝 Testing Form Service...');
      const url = `${this.getApiUrl()}/forms`;
      
      const response = await this.makeRequest(url, { method: 'GET' });
      const duration = Date.now() - startTime;
      
      if (response.ok || response.status === 401 || response.status === 403) {
        // 200 = success, 401/403 = auth required but service working
        const data = await response.json().catch(() => ({ forms: 'service_online' }));
        config.log('debug', '✅ Form Service test successful');
        
        return {
          service,
          endpoint: url,
          success: true,
          data: { 
            ...data, 
            note: response.status === 401 || response.status === 403 
              ? 'Service is responding (auth required)' 
              : 'Service is accessible' 
          },
          duration,
          status: response.status,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        config.log('warn', '⚠️ Form Service returned error');
        
        return {
          service,
          endpoint: url,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
          duration,
          status: response.status,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      config.log('error', '❌ Form Service test failed:', error);
      
      return {
        service,
        endpoint: `${this.getApiUrl()}/forms`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  // Test analysis service
  static async testAnalysisService(): Promise<ServiceTestResult> {
    const startTime = Date.now();
    const service = 'Analysis Service';
    
    try {
      config.log('debug', '📊 Testing Analysis Service...');
      const url = `${this.getApiUrl()}/analysis/ping`;
      
      const response = await this.makeRequest(url, { method: 'GET' });
      const duration = Date.now() - startTime;
      
      if (response.ok || response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({ analysis: 'service_online' }));
        config.log('debug', '✅ Analysis Service test successful');
        
        return {
          service,
          endpoint: url,
          success: true,
          data: { 
            ...data, 
            note: response.status === 401 || response.status === 403 
              ? 'Service is responding (auth required)' 
              : 'Service is accessible' 
          },
          duration,
          status: response.status,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        config.log('warn', '⚠️ Analysis Service returned error');
        
        return {
          service,
          endpoint: url,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
          duration,
          status: response.status,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      config.log('error', '❌ Analysis Service test failed:', error);
      
      return {
        service,
        endpoint: `${this.getApiUrl()}/analysis/ping`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  // Run all backend services tests
  static async runAllTests(): Promise<BackendServicesTestResults> {
    config.log('info', '🚀 Starting Backend Services Tests...');
    const startTime = Date.now();
    
    const results: BackendServicesTestResults = {
      healthCheck: await this.testHealthCheck(),
      apiStatus: await this.testApiStatus(),
      databaseConnection: await this.testDatabaseConnection(),
      authService: await this.testAuthService(),
      formService: await this.testFormService(),
      analysisService: await this.testAnalysisService(),
      summary: {
        totalServices: 6,
        onlineServices: 0,
        offlineServices: 0,
        totalDuration: 0,
        overallStatus: 'down',
      },
    };

    // Calculate summary
    const allTests = [
      results.healthCheck,
      results.apiStatus,
      results.databaseConnection,
      results.authService,
      results.formService,
      results.analysisService,
    ];

    results.summary.onlineServices = allTests.filter(test => test.success).length;
    results.summary.offlineServices = allTests.filter(test => !test.success).length;
    results.summary.totalDuration = Date.now() - startTime;

    // Determine overall status
    const onlinePercentage = (results.summary.onlineServices / results.summary.totalServices) * 100;
    if (onlinePercentage >= 100) {
      results.summary.overallStatus = 'healthy';
    } else if (onlinePercentage >= 50) {
      results.summary.overallStatus = 'degraded';
    } else {
      results.summary.overallStatus = 'down';
    }

    config.log('info', `✅ Backend Services Tests Completed - ${results.summary.overallStatus.toUpperCase()}`);
    config.log('info', `📊 Summary: ${results.summary.onlineServices}/${results.summary.totalServices} services online`);
    
    return results;
  }

  // Quick connectivity test (just health check)
  static async quickConnectivityTest(): Promise<ServiceTestResult> {
    return await this.testHealthCheck();
  }

  // Test specific service by name
  static async testSpecificService(serviceName: string): Promise<ServiceTestResult> {
    switch (serviceName.toLowerCase()) {
      case 'health':
      case 'healthcheck':
        return await this.testHealthCheck();
      case 'api':
      case 'apistatus':
        return await this.testApiStatus();
      case 'database':
      case 'db':
        return await this.testDatabaseConnection();
      case 'auth':
      case 'authentication':
        return await this.testAuthService();
      case 'form':
      case 'forms':
        return await this.testFormService();
      case 'analysis':
      case 'analytics':
        return await this.testAnalysisService();
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }
}