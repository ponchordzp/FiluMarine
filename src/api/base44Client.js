import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Bulletproof data fetching to prevent truncation on published pages
// Overrides the default 50-item limit to 5000 for critical entities so Operator Cards correctly fetch all trips
const originalBookingList = base44.entities.Booking.list;
base44.entities.Booking.list = async (sort, limit) => {
  return await originalBookingList.call(base44.entities.Booking, sort, limit || 5000);
};

const originalExpenseList = base44.entities.BookingExpense.list;
base44.entities.BookingExpense.list = async (sort, limit) => {
  return await originalExpenseList.call(base44.entities.BookingExpense, sort, limit || 5000);
};