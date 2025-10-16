import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// axios 기본 설정
axios.defaults.withCredentials = true;

export interface Setting {
  id: number;
  keyName: string;
  value: string;
  description: string;
  updatedAt: string;
}

export interface Reservation {
  id: number;
  userId: number;
  roomId: number;
  date: string;
  startSlot: number;
  endSlot: number;
  status: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  department?: string;  // 소속/학과
  role: number;  // 0: 일반, 1: 관리자, 2: 슈퍼관리자
  createdAt: string;
  updatedAt: string;
}

/**
 * 모든 설정 조회
 */
export const getAllSettings = async (): Promise<Setting[]> => {
  const response = await axios.get(`${API_BASE_URL}/admin/settings`);
  return response.data;
};

/**
 * 설정 업데이트
 */
export const updateSettings = async (settings: Record<string, string>): Promise<void> => {
  await axios.put(`${API_BASE_URL}/admin/settings`, settings);
};

/**
 * 현재 방 사용 현황 조회
 */
export const getCurrentReservations = async (): Promise<Reservation[]> => {
  const response = await axios.get(`${API_BASE_URL}/admin/reservations/current`);
  return response.data;
};

/**
 * 모든 예약 조회
 */
export const getAllReservations = async (): Promise<Reservation[]> => {
  const response = await axios.get(`${API_BASE_URL}/admin/reservations/all`);
  return response.data;
};

/**
 * 관리자 권한으로 예약 취소
 */
export const cancelReservationByAdmin = async (reservationId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/admin/reservations/${reservationId}`);
};

/**
 * 모든 사용자 조회 (슈퍼관리자용)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const response = await axios.get(`${API_BASE_URL}/users`);
  return response.data;
};

/**
 * 사용자 role 변경 (슈퍼관리자용)
 */
export const updateUserRole = async (userId: number, role: number): Promise<void> => {
  await axios.put(`${API_BASE_URL}/users/${userId}/role`, { role });
};

