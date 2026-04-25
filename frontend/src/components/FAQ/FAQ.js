import React from "react";

const faqs = [
  {
    question: "How do I book a campus resource?",
    answer: "Open Resources, choose an available room or facility, select the date, seats, and time slot, then submit the booking request.",
  },
  {
    question: "Where can I see my bookings?",
    answer: "Use the My Bookings page from the student dashboard to view upcoming bookings, cancellations, reschedules, and reviews.",
  },
  {
    question: "How do I report a maintenance issue?",
    answer: "From the student dashboard, choose Create Maintenance Ticket and add the resource, description, priority, and any supporting evidence.",
  },
  {
    question: "Can I update my profile details?",
    answer: "Yes. Select your profile avatar in the header to update your name, phone number, password, or account settings.",
  },
];

function FAQ() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[30px] border border-white/10 bg-primary p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Questions</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white">Frequently asked questions</h2>
          <div className="mt-8 grid gap-4">
            {faqs.map((item) => (
              <article key={item.question} className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <h3 className="text-lg font-bold text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default FAQ;
