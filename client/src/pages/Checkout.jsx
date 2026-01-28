import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import api from "../config/axios";

const Checkout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, processing, success, banned
  const [errorMsg, setErrorMsg] = useState("");
  const [warningExpanded, setWarningExpanded] = useState(false);

  if (!state) {
    return (
      <div className="p-10">
        Invalid Session.{" "}
        <a href="/" className="underline">
          Go Home
        </a>
      </div>
    );
  }

  const { offer, exam, date } = state;

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setErrorMsg("File too large. Maximum size is 5MB.");
        setFile(null);
        e.target.value = ""; // Reset input
        return;
      }
      if (!selectedFile.type.startsWith("image/")) {
        setErrorMsg("Only image files are allowed.");
        setFile(null);
        e.target.value = "";
        return;
      }
      setErrorMsg("");
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !contactInfo) return;

    // Double-check file size before upload
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg("File too large. Maximum size is 5MB.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    const formData = new FormData();
    formData.append("screenshot", file);
    formData.append("contactInfo", contactInfo);

    try {
      formData.append("userEmail", user?.email || "");
      formData.append("expectedAmount", state.expectedAmount != null && state.expectedAmount !== "" ? String(state.expectedAmount) : "none");

      const res = await api.post("/orders", formData, {
        timeout: 60000, // 60 second timeout
      });

      const { aiDecision } = res.data;
      if (aiDecision.isReal) {
        setStatus("success");
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.log("Axios error object:", err);
      console.log("Axios error:", err.response?.status, err.response?.data);

      if (err.response?.status === 403 && err.response.data?.redirect) {
        // Use direct browser navigation — safest
        window.location.href = err.response.data.redirect;
        return; // stop further execution
      }

      // All other errors
      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        setErrorMsg("Request timed out. Please try with a smaller image.");
        setStatus("error");
      } else if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
        setStatus("error");
      } else {
        setErrorMsg("Upload failed. Please try again.");
        setStatus("error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-gray-50">
          <div className="bg-white p-12 border border-green-200 shadow-xl max-w-lg w-full">
            <CheckCircle
              size={80}
              className="text-black mb-6 mx-auto stroke-1"
            />
            <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter">
              Verified
            </h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed uppercase tracking-wide">
              Transaction Authenticated. AI Analysis:{" "}
              <span className="text-black font-bold">REAL</span>.
              <br />
              Exam leaks will be dispatched to{" "}
              <span className="text-black font-bold border-b border-black">
                {contactInfo}
              </span>
              .
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-black text-white px-8 py-3 uppercase text-xs font-bold tracking-[0.2em] hover:bg-gray-800"
            >
              Return to Grid
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Side - Details */}
        <div className="w-full md:w-1/2 p-8 md:p-16 bg-gray-100 flex flex-col justify-center border-r border-white">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">
              Purchase Verification
            </h2>

            <div className="space-y-6 text-sm">
              <div className="flex justify-between border-b-2 border-gray-200 pb-2">
                <span className="uppercase text-gray-400 font-bold tracking-wider">
                  Item
                </span>
                <span className="font-bold">{offer.title}</span>
              </div>
              <div className="flex justify-between border-b-2 border-gray-200 pb-2">
                <span className="uppercase text-gray-400 font-bold tracking-wider">
                  Date
                </span>
                <span className="font-bold">
                  {exam} ({date})
                </span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="uppercase text-gray-400 font-bold tracking-wider">
                  Total
                </span>
                <span className="text-4xl font-black">{offer.price}</span>
              </div>
            </div>

            <div className="mt-16 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Send Payment to Crypto Address
              </p>
              
              <div className="space-y-3">
                {[
                  { label: 'BTC (Bitcoin)', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
                  { label: 'ETH (Ethereum)', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
                  { label: 'USDT (ERC20)', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' }
                ].map((item) => (
                  <div key={item.label} className="bg-white p-4 border-2 border-gray-100 hover:border-black transition-all group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-black transition-colors">{item.label}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item.address);
                          alert(`${item.label} address copied!`);
                        }}
                        className="text-[8px] font-black uppercase tracking-widest border border-gray-200 px-2 py-0.5 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-[11px] break-all leading-relaxed bg-gray-50 p-2 border border-gray-100 group-hover:bg-white group-hover:border-black/10 transition-all font-bold">
                      {item.address}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 border-l-2 border-blue-500 p-4 text-[10px] uppercase tracking-wide text-blue-600 font-bold leading-relaxed">
                <p>Ensure you send the EXACT amount specified above. AI verification will fail if the amount is mismatched.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="group">
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-400 group-focus-within:text-black">
                  Telegram / Contact
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full border-b-2 border-gray-100 py-3 text-lg focus:outline-none focus:border-black transition-colors rounded-none placeholder-gray-200"
                  placeholder="@username"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-4 text-gray-400">
                  Payment Evidence
                </label>
                <div
                  className={`relative border-2 ${file ? "border-black bg-gray-50" : "border-dashed border-gray-200 hover:border-gray-400"} p-12 text-center transition-all group cursor-pointer`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="pointer-events-none flex flex-col items-center">
                    <Upload
                      size={24}
                      className={`mb-4 ${file ? "text-black" : "text-gray-300 group-hover:text-gray-400"}`}
                    />
                    <span className="uppercase text-xs font-bold tracking-widest">
                      {file ? file.name : "Upload Screenshot"}
                    </span>
                    {file ? (
                      <span className="text-[10px] text-gray-400 mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 mt-2">
                        Max 5MB • Images only
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-l-2 border-red-500 p-4 text-[10px] uppercase tracking-wide text-red-600">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3">
                    <AlertTriangle size={14} className="shrink-0" />
                    <div>
                      <p className="font-bold">FORMAL WARNING AND ZERO TOLERANCE NOTICE</p>
                      <p className="mt-1">We actively deploy AI driven verification tools to detect fraudulent payment proofs.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setWarningExpanded(!warningExpanded)}
                    className="underline font-bold hover:text-red-800 transition-colors shrink-0"
                  >
                    {warningExpanded ? "COLLAPSE" : "EXPAND"}
                  </button>
                </div>
                
                {warningExpanded && (
                  <div className="mt-4 space-y-4 border-t border-red-200 pt-4 animate-fade-in normal-case tracking-normal text-[11px] leading-relaxed">
                    <p>We actively deploy automated systems and AI driven verification tools to detect fake screenshots, forged transaction records, and fraudulent payment proofs.</p>
                    <p>Any attempt to upload, submit, or circulate fake or fraudulent proof of payment will trigger immediate enforcement actions.</p>
                    <p className="font-bold">Consequences are absolute and irreversible:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Permanent blacklisting from all current and future products and services</li>
                      <li>Permanent IP address ban across all platforms and access points</li>
                      <li>Permanent termination of access to customer support and communication channels</li>
                      <li>Internal flagging of the account for fraud prevention systems</li>
                    </ul>
                    <p>There are no appeals, no reviews, and no exceptions.</p>
                    <p>All activity is logged, analyzed, and retained for security and compliance purposes.</p>
                    <p>Proceed only with legitimate transactions. Any deviation will be treated as intentional fraud.</p>
                    <p className="font-bold border-t border-red-200 pt-2 mt-2 uppercase tracking-widest text-[10px]">Compliance is mandatory.</p>
                  </div>
                )}
              </div>

              {errorMsg && (
                <p className="text-red-600 text-xs font-bold uppercase tracking-wide">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-5 font-black uppercase tracking-[0.25em] hover:bg-gray-900 flex justify-center items-center gap-3 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Verify & Submit"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
