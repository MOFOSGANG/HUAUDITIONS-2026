
import React, { useState } from 'react';
import { Application } from '../types';

interface ApplicationFormProps {
  onSubmit: (app: Partial<Application>) => void;
  onCancel: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Application>>({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    level: '',
    talents: [],
    experience: 'No',
    motivation: '',
    gain: '',
    availability: [],
    preferredSlot: 'Flexible - Any available slot'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.level) newErrors.level = 'Level is required';
    if (!formData.talents?.length) newErrors.talents = 'Select at least one talent';
    if (!formData.motivation || formData.motivation.length < 50) newErrors.motivation = 'Min 50 characters required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const list = (prev as any)[name] || [];
      if (checked) {
        return { ...prev, [name]: [...list, value] };
      } else {
        return { ...prev, [name]: list.filter((item: string) => item !== value) };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        onSubmit(formData);
        setIsSubmitting(false);
      }, 2000);
    }
  };

  const talentOptions = [
    "Singing", "Dancing", "Acting", "Playing Instruments",
    "Costume Management", "Stage Management", "Script Writing",
    "Makeup & Special Effects", "Sound/Technical Production",
    "Lighting Design", "Set Design", "Photography/Videography", "Other"
  ];

  return (
    <div className="bg-hudt-light min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="p-8 text-center bg-white border-b border-gray-100">
          <h2 className="text-5xl font-black text-purple-900 mb-2">Join HUDT</h2>
          <p className="text-gray-500 font-medium">Complete the form below to apply for our upcoming auditions.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
          {/* Section 1: Personal Information */}
          <div className="bg-purple-50 p-8 rounded-3xl space-y-6">
            <h3 className="text-2xl font-black text-purple-900 border-b-2 border-purple-200 pb-2 flex items-center gap-2">
              <span>👤</span> Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full p-4 rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-purple-500 ${errors.fullName ? 'border-red-400' : 'border-purple-200'}`}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1 font-bold">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="your.email@student.hallmark.edu"
                  className={`w-full p-4 rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-purple-500 ${errors.email ? 'border-red-400' : 'border-purple-200'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="+234 XXX XXX XXXX"
                  className={`w-full p-4 rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-purple-500 ${errors.phone ? 'border-red-400' : 'border-purple-200'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Department *</label>
                <select
                  name="department" value={formData.department} onChange={handleChange}
                  className={`w-full p-4 rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-purple-500 ${errors.department ? 'border-red-400' : 'border-purple-200'}`}
                >
                  <option value="">Select Department</option>
                  <option>International Relations</option>
                  <option>Mass Communication</option>
                  <option>Business Administration</option>
                  <option>Biochemistry</option>
                  <option>Microbiology</option>
                  <option>Accounting</option>
                  <option>Sociology</option>
                  <option>Computer Science</option>
                  <option>Economics</option>
                  <option>Zoology</option>
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1 font-bold">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Level/Year *</label>
                <select
                  name="level" value={formData.level} onChange={handleChange}
                  className={`w-full p-4 rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-purple-500 ${errors.level ? 'border-red-400' : 'border-purple-200'}`}
                >
                  <option value="">Select Level</option>
                  <option>100 Level</option>
                  <option>200 Level</option>
                  <option>300 Level</option>
                  <option>400 Level</option>
                  <option>500 Level</option>
                </select>
                {errors.level && <p className="text-red-500 text-xs mt-1 font-bold">{errors.level}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Talent Info */}
          <div className="bg-amber-50 p-8 rounded-3xl space-y-6">
            <h3 className="text-2xl font-black text-amber-900 border-b-2 border-amber-200 pb-2 flex items-center gap-2">
              <span>🎭</span> Talent Information
            </h3>

            <div>
              <label className="block text-sm font-bold text-amber-900 mb-4">Primary Talents/Contributions *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {talentOptions.map(talent => (
                  <label key={talent} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-amber-600"
                      checked={formData.talents?.includes(talent)}
                      onChange={(e) => handleCheckboxChange('talents', talent, e.target.checked)}
                    />
                    <span className="text-sm font-semibold">{talent}</span>
                  </label>
                ))}
              </div>
              {errors.talents && <p className="text-red-500 text-xs mt-2 font-bold">{errors.talents}</p>}
            </div>

            {formData.talents?.includes('Playing Instruments') && (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold text-amber-900 mb-2">Specify Instruments</label>
                <input
                  type="text" name="instruments" value={formData.instruments} onChange={handleChange}
                  placeholder="e.g. Piano, Guitar, Drums"
                  className="w-full p-4 rounded-xl border-2 border-amber-200"
                />
              </div>
            )}
          </div>

          {/* Section 3: Experience & Motivation */}
          <div className="bg-purple-50 p-8 rounded-3xl space-y-6">
            <h3 className="text-2xl font-black text-purple-900 border-b-2 border-purple-200 pb-2 flex items-center gap-2">
              <span>✨</span> Experience & Motivation
            </h3>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">Previous Performance Experience? *</label>
              <div className="flex gap-6">
                {['Yes', 'No'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="experience" value={opt} checked={formData.experience === opt}
                      onChange={handleChange}
                      className="w-5 h-5 accent-purple-600"
                    />
                    <span className="font-bold">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.experience === 'Yes' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold text-gray-700 mb-2">Experience Details</label>
                <textarea
                  name="experienceDetails" value={formData.experienceDetails} onChange={handleChange}
                  rows={3} placeholder="Tell us about your previous performances..."
                  className="w-full p-4 rounded-xl border-2 border-purple-200"
                ></textarea>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Why do you want to join HUDT? *</label>
              <textarea
                name="motivation" value={formData.motivation} onChange={handleChange}
                rows={4} placeholder="Share your passion and motivation... (min 50 chars)"
                className={`w-full p-4 rounded-xl border-2 ${errors.motivation ? 'border-red-400' : 'border-purple-200'}`}
              ></textarea>
              <div className="flex justify-between mt-1">
                {errors.motivation && <p className="text-red-500 text-xs font-bold">{errors.motivation}</p>}
                <p className="text-xs text-gray-400 ml-auto">{(formData.motivation?.length || 0)} / 50 characters minimum</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">Availability for Rehearsals *</label>
              <div className="flex flex-wrap gap-3">
                {['Weekdays', 'Weekends'].map(day => (
                  <label key={day} className={`px-6 py-2 rounded-full border-2 cursor-pointer transition-all font-bold ${formData.availability?.includes(day) ? 'bg-purple-900 text-white border-purple-900' : 'bg-white text-purple-900 border-purple-200'
                    }`}>
                    <input
                      type="checkbox" className="hidden"
                      checked={formData.availability?.includes(day)}
                      onChange={(e) => handleCheckboxChange('availability', day, e.target.checked)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Audition Slot</label>
              <select
                name="preferredSlot" value={formData.preferredSlot} onChange={handleChange}
                className="w-full p-4 rounded-xl border-2 border-purple-200 font-semibold"
              >
                <option>Flexible - Any available slot</option>
                <option>January 20, 2026 - 10:00 AM</option>
                <option>January 20, 2026 - 2:00 PM</option>
                <option>January 21, 2026 - 10:00 AM</option>
                <option>January 21, 2026 - 2:00 PM</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="button" onClick={onCancel}
              className="flex-1 px-8 py-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-[2] px-8 py-5 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-black rounded-2xl transition-all shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
