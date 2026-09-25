/**
 * Leads table: Record ID, Full Name, Email, Company, Actions.
 */
export default function LeadTable({ leads, loading, onView }) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-lg">CRM Leads</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 opacity-60">
                    No leads found. Create one from the form.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="font-mono text-xs">{lead.id}</td>
                    <td>{lead.fullName}</td>
                    <td className="text-xs">{lead.email || '—'}</td>
                    <td>{lead.company || '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-xs text-primary" onClick={() => onView(lead.id)}>
                        View Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
