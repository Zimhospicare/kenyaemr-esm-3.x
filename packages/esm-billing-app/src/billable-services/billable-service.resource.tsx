import { OpenmrsResource, openmrsFetch } from '@openmrs/esm-framework';
import useSWR from 'swr';
import { ServiceConcept, ServiceTypesResponse } from '../types';

type ResponseObject = {
  results: Array<OpenmrsResource>;
};

export const useBillableServices = () => {
  const url = `/ws/rest/v1/cashier/billableService?v=custom:(uuid,name,shortName,stockItem:(uuid, display),serviceStatus,serviceType:(uuid,display),servicePrices:(uuid,name,paymentMode,price),concept:(uuid,display))`;
  const { data, isLoading, isValidating, error, mutate } = useSWR<{ data: ResponseObject }>(url, openmrsFetch, {});
  return { billableServices: data?.data.results ?? [], isLoading, isValidating, error, mutate };
};

export function useServiceTypes() {
  // service concept UUID containing all available services e.g lab, pharmacy, surgical etc
  const serviceConceptUuid = `a8f3f64a-11d5-4a09-b0fb-c8118fa349f3`;
  const url = `/ws/rest/v1/concept/${serviceConceptUuid}?v=custom:(setMembers:(uuid,display,id))`;
  const { data, error, isLoading } = useSWR<{ data: ServiceTypesResponse }>(url, openmrsFetch, {});
  return { serviceTypes: data?.data.setMembers ?? [], error, isLoading };
}

export const usePaymentModes = () => {
  const url = `/ws/rest/v1/cashier/paymentMode`;
  const { data, error, isLoading } = useSWR<{ data: ResponseObject }>(url, openmrsFetch, {});
  return { paymentModes: data?.data.results ?? [], error, isLoading };
};

export const createBillableService = (payload: any, uuid?: string) => {
  const url = `/ws/rest/v1/cashier/api/billable-service`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
export const deleteBillableService = (payload: any) => {
  const url = `/ws/rest/v1/cashier/api/deletebillable-service`;
  return openmrsFetch(url, {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export function useConceptsSearch(conceptToLookup: string) {
  const conditionsSearchUrl = `/ws/rest/v1/conceptsearch?q=${conceptToLookup}`;

  const { data, error, isLoading } = useSWR<{ data: { results: Array<ServiceConcept> } }, Error>(
    conceptToLookup ? conditionsSearchUrl : null,
    openmrsFetch,
  );

  return {
    searchResults: data?.data?.results ?? [],
    error: error,
    isSearching: isLoading,
  };
}
