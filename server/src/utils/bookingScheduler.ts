/**
 * Booking Scheduler Utility
 * 
 * Automatically marks bookings as completed when:
 * - Booking date + 12 hours has passed
 * - Booking status is 'confirmed'
 * - For grouped bookings: all dates must have passed + 12 hours
 */

import Booking, { BookingStatus, IBooking } from '../models/Booking.js';
import mongoose from 'mongoose';

/**
 * Check and auto-complete bookings that have passed their date + 12 hours
 * This function is called periodically by the scheduler
 */
export async function autoCompleteBookings(): Promise<void> {
  try {
    // Only process if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('⏭️  Skipping auto-complete: Database not connected');
      return;
    }

    const now = new Date();
    // Only check bookings where the date is in the past (not future bookings)
    // We'll check each one individually to see if date + time + 12 hours has passed
    const confirmedBookings = await Booking.find({
      status: BookingStatus.CONFIRMED,
      date: { $lte: now } // Only check bookings with dates in the past
    }).lean();

    if (confirmedBookings.length === 0) {
      return; // No bookings to process
    }

    // Group bookings by bookingGroupId to handle multi-date bookings
    const groupedBookings: { [key: string]: typeof confirmedBookings } = {};
    const ungroupedBookings: typeof confirmedBookings = [];

    confirmedBookings.forEach(booking => {
      const groupId = (booking as IBooking).bookingGroupId;
      if (groupId) {
        if (!groupedBookings[groupId]) {
          groupedBookings[groupId] = [];
        }
        groupedBookings[groupId].push(booking);
      } else {
        ungroupedBookings.push(booking);
      }
    });

    let completedCount = 0;

    // Process ungrouped bookings (single date bookings)
    for (const booking of ungroupedBookings) {
      const bookingDate = new Date((booking as IBooking).date);
      // Set the time to the booking date, then add 12 hours
      const bookingDateTime = new Date(bookingDate);
      // If booking has a time, try to parse it (format: "HH:MM" or "HH:MM AM/PM")
      const timeStr = (booking as IBooking).time;
      if (timeStr && timeStr !== 'Not specified') {
        try {
          // Try to parse time string (e.g., "10:00 AM" or "14:30")
          const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3]?.toUpperCase();
            
            // Convert to 24-hour format if AM/PM is specified
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }
            
            bookingDateTime.setHours(hours, minutes, 0, 0);
          }
        } catch {
          // If time parsing fails, use the date at noon (12:00 PM) as default
          bookingDateTime.setHours(12, 0, 0, 0);
        }
      } else {
        // Default to noon if no time specified
        bookingDateTime.setHours(12, 0, 0, 0);
      }
      
      const completionTime = new Date(bookingDateTime.getTime() + 12 * 60 * 60 * 1000); // Date + time + 12 hours

      // Check if 12 hours have passed since the booking date and time
      if (now >= completionTime) {
        await Booking.updateOne(
          { _id: (booking as IBooking)._id },
          { status: BookingStatus.COMPLETED }
        );
        completedCount++;
      }
    }

    // Process grouped bookings (multi-date bookings)
    // For grouped bookings, mark as completed only when ALL dates have passed + 12 hours
    for (const [groupId, group] of Object.entries(groupedBookings)) {
      // Get all booking dates with times in the group
      const bookingTimes: Date[] = group.map(b => {
        const bookingDate = new Date((b as IBooking).date);
        const bookingDateTime = new Date(bookingDate);
        const timeStr = (b as IBooking).time;
        
        if (timeStr && timeStr !== 'Not specified') {
          try {
            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              const period = timeMatch[3]?.toUpperCase();
              
              if (period === 'PM' && hours !== 12) {
                hours += 12;
              } else if (period === 'AM' && hours === 12) {
                hours = 0;
              }
              
              bookingDateTime.setHours(hours, minutes, 0, 0);
            }
          } catch {
            bookingDateTime.setHours(12, 0, 0, 0);
          }
        } else {
          bookingDateTime.setHours(12, 0, 0, 0);
        }
        
        return bookingDateTime;
      });
      
      // Find the latest date+time in the group
      const latestDateTime = new Date(Math.max(...bookingTimes.map(d => d.getTime())));
      
      // Calculate completion time (latest date + time + 12 hours)
      const completionTime = new Date(latestDateTime.getTime() + 12 * 60 * 60 * 1000);

      // Check if 12 hours have passed since the latest booking date and time
      if (now >= completionTime) {
        // Update all bookings in the group
        await Booking.updateMany(
          { bookingGroupId: groupId },
          { status: BookingStatus.COMPLETED }
        );
        completedCount += group.length;
      }
    }

    if (completedCount > 0) {
      console.log(`✅ Auto-completed ${completedCount} booking(s) that passed their date + 12 hours`);
    }
  } catch (error) {
    console.error('❌ Error in auto-complete bookings scheduler:', error);
  }
}

/**
 * Initialize the booking scheduler
 * Runs the auto-complete check every hour
 */
export function startBookingScheduler(): void {
  // Run immediately on startup (in case server was down)
  autoCompleteBookings().catch(err => {
    console.error('Error in initial auto-complete check:', err);
  });

  // Then run every hour (3600000 ms)
  const intervalMs = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    autoCompleteBookings().catch(err => {
      console.error('Error in scheduled auto-complete check:', err);
    });
  }, intervalMs);

  console.log('🕐 Booking auto-complete scheduler started (runs every hour)');
}

