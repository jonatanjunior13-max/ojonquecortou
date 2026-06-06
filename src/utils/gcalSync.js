import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function syncBookingToGoogle(bookingId, isDelete = false) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const bookingData = bookingSnap.data();

    if (isDelete) {
      if (bookingData.googleEventId || bookingData.googleCalendarEventId) {
        await fetch(`/api/gcal?action=sync&bookingId=${bookingId}`, {
          method: 'DELETE'
        });
      }
      return { success: true };
    } else {
      const res = await fetch(`/api/gcal?action=sync&bookingId=${bookingId}`, {
        method: 'POST'
      });
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Error calling Google Calendar sync:', err);
    return { success: false, error: err.message };
  }
}
