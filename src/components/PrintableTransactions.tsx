import React from 'react';

interface PrintableTransactionsProps {
  transactions: any[];
  columns: { key: string; label: string }[];
}

const PrintableTransactions = React.forwardRef<HTMLDivElement, PrintableTransactionsProps>(
  ({ transactions, columns }, ref) => {
    const printableColumns = columns.filter(col => col.key !== 'attachment');

    return (
      <div ref={ref} className="hidden print:block p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Transaction Report</h1>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {printableColumns.map((col) => (
                <th key={col.key} className="p-2 text-left font-semibold text-gray-700">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-100">
                {printableColumns.map((col) => (
                  <td key={`${transaction.id}-${col.key}`} className="p-2 text-gray-800">
                    {transaction[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

PrintableTransactions.displayName = 'PrintableTransactions';

export default PrintableTransactions;