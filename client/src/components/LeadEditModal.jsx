import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { updateLead, fetchLeadById } from '../services/api';

const EMPTY = { firstName: '', lastName: '', company: '', email: '', phone: '' };

/**
 * Edit Lead modal: prefilled from the live record, PUT on save.
 * onSaved() triggers a table refresh in the parent.
 */
export default function LeadEditModal({ leadId, onClose, onSaved, onError }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    fetchLeadById(leadId).then((result) => {
      setLoading(false);
      if (result.success) {
        const { firstName, lastName, company, email, phone } = result.data;
        setForm({ firstName: firstName || '', lastName: lastName || '', company: company || '', email: email || '', phone: phone || '' });
      } else {
        onError(result);
        onClose();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  if (!leadId) return null;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function validate() {
    const errs = {};
    if (!form.lastName.trim()) errs.lastName = 'Last Name is required';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const result = await updateLead(leadId, {
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company,
      email: form.email,
      phone: form.phone,
    });
    setSaving(false);
    if (result.success) {
      onSaved(`Lead updated: ${form.firstName} ${form.lastName}`.trim());
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
    <div className="modal modal-open animate-fade-in">
      <div className="modal-box max-w-md animate-scale-in">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          <Pencil className="h-4 w-4 text-primary" /> Edit Lead
        </h3>
        <p className="text-xs opacity-60 mb-4 font-mono">{leadId}</p>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm opacity-60">Fetching record…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {input('firstName', 'First Name', 'text', 'John')}
              {input('lastName', 'Last Name *', 'text', 'Doe')}
            </div>
            {input('company', 'Company *', 'text', 'Acme Inc.')}
            {input('email', 'Email', 'email', 'john@acme.com')}
            {input('phone', 'Phone', 'tel', '+1 555 000 1234')}
            <div className="modal-action mt-4">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <><span className="loading loading-spinner loading-xs" /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
