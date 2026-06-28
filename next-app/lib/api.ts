import { AuthService } from './auth';
import { config } from './config';

// Use dynamic environment-based URL selection
const STRAPI_BASE_URL = config.getBackendServicesUrl();

export interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

export class ApiService {
  static async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true
    } = options;

    // Set default headers with UTF-8 charset
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    };

    // Add authentication header if required
    if (requireAuth) {
      const authToken = AuthService.getToken();
      if (authToken) {
        defaultHeaders['Authorization'] = `Bearer ${authToken}`;
      }
    }

    const config: RequestInit = {
      method,
      headers: defaultHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const url = endpoint.startsWith('http') ? endpoint : `${STRAPI_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Convenience methods
  static get<T = any>(endpoint: string, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  static post<T = any>(endpoint: string, data: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data, requireAuth });
  }

  static put<T = any>(endpoint: string, data: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data, requireAuth });
  }

  static delete<T = any>(endpoint: string, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }

  // Specific API endpoints
  static getQuestions() {
    return this.get('/api/questions?populate=*&sort[0]=No', false);
  }

  static getCurrentUser() {
    return this.get('/api/users/me');
  }

  static getForms() {
    return this.get('/api/forms');
  }

  static getAnswers() {
    return this.get('/api/answers?populate=*&sort[0]=No');
  }

  static getPositionTypes() {
    return this.get('/api/position-types');
  }

  static async createForm(data: any) {
    try {
      // พยายาม create form ปกติก่อน
      return await this.post('/api/forms', { data });
    } catch (error) {
      // ถ้าเกิด duplicate key error
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        console.warn('Duplicate key detected, attempting retry with form data check...');
        
        // พยายาม retry อีกครั้ง
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // รอ 500ms
          return await this.post('/api/forms', { data });
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw new Error('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ');
        }
      }
      throw error;
    }
  }

  static getForm(id: string) {
    return this.get(`/api/forms/${id}?populate=*`);
  }

  static updateForm(id: string, data: any) {
    return this.put(`/api/forms/${id}`, { data });
  }

  static analyzeForm(id: number | string) {
    return this.get(`/api/forms/analyse/${id}`);
  }
}