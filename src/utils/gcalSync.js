import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function syncBookingToGoogle(bookingId, isDelete = false) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const res = await fetch(`/api/gcal?action=sync&bookingId=${bookingId}${isDelete ? '&delete=true' : ''}`, {
      method: 'POST'
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Error calling Google Calendar sync:', err);
    return { success: false, error: err.message };
  }
}
