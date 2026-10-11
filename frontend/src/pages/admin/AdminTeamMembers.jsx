import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTeamMember, listTeamMembers, updateTeamMemberStatus } from "../../services/admin/adminSiteContentService";

const inputClass = "w-full rounded-lg border border-pb-border bg-white px-3 py-2 text-sm outline-none focus:border-pb-khaki";

function AdminTeamMembers() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => { const timer = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => {
    let alive = true;
    listTeamMembers({ search: query, is_active: status, page, per_page: 20 }).then((result) => { if (alive) { setData(result.data); setError(""); } }).catch((requestError) => { if (alive) setError(requestError.response?.data?.message || "Could not load team members."); });
    return () => { alive = false; };
  }, [query, status, page, reload]);

  const toggle = async (member) => {
    setBusyId(member.id); setError("");
    try { await updateTeamMemberStatus(member.id, !member.is_active); setReload((value) => value + 1); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not update status."); }
    finally { setBusyId(null); }
  };
  const remove = async (member) => {
    if (!window.confirm(`Delete ${member.name} and their profile photo permanently?`)) return;
    setBusyId(member.id); setError("");
    try { await deleteTeamMember(member.id); setReload((value) => value + 1); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not delete team member."); }
    finally { setBusyId(null); }
  };

  return <div className="mx-auto max-w-6xl p-4 sm:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-pb-khaki">Site Content</p><h1 className="mt-1 text-3xl font-black text-pb-green">Team Members</h1><p className="mt-2 text-sm text-slate-600">Manage the people displayed on the public Contact page.</p></div><Link to="/admin/site-content/team-members/new" className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white">+ Add team member</Link></header>
    <section className="mt-6 grid gap-3 rounded-xl border border-pb-border bg-white p-4 sm:grid-cols-[1fr_200px]"><label className="text-xs font-bold text-pb-green">Search name, role or bio<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search team members" className={`${inputClass} mt-1.5`} /></label><label className="text-xs font-bold text-pb-green">Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={`${inputClass} mt-1.5`}><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select></label></section>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!data ? <p role="status" className="mt-6">Loading team members...</p> : <><div className="mt-5 grid gap-3 lg:hidden">{data.items.map((member) => <article key={member.id} className="rounded-xl border border-pb-border bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-bold text-pb-green">{member.name}</h2><p className="mt-1 break-words text-sm text-pb-khaki">{member.role}</p></div><span className="shrink-0 rounded-full bg-pb-light px-2.5 py-1 text-xs font-bold">{member.is_active ? "Active" : "Inactive"}</span></div><p className="mt-3 break-words text-sm leading-6 text-slate-600">{member.bio || "No bio"}</p><p className="mt-2 text-xs text-slate-500">Display order: {member.display_order}</p><div className="mt-4 flex flex-wrap gap-2"><Link to={`/admin/site-content/team-members/${member.id}/edit`} className="inline-flex min-h-11 items-center rounded-md border border-pb-border px-3 font-bold">Edit</Link><button type="button" disabled={busyId === member.id} onClick={() => toggle(member)} className="min-h-11 rounded-md bg-pb-green px-3 font-bold text-white disabled:opacity-50">{member.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={busyId === member.id} onClick={() => remove(member)} className="min-h-11 rounded-md border border-red-200 px-3 font-bold text-red-700 disabled:opacity-50">Delete</button></div></article>)}{data.items.length === 0 && <p className="rounded-xl border border-dashed border-pb-border p-8 text-center text-slate-500">No team members found.</p>}</div><div className="mt-5 hidden overflow-x-auto rounded-xl border border-pb-border bg-white lg:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-pb-neutral text-pb-green"><tr>{["Person", "Role", "Order", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-pb-border-soft">{data.items.map((member) => <tr key={member.id}><td className="px-4 py-3"><p className="font-bold text-pb-green">{member.name}</p><p className="mt-1 max-w-sm truncate text-xs text-slate-500">{member.bio || "No bio"}</p></td><td className="px-4 py-3">{member.role}</td><td className="px-4 py-3">{member.display_order}</td><td className="px-4 py-3">{member.is_active ? "Active" : "Inactive"}</td><td className="px-4 py-3"><div className="flex gap-2"><Link to={`/admin/site-content/team-members/${member.id}/edit`} className="rounded-md border border-pb-border px-3 py-1.5 font-bold">Edit</Link><button type="button" disabled={busyId === member.id} onClick={() => toggle(member)} className="rounded-md bg-pb-green px-3 py-1.5 font-bold text-white disabled:opacity-50">{member.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={busyId === member.id} onClick={() => remove(member)} className="rounded-md border border-red-200 px-3 py-1.5 font-bold text-red-700 disabled:opacity-50">Delete</button></div></td></tr>)}{data.items.length === 0 && <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No team members found.</td></tr>}</tbody></table></div><div className="mt-4 flex items-center justify-between text-sm"><span>{data.pagination.total} team members · Page {page} of {Math.max(data.pagination.pages, 1)}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-pb-border px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)} className="rounded border border-pb-border px-3 py-2 disabled:opacity-40">Next</button></div></div></>}
  </div>;
}

export default AdminTeamMembers;
