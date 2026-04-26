import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Computer,
  Headphones,
  MapPin,
  School,
  Search,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";
import loginImage from "../../assets/images/login.jpg";
import signImage from "../../assets/images/sign.jpg";

const API_BASE_URL = "http://localhost:8082";

const fallbackSlides = [
  {
    id: "campus-services",
    name: "Campus Service Hub",
    location: "UniNex",
    description: "Book resources, manage tickets, and keep daily campus activity connected.",
    image: loginImage,
  },
  {
    id: "connected-workspace",
    name: "Connected Learning Spaces",
    location: "Students, technicians, and administrators",
    description: "A polished workspace for booking, support, approvals, and operational visibility.",
    image: signImage,
  },
];

const resourceTypeMeta = {
  LECTURE_HALL: { label: "Lecture Halls", icon: School },
  LAB: { label: "Labs", icon: Computer },
  MEETING_ROOM: { label: "Meeting Rooms", icon: Users },
  EQUIPMENT: { label: "Equipment", icon: Video },
  STUDY_AREA: { label: "Study Areas", icon: BookOpen },
};

function getDashboardPath(user) {
  switch (user?.role) {
    case "ADMIN":
      return "/admin-dashboard";
    case "TECHNICIAN":
      return "/technician-dashboard";
    case "STUDENT":
      return "/student-dashboard";
    default:
      return "/login";
  }
}

