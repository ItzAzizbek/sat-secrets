import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Copy,
  ChevronRight,
  Shield,
  ArrowLeft,
  Check
} from "lucide-react";
import api from "../config/axios";

const CRYPTO_OPTIONS = [
  {
    id: 'btc',
    name: 'Bitcoin',
    network: 'Bitcoin',
    assets: 'Bitcoin',
    address: 'bc1qjq5zaqt6qqu7mfyrmdtk9ehpeu9eqsfgrxqzhn',
    warning: 'Send ONLY Bitcoin to this address. Sending any other asset will result in permanent loss.'
  },
  {
    id: 'ton',
    name: 'TON Network',
    network: 'TON',
    assets: 'Toncoin or USDT on TON',
    address: 'UQBv36DBWQXHv_DXR20kWNqRmIpcSyb2WmLYQYVKq2wN5YK4',
    warning: 'Send ONLY Toncoin or USDT on TON network.'
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    network: 'BNB Chain',
    assets: 'BNB or USDT on BNB Chain',
    address: '0xb788375031d3259d0f49548076c17998c522bd61',
    warning: 'Send ONLY BNB or USDT on BNB Chain.'
  }
];

const Checkout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Stepper State
  const [step, setStep] = useState(1); // 1: Selection, 2: Payment, 3: Verification
  const [selectedCrypto, setSelectedCrypto] = useState(null);

  // Form State
  const [file, setFile] = useState(null);
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const [warningExpanded, setWarningExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setErrorMsg("File too large. Maximum size is 5MB.");
        setFile(null);
        e.target.value = "";
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
      // Add crypto details for context
      formData.append("paymentMethod", selectedCrypto?.name || "Crypto");

      const res = await api.post("/orders", formData, {
        timeout: 60000,
      });

      // Always show success regardless of isReal status, per requirements
      setStatus("success");

    } catch (err) {
      console.log("Error:", err);
      if (err.response?.status === 403 && err.response.data?.redirect) {
        window.location.href = err.response.data.redirect;
        return;
      }

      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        setErrorMsg("Request timed out. Please try with a smaller image.");
      } else if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-gray-50 min-h-[calc(100vh-80px)]">
          <div className="bg-white p-12 border border-gray-200 shadow-xl max-w-lg w-full">
            <CheckCircle
              size={64}
              className="text-black mb-6 mx-auto stroke-1"
            />
            <h2 className="text-3xl font-black uppercase mb-6 tracking-tighter">
              Submission Received
            </h2>

            <div className="bg-gray-50 p-6 mb-8 text-left space-y-4 border-l-4 border-black">
              <div className="flex items-start gap-3">
                <Shield size={20} className="shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Verification in Process</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This is a controlled operational process. Your payment proof has been securely logged and is pending manual verification against the blockchain ledger.
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-600 pl-8">
                <p>Status: <span className="font-bold text-black">PENDING VERIFICATION</span></p>
                <p>Timeline: <span className="font-bold text-black">15-30 MINUTES</span></p>
                <p className="mt-2">
                  Once verified, access details will be sent to: <span className="font-bold text-black underline">{contactInfo}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-black text-white px-8 py-4 uppercase text-xs font-bold tracking-[0.2em] hover:bg-gray-800 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Side - Context & Trust */}
        <div className="w-full md:w-1/2 p-8 md:p-16 bg-gray-100 flex flex-col justify-between border-r border-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">
                Checkout
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
                <div className="flex justify-between items-center pt-6">
                  <span className="uppercase text-gray-400 font-bold tracking-wider">
                    Total Due
                  </span>
                  <span className="text-5xl font-black tracking-tight">{offer.price}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 mt-12">
              <div className="p-6 bg-white border-l-4 border-black shadow-sm">
                <h3 className="font-bold uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                  <Shield size={14} />
                  Privacy Notice
                </h3>
                <p className="text-xs leading-relaxed text-gray-600 font-medium">
                  This platform does not accept card payments because card based systems compromise user privacy. Financial privacy is treated as a core user right.
                </p>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                Encrypted & Secure Session
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Stepper Flow */}
        <div className="w-full md:w-1/2 p-8 md:p-16 bg-white flex flex-col justify-center relative">
          <div className="max-w-md mx-auto w-full">

            {/* Step Indicator */}
            <div className="flex items-center space-x-2 mb-12 text-[10px] font-bold uppercase tracking-widest text-gray-300">
              <span className={step >= 1 ? "text-black" : ""}>01 Select</span>
              <ChevronRight size={12} />
              <span className={step >= 2 ? "text-black" : ""}>02 Pay</span>
              <ChevronRight size={12} />
              <span className={step >= 3 ? "text-black" : ""}>03 Verify</span>
            </div>

            {/* Step 1: Crypto Selection */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Select Payment Method</h3>
                <p className="text-xs text-gray-500 mb-8 uppercase tracking-wide font-bold">
                  Single Payment Method: Cryptocurrency
                </p>

                <div className="space-y-4">
                  {CRYPTO_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedCrypto(option);
                        setStep(2);
                      }}
                      className="w-full text-left p-6 border-2 border-gray-100 hover:border-black hover:bg-gray-50 transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center z-10 relative">
                        <div>
                          <p className="font-bold text-lg uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                            {option.name}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                            Network: {option.network}
                          </p>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" size={20} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Payment Address */}
            {step === 2 && selectedCrypto && (
              <div className="animate-fade-in">
                <button
                  onClick={() => setStep(1)}
                  className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={12} /> Back
                </button>

                <h3 className="text-xl font-black uppercase tracking-tight mb-6">
                  Send Payment
                </h3>

                <div className="bg-gray-50 p-6 border-2 border-gray-100 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                        Selected Network
                      </span>
                      <span className="font-bold text-lg">{selectedCrypto.name}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
                      Deposit Address
                    </span>
                    <div
                      onClick={() => handleCopy(selectedCrypto.address)}
                      className="bg-white border border-gray-200 p-4 font-mono text-xs break-all cursor-pointer hover:border-black transition-colors relative group"
                    >
                      {selectedCrypto.address}
                      <div className="absolute top-2 right-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedCrypto.address)}
                      className="mt-2 text-[10px] uppercase font-bold tracking-widest underline hover:text-gray-600"
                    >
                      {copied ? "Copied to clipboard" : "Click to copy address"}
                    </button>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-[10px] text-yellow-800 font-bold uppercase tracking-wide leading-relaxed">
                    <AlertTriangle size={12} className="inline mr-1 mb-0.5" />
                    Warning: {selectedCrypto.warning}
                  </div>
                </div>

                <div className="mb-6">
                   <p className="text-xs font-bold uppercase tracking-wide mb-1">Accepted Assets:</p>
                   <p className="text-sm">{selectedCrypto.assets}</p>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full bg-black text-white py-4 font-black uppercase tracking-[0.2em] hover:bg-gray-900 transition-all active:scale-[0.99]"
                >
                  I have sent the funds
                </button>
              </div>
            )}

            {/* Step 3: Verification */}
            {step === 3 && (
              <div className="animate-fade-in">
                <button
                  onClick={() => setStep(2)}
                  className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={12} /> Back
                </button>

                <h3 className="text-xl font-black uppercase tracking-tight mb-8">
                  Verify Transaction
                </h3>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-400 group-focus-within:text-black">
                      Telegram / Contact Info
                    </label>
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full border-b-2 border-gray-100 py-3 text-lg focus:outline-none focus:border-black transition-colors rounded-none placeholder-gray-200"
                      placeholder="@username or email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-4 text-gray-400">
                      Upload Proof of Payment
                    </label>
                    <div
                      className={`relative border-2 ${file ? "border-black bg-gray-50" : "border-dashed border-gray-200 hover:border-gray-400"} p-10 text-center transition-all group cursor-pointer`}
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
                          {file ? file.name : "Click to Upload Screenshot"}
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
                          <p className="font-bold">FORMAL WARNING</p>
                          <p className="mt-1">Fraudulent proofs trigger immediate enforcement.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWarningExpanded(!warningExpanded)}
                        className="underline font-bold hover:text-red-800 transition-colors shrink-0"
                      >
                        {warningExpanded ? "COLLAPSE" : "DETAILS"}
                      </button>
                    </div>

                    {warningExpanded && (
                      <div className="mt-4 space-y-3 border-t border-red-200 pt-4 animate-fade-in normal-case tracking-normal text-[11px] leading-relaxed">
                        <p>We deploy automated tools to detect fake screenshots and forged transaction records.</p>
                        <p className="font-bold">Consequences of fraud:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Permanent blacklisting</li>
                          <li>IP address ban</li>
                          <li>Termination of support</li>
                        </ul>
                        <p>Proceed only with legitimate transactions.</p>
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
