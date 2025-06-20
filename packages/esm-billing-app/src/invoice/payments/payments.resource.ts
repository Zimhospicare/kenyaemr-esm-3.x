import useSWR from 'swr';
import { openmrsFetch, useConfig } from '@openmrs/esm-framework';
import { BillingConfig } from '../../config-schema';

type PaymentMethod = {
  uuid: string;
  description: string;
  name: string;
  retired: boolean;
};

const swrOption = {
  errorRetryCount: 2,
};

export interface InsuranceScheme {
  insuranceScheme: string;
  policyNo: string;
  hasInsurance: boolean;
  message: string;
}

export const usePaymentModes = () => {
  const { excludedPaymentMode } = useConfig<BillingConfig>();
  const url = `/ws/rest/v1/cashier/paymentMode`;
  const { data, isLoading, error, mutate } = useSWR<{ data: { results: Array<PaymentMethod> } }>(
    url,
    openmrsFetch,
    swrOption,
  );
  const allowedPaymentModes =
    excludedPaymentMode?.length > 0
      ? data?.data?.results.filter((mode) => !excludedPaymentMode.some((excluded) => excluded.uuid === mode.uuid)) ?? []
      : data?.data?.results ?? [];
  return {
    paymentModes: allowedPaymentModes,
    isLoading,
    mutate,
    error,
  };
};

export const usePatientInsuranceScheme = (patientUuid: any) => {
  const url = `/ws/rest/v1/cashier/insurance-scheme?patientUuid=${patientUuid}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: InsuranceScheme }>(url, openmrsFetch);
  return {
    insurance: data?.data,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};
