import { useState } from "react";
import { auth, db } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Request form states
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("Full-time");
  const [requestSuccess, setRequestSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.reload();
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  const handleRequestAccount = async (e) => {
    e.preventDefault();
    if (reqPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    try {
      await addDoc(collection(db, "facultyRequests"), {
        name: reqName,
        email: reqEmail,
        password: reqPassword, // You might want to hash this later
        status: status,
        requestDate: new Date(),
      });
      setRequestSuccess("Account request submitted successfully!");
      setReqName("");
      setReqEmail("");
      setReqPassword("");
      setConfirmPassword("");
      setStatus("Full-time");
      setShowRequestForm(false);
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        {!showRequestForm ? (
          <>
            <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Login</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 mb-4 w-full rounded" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 mb-6 w-full rounded" required />
              <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800">Login</button>
            </form>

            <p className="mt-4 text-center text-blue-600 cursor-pointer" onClick={() => setShowRequestForm(true)}>
              Request an Account
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Request an Account</h1>

            {requestSuccess && <p className="text-green-600 mb-4">{requestSuccess}</p>}

            <form onSubmit={handleRequestAccount}>
              <input type="text" placeholder="Full Name" value={reqName} onChange={(e) => setReqName(e.target.value)} className="border p-2 mb-4 w-full rounded" required />
              <input type="email" placeholder="Email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} className="border p-2 mb-4 w-full rounded" required />
              <input type="password" placeholder="Password" value={reqPassword} onChange={(e) => setReqPassword(e.target.value)} className="border p-2 mb-4 w-full rounded" required />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border p-2 mb-4 w-full rounded" required />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-2 mb-4 w-full rounded">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Visiting</option>
              </select>
              <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800">
                Submit Request
              </button>
            </form>

            <p className="mt-4 text-center text-gray-600 cursor-pointer" onClick={() => setShowRequestForm(false)}>
              Back to Login
            </p>
          </>
        )}
      </div>
    </div>
  );
}
