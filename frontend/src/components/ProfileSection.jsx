const ProfileSection = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-3xl text-[#1E1E1E] mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Profile
        </h2>
        <p className="text-sm text-[#8a8375]">Your personal information and membership details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E7DED1] rounded-xl p-8">
          <h3 className="text-sm font-semibold text-[#1E1E1E] uppercase tracking-widest mb-8">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { label: "Full Name", value: user?.name },
              { label: "Email Address", value: user?.email },
              { label: "Role", value: user?.role === "admin" ? "Administrator" : "Member" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-[#8a8375] uppercase tracking-[0.15em] mb-2">
                  {label}
                </p>
                <p className="text-base text-[#1E1E1E] border-b border-[#E7DED1] pb-3">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;