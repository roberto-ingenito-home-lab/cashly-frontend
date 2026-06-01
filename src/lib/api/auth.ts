import axios from 'axios';
import { UserCreateDto, UserLoginResponseDto, UserLoginDto } from '../types/user';
import { environment } from '../../environments/environment';

// usa axios direttamente (le chiamate auth non hanno bisogno dell'interceptor)

const authAxios = axios.create({
  baseURL: environment.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

export const signup = async (userData: UserCreateDto): Promise<UserLoginResponseDto> => {
  const res = await authAxios.post<UserLoginResponseDto>('/Users/signup', userData);
  return res.data;
};

export const login = async (credentials: UserLoginDto): Promise<UserLoginResponseDto> => {
  const res = await authAxios.post<UserLoginResponseDto>('/Users/signin', credentials);
  return res.data;
};

export const refreshToken = async (refreshTokenValue: string): Promise<UserLoginResponseDto> => {
  const res = await authAxios.post<UserLoginResponseDto>('/Users/refresh', {
    refreshToken: refreshTokenValue,
  });
  return res.data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const res = await authAxios.post<{ message: string }>('/Users/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const res = await authAxios.post<{ message: string }>('/Users/reset-password', { token, newPassword });
  return res.data;
};

