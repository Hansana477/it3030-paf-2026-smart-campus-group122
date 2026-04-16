import React, { useState } from 'react';
import { 
  MapPin, 
  School,
  CheckCircle, 
  Search,
  Grid,
  List,

  BookOpen,
  Building,
  Users,
  Eye,
  RefreshCw,
  AlertCircle,

  Armchair,

  Zap,
  Plus,
  Edit,
  Trash2,
  Save,
  X,

  Video,
  Computer,
  Wrench,
  Shield,
  Loader2
} from 'lucide-react';

// ==============================================
// DUMMY DATA
// ==============================================
const DUMMY_RESOURCES = [
  {
    id: '1',
    name: 'Main Lecture Hall A',
    type: 'LECTURE_HALL',
    location: 'Building A, Floor 1',
    capacity: 120,
    status: 'ACTIVE',
    description: 'Large lecture hall with projector and sound system',
    amenities: ['Projector', 'Sound System', 'Air Conditioning', 'Whiteboard'],
    availabilityWindows: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '20:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '20:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '20:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
    ],
    seatingLayout: {
      rows: 8,
      cols: 15,
      seats: Array.from({ length: 120 }, (_, i) => ({
        id: `seat-${i+1}`,
        number: `${String.fromCharCode(65 + Math.floor(i / 15))}${(i % 15) + 1}`,
        type: i % 5 === 0 ? 'POWER_SEAT' : 'STANDARD',
        status: i < 100 ? 'AVAILABLE' : 'OCCUPIED',
        hasPower: i % 5 === 0,
        hasUsb: i % 10 === 0,
        isAccessible: i === 0,
        x: i % 15,
        y: Math.floor(i / 15),
      })),
    },
  },
  {
    id: '2',
    name: 'Computer Lab 301',
    type: 'LAB',
    location: 'Building C, Floor 3',
    capacity: 30,
    status: 'ACTIVE',
    description: 'Computer lab with 30 workstations',
    amenities: ['Computers', 'Printers', 'Software Licenses', 'Air Conditioning'],
    availabilityWindows: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
    seatingLayout: {
      rows: 6,
      cols: 5,
      seats: Array.from({ length: 30 }, (_, i) => ({
        id: `seat-${i+1}`,
        number: `WS${(i+1).toString().padStart(2, '0')}`,
        type: 'STANDARD',
        status: 'AVAILABLE',
        hasPower: true,
        hasUsb: true,
        isAccessible: false,
        x: i % 5,
        y: Math.floor(i / 5),
      })),
    },
  },
  {
    id: '3',
    name: 'Conference Room B',
    type: 'MEETING_ROOM',
    location: 'Building B, Floor 2',
    capacity: 12,
    status: 'ACTIVE',
    description: 'Executive meeting room with video conferencing',
    amenities: ['Video Conference', 'Smart Board', 'Coffee Machine', 'Whiteboard'],
    availabilityWindows: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '19:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '19:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '19:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '19:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
    ],
  },
  {
    id: '4',
    name: 'Portable Projector',
    type: 'EQUIPMENT',
    location: 'AV Room, Building A',
    capacity: 1,
    status: 'ACTIVE',
    description: 'Epson Portable Projector, 4000 lumens',
    amenities: ['HDMI Cable', 'VGA Cable', 'Remote Control', 'Carry Case'],
    availabilityWindows: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '16:00' },
    ],
    equipmentSpecs: {
      model: 'Epson EB-695Wi',
      serialNumber: 'EPS-2024-001',
      purchaseDate: '2024-01-15',
      warrantyExpiry: '2026-01-15',
    },
  },
  {
    id: '5',
    name: 'Silent Study Area',
    type: 'STUDY_AREA',
    location: 'Library, Floor 2',
    capacity: 50,
    status: 'ACTIVE',
    description: 'Quiet zone for individual study',
    amenities: ['WiFi', 'Power Outlets', 'Lockers', 'Water Dispenser'],
    availabilityWindows: [
      { dayOfWeek: 0, startTime: '10:00', endTime: '22:00' },
      { dayOfWeek: 1, startTime: '08:00', endTime: '23:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '23:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '23:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '23:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '20:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '18:00' },
    ],
    seatingLayout: {
      rows: 10,
      cols: 5,
      seats: Array.from({ length: 50 }, (_, i) => ({
        id: `seat-${i+1}`,
        number: `S${(i+1).toString().padStart(2, '0')}`,
        type: i % 3 === 0 ? 'POWER_SEAT' : (i % 7 === 0 ? 'PREMIUM' : 'STANDARD'),
        status: i < 35 ? 'AVAILABLE' : (i < 45 ? 'RESERVED' : 'OCCUPIED'),
        hasPower: i % 2 === 0,
        hasUsb: i % 4 === 0,
        isAccessible: i === 0,
        x: i % 5,
        y: Math.floor(i / 5),
      })),
    },
  },
  {
    id: '6',
    name: 'Group Study Room 204',
    type: 'STUDY_AREA',
    location: 'Library, Floor 2',
    capacity: 8,
    status: 'MAINTENANCE',
    description: 'Collaborative study room with whiteboard',
    amenities: ['Whiteboard', 'Power Outlets', 'Table', 'Chairs'],
    availabilityWindows: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '21:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '21:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '21:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '21:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '19:00' },
    ],
  },
];

