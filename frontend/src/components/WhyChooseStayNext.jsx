import React from "react";
import {
  ShieldCheck,
  BadgePercent,
  Headset,
  Star,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Booking",
    color: "blue",
    description:
      "Your payments and personal information are protected with industry-standard encrypted security.",
  },
  {
    icon: BadgePercent,
    title: "Best Price Guarantee",
    color: "emerald",
    description:
      "Get the best hotel deals with transparent pricing and absolutely no hidden booking charges.",
  },
  {
    icon: Headset,
    title: "24/7 Support",
    color: "violet",
    description:
      "Our dedicated support team is available around the clock to assist your travel needs anytime.",
  },
  {
    icon: Star,
    title: "Premium Quality",
    color: "amber",
    description:
      "Carefully hand-picked hotels that meet high standards of comfort, quality, and hospitality.",
  },
];

const WhyChooseStayNext = () => {
  return (
    <section className="relative max-w-7xl mx-auto px-6 py-24 overflow-hidden">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-64 bg-blue-50/50 blur-[120px] -z-10 rounded-full" />

      {/* Heading */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles size={14} /> Why StayNext
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Experience travel, <span className="text-blue-600">redefined.</span>
        </h2>
        <p className="text-gray-500 text-lg font-medium">
          We combine cutting-edge technology with world-class hospitality to ensure your journey is perfect from start to finish.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
            >
              {/* Icon Container with dynamic gradient background */}
              <div className={`flex items-center justify-center h-16 w-16 rounded-2xl bg-gray-50 mb-6 group-hover:scale-110 transition-transform duration-500`}>
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-200 blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                    <Icon size={32} className="relative text-gray-900 group-hover:text-blue-600 transition-colors" />
                 </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                {feature.description}
              </p>

              {/* Decorative Corner Accent */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-10 transition-opacity">
                 <Icon size={64} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default WhyChooseStayNext;