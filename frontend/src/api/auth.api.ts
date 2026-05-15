import type { StandardResponse } from "@/types";
import apiClient from "./client";

interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface TokenData {
  access_token: string;
  token_type: string;
}

export const registerOwner = (data: RegisterPayload) =>
  apiClient.post<StandardResponse<TokenData>>("/auth/register", data);

export const loginOwner = (data: LoginPayload) =>
  apiClient.post<StandardResponse<TokenData>>("/auth/login", data);

export const getMe = () =>
  apiClient.get<StandardResponse<{ public_id: string; full_name: string; email: string }>>(
    "/auth/me",
  );
