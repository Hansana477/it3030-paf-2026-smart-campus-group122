import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  X,
  Phone,
  Mail,
  User,
  BookOpen,
  Zap,
  FileText,
} from 'lucide-react';

// ==============================================
// DUMMY BOOKING DATA
// ==============================================
const DUMMY_BOOKINGS = [
  {
    id: 'BK001',
    resourceId: '1',
    resourceName: 'Main Lecture Hall A',
    resourceType: 'LECTURE_HALL',
    location: 'Building A, Floor 1',
    capacity: 120,
    bookedSeats: 85,
    requesterName: 'John Doe',
    requesterId: 'STU001',
    requesterEmail: 'john.doe@university.edu',
    requesterPhone: '+94-701-234-567',
    date: '2024-12-15',
    startTime: '09:00',
    endTime: '11:00',
    purpose: 'Advanced Programming Lecture',
    expectedAttendees: 85,
    createdDate: '2024-12-08',
    requestedDate: '2024-12-08',
    status: 'PENDING',
    notes: 'Need projector and sound system working',
    rejectionReason: null,
    approverName: null,
    amenitiesRequired: ['Projector', 'Sound System', 'WiFi'],
  },
  {
    id: 'BK002',
    resourceId: '2',
    resourceName: 'Computer Lab 301',
    resourceType: 'LAB',
    location: 'Building C, Floor 3',
    capacity: 30,
    bookedSeats: 25,
    requesterName: 'Sarah Smith',
    requesterId: 'STU002',
    requesterEmail: 'sarah.smith@university.edu',
    requesterPhone: '+94-701-234-568',
    date: '2024-12-16',
    startTime: '13:00',
    endTime: '15:00',
    purpose: 'Database Design Practical Session',
    expectedAttendees: 25,
    createdDate: '2024-12-08',
    requestedDate: '2024-12-08',
    status: 'PENDING',
    notes: 'Students need to install PostgreSQL beforehand',
    rejectionReason: null,
    approverName: null,
    amenitiesRequired: ['Computers', 'Software Licenses'],
  },
  {
    id: 'BK003',
    resourceId: '3',
    resourceName: 'Conference Room B',
    resourceType: 'MEETING_ROOM',
    location: 'Building B, Floor 2',
    capacity: 12,
    bookedSeats: 8,
    requesterName: 'Michael Johnson',
    requesterId: 'STU003',
    requesterEmail: 'michael.j@university.edu',
    requesterPhone: '+94-701-234-569',
    date: '2024-12-17',
    startTime: '10:00',
    endTime: '11:30',
    purpose: 'Research Team Meeting',
    expectedAttendees: 8,
    createdDate: '2024-12-07',
    requestedDate: '2024-12-07',
    status: 'APPROVED',
    notes: 'Need video conferencing setup',
    rejectionReason: null,
    approverName: 'Admin User',
    amenitiesRequired: ['Video Conference', 'Smart Board'],
  },
  {
    id: 'BK004',
    resourceId: '1',
    resourceName: 'Main Lecture Hall A',
    resourceType: 'LECTURE_HALL',
    location: 'Building A, Floor 1',
    capacity: 120,
    bookedSeats: 100,
    requesterName: 'Emma Wilson',
    requesterId: 'STU004',
    requesterEmail: 'emma.w@university.edu',
    requesterPhone: '+94-701-234-570',
    date: '2024-12-18',
    startTime: '14:00',
    endTime: '16:00',
    purpose: 'Annual Student Summit',
    expectedAttendees: 100,
    createdDate: '2024-12-06',
    requestedDate: '2024-12-06',
    status: 'REJECTED',
    notes: 'Time conflict with faculty meeting',
    rejectionReason: 'Time slot already booked by faculty',
    approverName: 'Admin User',
    amenitiesRequired: ['Projector', 'Sound System', 'WiFi', 'Whiteboard'],
  },
  {
    id: 'BK005',
    resourceId: '5',
    resourceName: 'Silent Study Area',
    resourceType: 'STUDY_AREA',
    location: 'Library, Floor 2',
    capacity: 50,
    bookedSeats: 40,
    requesterName: 'Alex Kumar',
    requesterId: 'STU005',
    requesterEmail: 'alex.k@university.edu',
    requesterPhone: '+94-701-234-571',
    date: '2024-12-19',
    startTime: '15:00',
    endTime: '18:00',
    purpose: 'Final Exam Group Study',
    expectedAttendees: 40,
    createdDate: '2024-12-05',
    requestedDate: '2024-12-05',
    status: 'APPROVED',
    notes: 'Please ensure all seating areas are available',
    rejectionReason: null,
    approverName: 'Admin User',
    amenitiesRequired: ['WiFi', 'Power Outlets'],
  },
  {
    id: 'BK006',
    resourceId: '4',
    resourceName: 'Portable Projector',
    resourceType: 'EQUIPMENT',
    location: 'AV Room, Building A',
    capacity: 1,
    bookedSeats: 1,
    requesterName: 'Lisa Chen',
    requesterId: 'STU006',
    requesterEmail: 'lisa.chen@university.edu',
    requesterPhone: '+94-701-234-572',
    date: '2024-12-20',
    startTime: '11:00',
    endTime: '13:00',
    purpose: 'Multimedia Project Presentation',
    expectedAttendees: 50,
    createdDate: '2024-12-04',
    requestedDate: '2024-12-04',
    status: 'PENDING',
    notes: 'Need HDMI and VGA cables included',
    rejectionReason: null,
    approverName: null,
    amenitiesRequired: ['HDMI Cable', 'VGA Cable'],
  },
  {
    id: 'BK007',
    resourceId: '2',
    resourceName: 'Computer Lab 301',
    resourceType: 'LAB',
    location: 'Building C, Floor 3',
    capacity: 30,
    bookedSeats: 20,
    requesterName: 'David Brown',
    requesterId: 'STU007',
    requesterEmail: 'david.b@university.edu',
    requesterPhone: '+94-701-234-573',
    date: '2024-12-21',
    startTime: '09:00',
    endTime: '12:00',
    purpose: 'Web Development Workshop',
    expectedAttendees: 20,
    createdDate: '2024-12-03',
    requestedDate: '2024-12-03',
    status: 'CANCELLED',
    notes: 'Instructor cancelled due to illness',
    rejectionReason: 'Cancelled by requester',
    approverName: 'Admin User',
    amenitiesRequired: ['Computers', 'Software Licenses', 'Printers'],
  },
  {
    id: 'BK008',
    resourceId: '3',
    resourceName: 'Conference Room B',
    resourceType: 'MEETING_ROOM',
    location: 'Building B, Floor 2',
    capacity: 12,
    bookedSeats: 6,
    requesterName: 'Rachel Green',
    requesterId: 'STU008',
    requesterEmail: 'rachel.g@university.edu',
    requesterPhone: '+94-701-234-574',
    date: '2024-12-22',
    startTime: '16:00',
    endTime: '17:00',
    purpose: 'Department Committee Meeting',
    expectedAttendees: 6,
    createdDate: '2024-12-02',
    requestedDate: '2024-12-02',
    status: 'PENDING',
    notes: 'Regular monthly meeting',
    rejectionReason: null,
    approverName: null,
    amenitiesRequired: ['Video Conference'],
  },
];

