'use client';

import React, { useEffect, useState } from 'react';
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
  Globe,
  Percent,
  Image as ImageIcon
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/lib/api';
import { Business } from '@/types';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    tax_rate: 16.00,
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.business.getAll();
      setBusinesses(response.data.results || response.data);
      if (response.data.length > 0 && !selectedBusiness) {
        setSelectedBusiness(response.data[0]);
        setFormData({
          business_name: response.data[0].business_name,
          email: response.data[0].email,
          phone: response.data[0].phone,
          address: response.data[0].address,
          tax_rate: response.data[0].tax_rate,
        });
      }
    } catch (error) {
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
    setLogoPreview(business.logo);
    setLogoFile(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedBusiness) return;

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      await apiService.business.update(selectedBusiness.id, formDataToSend);
      toast.success('Business profile updated successfully');
      setIsEditing(false);
      fetchBusinesses();
    } catch (error) {
      toast.error('Failed to update business profile');
    }
  };

  const handleCreate = async () => {
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      await apiService.business.create(formDataToSend);
      toast.success('Business created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchBusinesses();
    } catch (error) {
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
        const remaining = businesses.filter(b => b.id !== selectedBusiness.id);
        setSelectedBusiness(remaining[0]);
      } else {
        setSelectedBusiness(null);
      }
    } catch (error) {
      toast.error('Failed to delete business');
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: '',
      email: '',
      phone: '',
      address: '',
      tax_rate: 16.00,
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const isFormValid = () => {
    return formData.business_name.trim() !== '' && 
           formData.email.trim() !== '' &&
           formData.tax_rate >= 0 && formData.tax_rate <= 100;
  };

  return (
    <>
      <Navbar 
        title="Business Profile" 
        subtitle="Manage your business information and settings"
      />
      
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business List */}
          <Card title="Your Businesses" actions={
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          }>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-500">Loading businesses...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="py-8 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No businesses yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Add your first business to get started
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedBusiness?.id === business.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <div className="flex items-start space-x-3">
                      {business.logo ? (
                        <div className="h-12 w-12 rounded-lg bg-white border border-gray-200 p-1">
                          <img
                            src={business.logo}
                            alt={business.business_name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {business.business_name}
                        </h4>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {business.email}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            Tax: {business.tax_rate}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(business.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Business Details */}
          <div className="lg:col-span-2">
            {selectedBusiness ? (
              <Card 
                title={selectedBusiness.business_name}
                subtitle="Business Details"
                actions={
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setIsEditing(false);
                            handleSelectBusiness(selectedBusiness);
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={!isFormValid()}
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditing(true)}
                          size="sm"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setShowDeleteModal(true)}
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                }
              >
                <div className="space-y-6">
                  {/* Logo Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Business Logo
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="h-32 w-32 rounded-lg bg-white border border-gray-300 flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      
                      {isEditing && (
                        <div>
                          <input
                            type="file"
                            id="logo-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                          <label htmlFor="logo-upload">
                            <div className="cursor-pointer">
                              <Button variant="secondary" type="button">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo
                              </Button>
                            </div>
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            Recommended: 300x300px, PNG or JPG
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.business_name}
                          onChange={(e) => setFormData({
                            ...formData,
                            business_name: e.target.value
                          })}
                          placeholder="Enter business name"
                          required
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Building className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="font-medium">{selectedBusiness.business_name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({
                            ...formData,
                            email: e.target.value
                          })}
                          placeholder="business@example.com"
                          required
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Mail className="h-5 w-5 text-gray-400 mr-3" />
                          <span>{selectedBusiness.email}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            phone: e.target.value
                          })}
                          placeholder="+254 700 000000"
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Phone className="h-5 w-5 text-gray-400 mr-3" />
                          <span>{selectedBusiness.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.tax_rate}
                          onChange={(e) => setFormData({
                            ...formData,
                            tax_rate: parseFloat(e.target.value) || 0
                          })}
                          required
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Percent className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="font-medium">{selectedBusiness.tax_rate}% VAT</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Address
                      </label>
                      {isEditing ? (
                        <textarea
                          className="input-primary min-h-[100px]"
                          value={formData.address}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: e.target.value
                          })}
                          placeholder="Enter full business address"
                        />
                      ) : (
                        <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                          <span className="whitespace-pre-line">
                            {selectedBusiness.address || 'No address provided'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Stats */}
                  {!isEditing && (
                    <div className="pt-6 border-t">
                      <h4 className="font-medium text-gray-900 mb-4">Business Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 mb-1">Total Invoices</p>
                          <p className="text-xl font-bold text-blue-700">--</p>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600 mb-1">Total Income</p>
                          <p className="text-xl font-bold text-green-700">--</p>
                        </div>
                        
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-600 mb-1">Total Expenses</p>
                          <p className="text-xl font-bold text-red-700">--</p>
                        </div>
                        
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-600 mb-1">Tax Collected</p>
                          <p className="text-xl font-bold text-purple-700">--</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="py-12 text-center">
                  <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No business selected
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Select a business from the list or create a new one
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Business
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Create Business Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Business"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Business Logo (Optional)
            </label>
            <div className="flex items-center space-x-6">
              <div className="h-24 w-24 rounded-lg bg-white border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              <div>
                <input
                  type="file"
                  id="create-logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="create-logo-upload">
                  <div className="cursor-pointer">
                    <Button variant="secondary" type="button">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 300x300px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name *"
              value={formData.business_name}
              onChange={(e) => setFormData({
                ...formData,
                business_name: e.target.value
              })}
              placeholder="Enter business name"
              required
            />

            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({
                ...formData,
                email: e.target.value
              })}
              placeholder="business@example.com"
              required
            />

            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({
                ...formData,
                phone: e.target.value
              })}
              placeholder="+254 700 000000"
            />

            <Input
              label="Tax Rate (%) *"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.tax_rate}
              onChange={(e) => setFormData({
                ...formData,
                tax_rate: parseFloat(e.target.value) || 0
              })}
              required
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <textarea
                className="input-primary min-h-[100px]"
                value={formData.address}
                onChange={(e) => setFormData({
                  ...formData,
                  address: e.target.value
                })}
                placeholder="Enter full business address"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!isFormValid()}
            >
              Create Business
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Business"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{selectedBusiness?.business_name}</span>?
            This will also delete all associated invoices and expenses.
          </p>
          <p className="text-sm text-danger-600 bg-danger-50 p-3 rounded-lg">
            ⚠️ This action cannot be undone. All data will be permanently deleted.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Business
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}