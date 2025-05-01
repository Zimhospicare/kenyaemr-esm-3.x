import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { RequestStatus } from '../types';

export const readableStatusMap = new Map<RequestStatus, string>();
readableStatusMap.set('COMPLETED', 'COMPLETED');
readableStatusMap.set('FAILED', 'Failed');
readableStatusMap.set('PENDING', 'Waiting for user...');

export const initiateStkPush = async (
  payload: {
    AccountReference: string;
    PhoneNumber: string;
    Amount: string;
  },
  setNotification: (notification: { type: 'error' | 'success'; message: string }) => void,
  echoCash_PAYMENT_API_BASE_URL: string,
  isPDSLFacility: boolean,
): Promise<boolean> => {
  if (isPDSLFacility) {
    const billReference = payload.AccountReference.split('#').at(-1);
    const stkPushURL = `${restBaseUrl}/rmsdataexchange/api/rmsstkpush`;

    const stkPushResponse = await openmrsFetch(stkPushURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bill_reference: billReference,
        amount: payload.Amount,
        msisdn: payload.PhoneNumber,
      }),
    });

    if (stkPushResponse.ok) {
      setNotification({ message: 'STK Push sent successfully', type: 'success' });
      return true;
    }

    if (!stkPushResponse.ok) {
      setNotification({
        message: 'An error occurred making the request',
        type: 'error',
      });

      return false;
    }
  } else {
    try {
      const url = `${echoCash_PAYMENT_API_BASE_URL}/api/ecocash_pay/api/v2/payment/instant/c2b/sandbox`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerMsisdn: payload.PhoneNumber,
          amount: payload.Amount,
          reason: 'Payment',
          currency: 'USD',
          sourceReference: payload.AccountReference,
        }),
      });

      if (res.ok) {
        setNotification({ message: 'STK Push sent successfully', type: 'success' });
        return true;
      }

      if (!res.ok && res.status === 403) {
        setNotification({
          message: 'Health facility EcoCash data not configured.',
          type: 'error',
        });

        return;
      }

      if (!res.ok) {
        throw new Error('Unable to initiate Lipa Na EcoCash, please try again later.');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      setNotification({
        message: 'Unable to initiate Lipa Na EcoCash, please try again later.',
        type: 'error',
      });
    }
  }
};

export const getRequestStatus = async (
  payload: {
    AccountReference: string;
    PhoneNumber: string;
  },
  echoCash_PAYMENT_API_BASE_URL: string,
  isPDSLFacility: boolean,
): Promise<{ status: RequestStatus; ecocashReference?: string }> => {
  let response: Response;

  if (isPDSLFacility) {
    try {
      // response = await openmrsFetch(`${restBaseUrl}/rmsdataexchange/api/rmsstkcheck`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: {
      //     requestId,
      //   },
      // });
    } catch (error) {
      throw new Error(error.message ?? error.statusText ?? 'An error occurred');
    }
  } else {
    response = await fetch(`${echoCash_PAYMENT_API_BASE_URL}/api/ecocash_pay/api/v1/transaction/c2b/status/sandbox`, {
      method: 'POST',
      headers: {
        'X-API-KEY': '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceMobileNumber: payload.PhoneNumber,
        sourceReference: payload.AccountReference,
      }),
    });
  }

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);

    if (response.statusText) {
      error.message = response.statusText;
    }
    throw error;
  }

  return await response.json();
};

export const getErrorMessage = (err: { message: string }, t) => {
  if (err.message) {
    return err.message;
  }

  return t('unKnownErrorMsg', 'An unknown error occurred');
};
