import { useState } from "react";
import ReactDOM from "react-dom";
import "../pages/Faculty.css";
import api from "../api/axios";

export default function FacultyForm({ show, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    schoolId: "",
    status: "Full-time",
    role: "teacher",
    facultyId: "",
    subjects: ""
  });
  const [formError, setFormError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  if (!show) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required.";
    if (!formData.schoolId.trim()) return "School ID is required.";
    if (!/^[0-9]{2}-[0-9]{4}-[0-9]{3}$/.test(formData.schoolId)) return "School ID must be in format 22-2222-222.";
    if (!formData.facultyId.trim()) return "Faculty ID is required.";
    if (formData.role === "teacher" && !formData.subjects.trim()) return "Subjects are required for teachers.";
    return "";
  };

  const generateTempPassword = () => {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return pass;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    let dataToSend = { ...formData };
    if (formData.role === "teacher") {
      dataToSend.subjects = formData.subjects.split(",").map(s => s.trim()).filter(Boolean);
    }
    let tempPass = "";
    if (formData.role === "admin" || formData.role === "teacher") {
      tempPass = generateTempPassword();
      dataToSend.tempPassword = tempPass;
    }
    try {
      await api.post("/faculty", dataToSend);
      setFormData({ name: "", schoolId: "", status: "Full-time", role: "teacher", facultyId: "", subjects: "" });
      if (onSuccess) onSuccess();
      setTempPassword(tempPass);
    } catch (err) {
      setFormError(err.response?.data || err.message || "Failed to add faculty.");
    }
  };

  const modal = (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Faculty</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="faculty-form">
            <label>Name:
              <input name="name" value={formData.name} onChange={handleInputChange} required />
            </label>
            <label>School ID:
              <input name="schoolId" value={formData.schoolId} onChange={handleInputChange} required placeholder="22-2222-222" />
            </label>
            <label>Faculty ID:
              <input name="facultyId" value={formData.facultyId} onChange={handleInputChange} required />
            </label>
            <label>Role:
              <select name="role" value={formData.role} onChange={handleInputChange} required>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </label>
            {formData.role === "teacher" && (
              <label>Subjects:
                <input
                  name="subjects"
                  value={formData.subjects}
                  onChange={handleInputChange}
                  required={formData.role === "teacher"}
                  placeholder="e.g. Math, Science"
                />
              </label>
            )}
            <label>Status:
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
              </select>
            </label>
            {formError && <div className="form-error">{formError}</div>}
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary">Add Faculty</button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
        {tempPassword && (
          <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: 400 }}>
              <div className="modal-header">
                <h3 className="modal-title">Temporary Password</h3>
                <button className="close-button" onClick={() => setTempPassword("")}>×</button>
              </div>
              <div className="modal-content">
                <p>The temporary password for this user is:</p>
                <div className="temp-password-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>{tempPassword}</div>
                <button className="btn btn-primary" onClick={() => setTempPassword("")}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
} 