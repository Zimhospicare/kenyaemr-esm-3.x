import { Button, InlineLoading } from '@carbon/react';
import { BaggageClaim, Printer } from '@carbon/react/icons';
import { ExtensionSlot, formatDatetime, parseDate, showModal, usePatient, useVisit } from '@openmrs/esm-framework';
import { ErrorState } from '@openmrs/esm-patient-common-lib';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useBill, useDefaultFacility, useGetCurrentDollarRate } from '../billing.resource';
import { convertToCurrency, convertToZWLCurrency } from '../helpers';
import { usePaymentsReconciler } from '../hooks/use-payments-reconciler';
import { LineItem } from '../types';
import QuotationTable from './quotation-table.component';
import styles from './quotation.scss';

import { PrintableQuotation } from './printable-quotation/printable-quotation.component';

interface quotationDetailsProps {
  label: string;
  value: string | number;
}

const Quotation: React.FC = () => {
  const { t } = useTranslation();
  const { data: facilityInfo } = useDefaultFacility();
  const { billUuid, patientUuid } = useParams();
  const [isPrinting, setIsPrinting] = useState(false);
  const { patient, isLoading: isLoadingPatient, error: patientError } = usePatient(patientUuid);
  const { bill, isLoading: isLoadingBill, error: billingError } = useBill(billUuid);
  usePaymentsReconciler(billUuid);
  const { isLoading: isVisitLoading, error: visitError } = useVisit(patientUuid);
  const componentRef = useRef<HTMLDivElement>(null);
  const handleSelectItem = (lineItems: Array<LineItem>) => {};
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Quotation ${bill?.receiptNumber} - ${patient?.name?.[0]?.given?.join(' ')} ${
      patient?.name?.[0].family
    }`,
    onBeforePrint() {
      setIsPrinting(true);
    },
    onAfterPrint() {
      setIsPrinting(false);
    },
    removeAfterPrint: true,
  });

  const rate = useGetCurrentDollarRate();
  let forexRate = 1;
  if (rate.data != undefined) {
    forexRate = rate.data.rate_amount;
  }

  const quotationDetails = {
    'Total Amount':
      convertToCurrency(bill?.totalAmount) + ' Exchange Rate:' + convertToZWLCurrency(forexRate * bill?.totalAmount),
    'Quotation Number': bill.receiptNumber,
    'Date And Time': formatDatetime(parseDate(bill.dateCreated), { mode: 'standard', noToday: true }),
    'Valid Until':
      bill?.quotaValidityDate != '--'
        ? formatDatetime(parseDate(bill.quotaValidityDate), { mode: 'standard', noToday: true })
        : '--',
  };

  if (isLoadingPatient || isLoadingBill || isVisitLoading) {
    return (
      <div className={styles.quotationContainer}>
        <InlineLoading
          className={styles.loader}
          status="active"
          iconDescription="Loading"
          description="Loading patient header..."
        />
      </div>
    );
  }

  if (billingError || patientError || visitError) {
    return (
      <div className={styles.errorContainer}>
        <ErrorState
          headerTitle={t('quotationError', 'Quotation error')}
          error={billingError ?? patientError ?? visitError}
        />
      </div>
    );
  }

  const handleAcceptQuotation = async () => {
    const dispose = showModal('accept-quotation-modal', {
      closeModal: () => dispose(),
      billUuid: billUuid,
    });
  };

  return (
    <div className={styles.quotationContainer}>
      {patient && patientUuid && <ExtensionSlot name="patient-header-slot" state={{ patient, patientUuid }} />}
      <div className={styles.detailsContainer}>
        <section className={styles.details}>
          {Object.entries(quotationDetails).map(([key, val]) => (
            <QuotationDetails key={key} label={key} value={val} />
          ))}
        </section>
      </div>
      <div className={styles.actionArea}>
        <Button
          onClick={handlePrint}
          kind="secondary"
          size="sm"
          disabled={isPrinting}
          renderIcon={Printer}
          iconDescription="Add"
          tooltipPosition="right">
          {isPrinting ? t('printQuotation', 'Print Quotation...') : t('printingQuotation', 'Print Quotation')}
        </Button>
        <Button
          onClick={handleAcceptQuotation}
          kind="secondary"
          size="sm"
          renderIcon={BaggageClaim}
          iconDescription="Add"
          tooltipPosition="bottom">
          {t('acceptQuotation', 'Accept Quotation')}
        </Button>
      </div>

      <QuotationTable bill={bill} isLoadingBill={isLoadingBill} onSelectItem={handleSelectItem} />

      <div className={styles.printContainer}>
        <PrintableQuotation
          ref={componentRef}
          facilityInfo={facilityInfo}
          bill={bill}
          patient={patient}
          isPrinting={isPrinting}
        />
      </div>
    </div>
  );
};

function QuotationDetails({ label, value }: quotationDetailsProps) {
  return (
    <div>
      <h1 className={styles.label}>{label}</h1>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export default Quotation;
