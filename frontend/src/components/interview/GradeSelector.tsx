import { GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grades } from "@/lib/gradeConfiguration";

interface GradeSelectorProps {
  grade: string;
  onGradeChange: (value: string) => void;
}

export default function GradeSelector({ grade, onGradeChange }: GradeSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-purple-600" />
        Select Grade
      </h3>
      <Select value={grade} onValueChange={onGradeChange} required>
        <SelectTrigger className="w-full bg-white border-gray-300">
          <SelectValue placeholder="Select your target grade" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg">
          {grades.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              <div>
                <div className="font-medium">{g.name} ({g.id.toUpperCase()})</div>
                <div className="text-sm text-gray-500">{g.fullName}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}