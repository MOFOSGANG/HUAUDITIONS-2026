
import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import {
    getDashboardStats,
    getApplications,
    updateApplication,
    deleteApplication,
    bulkUpdateApplications,
    bulkDeleteApplications,
    exportApplications,
    adminLogout,
    getStoredAdmin,
    DashboardStats,
} from '../lib/api';

interface AdminDashboardProps {
    onLogout: () => void;
    onNavigate: (page: Page) => void;
}

const STATUSES = ['All', 'Submitted', 'Under Review', 'Audition Scheduled', 'Accepted', 'Waitlisted', 'Not Selected'];
const DEPARTMENTS = ['All', 'Computer Science', 'Engineering', 'Medicine', 'Law', 'Business Administration', 'Mass Communication', 'Arts', 'Sciences', 'Education', 'Nursing', 'Architecture', 'Pharmacy'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'history'>('dashboard');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Selection for bulk operations
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState('');

    // Modal states
    const [editingApp, setEditingApp] = useState<any | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    const admin = getStoredAdmin();

    useEffect(() => {
        loadData();
    }, [activeTab, page, statusFilter, departmentFilter]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'dashboard') {
                const response = await getDashboardStats();
                if (response.success) {
                    setStats(response.stats);
                }
            } else {
                // If in history tab, we force filter to Accepted or Not Selected if status is 'All'
                const effectiveStatus = activeTab === 'history' && statusFilter === 'All'
                    ? 'Accepted,Not Selected'
                    : statusFilter;

                const response = await getApplications({
                    search,
                    status: activeTab === 'history' && statusFilter === 'All' ? undefined : statusFilter,
                    department: departmentFilter,
                    page,
                    limit: 10,
                    sortBy: 'submitted_at',
                    sortOrder: 'desc',
                });

                if (response.success) {
                    let filteredApps = response.applications;

                    // Client-side status filter for history if necessary
                    if (activeTab === 'history' && statusFilter === 'All') {
                        filteredApps = filteredApps.filter((a: any) =>
                            a.status === 'Accepted' || a.status === 'Not Selected'
                        );
                    }

                    setApplications(filteredApps);
                    setTotalPages(response.totalPages);
                    setTotalCount(activeTab === 'history' && statusFilter === 'All' ? filteredApps.length : response.totalCount);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadData();
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await updateApplication(id, { status: newStatus });
            loadData();
            setEditingApp(null);
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteApplication(id);
            setShowDeleteConfirm(null);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete application');
        }
    };

    const handleBulkAction = async () => {
        if (selectedIds.length === 0 || !bulkAction) return;

        try {
            if (bulkAction === 'delete') {
                if (confirm(`Delete ${selectedIds.length} applications?`)) {
                    await bulkDeleteApplications(selectedIds);
                }
            } else {
                await bulkUpdateApplications(selectedIds, { status: bulkAction });
            }
            setSelectedIds([]);
            setBulkAction('');
            loadData();
        } catch (err: any) {
            alert(err.message || 'Bulk action failed');
        }
    };

    const handleExport = async () => {
        try {
            await exportApplications({ status: statusFilter, department: departmentFilter });
        } catch (err: any) {
            alert(err.message || 'Export failed');
        }
    };

    const handleLogout = () => {
        adminLogout();
        onLogout();
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === applications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(applications.map((a) => a.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Under Review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Audition Scheduled': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Accepted': return 'bg-green-100 text-green-700 border-green-200';
            case 'Waitlisted': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Not Selected': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="bg-purple-900 text-white shadow-xl">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <span className="text-xl">🎭</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black">HUDT Admin</h1>
                            <p className="text-xs text-purple-200">Welcome, {admin?.username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onNavigate(Page.HOME)}
                            className="text-purple-200 hover:text-white transition-colors font-semibold"
                        >
                            View Site
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-bold transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-8">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setStatusFilter('All'); }}
                            className={`py-4 border-b-4 font-bold transition-colors ${activeTab === 'dashboard'
                                ? 'border-amber-500 text-purple-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            📊 Dashboard
                        </button>
                        <button
                            onClick={() => { setActiveTab('applications'); setStatusFilter('All'); }}
                            className={`py-4 border-b-4 font-bold transition-colors ${activeTab === 'applications'
                                ? 'border-amber-500 text-purple-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            📋 Active
                        </button>
                        <button
                            onClick={() => { setActiveTab('history'); setStatusFilter('All'); }}
                            className={`py-4 border-b-4 font-bold transition-colors ${activeTab === 'history'
                                ? 'border-amber-500 text-purple-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            📜 History
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-xl mb-8">
                        <p className="font-bold">{error}</p>
                        <button onClick={loadData} className="mt-2 underline">Try again</button>
                    </div>
                )}

                {!loading && !error && activeTab === 'dashboard' && stats && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Total</p>
                                <p className="text-4xl font-black text-purple-900">{stats.totalApplications}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Today</p>
                                <p className="text-4xl font-black text-blue-600">{stats.applicationsToday}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-amber-500">
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">This Week</p>
                                <p className="text-4xl font-black text-amber-600">{stats.applicationsThisWeek}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Acceptance</p>
                                <p className="text-4xl font-black text-green-600">{stats.acceptanceRate}%</p>
                            </div>
                        </div>

                        {/* Status Distribution */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-xl font-black text-purple-900 mb-6">Status Distribution</h3>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                {Object.entries(stats.statusCounts).map(([status, count]) => (
                                    <div key={status} className={`p-4 rounded-xl border-2 text-center ${getStatusBadgeClass(status)}`}>
                                        <p className="text-2xl font-black">{count}</p>
                                        <p className="text-xs font-bold uppercase tracking-widest mt-1">{status}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Applications */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-xl font-black text-purple-900 mb-6">Recent Applications</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100">
                                            <th className="text-left py-3 px-4 font-bold text-gray-500 uppercase text-xs">Ref #</th>
                                            <th className="text-left py-3 px-4 font-bold text-gray-500 uppercase text-xs">Name</th>
                                            <th className="text-left py-3 px-4 font-bold text-gray-500 uppercase text-xs">Department</th>
                                            <th className="text-left py-3 px-4 font-bold text-gray-500 uppercase text-xs">Status</th>
                                            <th className="text-left py-3 px-4 font-bold text-gray-500 uppercase text-xs">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentApplications.map((app) => (
                                            <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-mono font-bold text-purple-600">{app.refNumber}</td>
                                                <td className="py-3 px-4 font-semibold">{app.fullName}</td>
                                                <td className="py-3 px-4 text-gray-600">{app.department}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(app.status)}`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500 text-sm">
                                                    {new Date(app.submittedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'applications' || activeTab === 'history') && !loading && !error && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Filters */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Name, email, phone, ref #"
                                        className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none"
                                    />
                                </div>
                                {activeTab === 'applications' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                            className="p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none font-semibold"
                                        >
                                            {STATUSES.filter(s => !['Accepted', 'Not Selected'].includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeTab === 'history' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Outcome</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                            className="p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none font-semibold"
                                        >
                                            <option value="All">All Outcomes</option>
                                            <option value="Accepted">Accepted</option>
                                            <option value="Not Selected">Not Selected</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                                    <select
                                        value={departmentFilter}
                                        onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                                        className="p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none font-semibold"
                                    >
                                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
                                >
                                    Search
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedIds.length > 0 && (
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex items-center gap-4">
                                <span className="font-bold text-purple-900">{selectedIds.length} selected</span>
                                <select
                                    value={bulkAction}
                                    onChange={(e) => setBulkAction(e.target.value)}
                                    className="p-2 rounded-lg border-2 border-purple-200 font-semibold"
                                >
                                    <option value="">Choose action...</option>
                                    <option value="Under Review">Set Under Review</option>
                                    <option value="Audition Scheduled">Set Audition Scheduled</option>
                                    <option value="Accepted">Set Accepted</option>
                                    <option value="Waitlisted">Set Waitlisted</option>
                                    <option value="Not Selected">Set Not Selected</option>
                                    <option value="delete">Delete Selected</option>
                                </select>
                                <button
                                    onClick={handleBulkAction}
                                    disabled={!bulkAction}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-purple-600 hover:text-purple-800 font-bold"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {/* Applications Table */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <p className="font-bold text-gray-500">{totalCount} {activeTab === 'history' ? 'historical' : 'active'} records</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="py-3 px-4 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === applications.length && applications.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="w-5 h-5 rounded accent-purple-600"
                                                />
                                            </th>
                                            <th className="py-3 px-4 text-left font-bold text-gray-500 uppercase text-xs">Ref #</th>
                                            <th className="py-3 px-4 text-left font-bold text-gray-500 uppercase text-xs">Name</th>
                                            <th className="py-3 px-4 text-left font-bold text-gray-500 uppercase text-xs">Dept</th>
                                            <th className="py-3 px-4 text-left font-bold text-gray-500 uppercase text-xs">Status</th>
                                            <th className="py-3 px-4 text-left font-bold text-gray-500 uppercase text-xs">Chat</th>
                                            <th className="py-3 px-4 text-left font-bold text-gray-500 uppercase text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-20 text-center text-gray-400 font-bold italic">No records found</td>
                                            </tr>
                                        ) : (
                                            applications.map((app) => (
                                                <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(app.id)}
                                                            onChange={() => toggleSelect(app.id)}
                                                            className="w-5 h-5 rounded accent-purple-600"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-bold text-purple-600">{app.refNumber}</td>
                                                    <td className="py-3 px-4 font-semibold">{app.fullName}</td>
                                                    <td className="py-3 px-4 text-gray-600 text-sm">{app.department}</td>
                                                    <td className="py-3 px-4">
                                                        <select
                                                            value={app.status}
                                                            onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                                            className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadgeClass(app.status)}`}
                                                        >
                                                            {STATUSES.filter(s => s !== 'All').map((s) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <a
                                                            href={`https://wa.me/${app.phone.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 inline-flex items-center gap-1"
                                                        >
                                                            <span>💬</span> WhatsApp
                                                        </a>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingApp(app)}
                                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Page {page} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-gray-100 rounded-lg font-semibold disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-4 py-2 bg-gray-100 rounded-lg font-semibold disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {
                editingApp && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-purple-900">{editingApp.refNumber}</h3>
                                <button onClick={() => setEditingApp(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs uppercase text-gray-400 font-bold mb-1">Full Name</p>
                                        <p className="font-bold text-gray-800">{editingApp.fullName}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs uppercase text-gray-400 font-bold mb-1">Email</p>
                                        <p className="font-bold text-gray-800">{editingApp.email}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs uppercase text-gray-400 font-bold mb-1">Phone</p>
                                        <p className="font-bold text-gray-800">{editingApp.phone}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs uppercase text-gray-400 font-bold mb-1">Department</p>
                                        <p className="font-bold text-gray-800">{editingApp.department}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs uppercase text-gray-400 font-bold mb-1">Level</p>
                                        <p className="font-bold text-gray-800">{editingApp.level}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs uppercase text-gray-400 font-bold mb-1">Status</p>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusBadgeClass(editingApp.status)}`}>
                                            {editingApp.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs uppercase text-gray-400 font-bold mb-2">Talents</p>
                                    <div className="flex flex-wrap gap-2">
                                        {editingApp.talents?.map((t: string) => (
                                            <span key={t} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs uppercase text-gray-400 font-bold mb-2">Motivation</p>
                                    <p className="text-gray-700">{editingApp.motivation}</p>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100">
                                <button
                                    onClick={() => setEditingApp(null)}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
