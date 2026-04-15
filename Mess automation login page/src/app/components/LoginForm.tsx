import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Webcam from 'react-webcam';
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';
import logo from "../../assets/IIT_Kanpur_Logo.svg.png";
import campusImage from "../../assets/photo-1541339907198-e08756dedf3f.avif";
export function LoginForm() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null); 
  
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'password' | 'face'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [showWebcam, setShowWebcam] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'manager'>('student');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [newPassword, setNewPassword] = useState('');

  const fetchWithTimeout = async (url: string, options: any, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  const [isProcessing, setIsProcessing] = useState(false); 
  const [scanProgress, setScanProgress] = useState(0); 

  const captureFrames = async (numFrames = 30, intervalMs = 150): Promise<string[]> => {
    const images: string[] = [];
    return new Promise((resolve) => {
      let count = 0;
      const interval = setInterval(() => {
        if (webcamRef.current) {
          const img = webcamRef.current.getScreenshot();
          if (img) images.push(img);
        }
        count++;
        setScanProgress(Math.round((count / numFrames) * 100));
        if (count >= numFrames) {
          clearInterval(interval);
          resolve(images);
        }
      }, intervalMs);
    });
  };

  const handleLogin = async () => {
    if (authMethod === 'password') {
      try {
        const response = await fetch(`${API_HOST}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role }),
        });
        const data = await response.json();

        if (response.ok && data.message === 'Login successful') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          alert(`Welcome back!`);
          role === 'student' ? navigate('/student-dashboard') : navigate('/manager-dashboard');
        } else {
          alert(data.error || "Login failed.");
        }
      } catch (error) {
        alert("Backend unreachable.");
      }
    } else {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
          alert("Camera capture failed.");
          return;
      }

      try {
        const response = await fetch(`${API_HOST}/api/auth/login-face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageSrc }),
        });
        const data = await response.json();

        if (response.ok && data.message === 'Login successful') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          alert(`Welcome, ${data.user.name}`);
          navigate('/student-dashboard'); 
        } else if (data.status === 'unknown' || response.status === 400) {
          alert(data.error || "Face not recognized. Please switch to the 'Password' tab to login.");
          setAuthMethod('password'); // Automatically switch to password tab
        } else {
          alert(data.error || "Action failed. Please try password login.");
          setAuthMethod('password');
        }
      } catch (error) {
        alert("Backend unreachable. Trying password login...");
        setAuthMethod('password');
      }
    }
  };

  const handleRegister = async () => {
    if (!showOtpInput) {
      // Step 1: Send registration details and get OTP
      try {
        const response = await fetch(`${API_HOST}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, rollNo, email, password, roomNo, phone }),
        });
        const data = await response.json();

        if (response.ok || data.message === "OTP sent to email") {
          alert("OTP sent to your email!");
          setShowOtpInput(true);
        } else {
          alert(data.error || "Registration failed.");
        }
      } catch (error) {
        alert("Backend unreachable.");
      }
    } else {
      // Step 2: Verify OTP
      try {
        const response = await fetch(`${API_HOST}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });
        const data = await response.json();

        if (response.ok && data.token) {
          alert("Registration Successful!");
          
          // Reset state to Login after successful registration
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', 'student');
          setIsLogin(true);
          setShowOtpInput(false);
          setScanProgress(0);
          setShowWebcam(true);
          setStatusMessage('');
        } else {
          alert(data.error || "Invalid OTP.");
        }
      } catch (error) {
        alert("Backend unreachable.");
      }
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!email) {
        alert("Please enter your email");
        return;
      }
      const response = await fetch(`${API_HOST}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("OTP sent to your email!");
        setResetStep(2);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (e) {
      alert("Backend unreachable");
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!otp || !newPassword) {
        alert("Please enter OTP and new password.");
        return;
      }
      const response = await fetch(`${API_HOST}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Password reset successfully. You can now login.");
        resetMode(true);
      } else {
        alert(data.error || "Failed to reset password");
      }
    } catch (e) {
      alert("Backend unreachable");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (isForgotPassword) {
      if (resetStep === 1) await handleForgotPassword();
      else await handleResetPassword();
    } else if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
    
    setIsProcessing(false);
  };

  const resetMode = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setShowOtpInput(false);
    setShowWebcam(true);
    setScanProgress(0);
    setIsForgotPassword(false);
    setResetStep(1);
    setNewPassword('');
    setOtp('');
  }

  return (
    <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header Info */}
      <div className="p-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="IITK" className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mess Automation</h1>
            <p className="text-sm text-gray-600">IIT Kanpur</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="px-12 pb-12 flex flex-col">
          <h2 className="text-3xl font-bold mb-6">{isLogin ? "Welcome Back" : "New Account"}</h2>

          <div className="flex gap-2 mb-6">
            <button type="button" onClick={() => resetMode(true)} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${isLogin ? 'bg-black text-white' : 'bg-gray-100'}`}>Login</button>
            <button type="button" onClick={() => resetMode(false)} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${!isLogin ? 'bg-black text-white' : 'bg-gray-100'}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isForgotPassword ? (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-lg">
                  <div className="flex-1 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Forgot Password</div>
                </div>
                {resetStep === 1 ? (
                  <>
                    <p className="text-sm text-gray-600">Enter your email and role to receive an OTP.</p>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="email@iitk.ac.in" required />
                    <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white outline-none">
                        <option value="student">Student</option>
                        <option value="manager">Manager</option>
                    </select>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Enter the OTP sent to your email and your new password.</p>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none tracking-widest text-lg font-semibold text-center" placeholder="Enter 6-digit OTP" required />
                    <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="New Password" required />
                  </>
                )}
                
                <button type="submit" disabled={isProcessing} className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-500">
                    {isProcessing ? "Processing..." : (resetStep === 1 ? "Send Reset OTP" : "Reset Password")}
                </button>

                <button type="button" onClick={() => resetMode(true)} className="w-full text-xs text-gray-500 hover:underline flex items-center justify-center gap-1 mt-4">
                    <ArrowLeft className="w-3 h-3" /> Back to Login
                </button>
              </div>
            ) : (
              <>
            {isLogin && (
                <div className="flex gap-2">
                    <button type="button" onClick={() => setAuthMethod('password')} className={`flex-1 py-2 rounded border text-xs font-medium ${authMethod === 'password' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}>Password</button>
                    <button type="button" onClick={() => setAuthMethod('face')} className={`flex-1 py-2 rounded border text-xs font-medium ${authMethod === 'face' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}>Face Scan</button>
                </div>
            )}

            {!isLogin && !showOtpInput && (
                <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-lg">
                  <div className="flex-1 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">New Student Registration</div>
                </div>
            )}

            {!isLogin && showOtpInput ? (
                // OTP Input State
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">An OTP has been sent to your IITK email.</p>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none text-center tracking-widest text-lg font-semibold" placeholder="Enter 6-digit OTP" required />
                </div>
            ) : (
                // Normal Form State
                <>
                  {(!isLogin || authMethod === 'password') && (
                      <>
                          {!isLogin && (
                            <>
                              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="Full Name" required />
                              <div className="flex gap-2">
                                <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="Roll No" required />
                                <input type="text" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="Room No" />
                              </div>
                              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="Phone Number" />
                            </>
                          )}
                          
                          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="email@iitk.ac.in" required />
                          
                          {isLogin && (
                            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white outline-none">
                                <option value="student">Student</option>
                                <option value="manager">Manager</option>
                            </select>
                          )}

                          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none" placeholder="Password" required />
                          {isLogin && (
                              <div className="flex justify-end">
                                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-black font-medium hover:underline">Forgot Password?</button>
                              </div>
                          )}
                      </>
                  )}

                  {isLogin && authMethod === 'face' ? (
                    <>
                      <div className="border-4 border-black rounded-lg overflow-hidden bg-black flex items-center justify-center relative h-[250px] flex-col">
                          {showWebcam ? (
                              <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ width: 320, height: 240 }} className="w-full h-full object-cover absolute top-0 left-0" />
                          ) : (
                              <div className="text-white text-center p-4 z-10"><p>⏳ Verifying Face...</p></div>
                          )}
                          <button 
                            type="button"
                            onClick={() => setAuthMethod('password')}
                            className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white px-3 py-1 rounded text-xs z-20 backdrop-blur-sm"
                          >
                            Use Password Instead
                          </button>
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mt-1">
                          Face ID allows one-click login if you have added a photo in your profile.
                      </p>
                    </>
                  ) : null}
                </>
            )}

            <button type="submit" disabled={isProcessing} className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-500">
                {statusMessage ? statusMessage : (isProcessing ? "Processing..." : (
                  isLogin ? "Login" : 
                    (showOtpInput ? "Verify OTP" : 
                      (authMethod === 'face' ? "Register & Scan" : "Register")
                    )
                ))}
            </button>

            {!isLogin && (
                <button type="button" onClick={() => resetMode(true)} className="w-full text-xs text-gray-500 hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Already have an account? Login
                </button>
            )}
            </>
            )}
          </form>
        </div>
        <div className="relative hidden md:block">
            <img src={campusImage} className="w-full h-full object-cover" alt="Campus" />
        </div>
      </div>
    </div>
  );
}