// Status badge color mapping
const STATUS_COLORS = {
  PENDING: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' },
  APPROVED: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' },
  REJECTED: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' },
  CANCELLED: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' },
};

const RESOURCE_LAYOUTS = {
  '1': {
    layoutLabel: 'Tiered lecture seating',
    focalPoint: 'Stage + dual projection screens',
    supportNote: 'Front-left accessible row and side aisle kept open for movement.',
    seatingLayout: {
      rows: 8,
      cols: 15,
      seats: Array.from({ length: 120 }, (_, i) => ({
        id: `lh-seat-${i + 1}`,
        number: `${String.fromCharCode(65 + Math.floor(i / 15))}${(i % 15) + 1}`,
        status: i < 92 ? 'AVAILABLE' : i < 108 ? 'RESERVED' : 'OCCUPIED',
        hasPower: i % 5 === 0,
        isAccessible: i < 2,
      })),
    },
  },
  '2': {
    layoutLabel: 'Workstation lab grid',
    focalPoint: 'Tutor desk + projector wall',
    supportNote: 'Every workstation includes power, with two assistant terminals near the entrance.',
    seatingLayout: {
      rows: 6,
      cols: 5,
      seats: Array.from({ length: 30 }, (_, i) => ({
        id: `lab-seat-${i + 1}`,
        number: `WS${(i + 1).toString().padStart(2, '0')}`,
        status: i < 22 ? 'AVAILABLE' : i < 27 ? 'RESERVED' : 'OCCUPIED',
        hasPower: true,
        isAccessible: i === 0,
      })),
    },
  },
  '3': {
    layoutLabel: 'Conference table',
    focalPoint: 'Center boardroom table + video wall',
    supportNote: 'Two spare chairs are kept along the side wall for overflow attendees.',
    conferenceLayout: {
      tableLabel: 'Board Table',
      seats: [
        { id: 'c1', number: 'N1', position: 'top', status: 'AVAILABLE' },
        { id: 'c2', number: 'N2', position: 'top', status: 'AVAILABLE' },
        { id: 'c3', number: 'N3', position: 'top', status: 'RESERVED' },
        { id: 'c4', number: 'E1', position: 'right', status: 'AVAILABLE' },
        { id: 'c5', number: 'E2', position: 'right', status: 'OCCUPIED' },
        { id: 'c6', number: 'E3', position: 'right', status: 'AVAILABLE' },
        { id: 'c7', number: 'S1', position: 'bottom', status: 'AVAILABLE' },
        { id: 'c8', number: 'S2', position: 'bottom', status: 'AVAILABLE' },
        { id: 'c9', number: 'S3', position: 'bottom', status: 'RESERVED' },
        { id: 'c10', number: 'W1', position: 'left', status: 'AVAILABLE' },
        { id: 'c11', number: 'W2', position: 'left', status: 'AVAILABLE' },
        { id: 'c12', number: 'W3', position: 'left', status: 'AVAILABLE' },
      ],
    },
  },
  '5': {
    layoutLabel: 'Quiet study rows',
    focalPoint: 'Individual study desks + silent zone entrance',
    supportNote: 'Reserved desks are grouped near the charging wall for longer sessions.',
    seatingLayout: {
      rows: 10,
      cols: 5,
      seats: Array.from({ length: 50 }, (_, i) => ({
        id: `study-seat-${i + 1}`,
        number: `S${(i + 1).toString().padStart(2, '0')}`,
        status: i < 30 ? 'AVAILABLE' : i < 42 ? 'RESERVED' : 'OCCUPIED',
        hasPower: i % 2 === 0,
        isAccessible: i === 0,
      })),
    },
  },
};

