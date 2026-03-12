import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import type { MaterialAggregate } from "../lib/calculations";
import { formatCurrency } from "../lib/calculations";

interface MaterialAggregateTableProps {
  aggregates: MaterialAggregate[];
}

function StockBadge({ available }: { available: number }) {
  if (available === 0)
    return (
      <Badge variant="destructive" className="text-xs">
        Out of Stock
      </Badge>
    );
  if (available < 10)
    return (
      <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
        Low Stock
      </Badge>
    );
  return (
    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
      In Stock
    </Badge>
  );
}

export default function MaterialAggregateTable({
  aggregates,
}: MaterialAggregateTableProps) {
  const totalValue = aggregates.reduce((sum, a) => sum + a.totalValue, 0);

  if (aggregates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No materials found.
      </p>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Material</TableHead>
            <TableHead className="text-right">Total In</TableHead>
            <TableHead className="text-right">Total Out</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregates.map((a) => (
            <TableRow key={a.material.id.toString()}>
              <TableCell className="font-medium">
                <div>{a.material.name}</div>
                <div className="text-xs text-muted-foreground">
                  {a.material.unit} ·{" "}
                  {formatCurrency(Number(a.material.costPerUnit))}/unit
                </div>
              </TableCell>
              <TableCell className="text-right text-green-700">
                {a.totalIn}
              </TableCell>
              <TableCell className="text-right text-orange-600">
                {a.totalOut}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {a.available}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(a.totalValue)}
              </TableCell>
              <TableCell>
                <StockBadge available={a.available} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="font-semibold">
              Total Stock Value
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(totalValue)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
