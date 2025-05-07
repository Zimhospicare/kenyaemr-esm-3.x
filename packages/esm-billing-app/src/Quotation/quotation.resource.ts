import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

export const convertQuotationToInvoice = (billUuid: string) => {
  const url = `${restBaseUrl}/cashier/quotation?billUuid=${billUuid}&billType=INVOICE`;
  return openmrsFetch(url, {
    method: 'GET',
  });
};
