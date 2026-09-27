import { useState } from 'react';
import { Plus, Building, Mail, Phone, UserRound } from 'lucide-react';
import { createLead } from '../services/api';
import { SkeletonForm } from './Skeleton.jsx';

const EMPTY = { firstName: '', lastName: '', company: '', email: '', phone: '' };

/** Text input with leading icon and validation feedback. */
function Field({ field, label, icon: Icon, type = 'text', placeholder = '', value, error, onChange }) {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text font-medium text-xs uppercase tracking-wider text-base-content/50">{label}</span>
      </label>
      <label className={`input input-sm flex items-center gap-2 bg-base-300/50 border-base-content/15 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-200 ${error ? 'input-error border-rose-500/50' : ''}`}>
        <Icon className="h-3.5 w-3.5 opacity-40 shrink-0" />
        <input
          type={type}
          className="grow"
          value={value}
          onChange={onChange(field)}
          placeholder={placeholder}
        />
      </label>
      {error && <span className="text-rose-400 text-xs mt-1 animate-fade-in">{error}</span>}
    </div>
  );
}

/**
 * Create New Lead card: icon-prefixed inputs, gradient submit button.
 * onCreated(result) fires with { id, ... } so the parent opens the details modal.
 */
export default function LeadForm({ onCreated, onError }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  if (!mounted) {
    setTimeout(() => setMounted(true), 350);
    return (
      <div className="card bg-base-100/70 backdrop-blur-md border border-base-content/10 shadow-md animate-slide-up">
        <div className="card-body">
          <h2 className="card-title text-base">Create New Lead</h2>
          <SkeletonForm />
        </div>
      </div>
    );
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function validate() {
    const errs = {};
    if (!form.lastName.trim()) errs.lastName = 'Last Name is required';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Valid email format is required';
    }
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

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100/70 backdrop-blur-md border border-base-content/10 shadow-md animate-slide-up">
      <div className="card-body gap-3 p-5">
        <div>
          <h2 className="card-title text-base">Create New Lead</h2>
          <p className="text-xs text-base-content/50">Insert a record directly into Zoho CRM.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field field="firstName" label="First Name" icon={UserRound} placeholder="John" value={form.firstName} error={errors.firstName} onChange={set} />
          <Field field="lastName" label="Last Name *" icon={UserRound} placeholder="Doe" value={form.lastName} error={errors.lastName} onChange={set} />
        </div>
        <Field field="company" label="Company *" icon={Building} placeholder="Acme Inc." value={form.company} error={errors.company} onChange={set} />
        <Field field="email" label="Email" icon={Mail} type="email" placeholder="john@acme.com" value={form.email} error={errors.email} onChange={set} />
        <Field field="phone" label="Phone" icon={Phone} type="tel" placeholder="+1 555 000 1234" value={form.phone} error={errors.phone} onChange={set} />
        <button
          type="submit"
          className="btn btn-block btn-sm mt-2 text-white border-none bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98]"
          disabled={loading}
        >
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
