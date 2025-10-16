import axios from 'axios';
import { Reservation } from '../types/reservation';

const API_BASE_URL = 'http://localhost:8080/api';

// axios 기본 설정: credentials 포함
axios.defaults.withCredentials = true;

export interface ReservationRequest {
    userId: number;
    roomId: number;
    date: string; // YYYY-MM-DD
    startSlot: number;
    endSlot: number;
}

export const getReservationsByDate = async (date: string): Promise<Reservation[]> => {
    const response = await axios.get(`${API_BASE_URL}/reservation`, {
        params: { date }
    });
    return response.data;
};

export const createReservation = async (reservationData: ReservationRequest): Promise<Reservation> => {
    const response = await axios.post(`${API_BASE_URL}/reservation`, reservationData);
    return response.data;
};

export const getMyReservations = async (userId: number): Promise<Reservation[]> => {
    const response = await axios.get(`${API_BASE_URL}/reservation/my-reservations`, {
        params: { userId }
    });
    return response.data;
}

export const cancelReservation = async (reservationId: number, userId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/reservation/${reservationId}`, {
        params: { userId }
    });
};
