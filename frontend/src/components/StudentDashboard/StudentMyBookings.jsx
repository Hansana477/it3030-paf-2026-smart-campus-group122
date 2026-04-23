import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Download, MapPin, MessageSquare, QrCode, RefreshCw, Star, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8082';

const StudentMyBookings = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', startTime: '', endTime: '' });
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [calendarDayModal, setCalendarDayModal] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to load bookings');
      }
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelBooking = async (booking) => {
    const reason = window.prompt('Reason for cancellation?', 'Student requested cancellation') || '';
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${booking.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to cancel booking');
      }
      setBookings(current => current.map(item => item.id === data.id ? data : item));
    } catch (error) {
      setMessage(error.message || 'Failed to cancel booking');
    }
  };

  const openReschedule = (booking) => {
    setRescheduleBooking(booking);
    setRescheduleForm({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });
  };

  const submitReschedule = async () => {
    if (!rescheduleBooking) return;
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${rescheduleBooking.id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...rescheduleBooking,
          date: rescheduleForm.date,
          startTime: rescheduleForm.startTime,
          endTime: rescheduleForm.endTime,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to reschedule booking');
      }
      setBookings(current => current.map(item => item.id === data.id ? data : item));
      setRescheduleBooking(null);
    } catch (error) {
      setMessage(error.message || 'Failed to reschedule booking');
    }
  };

  const openReview = (booking) => {
    setReviewBooking(booking);
    setReviewForm({ rating: 5, comment: '' });
  };

  const submitReview = async () => {
    if (!reviewBooking) return;
    setReviewSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bookingId: reviewBooking.id,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to submit review');
      }
      setBookings(current => current.map(item => item.id === reviewBooking.id
        ? {
            ...item,
            reviewed: true,
            reviewId: data.id,
            reviewRating: data.rating,
            reviewComment: data.comment,
          }
        : item
      ));
      setReviewBooking(null);
    } catch (error) {
      setMessage(error.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const canStudentCancel = (booking) => {
    if (!['PENDING', 'APPROVED'].includes(booking.status) || !booking.date || !booking.startTime) {
      return false;
    }
    const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
    const cutoff = new Date(bookingStart.getTime() - 3 * 60 * 60 * 1000);
    return new Date() <= cutoff;
  };

  const statusClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-slate-200 text-slate-600';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const statusDotClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500';
      case 'REJECTED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-slate-400';
      default: return 'bg-amber-500';
    }
  };

  const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const bookingsByDate = bookings.reduce((groups, booking) => {
    if (!booking.date) return groups;
    groups[booking.date] = [...(groups[booking.date] || []), booking];
    return groups;
  }, {});

  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });

  const changeMonth = (offset) => {
    setCalendarDate(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const calendarTitle = calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(new Date());

  const openCalendarDay = (dateKey, dayBookings) => {
    if (!dayBookings.length) return;
    setCalendarDayModal({
      date: dateKey,
      bookings: dayBookings,
    });
  };

  const getQrPayload = (booking) => booking.qrPayload || [
    'SMART_CAMPUS_BOOKING',
    `bookingId=${booking.id}`,
    `code=${booking.verificationCode || ''}`,
    `resource=${booking.resourceName || ''}`,
    `student=${booking.requesterEmail || ''}`,
    `date=${booking.date || ''}`,
    `time=${booking.startTime || ''}-${booking.endTime || ''}`,
    `seats=${booking.seatNumbers?.join(',') || ''}`,
  ].join('|');

  const getQrImageUrl = (booking) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(getQrPayload(booking))}`;
  };

  const downloadQr = (booking) => {
    const qrUrl = getQrImageUrl(booking);
    const escapedQrUrl = escapeSvg(qrUrl);
    const safeName = (booking.resourceName || 'booking').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="680" viewBox="0 0 520 680">
  <rect width="520" height="680" fill="#ffffff"/>
  <text x="40" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">Smart Campus Booking</text>
  <text x="40" y="86" font-family="Arial, sans-serif" font-size="14" fill="#475569">Show this QR code for booking verification.</text>
  <image href="${escapedQrUrl}" x="130" y="120" width="260" height="260"/>
  <text x="40" y="430" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#0f172a">${escapeSvg(booking.resourceName)}</text>
  <text x="40" y="464" font-family="Arial, sans-serif" font-size="14" fill="#334155">Date: ${escapeSvg(booking.date)}</text>
  <text x="40" y="492" font-family="Arial, sans-serif" font-size="14" fill="#334155">Time: ${escapeSvg(booking.startTime)} - ${escapeSvg(booking.endTime)}</text>
  <text x="40" y="520" font-family="Arial, sans-serif" font-size="14" fill="#334155">Seats: ${escapeSvg(booking.seatNumbers?.join(', ') || 'Resource booking')}</text>
  <text x="40" y="548" font-family="Arial, sans-serif" font-size="14" fill="#334155">Verification: ${escapeSvg(booking.verificationCode || 'Not available')}</text>
  <text x="40" y="606" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Booking ID: ${escapeSvg(booking.id)}</text>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName || 'booking'}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeSvg = (value) => {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Student Bookings</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">My Bookings</h1>
          </div>
          <button onClick={() => navigate('/student-dashboard')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">
            Back to Dashboard
          </button>
        </div>

        {message && <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>}
        {loading && <p className="mt-8 flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading bookings...</p>}

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Privacy & Policy</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Cancellation Policy</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Students can cancel a pending or approved booking only if the cancellation is made at least
            <strong> 3 hours before </strong>
            the booking start time. If the booking starts in less than 3 hours, contact an admin for help.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Booking Calendar</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{calendarTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Today
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {calendarDays.map(day => {
              const dateKey = toDateKey(day);
              const dayBookings = bookingsByDate[dateKey] || [];
              const isCurrentMonth = day >= monthStart && day <= monthEnd;
              const isToday = dateKey === todayKey;

              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => openCalendarDay(dateKey, dayBookings)}
                  disabled={dayBookings.length === 0}
                  className={`min-h-[82px] rounded-lg border p-1.5 text-left ${
                    isCurrentMonth ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 text-slate-300'
                  } ${isToday ? 'ring-2 ring-emerald-400' : ''} ${dayBookings.length > 0 ? 'cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/40' : 'cursor-default'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isCurrentMonth ? 'text-slate-800' : 'text-slate-300'}`}>
                      {day.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {dayBookings.slice(0, 1).map(booking => (
                      <div key={booking.id} className="rounded-lg bg-slate-50 px-2 py-1">
                        <p className="flex items-center gap-1 truncate text-[11px] font-bold text-slate-700">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(booking.status)}`} />
                          {booking.resourceName}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">{booking.startTime} - {booking.endTime}</p>
                      </div>
                    ))}
                    {dayBookings.length > 1 && (
                      <p className="text-[10px] font-semibold text-slate-400">+{dayBookings.length - 1} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pending</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Approved</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Rejected</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Cancelled</span>
          </div>
        </section>

        <div className="mt-8 grid gap-4">
          {bookings.map(booking => (
            <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{booking.resourceName}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {booking.location}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {booking.date}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {booking.startTime} - {booking.endTime}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">Seats: {booking.seatNumbers?.join(', ') || 'Resource booking'}</p>
                  <p className="mt-1 text-sm text-slate-600">Purpose: {booking.purpose}</p>
                  {booking.status === 'APPROVED' && (
                    <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <QrCode className="h-4 w-4" />
                      Verification code: {booking.verificationCode || 'Available'}
                    </p>
                  )}
                  {booking.rejectionReason && <p className="mt-2 text-sm text-red-600">Rejected: {booking.rejectionReason}</p>}
                  {booking.cancellationReason && <p className="mt-2 text-sm text-slate-500">Cancelled: {booking.cancellationReason}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {booking.status === 'APPROVED' && (
                    <button onClick={() => downloadQr(booking)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-slate-800">
                      <Download className="h-4 w-4" /> Download QR
                    </button>
                  )}
                  {booking.status === 'APPROVED' && !booking.reviewed && (
                    <button onClick={() => openReview(booking)} className="inline-flex items-center gap-2 rounded-xl bg-yellow-50 px-4 py-2 font-semibold text-yellow-700 hover:bg-yellow-100">
                      <Star className="h-4 w-4" /> Add Review
                    </button>
                  )}
                  {booking.status === 'APPROVED' && booking.reviewed && (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Reviewed {booking.reviewRating}/5
                    </span>
                  )}
                  {['PENDING', 'APPROVED'].includes(booking.status) && (
                    <>
                      <button onClick={() => openReschedule(booking)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-100">
                        <RefreshCw className="h-4 w-4" /> Reschedule
                      </button>
                      {canStudentCancel(booking) ? (
                        <button onClick={() => cancelBooking(booking)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-600 hover:bg-red-100">
                          <XCircle className="h-4 w-4" /> Cancel
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
                          <XCircle className="h-4 w-4" /> Cancel locked
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {!loading && bookings.length === 0 && (
          <p className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-500">No bookings yet.</p>
        )}
      </section>

      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900">Reschedule Booking</h2>
            <div className="mt-5 grid gap-4">
              <input type="date" value={rescheduleForm.date} onChange={(event) => setRescheduleForm(current => ({ ...current, date: event.target.value }))} className="rounded-xl border border-slate-200 px-4 py-3" />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" value={rescheduleForm.startTime} onChange={(event) => setRescheduleForm(current => ({ ...current, startTime: event.target.value }))} className="rounded-xl border border-slate-200 px-4 py-3" />
                <input type="time" value={rescheduleForm.endTime} onChange={(event) => setRescheduleForm(current => ({ ...current, endTime: event.target.value }))} className="rounded-xl border border-slate-200 px-4 py-3" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRescheduleBooking(null)} className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100">Close</button>
              <button onClick={submitReschedule} className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600">Submit</button>
            </div>
          </div>
        </div>
      )}

      {calendarDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Calendar Bookings</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {new Date(`${calendarDayModal.date}T00:00:00`).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
              </div>
              <button onClick={() => setCalendarDayModal(null)} className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100">
                Close
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {calendarDayModal.bookings.map(booking => (
                <article key={booking.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{booking.resourceName}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {booking.location}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {booking.startTime} - {booking.endTime}
                    </p>
                    <p>Seats: {booking.seatNumbers?.join(', ') || 'Resource booking'}</p>
                    <p className="sm:col-span-2">Purpose: {booking.purpose}</p>
                  </div>

                  {booking.status === 'APPROVED' && (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <QrCode className="h-4 w-4" />
                      Verification: {booking.verificationCode || 'Available'}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Review Resource</h2>
                <p className="mt-1 text-sm text-slate-500">{reviewBooking.resourceName} on {reviewBooking.date}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700">Rating</p>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewForm(current => ({ ...current, rating: value }))}
                    className="rounded-lg p-1 transition hover:bg-yellow-50"
                    aria-label={`Rate ${value} stars`}
                  >
                    <Star className={`h-8 w-8 ${value <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">Feedback</span>
              <textarea
                value={reviewForm.comment}
                onChange={(event) => setReviewForm(current => ({ ...current, comment: event.target.value }))}
                rows={4}
                placeholder="Share your experience with this resource..."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setReviewBooking(null)} className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100">Close</button>
              <button
                onClick={submitReview}
                disabled={reviewSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {reviewSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default StudentMyBookings;
