"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface DataTableProps<T> {
  columns: {
    key: keyof T | string;
    label: string;
  }[];
  data: T[];
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>{column.label}</TableHead>
            ))}
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.length ? (
            data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => {
                  const value = String(column.key).split('.').reduce((o: any, i) => o?.[i], row);
                  return (
                    <TableCell key={String(column.key)}>
                      {value as React.ReactNode}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onEdit(row)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onDelete(row.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;