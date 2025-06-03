import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import fuzzy from 'fuzzy';
import {
  DataTable,
  type DataTableHeader,
  type DataTableRow,
  DataTableSkeleton,
  Layer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tile,
} from '@carbon/react';
import { ExtensionSlot, isDesktop, useDebounce, useLayoutType } from '@openmrs/esm-framework';
import { LineItem, MappedBill } from '../types';
import styles from './quotation-table.scss';

type QuotationTableProps = {
  bill: MappedBill;
  isSelectable?: boolean;
  isLoadingBill?: boolean;
  onSelectItem?: (selectedLineItems: LineItem[]) => void;
};

const QuotationTable: React.FC<QuotationTableProps> = ({ bill, isSelectable = true, isLoadingBill, onSelectItem }) => {
  const { t } = useTranslation();
  const lineItems = bill.lineItems;

  const paidLineItems = lineItems?.filter((item) => item.paymentStatus === 'PAID') ?? [];
  const layout = useLayoutType();
  const responsiveSize = isDesktop(layout) ? 'sm' : 'lg';
  const [selectedLineItems, setSelectedLineItems] = useState(paidLineItems ?? []);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm);
  const filteredLineItems = useMemo(() => {
    if (!debouncedSearchTerm) {
      return lineItems;
    }

    return debouncedSearchTerm
      ? fuzzy
          .filter(debouncedSearchTerm, lineItems, {
            extract: (lineItem: LineItem) => `${lineItem.item}`,
          })
          .sort((r1, r2) => r1.score - r2.score)
          .map((result) => result.original)
      : lineItems;
  }, [debouncedSearchTerm, lineItems]);

  const tableHeaders: Array<typeof DataTableHeader> = [
    { header: 'No', key: 'no' },
    { header: 'Quotation item', key: 'billItem' },
    { header: 'Quotation code', key: 'billCode' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Price', key: 'price' },
    { header: 'Total', key: 'total' },
  ];
  const processBillItem = (item) => (item?.item || item?.billableService)?.split(':')[1];

  const tableRows: Array<typeof DataTableRow> = useMemo(
    () =>
      filteredLineItems?.map((item, index) => {
        return {
          no: `${index + 1}`,
          id: `${item.uuid}`,
          billItem: processBillItem(item),
          billCode: bill.receiptNumber,
          status: item.paymentStatus,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        };
      }) ?? [],
    [bill.receiptNumber, filteredLineItems],
  );

  if (isLoadingBill) {
    return (
      <div className={styles.loaderContainer}>
        <DataTableSkeleton
          columnCount={tableHeaders.length}
          showHeader={false}
          showToolbar={false}
          size={responsiveSize}
          zebra
        />
      </div>
    );
  }

  const handleRowSelection = (row: typeof DataTableRow, checked: boolean) => {
    const matchingRow = filteredLineItems.find((item) => item.uuid === row.id);
    let newSelectedLineItems;

    if (checked) {
      newSelectedLineItems = [...selectedLineItems, matchingRow];
    } else {
      newSelectedLineItems = selectedLineItems.filter((item) => item.uuid !== row.id);
    }
    setSelectedLineItems(newSelectedLineItems);
    onSelectItem(newSelectedLineItems);
  };

  return (
    <div className={styles.quotationContainer}>
      <DataTable headers={tableHeaders} isSortable rows={tableRows} size={responsiveSize} useZebraStyles>
        {({ rows, headers, getRowProps, getSelectionProps, getTableProps, getToolbarProps }) => (
          <TableContainer
            description={
              <span className={styles.tableDescription}>
                <span>{t('itemsToBeBilled', 'Items to be billed')}</span>
              </span>
            }
            title={t('lineItems', 'Line items')}>
            <div className={styles.toolbarWrapper}>
              <TableToolbar {...getToolbarProps()} className={styles.tableToolbar} size={responsiveSize}>
                <TableToolbarContent className={styles.headerContainer}>
                  <TableToolbarSearch
                    className={styles.searchbox}
                    expanded
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    placeholder={t('searchThisTable', 'Search this table')}
                    size={responsiveSize}
                  />
                </TableToolbarContent>
              </TableToolbar>
            </div>
            <Table {...getTableProps()} aria-label="Quotation line items" className={styles.table}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader key={header.key}>{header.header}</TableHeader>
                  ))}
                  <TableHeader key={'action'}>Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => {
                  const lineItem = lineItems[index];
                  return (
                    <TableRow
                      key={row.id}
                      {...getRowProps({
                        row,
                      })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                      <TableCell>
                        <ExtensionSlot
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            height: '3em',
                          }}
                          className="cds--overflow-menu-options__option"
                          name="quotation-actions-overflow-menu-slot"
                          state={{ lineItem, bill }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      {filteredLineItems?.length === 0 && (
        <div className={styles.filterEmptyState}>
          <Layer>
            <Tile className={styles.filterEmptyStateTile}>
              <p className={styles.filterEmptyStateContent}>
                {t('noMatchingItemsToDisplay', 'No matching items to display')}
              </p>
              <p className={styles.filterEmptyStateHelper}>{t('checkFilters', 'Check the filters above')}</p>
            </Tile>
          </Layer>
        </div>
      )}
    </div>
  );
};

export default QuotationTable;