const AMENITIES_LIST = [
  'Projector', 'Smart Board', 'Whiteboard', 'Sound System', 'Microphone',
  'Video Conference', 'Air Conditioning', 'Heating', 'WiFi', 'Power Outlets',
  'USB Ports', 'Printers', 'Scanning', 'Coffee Machine', 'Water Dispenser',
  'Lockers', 'Wheelchair Access', 'Natural Light', 'Blackout Curtains', 'Standing Desk'
];

const LOCATIONS = [
  'Building A, Floor 1', 'Building A, Floor 2', 'Building A, Floor 3',
  'Building B, Floor 1', 'Building B, Floor 2', 'Building B, Floor 3',
  'Building C, Floor 1', 'Building C, Floor 2', 'Building C, Floor 3',
  'Library, Floor 1', 'Library, Floor 2', 'Library, Floor 3',
  'Student Center', 'Lab Complex', 'AV Room'
];

// ==============================================
// MAIN COMPONENT
// ==============================================
const AdminResourceManagement = () => {
  const [resources, setResources] = useState(DUMMY_RESOURCES);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('details');
  
  // Resource form state
  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'LECTURE_HALL',
    location: '',
    capacity: 0,
    status: 'ACTIVE',
    description: '',
    amenities: [],
    availabilityWindows: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }
    ],
  });
  
  // Seat form state
  const [seatForm, setSeatForm] = useState({
    number: '',
    type: 'STANDARD',
    status: 'AVAILABLE',
    hasPower: false,
    hasUsb: false,
    isAccessible: false,
    x: 0,
    y: 0,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [seatGridRows, setSeatGridRows] = useState(4);
  const [seatGridCols, setSeatGridCols] = useState(4);

  // Show notification helper
  const showNotificationMessage = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || resource.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || resource.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Resource CRUD
  const handleAddResource = () => {
    setResourceForm({
      name: '',
      type: 'LECTURE_HALL',
      location: '',
      capacity: 0,
      status: 'ACTIVE',
      description: '',
      amenities: [],
      availabilityWindows: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
    });
    setIsEditing(false);
    setFormErrors({});
    setActiveTab('details');
    setShowResourceModal(true);
  };

  const handleEditResource = (resource) => {
    setResourceForm({ ...resource });
    setSelectedResource(resource);
    setIsEditing(true);
    setFormErrors({});
    setActiveTab('details');
    if (resource.seatingLayout) {
      setSeatGridRows(resource.seatingLayout.rows);
      setSeatGridCols(resource.seatingLayout.cols);
    }
    setShowResourceModal(true);
  };

  const handleDeleteResource = (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      setResources(prev => prev.filter(r => r.id !== resourceId));
      showNotificationMessage('Resource deleted successfully!', 'success');
    }
  };

  const validateResourceForm = () => {
    const errors = {};
    if (!resourceForm.name?.trim()) errors.name = 'Resource name is required';
    if (resourceForm.name && resourceForm.name.length < 2) errors.name = 'Name must be at least 2 characters';
    if (!resourceForm.location) errors.location = 'Location is required';
    if (!resourceForm.capacity || resourceForm.capacity < 1) errors.capacity = 'Capacity must be at least 1';
    if (!resourceForm.description?.trim()) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateSeats = (rows, cols) => {
    const seats = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
        seats.push({
          id: `seat-${row}-${col}`,
          number: seatNumber,
          type: 'STANDARD',
          status: 'AVAILABLE',
          hasPower: false,
          hasUsb: false,
          isAccessible: false,
          x: col,
          y: row,
        });
      }
    }
    return seats;
  };

  const handleSaveResource = () => {
    if (!validateResourceForm()) {
      showNotificationMessage('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (isEditing && selectedResource) {
        setResources(prev => prev.map(r => 
          r.id === selectedResource.id ? { ...r, ...resourceForm, id: r.id } : r
        ));
        showNotificationMessage('Resource updated successfully!', 'success');
      } else {
        const newResource = {
          id: Date.now().toString(),
          name: resourceForm.name,
          type: resourceForm.type,
          location: resourceForm.location,
          capacity: resourceForm.capacity,
          status: resourceForm.status,
          description: resourceForm.description,
          amenities: resourceForm.amenities || [],
          availabilityWindows: resourceForm.availabilityWindows || [],
          ...((resourceForm.type === 'LECTURE_HALL' || resourceForm.type === 'STUDY_AREA' || resourceForm.type === 'LAB') ? {
            seatingLayout: {
              rows: seatGridRows,
              cols: seatGridCols,
              seats: generateSeats(seatGridRows, seatGridCols),
            }
          } : {}),
          ...(resourceForm.type === 'EQUIPMENT' ? {
            equipmentSpecs: {
              model: '',
              serialNumber: '',
              purchaseDate: '',
              warrantyExpiry: '',
            }
          } : {}),
        };
        setResources(prev => [...prev, newResource]);
        showNotificationMessage('Resource created successfully!', 'success');
      }
      setShowResourceModal(false);
      setLoading(false);
    }, 500);
  };

  // Seat management
  const handleAddSeat = () => {
    if (!selectedResource) return;
    setSeatForm({
      number: '',
      type: 'STANDARD',
      status: 'AVAILABLE',
      hasPower: false,
      hasUsb: false,
      isAccessible: false,
      x: 0,
      y: 0,
    });
    setShowSeatModal(true);
  };

  const handleEditSeat = (seat) => {
    setSeatForm({ ...seat });
    setShowSeatModal(true);
  };

  const handleDeleteSeat = (seatId) => {
    if (!selectedResource || !selectedResource.seatingLayout) return;
    if (window.confirm('Delete this seat?')) {
      const updatedSeats = selectedResource.seatingLayout.seats.filter(s => s.id !== seatId);
      const updatedResource = {
        ...selectedResource,
        seatingLayout: {
          ...selectedResource.seatingLayout,
          seats: updatedSeats,
        },
      };
      setResources(prev => prev.map(r => r.id === selectedResource.id ? updatedResource : r));
      setSelectedResource(updatedResource);
      showNotificationMessage('Seat deleted successfully', 'success');
    }
  };

  const handleSaveSeat = () => {
    if (!selectedResource || !selectedResource.seatingLayout) return;
    
    if (!seatForm.number?.trim()) {
      showNotificationMessage('Seat number is required', 'error');
      return;
    }

    const updatedSeats = seatForm.id
      ? selectedResource.seatingLayout.seats.map(s => s.id === seatForm.id ? { ...s, ...seatForm } : s)
      : [...selectedResource.seatingLayout.seats, { ...seatForm, id: `seat-${Date.now()}` }];
    
    const updatedResource = {
      ...selectedResource,
      seatingLayout: {
        ...selectedResource.seatingLayout,
        seats: updatedSeats,
      },
    };
    
    setResources(prev => prev.map(r => r.id === selectedResource.id ? updatedResource : r));
    setSelectedResource(updatedResource);
    setShowSeatModal(false);
    showNotificationMessage(seatForm.id ? 'Seat updated successfully' : 'Seat added successfully', 'success');
  };

  const handleRegenerateSeats = () => {
    if (!selectedResource) return;
    if (window.confirm('This will replace all existing seats with a new grid. Continue?')) {
      const newSeats = generateSeats(seatGridRows, seatGridCols);
      const updatedResource = {
        ...selectedResource,
        seatingLayout: {
          rows: seatGridRows,
          cols: seatGridCols,
          seats: newSeats,
        },
      };
      setResources(prev => prev.map(r => r.id === selectedResource.id ? updatedResource : r));
      setSelectedResource(updatedResource);
      showNotificationMessage(`Generated ${newSeats.length} seats in ${seatGridRows}x${seatGridCols} layout`, 'success');
    }
  };

  // Availability management
  const addAvailabilityWindow = () => {
    setResourceForm(prev => ({
      ...prev,
      availabilityWindows: [...(prev.availabilityWindows || []), { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }]
    }));
  };

  const updateAvailabilityWindow = (index, field, value) => {
    const newWindows = [...(resourceForm.availabilityWindows || [])];
    newWindows[index] = { ...newWindows[index], [field]: value };
    setResourceForm(prev => ({ ...prev, availabilityWindows: newWindows }));
  };

  const removeAvailabilityWindow = (index) => {
    setResourceForm(prev => ({
      ...prev,
      availabilityWindows: (prev.availabilityWindows || []).filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity) => {
    const current = resourceForm.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    setResourceForm(prev => ({ ...prev, amenities: updated }));
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      OUT_OF_SERVICE: 'bg-red-100 text-red-700 border-red-200',
      MAINTENANCE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return styles[status] || styles.ACTIVE;
  };



  const getResourceTypeIcon = (type) => {
    switch(type) {
      case 'LECTURE_HALL': return <School className="w-5 h-5" />;
      case 'LAB': return <Computer className="w-5 h-5" />;
      case 'MEETING_ROOM': return <Users className="w-5 h-5" />;
      case 'EQUIPMENT': return <Video className="w-5 h-5" />;
      case 'STUDY_AREA': return <BookOpen className="w-5 h-5" />;
      default: return <Building className="w-5 h-5" />;
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Count statistics
  const stats = {
    total: resources.length,
    active: resources.filter(r => r.status === 'ACTIVE').length,
    maintenance: resources.filter(r => r.status === 'MAINTENANCE').length,
    outOfService: resources.filter(r => r.status === 'OUT_OF_SERVICE').length,
    totalSeats: resources.reduce((acc, r) => acc + (r.seatingLayout?.seats.length || 0), 0),
    availableSeats: resources.reduce((acc, r) => acc + (r.seatingLayout?.seats.filter(s => s.status === 'AVAILABLE').length || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-xl backdrop-blur-sm">
                  <Building className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Resource <span className="text-emerald-400">Management Hub</span>
                </h1>
              </div>
              <p className="text-slate-300 text-sm">Manage lecture halls, labs, equipment, and study areas for Smart Campus Operations</p>
            </div>
            <button
              onClick={handleAddResource}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              Add New Resource
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-500">Total Resources</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-xs text-slate-500">Active</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
              <div className="text-xs text-slate-500">Maintenance</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">{stats.outOfService}</div>
              <div className="text-xs text-slate-500">Out of Service</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSeats}</div>
              <div className="text-xs text-slate-500">Total Seats</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-50">
              <div className="text-2xl font-bold text-emerald-600">{stats.availableSeats}</div>
              <div className="text-xs text-slate-500">Available Seats</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notification */}
        {showNotification && (
          <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
            <div className={`${notificationType === 'success' ? 'bg-emerald-500' : notificationType === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2`}>
              {notificationType === 'success' ? <CheckCircle className="w-5 h-5" /> : notificationType === 'error' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              <span className="font-medium">{notificationMessage}</span>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ALL">All Types</option>
                <option value="LECTURE_HALL">Lecture Halls</option>
                <option value="LAB">Labs</option>
                <option value="MEETING_ROOM">Meeting Rooms</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="STUDY_AREA">Study Areas</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 px-3 ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 px-3 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={() => handleEditResource(resource)}
                onDelete={() => handleDeleteResource(resource.id)}
                onView={() => handleEditResource(resource)}
                getStatusBadge={getStatusBadge}
                getResourceTypeIcon={getResourceTypeIcon}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">Name</th>
                  <th className="text-left p-4 font-medium text-slate-600">Type</th>
                  <th className="text-left p-4 font-medium text-slate-600">Location</th>
                  <th className="text-center p-4 font-medium text-slate-600">Capacity</th>
                  <th className="text-center p-4 font-medium text-slate-600">Status</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((resource) => (
                  <tr key={resource.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{resource.name}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-sm">
                        {getResourceTypeIcon(resource.type)}
                        {resource.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{resource.location}</td>
                    <td className="p-4 text-center">{resource.capacity}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(resource.status)}`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditResource(resource)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteResource(resource.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredResources.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No resources found</p>
            <button onClick={handleAddResource} className="mt-4 text-emerald-500 hover:underline">
              Click here to add your first resource
            </button>
          </div>
        )}
      </div>

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {isEditing ? 'Edit Resource' : 'Create New Resource'}
              </h3>
              <button onClick={() => setShowResourceModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6">
              {['details', 'seats', 'availability'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === tab 
                      ? 'border-b-2 border-emerald-500 text-emerald-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'details' && 'Resource Details'}
                  {tab === 'seats' && 'Seat Layout'}
                  {tab === 'availability' && 'Availability Windows'}
                </button>
              ))}
            </div>
            
            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Resource Name *</label>
                      <input
                        type="text"
                        value={resourceForm.name || ''}
                        onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          formErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
                        }`}
                        placeholder="e.g., Main Lecture Hall"
                      />
                      {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Resource Type *</label>
                      <select
                        value={resourceForm.type}
                        onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="LAB">Lab</option>
                        <option value="MEETING_ROOM">Meeting Room</option>
                        <option value="EQUIPMENT">Equipment</option>
                        <option value="STUDY_AREA">Study Area</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Location *</label>
                      <select
                        value={resourceForm.location}
                        onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select location</option>
                        {LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                      {formErrors.location && <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Capacity *</label>
                      <input
                        type="number"
                        value={resourceForm.capacity || ''}
                        onChange={(e) => setResourceForm({ ...resourceForm, capacity: parseInt(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          formErrors.capacity ? 'border-red-500 bg-red-50' : 'border-slate-200'
                        }`}
                        min="1"
                      />
                      {formErrors.capacity && <p className="text-xs text-red-500 mt-1">{formErrors.capacity}</p>}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
                      <select
                        value={resourceForm.status}
                        onChange={(e) => setResourceForm({ ...resourceForm, status: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Description *</label>
                    <textarea
                      value={resourceForm.description || ''}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.description ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="Describe the resource..."
                    />
                    {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Amenities</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                      {AMENITIES_LIST.map(amenity => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            resourceForm.amenities?.includes(amenity)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {(resourceForm.type === 'EQUIPMENT') && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4" /> Equipment Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Model" className="px-3 py-2 border rounded-lg text-sm" />
                        <input type="text" placeholder="Serial Number" className="px-3 py-2 border rounded-lg text-sm" />
                        <input type="date" placeholder="Purchase Date" className="px-3 py-2 border rounded-lg text-sm" />
                        <input type="date" placeholder="Warranty Expiry" className="px-3 py-2 border rounded-lg text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'seats' && (
                <div className="space-y-5">
                  {(resourceForm.type === 'LECTURE_HALL' || resourceForm.type === 'STUDY_AREA' || resourceForm.type === 'LAB') ? (
                    <>
                      <div className="flex gap-4 items-end">
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-1">Rows</label>
                          <input
                            type="number"
                            value={seatGridRows}
                            onChange={(e) => setSeatGridRows(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-3 py-2 border border-slate-200 rounded-lg"
                            min="1"
                            max="20"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-1">Columns</label>
                          <input
                            type="number"
                            value={seatGridCols}
                            onChange={(e) => setSeatGridCols(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-3 py-2 border border-slate-200 rounded-lg"
                            min="1"
                            max="20"
                          />
                        </div>
                        <button
                          onClick={handleRegenerateSeats}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Generate {seatGridRows * seatGridCols} Seats
                        </button>
                      </div>
                      
                      {selectedResource?.seatingLayout && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-slate-700">Current Seat Layout</h4>
                            <button
                              onClick={handleAddSeat}
                              className="text-sm text-emerald-500 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Single Seat
                            </button>
                          </div>
                          <div className="border rounded-xl p-4 bg-slate-50 overflow-x-auto">
                            <div 
                              className="grid gap-2 min-w-max"
                              style={{ gridTemplateColumns: `repeat(${selectedResource.seatingLayout.cols}, 70px)` }}
                            >
                              {selectedResource.seatingLayout.seats.map((seat) => (
                                <div key={seat.id} className="relative group">
                                  <div className={`
                                    p-2 rounded-lg text-center transition-all border-2 cursor-pointer
                                    ${seat.status === 'AVAILABLE' ? 'bg-green-50 border-green-200 hover:bg-green-100' : 
                                      seat.status === 'OCCUPIED' ? 'bg-red-50 border-red-200' :
                                      seat.status === 'RESERVED' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}
                                  `} onClick={() => handleEditSeat(seat)}>
                                    <div className="flex flex-col items-center gap-1">
                                      <Armchair className={`w-4 h-4 ${
                                        seat.status === 'AVAILABLE' ? 'text-green-500' : 
                                        seat.status === 'OCCUPIED' ? 'text-red-500' : 'text-blue-500'
                                      }`} />
                                      <div className="text-xs font-medium">{seat.number}</div>
                                      {seat.hasPower && <Zap className="w-3 h-3 text-yellow-500 absolute top-0 right-0" />}
                                      {seat.isAccessible && <Shield className="w-3 h-3 text-blue-500 absolute bottom-0 left-0" />}
                                    </div>
                                  </div>
                                  <div className="absolute top-0 right-0 -mt-1 -mr-1 hidden group-hover:flex gap-1">
                                    <button onClick={() => handleEditSeat(seat)} className="p-0.5 bg-blue-500 text-white rounded hover:bg-blue-600">
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleDeleteSeat(seat.id)} className="p-0.5 bg-red-500 text-white rounded hover:bg-red-600">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-4 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div> Available</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div> Occupied</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div> Reserved</span>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Power Outlet</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Armchair className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Seat layout is only available for Lecture Halls, Labs, and Study Areas</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'availability' && (
                <div className="space-y-4">
                  {resourceForm.availabilityWindows?.map((window, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-3 bg-slate-50 rounded-lg">
                      <select
                        value={window.dayOfWeek}
                        onChange={(e) => updateAvailabilityWindow(idx, 'dayOfWeek', parseInt(e.target.value))}
                        className="px-3 py-2 border rounded-lg bg-white"
                      >
                        {daysOfWeek.map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={window.startTime}
                        onChange={(e) => updateAvailabilityWindow(idx, 'startTime', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={window.endTime}
                        onChange={(e) => updateAvailabilityWindow(idx, 'endTime', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      />
                      <button onClick={() => removeAvailabilityWindow(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addAvailabilityWindow} className="text-emerald-500 hover:underline flex items-center gap-1 text-sm">
                    <Plus className="w-4 h-4" /> Add Availability Window
                  </button>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => setShowResourceModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSaveResource} disabled={loading} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEditing ? 'Update Resource' : 'Create Resource'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Modal */}
      {showSeatModal && selectedResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{seatForm.id ? 'Edit Seat' : 'Add New Seat'}</h3>
              <button onClick={() => setShowSeatModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Seat Number *</label>
                <input
                  type="text"
                  value={seatForm.number || ''}
                  onChange={(e) => setSeatForm({ ...seatForm, number: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., A01, B12"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Seat Type</label>
                <select
                  value={seatForm.type}
                  onChange={(e) => setSeatForm({ ...seatForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="POWER_SEAT">Power Seat (with outlet)</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="WHEELCHAIR">Wheelchair Accessible</option>
                  <option value="GROUP_TABLE">Group Table</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
                <select
                  value={seatForm.status}
                  onChange={(e) => setSeatForm({ ...seatForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={seatForm.hasPower} onChange={(e) => setSeatForm({ ...seatForm, hasPower: e.target.checked })} className="rounded" />
                  <span className="text-sm">Power Outlet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={seatForm.hasUsb} onChange={(e) => setSeatForm({ ...seatForm, hasUsb: e.target.checked })} className="rounded" />
                  <span className="text-sm">USB Port</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={seatForm.isAccessible} onChange={(e) => setSeatForm({ ...seatForm, isAccessible: e.target.checked })} className="rounded" />
                  <span className="text-sm">Accessible</span>
                </label>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => setShowSeatModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveSeat} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">Save Seat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Resource Card Component
const ResourceCard = ({ resource, onEdit, onDelete, onView, getStatusBadge, getResourceTypeIcon }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              {getResourceTypeIcon(resource.type)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{resource.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <p className="text-xs text-slate-500">{resource.location}</p>
              </div>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(resource.status)}`}>
            {resource.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-3 line-clamp-2">{resource.description}</p>
      </div>
      
      <div className="p-4 bg-slate-50">
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <div className="text-lg font-bold text-slate-700">{resource.capacity}</div>
            <div className="text-xs text-slate-500">Capacity</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-700">{resource.amenities?.length || 0}</div>
            <div className="text-xs text-slate-500">Amenities</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-700">{resource.seatingLayout?.seats.length || '-'}</div>
            <div className="text-xs text-slate-500">Seats</div>
          </div>
        </div>
        {resource.amenities && resource.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.amenities.slice(0, 3).map((amenity, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-white rounded-full text-slate-600 border border-slate-200">
                {amenity}
              </span>
            ))}
            {resource.amenities.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-white rounded-full text-slate-500">+{resource.amenities.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button onClick={onView} className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button onClick={onEdit} className="px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={onDelete} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Info component
const Info = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default AdminResourceManagement;