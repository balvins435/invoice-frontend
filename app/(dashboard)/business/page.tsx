'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  Upload,
  Trash2,
  Plus,
  Percent,
  Image as ImageIcon,
  Briefcase,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/lib/api';
import { API_ORIGIN } from '@/lib/config';
import { Business } from '@/types';
import toast from 'react-hot-toast';

const getLogoUrl = (logo?: string | null) => {
  if (!logo) return null;
  if (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:')) return logo;
  if (logo.startsWith('/')) return `${API_ORIGIN}${logo}`;
  return `${API_ORIGIN}/${logo}`;
};

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const editLogoInputRef = useRef<HTMLInputElement | null>(null);
  const createLogoInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    tax_rate: 16.0,
  });

  useEffect(() => { fetchBusinesses(); }, []);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.business.getAll();
      const businessesData = response.data.results || response.data;
      setBusinesses(businessesData);
      if (businessesData.length > 0 && !selectedBusiness) {
        setSelectedBusiness(businessesData[0]);
        setFormData({
          business_name: businessesData[0].business_name,
          email: businessesData[0].email,
          phone: businessesData[0].phone,
          address: businessesData[0].address,
          tax_rate: businessesData[0].tax_rate,
        });
        setLogoPreview(getLogoUrl(businessesData[0].logo));
      }
    } catch {
      toast.error('Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setIsEditing(false);
    setFormData({
      business_name: business.business_name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      tax_rate: business.tax_rate,
    });
    setLogoPreview(getLogoUrl(business.logo));
    setLogoFile(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!selectedBusiness) return;
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value.toString()));
      if (logoFile) formDataToSend.append('logo', logoFile);
      await apiService.business.update(selectedBusiness.id, formDataToSend);
      toast.success('Business profile updated successfully');
      setIsEditing(false);
      fetchBusinesses();
    } catch {
      toast.error('Failed to update business profile');
    }
  };

  const handleCreate = async () => {
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value.toString()));
      if (logoFile) formDataToSend.append('logo', logoFile);
      await apiService.business.create(formDataToSend);
      toast.success('Business created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchBusinesses();
    } catch {
      toast.error('Failed to create business');
    }
  };

  const handleDelete = async () => {
    if (!selectedBusiness) return;
    try {
      await apiService.business.delete(selectedBusiness.id);
      toast.success('Business deleted successfully');
      setShowDeleteModal(false);
      fetchBusinesses();
      if (businesses.length > 1) {
        const remaining = businesses.filter((b) => b.id !== selectedBusiness.id);
        setSelectedBusiness(remaining[0]);
      } else {
        setSelectedBusiness(null);
      }
    } catch {
      toast.error('Failed to delete business');
    }
  };

  const resetForm = () => {
    setFormData({ business_name: '', email: '', phone: '', address: '', tax_rate: 16.0 });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const isFormValid = () =>
    formData.business_name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.tax_rate >= 0 &&
    formData.tax_rate <= 100;

  return (
    <>
      <Navbar title="Business Profile" subtitle="Manage your business information and settings" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-7xl">

          {/* ── Page Header ── */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Business Profile
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your business information and settings
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 shadow-sm transition-all hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Business
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

            {/* ── Left Sidebar — Business List ── */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

                <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Your Businesses
                  </p>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white" />
                    <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading…</p>
                  </div>

                ) : businesses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                      <Building className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No businesses yet</p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Create your first business to get started
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Business
                    </button>
                  </div>

                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {businesses.map((business) => {
                      const isSelected = selectedBusiness?.id === business.id;
                      return (
                        <button
                          key={business.id}
                          onClick={() => handleSelectBusiness(business)}
                          className={`group w-full px-5 py-4 text-left transition-all ${
                            isSelected
                              ? 'bg-gray-900 dark:bg-white'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
                              isSelected
                                ? 'border-white/20 dark:border-gray-900/20 bg-white/10 dark:bg-gray-900/10'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                            }`}>
                              {business.logo ? (
                                <img
                                  src={getLogoUrl(business.logo) || ''}
                                  alt={business.business_name}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <span className={`text-sm font-bold ${
                                  isSelected
                                    ? 'text-white dark:text-gray-900'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {business.business_name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-semibold ${
                                isSelected
                                  ? 'text-white dark:text-gray-900'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {business.business_name}
                              </p>
                              <p className={`mt-0.5 truncate text-xs ${
                                isSelected
                                  ? 'text-gray-300 dark:text-gray-600'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                {business.email}
                              </p>
                            </div>

                            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                              isSelected
                                ? 'text-white dark:text-gray-900'
                                : 'text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                            }`} />
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              isSelected
                                ? 'bg-white/15 dark:bg-gray-900/15 text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                            }`}>
                              Tax {business.tax_rate}%
                            </span>
                            <span className={`text-xs ${
                              isSelected ? 'text-gray-400 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {new Date(business.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            {/* ── Right Panel — Details ── */}
            <div className="lg:col-span-8 xl:col-span-9">
              {selectedBusiness ? (
                <div className="space-y-5">

                  {/* Header Card */}
                  <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <div className="flex items-start justify-between gap-4 p-6">

                      <div className="flex items-center gap-5">
                        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                          ) : (
                            <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                              {selectedBusiness.business_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {isEditing && (
                            <>
                              <input ref={editLogoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                              <button
                                type="button"
                                onClick={() => editLogoInputRef.current?.click()}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity hover:opacity-100 rounded-2xl"
                              >
                                <Upload className="h-5 w-5 text-white" />
                                <span className="text-[10px] font-medium text-white">Change</span>
                              </button>
                            </>
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {selectedBusiness.business_name}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {selectedBusiness.email}
                          </p>
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                              Active
                            </span>
                            <span className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                              VAT {selectedBusiness.tax_rate}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex shrink-0 items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => { setIsEditing(false); handleSelectBusiness(selectedBusiness); }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={!isFormValid()}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-white px-3.5 py-2 text-sm font-medium text-white dark:text-gray-900 transition-all hover:bg-gray-800 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              Save Changes
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Info Grid */}
                  <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                    <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Company Information
                      </p>
                    </div>

                    {/* The gap-px trick: parent bg becomes the "border" between cells */}
                    <div className="grid grid-cols-1 gap-px bg-gray-100 dark:bg-gray-800 md:grid-cols-2">

                      {/* Business Name */}
                      <div className="bg-white dark:bg-gray-900 p-5">
                        <div className="mb-2 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            Business Name
                          </label>
                        </div>
                        {isEditing ? (
                          <Input
                            value={formData.business_name}
                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                            placeholder="Enter business name"
                            required
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {selectedBusiness.business_name}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="bg-white dark:bg-gray-900 p-5">
                        <div className="mb-2 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            Email Address
                          </label>
                        </div>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="business@example.com"
                            required
                          />
                        ) : (
                          <p className="text-sm text-gray-900 dark:text-gray-100">{selectedBusiness.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="bg-white dark:bg-gray-900 p-5">
                        <div className="mb-2 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            Phone Number
                          </label>
                        </div>
                        {isEditing ? (
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+254 700 000000"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedBusiness.phone || (
                              <span className="text-gray-400 dark:text-gray-500">Not provided</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Tax Rate */}
                      <div className="bg-white dark:bg-gray-900 p-5">
                        <div className="mb-2 flex items-center gap-2">
                          <Percent className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            Tax Rate
                          </label>
                        </div>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.tax_rate}
                            onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                            required
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {selectedBusiness.tax_rate}% VAT
                          </p>
                        )}
                      </div>

                      {/* Address — full width */}
                      <div className="bg-white dark:bg-gray-900 p-5 md:col-span-2">
                        <div className="mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            Business Address
                          </label>
                        </div>
                        {isEditing ? (
                          <textarea
                            className="input-primary min-h-[90px] w-full resize-none"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter full business address"
                          />
                        ) : (
                          <p className="whitespace-pre-line text-sm text-gray-900 dark:text-gray-100">
                            {selectedBusiness.address || (
                              <span className="text-gray-400 dark:text-gray-500">No address provided</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats — view mode only */}
                  {!isEditing && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 p-5">
                        <p className="text-xs font-medium text-blue-500 dark:text-blue-400">Total Invoices</p>
                        <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">—</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 p-5">
                        <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400">Total Income</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">—</p>
                      </div>
                      <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-5">
                        <p className="text-xs font-medium text-red-500 dark:text-red-400">Total Expenses</p>
                        <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">—</p>
                      </div>
                      <div className="rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-950/30 p-5">
                        <p className="text-xs font-medium text-violet-500 dark:text-violet-400">Tax Collected</p>
                        <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-300">—</p>
                      </div>
                    </div>
                  )}
                </div>

              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center shadow-sm">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <Building className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300">No business selected</p>
                  <p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500">
                    Select a business from the list, or create a new one
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Business
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════
          Create Business Modal
      ══════════════════════════════════════ */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New Business"
        size="lg"
      >
        <div className="space-y-5">

          {/* Logo Upload */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Business Logo (Optional)
            </p>
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-2" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <div>
                <input ref={createLogoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <button
                  type="button"
                  onClick={() => createLogoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </button>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Recommended: 300×300px · PNG or JPG
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Business Name *"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Enter business name"
              required
            />
            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="business@example.com"
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+254 700 000000"
            />
            <Input
              label="Tax Rate (%) *"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              required
            />
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Business Address
              </label>
              <textarea
                className="input-primary min-h-[90px] w-full resize-none"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full business address"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 dark:border-gray-800 pt-4 sm:flex-row sm:justify-end">
            <button
              onClick={() => { setShowCreateModal(false); resetForm(); }}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!isFormValid()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Business
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          Delete Confirmation Modal
      ══════════════════════════════════════ */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Business"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                This action is permanent
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Deleting{' '}
                <span className="font-semibold">{selectedBusiness?.business_name}</span>{' '}
                will permanently remove all associated invoices and expenses. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 dark:bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Business
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
