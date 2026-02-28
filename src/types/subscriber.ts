export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  car: string;
  vehiclePlate: string;
  monthlyFee: number;
  lastPaymentDate: Date | null;
  validUntil: Date | null;
  status: PaymentStatus;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  subscriberId: string;
  amount: number;
  paymentDate: Date;
  validFrom: Date;
  validUntil: Date;
}
