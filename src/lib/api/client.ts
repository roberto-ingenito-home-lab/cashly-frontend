import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '../types/api';
import { UserLoginResponseDto } from '../types/user';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../app/core/services/auth.store';
import { environment } from '../../environments/environment';
import * as authApi from '../api/auth';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  private authStore = inject(AuthStore);
  private router = inject(Router);

  constructor() {
    this.client = axios.create({
      baseURL: environment.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = this.authStore.getJwtToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ message: string }>) => {
        const originalRequest = error.config as any;

        const isAuthRequest =
          originalRequest.url?.includes('/Users/signin') ||
          originalRequest.url?.includes('/Users/signup') ||
          originalRequest.url?.includes('/Users/refresh');

        // Se l'errore è 401 e non stiamo già cercando di fare il refresh e non è una richiesta di autenticazione
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.authStore.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Chiamata per ottenere il nuovo refresh token
            const response = await authApi.refreshToken(refreshToken);
            const { token: newToken, refreshToken: newRefreshToken } = response;

            // Salva i nuovi token nei cookie
            this.authStore.saveJwtToken(newToken);
            this.authStore.saveRefreshToken(newRefreshToken);

            this.processQueue(null, newToken);

            // Riprova la richiesta originale
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);

            this.authStore.logout();
            this.router.navigate(['/login']);

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        const apiError: ApiError = {
          message: error.response?.data.message || 'An error occurred',
          statusCode: error.response?.status,
        };

        return Promise.reject(apiError);
      },
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  async get<T>(url: string, params?: unknown) {
    const res = await this.client.get<T>(url, { params });
    return res.data;
  }

  async post<T>(url: string, data?: unknown) {
    const res = await this.client.post<T>(url, data);
    return res.data;
  }

  async put<T>(url: string, data?: unknown) {
    const res = await this.client.put<T>(url, data);
    return res.data;
  }

  async delete<T>(url: string) {
    const res = await this.client.delete<T>(url);
    return res.data;
  }
}
