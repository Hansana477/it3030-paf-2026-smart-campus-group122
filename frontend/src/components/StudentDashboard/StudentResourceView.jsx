import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Calendar,
  Search,
  Grid,
  List,
  BookOpen,
  Building,
  Users,
  Eye,
  Wifi,
  Zap,
  Coffee,
  Video,
  Monitor,
  Computer,
  School,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Speaker,
  Thermometer,
  Armchair,
  Table,
  Clock as ClockIcon,
  Loader2,
  Heart,
  HeartOff
} from 'lucide-react';

const AMENITY_ICONS = {
  'WiFi': <Wifi className="w-4 h-4" />,
  'Power Outlets': <Zap className="w-4 h-4" />,
  'Projector': <Video className="w-4 h-4" />,
  'Smart Board': <Monitor className="w-4 h-4" />,
  'Computers': <Computer className="w-4 h-4" />,
  'Coffee Machine': <Coffee className="w-4 h-4" />,
  'Air Conditioning': <Thermometer className="w-4 h-4" />,
  'Sound System': <Speaker className="w-4 h-4" />,
  'Whiteboard': <Table className="w-4 h-4" />,
};

const API_BASE_URL = 'http://localhost:8082';

const StudentResourceView = () => {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAmenity, setSelectedAmenity] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/resources?status=ACTIVE`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.message || data?.error || 'Failed to load resources');
        }

        setResources(Array.isArray(data) ? data : []);
      } catch (error) {
        showNotificationMessage(error.message || 'Failed to load resources', 'error');
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  // Get unique amenities for filter
  const allAmenities = ['ALL', ...new Set(resources.flatMap(r => r.amenities || []))];

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = (resource.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (resource.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (resource.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || resource.type === selectedType;
    const matchesAmenity = selectedAmenity === 'ALL' || (resource.amenities || []).includes(selectedAmenity);
    const matchesStatus = resource.status === 'ACTIVE'; // Only show active resources to students
    return matchesSearch && matchesType && matchesAmenity && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedAmenity]);

  const showNotificationMessage = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleViewDetails = (resource) => {
    setSelectedResource(resource);
    setSelectedImageIndex(0);
    setShowDetailsModal(true);
  };

  const showPreviousImage = () => {
    const imageCount = selectedResource?.images?.length || 0;
    if (imageCount < 2) return;
    setSelectedImageIndex((current) => (current - 1 + imageCount) % imageCount);
  };

  const showNextImage = () => {
    const imageCount = selectedResource?.images?.length || 0;
    if (imageCount < 2) return;
    setSelectedImageIndex((current) => (current + 1) % imageCount);
  };

  const toggleFavorite = (resourceId) => {
    if (favorites.includes(resourceId)) {
      setFavorites(favorites.filter(id => id !== resourceId));
      showNotificationMessage('Removed from favorites', 'info');
    } else {
      setFavorites([...favorites, resourceId]);
      showNotificationMessage('Added to favorites', 'success');
    }
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

  const getResourceTypeColor = (type) => {
    switch(type) {
      case 'LECTURE_HALL': return 'bg-purple-100 text-purple-700';
      case 'LAB': return 'bg-blue-100 text-blue-700';
      case 'MEETING_ROOM': return 'bg-orange-100 text-orange-700';
      case 'EQUIPMENT': return 'bg-cyan-100 text-cyan-700';
      case 'STUDY_AREA': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAvailableSeatsCount = (resource) => {
    if (!resource.seatingLayout) return 0;
    return resource.seatingLayout.seats.filter(s => s.status === 'AVAILABLE').length;
  };

  const getOccupancyRate = (resource) => {
    if (!resource.seatingLayout) return 0;
    const total = resource.seatingLayout.seats.length;
    const occupied = resource.seatingLayout.seats.filter(s => s.status === 'OCCUPIED').length;
    return Math.round((occupied / total) * 100);
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayDate = getDateKey(new Date());
  const formatAvailabilityDate = (date) => {
    if (!date) return null;
    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  const getTodayHours = (availabilityWindows) => {
    const todayWindow = availabilityWindows?.find(w => w.date === todayDate) ||
                        availabilityWindows?.find(w => !w.date && w.dayOfWeek === today);
    if (todayWindow) {
      return `${todayWindow.startTime} - ${todayWindow.endTime}`;
    }
    return 'Closed';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Building className="w-4 h-4 text-emerald-400" />
              <span className="text-sm">Smart Campus Resources</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect Study Space
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Browse and book lecture halls, labs, study areas, and equipment available across campus
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification */}
        {showNotification && (
          <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
            <div className={`${notificationType === 'success' ? 'bg-emerald-500' : notificationType === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2`}>
              {notificationType === 'success' ? <CheckCircle className="w-5 h-5" /> : notificationType === 'error' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              <span className="font-medium">{notificationMessage}</span>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-[140px]"
            >
              <option value="ALL">All Types</option>
              <option value="LECTURE_HALL">Lecture Halls</option>
              <option value="LAB">Labs</option>
              <option value="MEETING_ROOM">Meeting Rooms</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="STUDY_AREA">Study Areas</option>
            </select>
            
            {/* Amenity Filter */}
            <select
              value={selectedAmenity}
              onChange={(e) => setSelectedAmenity(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-[160px]"
            >
              {allAmenities.map(amenity => (
                <option key={amenity} value={amenity}>
                  {amenity === 'ALL' ? 'All Amenities' : amenity}
                </option>
              ))}
            </select>
            
            {/* View Toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 px-4 ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 px-4 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Active Filters */}
          {(searchTerm || selectedType !== 'ALL' || selectedAmenity !== 'ALL') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedType !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
                  Type: {selectedType.replace('_', ' ')}
                  <button onClick={() => setSelectedType('ALL')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedAmenity !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
                  Amenity: {selectedAmenity}
                  <button onClick={() => setSelectedAmenity('ALL')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">
            Found <span className="font-semibold text-slate-700">{filteredResources.length}</span> resources
          </p>
          {favorites.length > 0 && (
            <p className="text-sm text-emerald-600">
              ❤️ {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Resources Display */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isFavorite={favorites.includes(resource.id)}
                onViewDetails={() => handleViewDetails(resource)}
                onToggleFavorite={() => toggleFavorite(resource.id)}
                getResourceTypeIcon={getResourceTypeIcon}
                getResourceTypeColor={getResourceTypeColor}
                getAvailableSeatsCount={getAvailableSeatsCount}
                getOccupancyRate={getOccupancyRate}
                getTodayHours={getTodayHours}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedResources.map((resource) => (
              <ResourceListItem
                key={resource.id}
                resource={resource}
                isFavorite={favorites.includes(resource.id)}
                onViewDetails={() => handleViewDetails(resource)}
                onToggleFavorite={() => toggleFavorite(resource.id)}
                getResourceTypeIcon={getResourceTypeIcon}
                getResourceTypeColor={getResourceTypeColor}
                getAvailableSeatsCount={getAvailableSeatsCount}
                getTodayHours={getTodayHours}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === i + 1
                    ? 'bg-emerald-500 text-white'
                    : 'border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {filteredResources.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No resources found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Resource Details Modal */}
      {showDetailsModal && selectedResource && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getResourceTypeColor(selectedResource.type)}`}>
                  {getResourceTypeIcon(selectedResource.type)}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{selectedResource.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleFavorite(selectedResource.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {favorites.includes(selectedResource.id) ? (
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  ) : (
                    <HeartOff className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Images */}
              {selectedResource.images?.length > 0 && (
                <div className="mb-6">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={selectedResource.images[selectedImageIndex]}
                      alt={`${selectedResource.name} view ${selectedImageIndex + 1}`}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute left-3 top-3 rounded-lg bg-white/90 p-2 text-slate-700 shadow">
                      {getResourceTypeIcon(selectedResource.type)}
                    </div>
                    {selectedResource.images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={showPreviousImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white"
                          aria-label="Previous resource image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={showNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white"
                          aria-label="Next resource image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                          {selectedImageIndex + 1} / {selectedResource.images.length}
                        </span>
                      </>
                    )}
                  </div>
                  {selectedResource.images.length > 1 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {selectedResource.images.map((imageUrl, imageIndex) => (
                        <button
                          key={`${imageUrl}-${imageIndex}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(imageIndex)}
                          className={`overflow-hidden rounded-lg border ${
                            selectedImageIndex === imageIndex ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${selectedResource.name} thumbnail ${imageIndex + 1}`}
                            className="h-24 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Description */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                <p className="text-slate-600">{selectedResource.description}</p>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{selectedResource.location}</span>
                  </div>
                  {selectedResource.type !== 'EQUIPMENT' && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Capacity: {selectedResource.capacity} people</span>
                    </div>
                  )}
                  {selectedResource.seatingLayout && (
                    <>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Armchair className="w-4 h-4" />
                        <span className="text-sm">
                          Total Seats: {selectedResource.seatingLayout.seats.length} | 
                          Available: {getAvailableSeatsCount(selectedResource)} | 
                          Occupancy: {getOccupancyRate(selectedResource)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${100 - getOccupancyRate(selectedResource)}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-sm">Today's Hours: {getTodayHours(selectedResource.availabilityWindows)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm">{selectedResource.rating} ⭐ ({selectedResource.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              
              {/* Amenities */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedResource.amenities.map((amenity, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700">
                      {AMENITY_ICONS[amenity] || <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Availability Schedule */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Weekly Schedule
                </h4>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedResource.availabilityWindows?.map((window, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-sm font-medium text-slate-700">{daysOfWeek[window.dayOfWeek]}</span>
                        {window.date && (
                          <span className="text-xs text-slate-400">{formatAvailabilityDate(window.date)}</span>
                        )}
                        <span className="text-sm text-slate-500">{window.startTime} - {window.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Seat Map Preview for Study Areas */}
              {selectedResource.seatingLayout && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-800 mb-3">Seat Map Preview</h4>
                  <div className="border rounded-xl p-4 bg-slate-50 overflow-x-auto">
                    <div 
                      className="grid gap-2 min-w-max"
                      style={{ gridTemplateColumns: `repeat(${selectedResource.seatingLayout.cols}, 50px)` }}
                    >
                      {selectedResource.seatingLayout.seats.slice(0, 30).map((seat) => (
                        <div
                          key={seat.id}
                          className={`
                            p-1.5 rounded-lg text-center text-xs border
                            ${seat.status === 'AVAILABLE' ? 'bg-green-100 border-green-300 cursor-pointer hover:bg-green-200' : 
                              seat.status === 'OCCUPIED' ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300'}
                          `}
                          title={`Seat ${seat.number} - ${seat.status}`}
                        >
                          {seat.number}
                          {seat.hasPower && <Zap className="w-2 h-2 inline ml-1 text-yellow-600" />}
                        </div>
                      ))}
                    </div>
                    {selectedResource.seatingLayout.seats.length > 30 && (
                      <p className="text-center text-xs text-slate-400 mt-3">
                        +{selectedResource.seatingLayout.seats.length - 30} more seats
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div> Available</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div> Occupied</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div> Reserved</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-600" /> Power Outlet</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end bg-slate-50">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Resource Card Component (Grid View)
const ResourceCard = ({ 
  resource, isFavorite, onViewDetails, onToggleFavorite,
  getResourceTypeIcon, getResourceTypeColor, getAvailableSeatsCount, getOccupancyRate, getTodayHours 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="relative h-48 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700">
          {getResourceTypeIcon(resource.type)}
        </div>
        <div className="absolute top-3 left-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-slate-700">
          {getResourceTypeIcon(resource.type)}
        </div>
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
        >
          {isFavorite ? (
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          ) : (
            <HeartOff className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
            {resource.type.replace('_', ' ')}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{resource.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-3 h-3 text-slate-400" />
          <p className="text-xs text-slate-500">{resource.location}</p>
        </div>
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{resource.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-slate-700">{resource.rating}</span>
            <span className="text-xs text-slate-400">({resource.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{getTodayHours(resource.availabilityWindows)}</span>
          </div>
        </div>
        
        {resource.seatingLayout && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Available Seats</span>
              <span>{getAvailableSeatsCount(resource)} / {resource.seatingLayout.seats.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(getAvailableSeatsCount(resource) / resource.seatingLayout.seats.length) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onViewDetails}
            className="flex-1 px-3 py-2 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <button className="px-3 py-2 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center justify-center gap-1">
            <Calendar className="w-4 h-4" />
            Book
          </button>
        </div>
      </div>
    </div>
  );
};

// Resource List Item Component (List View)
const ResourceListItem = ({ 
  resource, isFavorite, onViewDetails, onToggleFavorite,
  getResourceTypeIcon, getResourceTypeColor, getAvailableSeatsCount, getTodayHours 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700">
            {getResourceTypeIcon(resource.type)}
          </div>
          <div className="absolute left-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-700 shadow-sm">
            {getResourceTypeIcon(resource.type)}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{resource.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                  {resource.type.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-slate-600">{resource.rating}</span>
                </div>
              </div>
            </div>
            <button onClick={onToggleFavorite} className="p-1.5 hover:bg-slate-100 rounded-lg">
              {isFavorite ? (
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              ) : (
                <HeartOff className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
          
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{resource.description}</p>
          
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{resource.location}</span>
            </div>
            {resource.type !== 'EQUIPMENT' && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Capacity: {resource.capacity}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Today: {getTodayHours(resource.availabilityWindows)}</span>
            </div>
            {resource.seatingLayout && (
              <div className="flex items-center gap-1">
                <Armchair className="w-3 h-3" />
                <span>Available: {getAvailableSeatsCount(resource)}/{resource.seatingLayout.seats.length}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={onViewDetails}
              className="px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button className="px-3 py-1.5 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResourceView;
