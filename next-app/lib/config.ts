// Application Configuration
// Centralized configuration management for environment variables

export interface AppConfig {
  // Strapi Backend
  strapi: {
    url: string;
    apiToken?: string;
  };
  
  // Backend Services (Separate Server)
  backendServices: {
    url: string;
    apiUrl: string;
    apiToken?: string;
    devUrl: string;
    stagingUrl: string;
    prodUrl: string;
  };
  
  // Database Services
  dbServices: {
    url: string;
  };
  
  // Authentication
  auth: {
    provider: string;
    jwtSecret?: string;
  };
  
  // Application
  app: {
    env: string;
    name: string;
    version: string;
  };
  
  // Debug and Logging
  debug: {
    enabled: boolean;
    logLevel: string;
  };
  
  // Network Settings
  network: {
    apiTimeout: number;
    connectionTimeout: number;
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /** Pick the production or development default depending on NODE_ENV. */
  private prodOrDev(prod: string, dev: string): string {
    return process.env.NODE_ENV === 'production' ? prod : dev;
  }

  private getDefaultStrapiUrl(): string {
    return this.prodOrDev('https://jeval.otepc.go.th/api', 'http://jeval-strapi-app:1337');
  }

  private getDefaultBackendUrl(): string {
    return this.prodOrDev('https://jeval.otepc.go.th/api', 'http://jeval-strapi-app:1337');
  }

  private getDefaultBackendApiUrl(): string {
    return this.prodOrDev('https://jeval.otepc.go.th/api', 'http://jeval-strapi-app:1337/api');
  }

  /**
   * Static map of public env vars.
   *
   * Next.js only inlines `process.env.NEXT_PUBLIC_*` into the client bundle when
   * it is written as a STATIC literal access. The previous helper read
   * `process.env[key]` with a computed key, which the compiler cannot replace —
   * so in the browser every value resolved to `undefined` and fell back to its
   * default (that is why the app reported "development" even in production).
   * Referencing each variable literally here lets the build-time inlining work.
   */
  private static readonly PUBLIC_ENV: Record<string, string | undefined> = {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
    NEXT_PUBLIC_BACKEND_SERVICES_URL: process.env.NEXT_PUBLIC_BACKEND_SERVICES_URL,
    NEXT_PUBLIC_BACKEND_SERVICES_API_URL: process.env.NEXT_PUBLIC_BACKEND_SERVICES_API_URL,
    NEXT_PUBLIC_BACKEND_SERVICES_DEV_URL: process.env.NEXT_PUBLIC_BACKEND_SERVICES_DEV_URL,
    NEXT_PUBLIC_BACKEND_SERVICES_STAGING_URL: process.env.NEXT_PUBLIC_BACKEND_SERVICES_STAGING_URL,
    NEXT_PUBLIC_BACKEND_SERVICES_PROD_URL: process.env.NEXT_PUBLIC_BACKEND_SERVICES_PROD_URL,
    NEXT_PUBLIC_DB_SERVICES_URL: process.env.NEXT_PUBLIC_DB_SERVICES_URL,
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_JWT_SECRET: process.env.NEXT_PUBLIC_JWT_SECRET,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
    NEXT_PUBLIC_CONNECTION_TIMEOUT: process.env.NEXT_PUBLIC_CONNECTION_TIMEOUT,
  };

  private loadConfig(): AppConfig {
    const getEnvVar = (key: string, defaultValue: string = ''): string => {
      if (typeof window === 'undefined') {
        // Server-side: read live process.env (NEXT_PUBLIC_* + server-only secrets)
        return process.env[key] || defaultValue;
      }
      // Client-side: only build-time-inlined NEXT_PUBLIC_* values are available
      return ConfigManager.PUBLIC_ENV[key] || defaultValue;
    };

    const getBooleanEnvVar = (key: string, defaultValue: boolean = false): boolean => {
      const value = getEnvVar(key);
      return value.toLowerCase() === 'true' || value === '1';
    };

    const getNumberEnvVar = (key: string, defaultValue: number = 0): number => {
      const value = getEnvVar(key);
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    return {
      strapi: {
        url: getEnvVar('NEXT_PUBLIC_STRAPI_URL', this.getDefaultStrapiUrl()),
        apiToken: getEnvVar('STRAPI_API_TOKEN'),
      },

      backendServices: {
        url: getEnvVar('NEXT_PUBLIC_BACKEND_SERVICES_URL', this.getDefaultBackendUrl()),
        apiUrl: getEnvVar('NEXT_PUBLIC_BACKEND_SERVICES_API_URL', this.getDefaultBackendApiUrl()),
        apiToken: getEnvVar('BACKEND_SERVICES_API_TOKEN'),
        devUrl: getEnvVar('NEXT_PUBLIC_BACKEND_SERVICES_DEV_URL', 'http://jeval-strapi-app:1337'),
        stagingUrl: getEnvVar('NEXT_PUBLIC_BACKEND_SERVICES_STAGING_URL', 'https://staging.jeval.otepc.go.th'),
        prodUrl: getEnvVar('NEXT_PUBLIC_BACKEND_SERVICES_PROD_URL', 'https://jeval.otepc.go.th/api'),
      },
      
      dbServices: {
        url: getEnvVar('NEXT_PUBLIC_DB_SERVICES_URL', 'http://localhost:5432'),
      },
      
      auth: {
        provider: getEnvVar('NEXT_PUBLIC_AUTH_PROVIDER', 'strapi'),
        jwtSecret: getEnvVar('NEXT_PUBLIC_JWT_SECRET'),
      },
      
      app: {
        env: getEnvVar('NEXT_PUBLIC_APP_ENV', 'development'),
        name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'jeval-app'),
        version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
      },
      
      debug: {
        enabled: getBooleanEnvVar('NEXT_PUBLIC_DEBUG_MODE', true),
        logLevel: getEnvVar('NEXT_PUBLIC_LOG_LEVEL', 'debug'),
      },
      
      network: {
        apiTimeout: getNumberEnvVar('NEXT_PUBLIC_API_TIMEOUT', 30000),
        connectionTimeout: getNumberEnvVar('NEXT_PUBLIC_CONNECTION_TIMEOUT', 5000),
      },
    };
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public get strapi() {
    return this.config.strapi;
  }

  public get backendServices() {
    return this.config.backendServices;
  }

  public get dbServices() {
    return this.config.dbServices;
  }

  public get auth() {
    return this.config.auth;
  }

  public get app() {
    return this.config.app;
  }

  public get debug() {
    return this.config.debug;
  }

  public get network() {
    return this.config.network;
  }

  // Environment-specific backend services URL
  public getBackendServicesUrl(): string {
    const env = this.config.app.env;

    // Auto-detect if running in production/development
    const isProduction = process.env.NODE_ENV === 'production' || env === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development' || env === 'development';

    if (isProduction) {
      // Production: Use production URL from .env.production
      return this.config.backendServices.prodUrl;
    } else if (isDevelopment) {
      // Development: Use localhost with strapi container
      return this.config.backendServices.devUrl;
    } else if (env === 'staging') {
      // Staging: Use staging URL
      return this.config.backendServices.stagingUrl;
    } else {
      // Default to development
      return this.config.backendServices.devUrl;
    }
  }

  // Get API URL with automatic environment detection
  public getApiUrl(): string {
    const baseUrl = this.getBackendServicesUrl();
    return `${baseUrl}/api`;
  }

  // Get Strapi Admin URL for production vs development
  public getStrapiAdminUrl(): string {
    if (this.isProduction()) {
      return 'https://jeval.otepc.go.th/api';
    } else {
      return 'http://jeval-strapi-app:1337/admin';
    }
  }

  // Get Strapi URL (base URL without /admin path)
  public getStrapiUrl(): string {
    if (this.isProduction()) {
      return 'https://jeval.otepc.go.th/api';
    } else {
      return 'http://jeval-strapi-app:1337';
    }
  }

  // Environment detection helpers
  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production' || this.config.app.env === 'production';
  }

  public isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || this.config.app.env === 'development';
  }

  public isStaging(): boolean {
    return this.config.app.env === 'staging';
  }

  // Utility methods for logging
  public log(level: string, message: string, ...args: any[]): void {
    if (!this.config.debug.enabled) return;
    
    const logLevels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = logLevels.indexOf(this.config.debug.logLevel);
    const messageLevelIndex = logLevels.indexOf(level);
    
    if (messageLevelIndex <= currentLevelIndex) {
      (console as any)[level](
        `[${this.config.app.name}] [${level.toUpperCase()}]`,
        message,
        ...args
      );
    }
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();

// Export individual getters for convenience
export const {
  strapi: strapiConfig,
  backendServices: backendServicesConfig,
  dbServices: dbServicesConfig,
  auth: authConfig,
  app: appConfig,
  debug: debugConfig,
  network: networkConfig,
} = config.getConfig();