const getLayoutStats = (resourceProfile) => {
  if (!resourceProfile) {
    return { total: 0, available: 0, reserved: 0, occupied: 0 };
  }

  const seats = resourceProfile.seatingLayout?.seats || resourceProfile.conferenceLayout?.seats || [];
  if (!seats.length) {
    return { total: 0, available: 0, reserved: 0, occupied: 0 };
  }

  return seats.reduce((summary, seat) => {
    summary.total += 1;
    if (seat.status === 'AVAILABLE') summary.available += 1;
    if (seat.status === 'RESERVED') summary.reserved += 1;
    if (seat.status === 'OCCUPIED') summary.occupied += 1;
    return summary;
  }, { total: 0, available: 0, reserved: 0, occupied: 0 });
};

// ==============================================
// MAIN COMPONENT
// ==============================================
const AdminBookingManagement = () => {
  const [bookings, setBookings] = useState(DUMMY_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedResourceType, setSelectedResourceType] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const enrichedBookings = bookings.map((booking) => {
    const resourceProfile = RESOURCE_LAYOUTS[booking.resourceId] || null;
    return {
      ...booking,
      resourceProfile,
      layoutStats: getLayoutStats(resourceProfile),
    };
  });

  // Show notification
  const showNotificationMessage = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Filter bookings
  const filteredBookings = enrichedBookings.filter(booking => {
    const matchesSearch = 
      booking.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || booking.status === selectedStatus;
    const matchesType = selectedResourceType === 'ALL' || booking.resourceType === selectedResourceType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'attendees':
        return b.expectedAttendees - a.expectedAttendees;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = sortedBookings.slice(startIdx, startIdx + itemsPerPage);

  // Handle approval/rejection
  const handleApproveBooking = () => {
    if (!selectedBooking) return;
    setLoading(true);
    setTimeout(() => {
      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, status: 'APPROVED', approverName: 'Admin User' }
          : b
      ));
      showNotificationMessage('Booking approved successfully!', 'success');
      setShowActionModal(false);
      setShowDetailModal(false);
      setLoading(false);
    }, 500);
  };

  const handleRejectBooking = () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      showNotificationMessage('Please provide a rejection reason', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, status: 'REJECTED', rejectionReason, approverName: 'Admin User' }
          : b
      ));
      showNotificationMessage('Booking rejected successfully!', 'success');
      setRejectionReason('');
      setShowActionModal(false);
      setShowDetailModal(false);
      setLoading(false);
    }, 500);
  };

  const openActionModal = (booking, type) => {
    setSelectedBooking(booking);
    setActionType(type);
    setRejectionReason('');
    setShowActionModal(true);
  };

  // Calculate statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
  };

  const quickPreviewBooking = selectedBooking || paginatedBookings.find(
    (booking) => booking.resourceProfile?.seatingLayout || booking.resourceProfile?.conferenceLayout
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Booking Management</h1>
        <p className="text-slate-600">Review, approve, or reject resource booking requests</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Requests" value={stats.total} icon={<BookOpen />} color="blue" />
        <StatCard label="Pending" value={stats.pending} icon={<AlertCircle />} color="yellow" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle />} color="green" />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle />} color="red" />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking ID, resource, or requester..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Resource Type Filter */}
          <select
            value={selectedResourceType}
            onChange={(e) => {
              setSelectedResourceType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Resources</option>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="LAB">Lab</option>
            <option value="MEETING_ROOM">Meeting Room</option>
            <option value="STUDY_AREA">Study Area</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
            <option value="attendees">Sort by Attendees</option>
          </select>
        </div>
      </div>

      {quickPreviewBooking && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Space Preview</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{quickPreviewBooking.resourceName}</h2>
              <p className="text-slate-600 mt-1">
                {quickPreviewBooking.resourceProfile?.layoutLabel} for booking {quickPreviewBooking.id}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <LayoutStatCard label="Available" value={quickPreviewBooking.layoutStats.available} tone="green" />
              <LayoutStatCard label="Reserved" value={quickPreviewBooking.layoutStats.reserved} tone="amber" />
              <LayoutStatCard label="Occupied" value={quickPreviewBooking.layoutStats.occupied} tone="rose" />
            </div>
          </div>

          <BookingSpaceLayout booking={quickPreviewBooking} compact />
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Booking ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Resource</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Layout</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Requester</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Attendees</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{booking.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{booking.resourceName}</p>
                        <p className="text-xs text-slate-500">{booking.location}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {booking.resourceProfile ? (
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{booking.resourceProfile.layoutLabel}</p>
                          <p className="text-xs text-slate-500">
                            {booking.layoutStats.available} seats free
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No seating layout</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{booking.requesterName}</p>
                        <p className="text-xs text-slate-500">{booking.requesterEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{booking.date}</p>
                        <p className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{booking.expectedAttendees}/{booking.capacity}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    No bookings found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, sortedBookings.length)} of {sortedBookings.length} bookings
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-cyan-500 text-white'
                      : 'border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {showNotification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white font-medium ${
          notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notificationMessage}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setShowDetailModal(false)}
          onApprove={() => openActionModal(selectedBooking, 'approve')}
          onReject={() => openActionModal(selectedBooking, 'reject')}
          canApproveReject={selectedBooking.status === 'PENDING'}
        />
      )}

      {/* Action Modal */}
      {showActionModal && selectedBooking && (
        <ActionModal
          booking={selectedBooking}
          action={actionType}
          rejectionReason={rejectionReason}
          onReasonChange={setRejectionReason}
          onConfirm={actionType === 'approve' ? handleApproveBooking : handleRejectBooking}
          onCancel={() => setShowActionModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

// ==============================================
// HELPER COMPONENTS
// ==============================================

const StatCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 text-blue-700',
    yellow: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700',
    green: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-green-700',
    red: 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 text-red-700',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="opacity-20">{icon}</div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const statusLabels = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
  };

  const statusIcons = {
    PENDING: <AlertCircle className="w-4 h-4" />,
    APPROVED: <CheckCircle className="w-4 h-4" />,
    REJECTED: <XCircle className="w-4 h-4" />,
    CANCELLED: <AlertCircle className="w-4 h-4" />,
  };

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-full px-3 py-1 flex items-center gap-2 w-fit`}>
      <span className={colors.icon}>{statusIcons[status]}</span>
      <span className={`${colors.text} text-xs font-semibold`}>{statusLabels[status]}</span>
    </div>
  );
};

const LayoutStatCard = ({ label, value, tone }) => {
  const tones = {
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  return (
    <div className={`min-w-[88px] rounded-xl border px-4 py-3 text-center ${tones[tone] || tones.green}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

const SeatStatusLegend = () => (
  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
    <span className="flex items-center gap-2">
      <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
      Available
    </span>
    <span className="flex items-center gap-2">
      <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
      Reserved
    </span>
    <span className="flex items-center gap-2">
      <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
      Occupied
    </span>
    <span className="flex items-center gap-2">
      <Zap className="w-3 h-3 text-yellow-500" />
      Power seat
    </span>
  </div>
);

const BookingSpaceLayout = ({ booking, compact = false }) => {
  const resourceProfile = booking.resourceProfile;

  if (!resourceProfile) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
        Layout preview is not available for this resource type.
      </div>
    );
  }

  if (resourceProfile.conferenceLayout) {
    const topSeats = resourceProfile.conferenceLayout.seats.filter((seat) => seat.position === 'top');
    const rightSeats = resourceProfile.conferenceLayout.seats.filter((seat) => seat.position === 'right');
    const bottomSeats = resourceProfile.conferenceLayout.seats.filter((seat) => seat.position === 'bottom');
    const leftSeats = resourceProfile.conferenceLayout.seats.filter((seat) => seat.position === 'left');

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="rounded-xl bg-slate-900 text-white text-center py-2 text-xs font-semibold uppercase tracking-[0.18em] mb-4">
              Video Wall
            </div>
            <div className="space-y-3">
              <ConferenceSeatRow seats={topSeats} />
              <div className="grid grid-cols-[64px_minmax(0,1fr)_64px] gap-3 items-center">
                <ConferenceSeatColumn seats={leftSeats} />
                <div className="rounded-[28px] border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 text-center shadow-inner">
                  <p className="text-sm font-semibold text-slate-900">{resourceProfile.conferenceLayout.tableLabel}</p>
                  <p className="text-xs text-slate-500 mt-1">{resourceProfile.focalPoint}</p>
                </div>
                <ConferenceSeatColumn seats={rightSeats} />
              </div>
              <ConferenceSeatRow seats={bottomSeats} />
            </div>
          </div>

          {!compact && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Conference Setup</p>
                <p className="text-sm text-slate-600 mt-2">{resourceProfile.supportNote}</p>
              </div>
              <SeatStatusLegend />
            </div>
          )}
        </div>
        {compact && <SeatStatusLegend />}
      </div>
    );
  }

  const seats = resourceProfile.seatingLayout?.seats || [];
  const cols = resourceProfile.seatingLayout?.cols || 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 overflow-x-auto">
          <div className="rounded-xl bg-slate-900 text-white text-center py-2 text-xs font-semibold uppercase tracking-[0.18em] mb-4">
            {resourceProfile.focalPoint}
          </div>
          <div
            className="grid gap-2 min-w-max"
            style={{ gridTemplateColumns: `repeat(${cols}, ${compact ? '38px' : '46px'})` }}
          >
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`relative rounded-lg border text-center text-[11px] font-semibold py-2 ${
                  seat.status === 'AVAILABLE'
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : seat.status === 'RESERVED'
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-rose-100 border-rose-300 text-rose-800'
                }`}
                title={`${seat.number} - ${seat.status}`}
              >
                {compact ? seat.number.replace(/[^0-9A-Z]/g, '').slice(-2) : seat.number}
                {seat.hasPower && <Zap className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 bg-white rounded-full p-0.5" />}
              </div>
            ))}
          </div>
        </div>

        {!compact && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Layout Notes</p>
              <p className="text-sm text-slate-600 mt-2">{resourceProfile.supportNote}</p>
            </div>
            <SeatStatusLegend />
          </div>
        )}
      </div>
      {compact && <SeatStatusLegend />}
    </div>
  );
};