function formatType(type) {
  if (!type) {
    return "Campus Resource";
  }

  return resourceTypeMeta[type]?.label || type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getResourceImage(resource) {
  return resource?.images?.[0] || fallbackSlides[0].image;
}

function renderStars(rating) {
  const roundedRating = Math.round(Number(rating) || 0);

  return [1, 2, 3, 4, 5].map((value) => (
    <Star
      key={value}
      size={15}
      className={value <= roundedRating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}
      aria-hidden="true"
    />
  ));
}

function Home() {
  const [resources, setResources] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const storedUser = localStorage.getItem("user");
  let user = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      user = null;
    }
  }

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      setIsLoadingResources(true);
      try {
        const response = await fetch(`${API_BASE_URL}/resources?status=ACTIVE`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.message || data?.error || "Failed to load resources");
        }

        if (isMounted) {
          setResources(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setResources([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingResources(false);
        }
      }
    };

    loadResources();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroSlides = useMemo(() => {
    const resourceSlides = resources
      .filter((resource) => resource.images?.length)
      .slice(0, 6)
      .map((resource) => ({
        id: resource.id,
        name: resource.name,
        location: resource.location,
        description: resource.description,
        image: getResourceImage(resource),
        rating: resource.rating,
        reviews: resource.reviews,
        type: resource.type,
      }));

    return resourceSlides.length ? resourceSlides : fallbackSlides;
  }, [resources]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (activeSlideIndex >= heroSlides.length) {
      setActiveSlideIndex(0);
    }
  }, [activeSlideIndex, heroSlides.length]);

  const topRatedResources = useMemo(() => {
    return [...resources]
      .filter((resource) => Number(resource.rating) > 0 || Number(resource.reviews) > 0)
      .sort((left, right) => {
        const ratingDifference = (Number(right.rating) || 0) - (Number(left.rating) || 0);
        if (ratingDifference !== 0) {
          return ratingDifference;
        }
        return (Number(right.reviews) || 0) - (Number(left.reviews) || 0);
      })
      .slice(0, 3);
  }, [resources]);

  const resourceTypes = useMemo(() => {
    return Object.entries(resourceTypeMeta).map(([type, meta]) => ({
      type,
      ...meta,
      count: resources.filter((resource) => resource.type === type).length,
    }));
  }, [resources]);

  const activeSlide = heroSlides[activeSlideIndex] || heroSlides[0];

  const goToPreviousSlide = () => {
    setActiveSlideIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNextSlide = () => {
    setActiveSlideIndex((current) => (current + 1) % heroSlides.length);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl overflow-hidden rounded-[34px] bg-primary text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="relative min-h-[620px]">
          <img
            src={activeSlide.image}
            alt={activeSlide.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/20" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-primary to-transparent" />

          <div className="relative z-10 grid min-h-[620px] gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
            <div className="flex max-w-3xl flex-col justify-center">
              <p className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-accent">
                <SparkDot />
                UniNex
              </p>
              <h1 className="mt-6 text-5xl font-extrabold leading-tight text-white sm:text-6xl">
                Find and book the right campus space
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                Browse active resources, compare ratings, reserve seats, and keep campus services moving from one modern workspace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/resources"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-500"
                >
                  Explore resources
                  <Search size={17} aria-hidden="true" />
                </Link>
                {user ? (
                  <Link
                    to={getDashboardPath(user)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Go to dashboard
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <section className="w-full rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                      Featured resource
                    </p>
                    <h2 className="mt-2 text-3xl font-extrabold text-white">{activeSlide.name}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <MapPin size={16} aria-hidden="true" />
                      {activeSlide.location}
                    </p>
                  </div>
                  {activeSlide.rating ? (
                    <div className="rounded-2xl bg-white px-4 py-3 text-primary">
                      <div className="flex items-center gap-1">{renderStars(activeSlide.rating)}</div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {Number(activeSlide.rating).toFixed(1)} from {activeSlide.reviews || 0} reviews
                      </p>
                    </div>
                  ) : null}
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-200">{activeSlide.description}</p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="rounded-full bg-secondary/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                    {formatType(activeSlide.type)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={goToPreviousSlide}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextSlide}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Next slide"
                    >
                      <ChevronRight size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-7xl rounded-[30px] bg-primary px-6 py-8 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)] sm:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-accent">Resource Types</p>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-white">Explore campus spaces</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {resourceTypes.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.type}
                to="/resources"
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition hover:-translate-y-1 hover:border-accent/50 hover:bg-accent/10"
              >
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-accent transition group-hover:bg-white group-hover:text-primary">
                  <Icon size={25} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-extrabold text-white">{item.label}</h3>
                <p className="mt-1 text-sm text-slate-300">
                  {isLoadingResources ? "Loading" : `${item.count} resource${item.count === 1 ? "" : "s"}`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-7xl rounded-[30px] border border-primary/10 bg-white/95 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-accent">Most Rated</p>
            <h2 className="mt-2 text-3xl font-extrabold text-primary">Top-rated resources</h2>
          </div>
          <Link
            to="/resources"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            View all resources
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {topRatedResources.length ? (
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {topRatedResources.map((resource) => (
              <article key={resource.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
                <div className="relative h-52 overflow-hidden">
                  <img src={getResourceImage(resource)} alt={resource.name} className="h-full w-full object-cover" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                    {formatType(resource.type)}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-extrabold text-primary">{resource.name}</h3>
                    <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-sm font-bold text-primary">
                      <Star size={15} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />
                      {Number(resource.rating || 0).toFixed(1)}
                    </div>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={15} aria-hidden="true" />
                    {resource.location}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <div className="flex items-center gap-1">{renderStars(resource.rating)}</div>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {resource.reviews || 0} review{Number(resource.reviews) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Link
                      to="/resources"
                      className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-500"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <Star className="mx-auto text-slate-300" size={34} aria-hidden="true" />
            <h3 className="mt-3 text-lg font-extrabold text-primary">Top-rated resources will appear here</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ratings are shown after students review approved bookings.
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto mt-6 flex w-full max-w-7xl flex-col gap-4 rounded-[30px] border border-primary/10 bg-primary p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent">
            <Building2 size={24} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-extrabold">Built for daily campus work</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">Students, technicians, and admins each get the right workspace.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Bookings", icon: CalendarCheck },
            { label: "Support", icon: Headphones },
            { label: "Admin", icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <span key={item.label} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white">
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </span>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function SparkDot() {
  return <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_18px_rgba(34,197,94,0.75)]" aria-hidden="true" />;
}

export default Home;

