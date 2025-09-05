import { Info } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface FrameworkSelectorProps {
  framework: 'old' | 'new';
  onFrameworkChange: (value: 'old' | 'new') => void;
}

export default function FrameworkSelector({ framework, onFrameworkChange }: FrameworkSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Info className="w-5 h-5 text-purple-600" />
        Select Framework
      </h3>
      <RadioGroup value={framework} onValueChange={(value) => onFrameworkChange(value as 'old' | 'new')}>
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="old" id="old-framework" className="mt-1" />
              <Label htmlFor="old-framework" className="cursor-pointer flex-1">
                <div className="font-medium">Traditional 6-Competency Framework</div>
                <div className="text-sm text-gray-600 mt-1">
                  Team Leadership • Judgement & Analysis • Management & Delivery • Communication • Specialist Knowledge • Drive & Commitment
                </div>
              </Label>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="new" id="new-framework" className="mt-1" />
              <Label htmlFor="new-framework" className="cursor-pointer flex-1">
                <div className="font-medium">New 4-Area Capability Framework</div>
                <div className="text-sm text-gray-600 mt-1">
                  Building Future Readiness • Leading & Empowering • Evidence Informed Delivery • Communicating & Collaborating
                </div>
              </Label>
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}