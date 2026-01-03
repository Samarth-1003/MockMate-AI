import React from 'react';

const SocialLink = ({ href, icon, colorClass }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 transition-all duration-300 hover:text-white hover:scale-110 ${colorClass}`}
  >
    {icon}
  </a>
);

const TeamCard = ({ name, role, image, socials, delay }) => (
  <div className={`relative group p-1 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 hover:from-indigo-500/50 hover:to-purple-500/50 transition-all duration-500 hover:-translate-y-2 animate-fade-in ${delay}`}>
    
    {/* Inner Card Content */}
    <div className="bg-[#1e293b] rounded-[22px] p-8 flex flex-col items-center text-center h-full relative z-10 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

      {/* Profile Image */}
      <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-6 relative group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow duration-500">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full rounded-full object-cover border-4 border-[#1e293b] bg-gray-800"
          onError={(e) => {e.target.src = "https://ui-avatars.com/api/?name=" + name + "&background=random"}}
        />
      </div>

      {/* Text Info */}
      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-purple-300 transition-all">
        {name}
      </h3>
      <p className="text-indigo-400 font-medium text-sm mb-6 uppercase tracking-wider">
        {role}
      </p>

      {/* Social Icons */}
      <div className="flex gap-4 mt-auto">
        <SocialLink href={socials.linkedin} colorClass="hover:bg-[#0077b5]" icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>} />
        <SocialLink href={socials.instagram} colorClass="hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500" icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>} />
        <SocialLink href={`mailto:${socials.email}`} colorClass="hover:bg-red-500" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
      </div>
    </div>
  </div>
);

const ContactUs = () => {
  return (
    <section id="contact" className="relative w-full py-24 px-6 md:px-12 bg-[#0f172a] border-t border-white/5">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
        <span className="text-purple-400 font-bold tracking-widest text-xs uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          The Team
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white mt-6 mb-4">
          Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Creators</span>
        </h2>
        <p className="text-gray-400">
          Passionate developers building the future of AI interviews.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
        <TeamCard 
          name="Samarth Bhavsar"
          role="Backend Developer"
          image="/samarth.JPG" 
          delay="animation-delay-0"
          socials={{
            linkedin: "https://www.linkedin.com/in/samarth-bhavsar-33a50b355",
            instagram: "#",
            email: "samarthbhavsar1003@gmail.com"
          }}
        />
        <TeamCard 
          name="Kush Bhatt"
          role="Frontend Developer"
          image="/kush.JPG" 
          delay="animation-delay-200"
          socials={{
            linkedin: "https://www.linkedin.com/in/kushbhatt1902",
            instagram: "#",
            email: "bhattkush2170@gmail.com"
          }}
        />
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    </section>
  );
};

export default ContactUs;