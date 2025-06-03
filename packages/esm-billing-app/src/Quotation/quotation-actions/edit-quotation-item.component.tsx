import { launchWorkspace } from '@openmrs/esm-framework';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem } from '@carbon/react';
import { LineItem, MappedBill } from '../../types';

type EditLineItemProps = {
  lineItem: LineItem;
  bill: MappedBill;
};

const EditQuotationItem: React.FC<EditLineItemProps> = ({ lineItem, bill }) => {
  const { t } = useTranslation();

  const handleOpenEditLineItemWorkspace = (lineItem: LineItem) => {
    launchWorkspace('edit-quote-form', {
      workspaceTitle: t('editQuoteForm', 'Edit Quote Form'),
      lineItem,
      bill,
    });
  };
  return (
    <OverflowMenuItem itemText={t('editItem', 'Edit')} onClick={() => handleOpenEditLineItemWorkspace(lineItem)} />
  );
};

export default EditQuotationItem;
