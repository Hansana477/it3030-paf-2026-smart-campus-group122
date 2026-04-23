import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Download, MapPin, QrCode, RefreshCw, XCircle, Loader2 } from 'lucide-react';
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

  const statusClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-slate-200 text-slate-600';
      default: return 'bg-amber-100 text-amber-700';
    }
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
                  {['PENDING', 'APPROVED'].includes(booking.status) && (
                    <>
                      <button onClick={() => openReschedule(booking)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-100">
                        <RefreshCw className="h-4 w-4" /> Reschedule
                      </button>
                      <button onClick={() => cancelBooking(booking)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-600 hover:bg-red-100">
                        <XCircle className="h-4 w-4" /> Cancel
                      </button>
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
    </main>
  );
};

export default StudentMyBookings;
