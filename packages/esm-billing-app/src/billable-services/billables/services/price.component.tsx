import React, { useMemo, useState } from 'react';
import { BillableFormSchema } from '../form-schemas';
import { Controller, Noop, RefCallBack, useFormContext, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useGetCurrentDollarRate, usePaymentModes } from '../../../billing.resource';
import styles from './service-form.scss';
import { ComboBox, IconButton, TextInput } from '@carbon/react';
import { TrashCan } from '@carbon/react/icons';
import { ResponsiveWrapper } from '@openmrs/esm-framework';

interface PriceFieldProps {
  field: Record<string, any>;
  index: number;
  control: Control<BillableFormSchema>;
  removeServicePrice: (index: number) => void;
  errors: Record<string, any>;
}

const PriceField: React.FC<PriceFieldProps> = ({ field, index, control, removeServicePrice, errors }) => {
  const { t } = useTranslation();
  const { paymentModes, isLoading } = usePaymentModes();
  const { watch } = useFormContext();
  const servicePrices = watch('servicePrices');
  const rate = useGetCurrentDollarRate();
  const [exchangeAmount, setExchangeAmount] = useState(1);
  // Filter out the payment modes that are already selected
  const availablePaymentModes = useMemo(
    () =>
      paymentModes?.filter(
        (paymentMode) => !servicePrices?.some((servicePrice) => servicePrice.paymentMode?.uuid === paymentMode.uuid),
      ),
    [paymentModes, servicePrices],
  );

  const handleServicePrice = (
    e: { target: { value: string } },
    field: {
      onChange: any;
      onBlur?: Noop;
      value?: number;
      disabled?: boolean;
      name?: `servicePrices.${number}.price`;
      ref?: RefCallBack;
    },
  ) => {
    field.onChange(parseFloat(e.target.value));
    let computed = parseFloat(e.target.value) * rate.data.rate_amount;
    setExchangeAmount(computed);
  };

  return (
    <div key={field.id} className={styles.paymentMethods}>
      <ResponsiveWrapper>
        <Controller
          name={`servicePrices.${index}.paymentMode`}
          control={control}
          render={({ field }) => (
            <ComboBox
              onChange={({ selectedItem }) => field.onChange(selectedItem)}
              titleText={t('paymentMethodDescription', 'Payment method {{methodName}}', {
                methodName: servicePrices[index]?.paymentMode?.name ?? '',
              })}
              items={availablePaymentModes ?? []}
              itemToString={(item) => (item ? item.name : '')}
              placeholder={t('selectPaymentMode', 'Select payment mode')}
              disabled={isLoading}
              initialSelectedItem={field.value}
              invalid={!!errors?.servicePrices?.[index]?.paymentMode}
              invalidText={errors?.servicePrices?.[index]?.paymentMode?.message}
            />
          )}
        />
      </ResponsiveWrapper>
      <ResponsiveWrapper>
        <Controller
          name={`servicePrices.${index}.uuid`}
          control={control}
          render={({ field }) => (
            <TextInput type="hidden" labelText="" defaultValue={field.value} invalid="" invalidText="" />
          )}
        />
        <Controller
          name={`servicePrices.${index}.price`}
          control={control}
          render={({ field }) => (
            <TextInput
              onChange={(e: { target: { value: string } }) => {
                handleServicePrice(e, field);
              }}
              type="number"
              labelText={t('usCurrency', 'USD')}
              placeholder={t('enterPrice', 'Enter price')}
              defaultValue={field.value}
              invalid={!!errors?.servicePrices?.[index]?.price}
              invalidText={errors?.servicePrices?.[index]?.price?.message}
            />
          )}
        />
      </ResponsiveWrapper>
      <ResponsiveWrapper>
        <p style={{ color: 'red' }}>
          Exchange Rate:{' '}
          {exchangeAmount.toLocaleString('en-ZW', {
            style: 'currency',
            currency: 'ZWL',
          })}
        </p>
      </ResponsiveWrapper>
      <IconButton
        kind="danger--tertiary"
        size="md"
        label={t('delete', 'Delete')}
        onClick={() => removeServicePrice(index)}>
        <TrashCan />
      </IconButton>
    </div>
  );
};

export default PriceField;
