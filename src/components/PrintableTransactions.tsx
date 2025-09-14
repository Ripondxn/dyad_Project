import React from 'react';

interface PrintableTransactionsProps {
  transactions: any[];
  columns: { key: string; label: string }[];
}

const PrintableTransactions = React.forwardRef<HTMLDivElement, PrintableTransactionsProps>(
  ({ transactions, columns }, ref) => {
    // Filter out the 'attachment' column from the main display columns if it's a React element
    // and handle it separately for printing the URL.
    const printableColumns = columns.filter(col => col.key !== 'attachment');

    return (
      <div 
        ref={ref} 
        // This component is positioned off-screen and becomes visible only for printing.
        className="absolute -left-[9999px] p-6 print:static print:left-auto"
      >
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Transaction Report</h1>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {printableColumns.map((col) => (
                <th key={col.key} className="p-2 text-left font-semibold text-gray-700">
                  {col.label}
                </th>
              ))}
              {/* Add a column for attachment URL if it exists in the data */}
              {transactions.some(t => t.attachment_url) && (
                <th className="p-2 text-left font-semibold text-gray-700">Attachment URL</th>
              )}
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
                {transaction.attachment_url && (
                  <td className="p-2 text-blue-600 underline">
                    {transaction.attachment_url}
                  </td>
                )}
                {!transaction.attachment_url && transactions.some(t => t.attachment_url) && (
                  <td className="p-2 text-gray-500">None</td>
                )}
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