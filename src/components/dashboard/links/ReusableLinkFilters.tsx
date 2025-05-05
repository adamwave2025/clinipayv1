
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReusableLinkFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  linkType: string;
  onLinkTypeChange: (type: string) => void;
}

const ReusableLinkFilters = ({
  searchQuery,
  onSearchChange,
  linkType,
  onLinkTypeChange
}: ReusableLinkFiltersProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex items-center w-full md:w-auto relative">
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search reusable links"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full md:w-[300px]"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={linkType}
          onValueChange={onLinkTypeChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="consultation">Consultation</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="treatment">Treatment</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ReusableLinkFilters;
