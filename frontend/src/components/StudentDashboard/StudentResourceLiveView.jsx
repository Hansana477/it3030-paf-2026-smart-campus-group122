import React, { useState } from "react";
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Star,
  Eye,
} from "lucide-react";

// -------------------------
// DUMMY DATA
// -------------------------
const RESOURCES = [
  {
    id: "1",
    name: "Main Lecture Hall A",
    location: "Building A",
    capacity: 120,
    type: "LECTURE_HALL",
    rating: 4.5,
    description: "Large lecture hall with projector and sound system.",
  },
  {
    id: "2",
    name: "Computer Lab 301",
    location: "Building C",
    capacity: 30,
    type: "LAB",
    rating: 4.8,
    description: "High performance computers for programming.",
  },
  {
    id: "3",
    name: "Silent Study Area",
    location: "Library Floor 2",
    capacity: 50,
    type: "STUDY_AREA",
    rating: 4.9,
    description: "Quiet zone for focused study.",
  },
];

// -------------------------
// MAIN COMPONENT
// -------------------------
export default function StudentResourceLiveView() {
  const [selectedResource, setSelectedResource] = useState(null);

  // booking state (LIVE)
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSelect = (resource) => {
    setSelectedResource(resource);
    setDate("");
    setStartTime("");
    setEndTime("");
  };

  const handleBook = () => {
    if (!selectedResource) return;
    if (!date || !startTime || !endTime) {
      alert("Fill all fields");
      return;
    }

    alert(
      `Booked: ${selectedResource.name} on ${date} (${startTime} - ${endTime})`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">

      {/* ---------------- LEFT: CATALOG ---------------- */}
      <div className="lg:col-span-2 space-y-4">

        <h1 className="text-2xl font-bold">Student Resources</h1>

        {RESOURCES.map((res) => (
          <div
            key={res.id}
            onClick={() => handleSelect(res)}
            className={`p-4 bg-white rounded-xl border cursor-pointer hover:shadow-md transition
              ${selectedResource?.id === res.id ? "border-emerald-500" : ""}`}
          >
            <div className="flex justify-between">
              <h2 className="font-bold">{res.name}</h2>
              <div className="flex items-center gap-1 text-yellow-500 text-sm">
                <Star className="w-4 h-4" />
                {res.rating}
              </div>
            </div>

            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> {res.location}
            </p>

            <p className="text-sm text-slate-600 mt-2">
              {res.description}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Capacity: {res.capacity}
            </p>
          </div>
        ))}
      </div>

      {/* ---------------- RIGHT: LIVE BOOKING PANEL ---------------- */}
      <div className="bg-white rounded-xl border p-4 h-fit sticky top-6">

        {!selectedResource ? (
          <div className="text-center text-slate-400 py-10">
            👈 Select a resource
          </div>
        ) : (
          <>
            {/* HEADER */}
            <h2 className="text-xl font-bold mb-1">
              {selectedResource.name}
            </h2>

            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {selectedResource.location}
            </p>

            <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
              <Users className="w-4 h-4" />
              Capacity: {selectedResource.capacity}
            </p>

            <div className="border-t pt-3 space-y-3">

              {/* DATE */}
              <div>
                <label className="text-sm">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              {/* TIME */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm">Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm">End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              {/* LIVE PREVIEW */}
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                <p><b>Preview:</b></p>
                <p>{date || "Select date"}</p>
                <p>{startTime} - {endTime}</p>
              </div>

              {/* BOOK BUTTON */}
              <button
                onClick={handleBook}
                className="w-full bg-emerald-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Book Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}