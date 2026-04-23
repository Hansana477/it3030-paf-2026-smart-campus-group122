import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, Clock, Loader2, Search, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8082';
const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

const AdminBookingManagement = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [actionBooking, setActionBooking] = useState(null);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
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

  const openAction = (booking, type) => {
    setActionBooking(booking);
    setActionType(type);
    setReason('');
  };

  const submitAction = async () => {
    if (!actionBooking) return;
    if (actionType === 'reject' && !reason.trim()) {
      setMessage('Reject reason is required');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${actionBooking.id}/${actionType}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed to ${actionType} booking`);
      }
      setBookings(current => current.map(booking => booking.id === data.id ? data : booking));
      setActionBooking(null);
    } catch (error) {
      setMessage(error.message || `Failed to ${actionType} booking`);
    } finally {
      setSaving(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      booking.resourceName?.toLowerCase().includes(term) ||
      booking.requesterName?.toLowerCase().includes(term) ||
      booking.requesterEmail?.toLowerCase().includes(term) ||
      booking.id?.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const statusClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-slate-200 text-slate-600';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Booking Management</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">Review Booking Requests</h1>
            <p className="mt-2 text-slate-500">Approve pending bookings or reject them with a reason.</p>
          </div>
          <button onClick={() => navigate('/admin-dashboard')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700">
            Back to Admin Dashboard
          </button>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search resource, requester, email, or booking ID"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3">
            {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <button onClick={loadBookings} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white">Refresh</button>
        </div>

        {message && <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>}
        {loading && <p className="mt-8 flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading bookings...</p>}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-600">
                <th className="px-4 py-4">Booking</th>
                <th className="px-4 py-4">Requester</th>
                <th className="px-4 py-4">Date & Time</th>
                <th className="px-4 py-4">Seats</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBookings.map(booking => (
                <tr key={booking.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900">{booking.resourceName}</p>
                    <p className="mt-1 text-slate-500">{booking.location}</p>
                    <p className="mt-2 text-slate-600">Purpose: {booking.purpose}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{booking.requesterName}</p>
                    <p className="text-slate-500">{booking.requesterEmail}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {booking.date}</p>
                    <p className="mt-1 inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {booking.startTime} - {booking.endTime}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{booking.seatNumbers?.join(', ') || booking.expectedAttendees}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(booking.status)}`}>{booking.status}</span>
                    {booking.rejectionReason && <p className="mt-2 text-xs text-red-600">{booking.rejectionReason}</p>}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {booking.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openAction(booking, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                        <button onClick={() => openAction(booking, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-600 hover:bg-red-100">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredBookings.length === 0 && (
          <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">No bookings found.</p>
        )}
      </section>

      {actionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}</h2>
                <p className="mt-1 text-sm text-slate-500">{actionBooking.resourceName} for {actionBooking.requesterName}</p>
              </div>
            </div>
            {actionType === 'reject' && (
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                placeholder="Reason for rejection"
                className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setActionBooking(null)} className="rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-100">Close</button>
              <button onClick={submitAction} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminBookingManagement;
