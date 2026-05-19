import type { STANDARD_RESPONSE } from "@/types";
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
  apiClient.post<STANDARD_RESPONSE<TokenData>>("/auth/register", data);

export const loginOwner = (data: LoginPayload) =>
  apiClient.post<STANDARD_RESPONSE<TokenData>>("/auth/login", data);

export const getMe = () =>
  apiClient.get<STANDARD_RESPONSE<{ public_id: string; full_name: string; email: string }>>(
    "/auth/me",
  );
