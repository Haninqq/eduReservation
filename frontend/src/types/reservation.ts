export interface Reservation {
    id: number;
    userId: number;
    roomId: number;
    date: string; // YYYY-MM-DD
    startSlot: number;
    endSlot: number;
    status: string;
    checkinTime: string | null; // or Date?
    createdAt: string; // or Date?
}