const ConferenceSeatRow = ({ seats }) => (
  <div className="flex justify-center gap-2">
    {seats.map((seat) => (
      <ConferenceSeat seat={seat} key={seat.id} />
    ))}
  </div>
);

const ConferenceSeatColumn = ({ seats }) => (
  <div className="flex flex-col items-center gap-2">
    {seats.map((seat) => (
      <ConferenceSeat seat={seat} key={seat.id} />
    ))}
  </div>
);

const ConferenceSeat = ({ seat }) => (
  <div
    className={`w-12 h-12 rounded-xl border text-[11px] font-semibold flex items-center justify-center ${
      seat.status === 'AVAILABLE'
        ? 'bg-green-100 border-green-300 text-green-800'
        : seat.status === 'RESERVED'
          ? 'bg-amber-100 border-amber-300 text-amber-800'
          : 'bg-rose-100 border-rose-300 text-rose-800'
    }`}
    title={`${seat.number} - ${seat.status}`}
  >
    {seat.number}
  </div>
);

const BookingDetailModal = ({ booking, onClose, onApprove, onReject, canApproveReject }) => {
  const colors = STATUS_COLORS[booking.status];
  const layoutStats = booking.layoutStats || getLayoutStats(booking.resourceProfile);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Booking Details</h2>
            <p className="text-slate-600 text-sm mt-1">Booking ID: {booking.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
            <div className="flex items-center gap-3">
              <span className={colors.icon}>{STATUS_COLORS[booking.status].icon === 'text-yellow-600' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}</span>
              <div>
                <p className={`${colors.text} font-semibold`}>
                  {booking.status === 'PENDING' ? 'Awaiting Approval' : booking.status}
                </p>
                {booking.rejectionReason && (
                  <p className={`${colors.text} text-sm`}>Reason: {booking.rejectionReason}</p>
                )}
              </div>
            </div>
          </div>

          {/* Resource Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-slate-600 uppercase">Resource</label>
              <p className="text-lg font-bold text-slate-900 mt-1">{booking.resourceName}</p>
              <p className="text-sm text-slate-600 mt-1">{booking.location}</p>
              <p className="text-xs text-slate-500 mt-2">{booking.resourceType}</p>
              {booking.resourceProfile?.layoutLabel && (
                <p className="text-xs text-cyan-700 mt-2 font-medium">{booking.resourceProfile.layoutLabel}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <label className="text-xs font-semibold text-slate-600 uppercase">Capacity</label>
              <p className="text-lg font-bold text-slate-900 mt-1">{booking.expectedAttendees}/{booking.capacity}</p>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${(booking.expectedAttendees / booking.capacity) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {(booking.resourceProfile?.seatingLayout || booking.resourceProfile?.conferenceLayout) && (
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Layout and Seating Availability</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Admin preview of the space the student requested.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <LayoutStatCard label="Free" value={layoutStats.available} tone="green" />
                  <LayoutStatCard label="Held" value={layoutStats.reserved} tone="amber" />
                  <LayoutStatCard label="Used" value={layoutStats.occupied} tone="rose" />
                </div>
              </div>

              <BookingSpaceLayout booking={booking} />
            </div>
          )}

          {/* Booking Details */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Booking Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-600">Date</p>
                  <p className="font-semibold text-slate-900">{booking.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-600">Time Slot</p>
                  <p className="font-semibold text-slate-900">{booking.startTime} - {booking.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-600">Purpose</p>
                  <p className="font-semibold text-slate-900">{booking.purpose}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-600">Attendees</p>
                  <p className="font-semibold text-slate-900">{booking.expectedAttendees}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requester Details */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Requester Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-600">Name</p>
                  <p className="font-semibold text-slate-900">{booking.requesterName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-600">Email</p>
                  <p className="font-semibold text-slate-900">{booking.requesterEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-slate-600">Phone</p>
                  <p className="font-semibold text-slate-900">{booking.requesterPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {booking.amenitiesRequired && booking.amenitiesRequired.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Required Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {booking.amenitiesRequired.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Additional Notes</h3>
              <p className="text-blue-800 text-sm">{booking.notes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <p className="text-xs font-semibold uppercase">Requested On</p>
              <p className="mt-1">{booking.requestedDate}</p>
            </div>
            {booking.approverName && (
              <div>
                <p className="text-xs font-semibold uppercase">Reviewed By</p>
                <p className="mt-1">{booking.approverName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          {canApproveReject ? (
            <>
              <button
                onClick={onReject}
                className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={onApprove}
                className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionModal = ({
  booking,
  action,
  rejectionReason,
  onReasonChange,
  onConfirm,
  onCancel,
  loading,
}) => {
  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className={`p-6 border-b ${isApprove ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h2 className={`text-xl font-bold ${isApprove ? 'text-green-900' : 'text-red-900'}`}>
            {isApprove ? '✓ Approve Booking?' : '✗ Reject Booking?'}
          </h2>
          <p className={`text-sm mt-1 ${isApprove ? 'text-green-700' : 'text-red-700'}`}>
            Booking ID: {booking.id}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              <strong>{booking.resourceName}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {booking.date} • {booking.startTime} - {booking.endTime}
            </p>
          </div>

          {!isApprove && (
            <>
              <label className="block text-sm font-semibold text-slate-900">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Explain why this booking is being rejected..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows="4"
              />
            </>
          )}

          {isApprove && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                The requester will receive an approval notification and the booking will be confirmed.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (!isApprove && !rejectionReason.trim())}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
              isApprove
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingManagement;
