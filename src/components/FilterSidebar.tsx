import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const FilterSidebar = () => {
  const [isOpen, setIsOpen] = useState({
    keywords: true,
    department: false,
    location: false,
    jobType: false,
  });

  const FilterSection = ({ 
    title, 
    id, 
    children 
  }: { 
    title: string; 
    id: keyof typeof isOpen; 
    children: React.ReactNode;
  }) => (
    <Collapsible
      open={isOpen[id]}
      onOpenChange={() => setIsOpen({ ...isOpen, [id]: !isOpen[id] })}
      className="border-b pb-4"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between py-3 hover:text-primary transition-colors">
        <span className="font-medium">{title}</span>
        {isOpen[id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Filter Jobs
          <Button variant="ghost" size="sm" className="text-xs">
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <FilterSection title="Keywords" id="keywords">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="my-network" />
              <Label htmlFor="my-network" className="text-sm cursor-pointer">
                My Network
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="alumni-postings" />
              <Label htmlFor="alumni-postings" className="text-sm cursor-pointer">
                Alumni Postings
              </Label>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Department" id="department">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="computer-science" />
              <Label htmlFor="computer-science" className="text-sm cursor-pointer">
                Computer Science
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="engineering" />
              <Label htmlFor="engineering" className="text-sm cursor-pointer">
                Engineering
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="business" />
              <Label htmlFor="business" className="text-sm cursor-pointer">
                Business
              </Label>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Location" id="location">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="remote" />
              <Label htmlFor="remote" className="text-sm cursor-pointer">
                Remote
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="bay-area" />
              <Label htmlFor="bay-area" className="text-sm cursor-pointer">
                San Francisco Bay Area
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="new-york" />
              <Label htmlFor="new-york" className="text-sm cursor-pointer">
                New York
              </Label>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Job Type" id="jobType">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="full-time" />
              <Label htmlFor="full-time" className="text-sm cursor-pointer">
                Full-time
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="internship" />
              <Label htmlFor="internship" className="text-sm cursor-pointer">
                Internship
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="contract" />
              <Label htmlFor="contract" className="text-sm cursor-pointer">
                Contract
              </Label>
            </div>
          </div>
        </FilterSection>

        <Button className="w-full mt-4">Apply Filters</Button>
      </CardContent>
    </Card>
  );
};
