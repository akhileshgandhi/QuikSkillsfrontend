import { useState } from 'react';
import api from '../utils/api';
import { validateGST, formatGST } from '../utils/gstValidator';

export interface CreateTenantData {
  name: string;
  gstNumber: string;
  dbConnectionString?: string;
}

export interface TenantResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    subdomain: string;
    gstNumber: string;
    tenantKey: string;
    status: string;
    createdAt: string;
  };
  message: string;
  clientUrl: string;
}

export const useTenantOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<TenantResponse | null>(null);

  const createTenant = async (data: CreateTenantData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate GST before sending
      if (!validateGST(data.gstNumber)) {
        throw new Error('Invalid GST Number format');
      }

      // Format GST number
      const formattedData = {
        ...data,
        gstNumber: formatGST(data.gstNumber),
      };

      const response = await api.post<TenantResponse>('/tenants', formattedData);
      setSuccess(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to create tenant';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTenant,
    loading,
    error,
    success,
  };
};

