
import React from 'react';
import { Input } from '@/components/ui/input';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Search } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface PaymentHistoryFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onDownloadReport: () => void;
}

const PaymentHistoryFilters: React.FC<PaymentHistoryFiltersProps> = ({
  search,
  setSearch,
  dateRange,
  setDateRange,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  onDownloadReport,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by patient name, email, phone or payment reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 input-focus"
        />
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 text-xs flex items-center gap-1"
          onClick={onDownloadReport}
        >
          <Download className="h-3 w-3" />
          Download Report
        </Button>
      </div>
    </div>
  );
};

export default PaymentHistoryFilters;
