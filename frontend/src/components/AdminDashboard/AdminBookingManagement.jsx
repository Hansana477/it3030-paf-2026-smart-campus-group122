import React, { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Calendar, CheckCircle, Clock, Download, Loader2, Mail, PieChart, RefreshCw, Search, TrendingUp, XCircle } from 'lucide-react';
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
  const [emailSendingId, setEmailSendingId] = useState('');

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
      if (actionType === 'approve' && data.approvalEmailStatus === 'FAILED') {
        setMessage(`Booking approved, but email failed for ${data.requesterEmail}. Check SMTP settings or use Resend Email.`);
      }
      setActionBooking(null);
    } catch (error) {
      setMessage(error.message || `Failed to ${actionType} booking`);
    } finally {
      setSaving(false);
    }
  };

  const resendApprovalEmail = async (booking) => {
    setEmailSendingId(booking.id);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${booking.id}/send-approval-email`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Admin permission denied. Please log out, sign in again with an admin account, then retry.');
        }
        throw new Error(data?.message || data?.error || 'Failed to resend approval email');
      }
      setBookings(current => current.map(currentBooking => currentBooking.id === data.id ? data : currentBooking));
      setMessage(data.approvalEmailStatus === 'SENT'
        ? `Approval email sent to ${data.requesterEmail}.`
        : `Email still failed for ${data.requesterEmail}. Check backend SMTP logs and mail settings.`);
    } catch (error) {
      setMessage(error.message || 'Failed to resend approval email');
    } finally {
      setEmailSendingId('');
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

  const resourceStats = Object.values(bookings.reduce((stats, booking) => {
    const key = booking.resourceId || booking.resourceName || 'Unknown resource';
    const current = stats[key] || {
      id: key,
      name: booking.resourceName || 'Unknown resource',
      location: booking.location || '',
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
    };
    current.total += 1;
    if (booking.status === 'APPROVED') current.approved += 1;
    if (booking.status === 'PENDING') current.pending += 1;
    if (booking.status === 'REJECTED') current.rejected += 1;
    if (booking.status === 'CANCELLED') current.cancelled += 1;
    stats[key] = current;
    return stats;
  }, {})).sort((a, b) => b.total - a.total);

  const maxResourceBookings = Math.max(...resourceStats.map(resource => resource.total), 1);
  const topResource = resourceStats[0];
  const statusStats = STATUS_OPTIONS
    .filter(status => status !== 'ALL')
    .map(status => ({
      status,
      count: bookings.filter(booking => booking.status === status).length,
    }));
  const totalBookings = bookings.length;
  const approvedCount = statusStats.find(item => item.status === 'APPROVED')?.count || 0;
  const approvalRate = totalBookings ? Math.round((approvedCount / totalBookings) * 100) : 0;
  const statusColorClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500';
      case 'REJECTED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-slate-400';
      default: return 'bg-amber-500';
    }
  };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const downloadPdfReport = () => {
    const generatedAt = new Date().toLocaleString();
    const resourceRows = resourceStats.map(resource => {
      const width = Math.max((resource.total / maxResourceBookings) * 100, 5);
      return `
        <tr>
          <td>
            <strong>${escapeHtml(resource.name)}</strong>
            <span>${escapeHtml(resource.location)}</span>
          </td>
          <td>${resource.total}</td>
          <td>${resource.approved}</td>
          <td>${resource.pending}</td>
          <td>${resource.rejected}</td>
          <td>${resource.cancelled}</td>
          <td><div class="bar"><div style="width:${width}%"></div></div></td>
        </tr>
      `;
    }).join('');
    const statusRows = statusStats.map(item => {
      const percentage = totalBookings ? Math.round((item.count / totalBookings) * 100) : 0;
      return `
        <tr>
          <td>${escapeHtml(item.status)}</td>
          <td>${item.count}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    }).join('');

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      setMessage('Popup blocked. Please allow popups to download the PDF report.');
      return;
    }

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>UniNex Booking Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
            .page { max-width: 980px; margin: 0 auto; background: white; padding: 32px; border: 1px solid #e2e8f0; border-radius: 18px; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #10b981; padding-bottom: 18px; }
            .eyebrow { color: #059669; font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
            h1 { margin: 8px 0 6px; font-size: 30px; }
            h2 { margin: 28px 0 12px; font-size: 20px; }
            .muted { color: #64748b; font-size: 13px; }
            .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 22px; }
            .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; background: #f8fafc; }
            .card span { display: block; color: #64748b; font-size: 12px; font-weight: 700; }
            .card strong { display: block; margin-top: 6px; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th { background: #f1f5f9; color: #475569; text-align: left; padding: 10px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 10px; vertical-align: middle; }
            td span { display: block; margin-top: 3px; color: #64748b; font-size: 11px; }
            .bar { height: 9px; min-width: 120px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
            .bar div { height: 100%; border-radius: 999px; background: #10b981; }
            .footer { margin-top: 28px; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 14px; }
            @media print {
              body { padding: 0; background: white; }
              .page { border: 0; border-radius: 0; max-width: none; }
            }
          </style>
        </head>
        <body>
          <main class="page">
            <section class="header">
              <div>
                <div class="eyebrow">UniNex</div>
                <h1>Booking Report & Analysis</h1>
                <p class="muted">Generated at ${escapeHtml(generatedAt)}</p>
              </div>
              <div>
                <p class="muted">Top resource</p>
                <strong>${escapeHtml(topResource?.name || 'No bookings yet')}</strong>
              </div>
            </section>

            <section class="cards">
              <div class="card"><span>Total Bookings</span><strong>${totalBookings}</strong></div>
              <div class="card"><span>Approved</span><strong>${approvedCount}</strong></div>
              <div class="card"><span>Approval Rate</span><strong>${approvalRate}%</strong></div>
              <div class="card"><span>Resources Booked</span><strong>${resourceStats.length}</strong></div>
            </section>

            <h2>Most Booked Resources</h2>
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Rejected</th>
                  <th>Cancelled</th>
                  <th>Chart</th>
                </tr>
              </thead>
              <tbody>${resourceRows || '<tr><td colspan="7">No booking data available.</td></tr>'}</tbody>
            </table>

            <h2>Status Breakdown</h2>
            <table>
              <thead><tr><th>Status</th><th>Count</th><th>Percentage</th></tr></thead>
              <tbody>${statusRows}</tbody>
            </table>

            <p class="footer">UniNex booking analytics report.</p>
          </main>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Report & Analysis</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Booking Performance</h2>
              <p className="mt-1 text-sm text-slate-500">Most booked resources and booking status summary.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[auto_auto] lg:grid-cols-[auto_auto_auto_auto] lg:items-center">
              <button
                onClick={downloadPdfReport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <div className="grid grid-cols-3 gap-3 text-center sm:col-span-2 lg:col-span-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{totalBookings}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700">Approved</p>
                <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
              </div>
              <div className="rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold text-blue-700">Approval</p>
                <p className="text-2xl font-bold text-blue-700">{approvalRate}%</p>
              </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 font-bold text-slate-900">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Most Booked Resources
                </h3>
                {topResource && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Top: {topResource.name}
                  </span>
                )}
              </div>

              {resourceStats.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No booking data yet.</p>
              ) : (
                <div className="space-y-3">
                  {resourceStats.slice(0, 6).map(resource => (
                    <div key={resource.id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{resource.name}</p>
                          <p className="truncate text-xs text-slate-400">{resource.location}</p>
                        </div>
                        <span className="shrink-0 font-bold text-slate-700">{resource.total}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.max((resource.total / maxResourceBookings) * 100, 5)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>Approved {resource.approved}</span>
                        <span>Pending {resource.pending}</span>
                        <span>Rejected {resource.rejected}</span>
                        <span>Cancelled {resource.cancelled}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="mb-4 inline-flex items-center gap-2 font-bold text-slate-900">
                <PieChart className="h-5 w-5 text-blue-600" />
                Status Breakdown
              </h3>
              <div className="space-y-3">
                {statusStats.map(item => {
                  const percentage = totalBookings ? Math.round((item.count / totalBookings) * 100) : 0;
                  return (
                    <div key={item.status}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusColorClass(item.status)}`} />
                          {item.status}
                        </span>
                        <span className="font-bold text-slate-700">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${statusColorClass(item.status)}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

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
                    {booking.status === 'APPROVED' && (
                      <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                        booking.approvalEmailStatus === 'SENT' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        <Mail className="h-3.5 w-3.5" />
                        Email {booking.approvalEmailStatus || 'NOT SENT'}
                      </p>
                    )}
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
                    ) : booking.status === 'APPROVED' ? (
                      <button
                        onClick={() => resendApprovalEmail(booking)}
                        disabled={emailSendingId === booking.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                      >
                        {emailSendingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Resend Email
                      </button>
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

