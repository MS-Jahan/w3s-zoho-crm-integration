import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createLead } from '../services/api';
import { SkeletonForm } from './Skeleton.jsx';

const EMPTY = { firstName: '', lastName: '', company: '', email: '', phone: '' };

/**
 * Create Lead form with client-side validation and loading state.
 * onCreated(result) is called with { id, ... } so the parent can open the modal.
 */
export default function LeadForm({ onCreated, onError }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Show skeleton briefly on first mount for a polished entrance
  if (!mounted) {
    setTimeout(() => setMounted(true), 350);
    return (
      <div className="card bg-base-100 shadow-md animate-slide-up">
        <div className="card-body">
          <h2 className="card-title text-lg">Create New Lead</h2>
          <SkeletonForm />
        </div>
      </div>
    );
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First Name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last Name is required';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await createLead({
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company,
      email: form.email,
      phone: form.phone,
    });
    setLoading(false);

    if (result.success) {
      setForm(EMPTY);
      setErrors({});
      onCreated(result.data);
    } else {
      onError(result);
    }
  }

  const input = (field, label, type = 'text', placeholder = '') => (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text font-medium">{label}</span>
      </label>
      <input
        type={type}
        className={`input input-bordered input-sm focus:input-primary transition-colors ${errors[field] ? 'input-error' : ''}`}
        value={form[field]}
        onChange={set(field)}
        placeholder={placeholder}
      />
      {errors[field] && <span className="text-error text-xs mt-1 animate-fade-in">{errors[field]}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md animate-slide-up">
      <div className="card-body gap-3">
        <h2 className="card-title text-lg">Create New Lead</h2>
        {input('firstName', 'First Name', 'text', 'John')}
        {input('lastName', 'Last Name', 'text', 'Doe')}
        {input('company', 'Company', 'text', 'Acme Inc.')}
        {input('email', 'Email', 'email', 'john@acme.com')}
        {input('phone', 'Phone', 'tel', '+1 555 000 1234')}
        <button type="submit" className="btn btn-primary btn-block btn-sm mt-2 transition-transform active:scale-[0.98]" disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs" /> Creating…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Create Lead
            </>
          )}
        </button>
      </div>
    </form>
  );
}
