import { Button, Loading, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { navigate, showSnackbar } from '@openmrs/esm-framework';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { convertQuotationToInvoice } from './quotation.resource';
import { spaBasePath } from '../constants';

export interface AcceptQuotationModalProps {
  closeModal: () => void;
  billUuid: string;
}

export const AcceptQuotationModal: React.FC<AcceptQuotationModalProps> = ({ closeModal, billUuid }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();

  const onContinue = () => {
    setIsSubmitting(true);
    convertQuotationToInvoice(billUuid)
      .then(() => {
        closeModal();
        showSnackbar({
          title: t('success', 'Success'),
          subtitle: t('successfullyAcceptedQuotation', 'Successfully Accepted Quotation'),
          kind: 'success',
        });
        navigate({ to: window.getOpenmrsSpaBase() + 'home/billing' });
      })
      .catch(() => {
        showSnackbar({
          title: t('anErrorOccurred', 'An Error Occurred'),
          subtitle: t('anErrorOccurredClockingOut', 'An error occurred while accepting Quotation'),
          kind: 'error',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
        closeModal();
      });
  };

  return (
    <React.Fragment>
      <ModalHeader closeModal={closeModal}>Accept Quotation</ModalHeader>
      <ModalBody>Do you want to proceed.</ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal} type="button">
          {t('cancel', 'Cancel')}
        </Button>
        <Button type="submit" onClick={onContinue} kind="primary">
          {isSubmitting ? (
            <>
              <Loading withOverlay={false} small />
              {t('acceptQuotation', 'Accept Quotation')}
            </>
          ) : (
            t('acceptQuotation', 'Accept Quotation')
          )}
        </Button>
      </ModalFooter>
    </React.Fragment>
  );
};
