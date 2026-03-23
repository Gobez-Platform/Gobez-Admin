import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft, GraduationCap, CheckCircle } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* LEFT — Teal branding panel */}
      <div
        className="relative hidden md:flex flex-col items-center justify-center w-5/12 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #2dd4bf 0%, #0d9488 60%, #0f766e 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="absolute bottom-1/3 right-0 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* Logo + Name */}
        <div className="relative flex flex-col items-center gap-5">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.25)", boxShadow: "0 12px 36px rgba(0,0,0,0.15)" }}
          >
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "1.6rem", letterSpacing: "0.01em" }}>
            Gobez Admin
          </span>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", textAlign: "center", maxWidth: "200px", lineHeight: 1.7 }}>
            Manage your tutoring platform with ease
          </p>
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 py-12"
        style={{ background: "#f8fafc" }}
      >
        {/* Mobile logo */}
        <div className="flex md:hidden flex-col items-center gap-3 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "#0d9488", boxShadow: "0 8px 24px rgba(13,148,136,0.35)" }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span style={{ color: "#0d9488", fontWeight: 700, fontSize: "1.2rem" }}>Gobez Admin</span>
        </div>

        <div className="w-full" style={{ maxWidth: "400px" }}>
          {submitted ? (
            /* Success State */
            <div className="flex flex-col items-center gap-6 text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(13,148,136,0.1)" }}
              >
                <CheckCircle className="w-10 h-10" style={{ color: "#0d9488" }} />
              </div>
              <div>
                <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.6rem", letterSpacing: "-0.01em" }}>
                  Check your inbox
                </h2>
                <p className="mt-2" style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.7 }}>
                  We've sent a reset link to{" "}
                  <span style={{ color: "#0d9488", fontWeight: 600 }}>{email}</span>.
                  <br />Check your spam folder if you don't see it.
                </p>
              </div>
              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 py-3 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(13,148,136,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #0f766e, #0d9488)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #0d9488, #14b8a6)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.8rem", letterSpacing: "-0.01em" }}>
                  Forgot Password?
                </h1>
                <p className="mt-1.5" style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                  Enter your email to receive a password reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label style={{ color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Mail className="w-4 h-4" style={{ color: "#0d9488" }} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-4 py-3 outline-none transition-all duration-200"
                      style={{
                        background: "white",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        color: "#0f172a",
                        fontSize: "0.875rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                      onFocus={(e) => {
                        e.target.style.border = "1.5px solid #0d9488";
                        e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.border = "1.5px solid #e2e8f0";
                        e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                      }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 transition-all duration-200"
                  style={{
                    background: isLoading
                      ? "linear-gradient(135deg, #5eead4, #2dd4bf)"
                      : "linear-gradient(135deg, #0d9488, #14b8a6)",
                    borderRadius: "12px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(13,148,136,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = "linear-gradient(135deg, #0f766e, #0d9488)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(13,148,136,0.45)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = "linear-gradient(135deg, #0d9488, #14b8a6)";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(13,148,136,0.35)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,148,136,0.25)";
                    }
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                {/* Back to Login */}
                <div className="flex justify-center">
                  <Link
                    to="/"
                    className="flex items-center gap-1.5 transition-colors duration-150"
                    style={{ color: "#0d9488", fontWeight: 500, fontSize: "0.82rem", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#0f766e")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#0d9488")}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}

          <p className="text-center mt-8" style={{ color: "#cbd5e1", fontSize: "0.72rem" }}>
            Admin access only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
