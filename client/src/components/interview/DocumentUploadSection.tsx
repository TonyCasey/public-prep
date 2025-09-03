import { FileText, Briefcase } from "lucide-react";
import FileUpload from "../FileUpload";

interface DocumentUploadSectionProps {
  cvDocument: any;
  jobSpecDocument: any;
  onCvChange: (doc: any) => void;
  onJobSpecChange: (doc: any) => void;
}

export default function DocumentUploadSection({ 
  cvDocument, 
  jobSpecDocument, 
  onCvChange, 
  onJobSpecChange 
}: DocumentUploadSectionProps) {
  return (
    <div className="space-y-6">
      {/* Bright Privacy Warning for CV Upload */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-red-800 mb-2">⚠️ IMPORTANT: Remove Personal Data</h4>
            <p className="text-sm text-red-700 font-medium">
              Before uploading your CV, please remove all personal identifying information including:
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
              <li>Full name, address, phone number</li>
              <li>PPS number, date of birth</li>
              <li>Personal photos or images</li>
            </ul>
            <p className="text-sm text-red-700 font-medium mt-2">
              Our AI only needs your professional experience and skills for effective interview preparation.
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Your CV
        </h3>
        <FileUpload
          type="cv"
          label=""
          description="Upload your CV for AI analysis"
          icon={FileText}
          onUploadComplete={() => {
            console.log('NewInterviewModal: CV upload completed');
            // The FileUpload component handles document updates internally via query invalidation
          }}
          existingFile={cvDocument ? { filename: cvDocument.filename, id: cvDocument.id } : undefined}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-600" />
          Job Specification
        </h3>
        <FileUpload
          type="job_spec"
          label=""
          description="Upload the job description (optional)"
          icon={Briefcase}
          onUploadComplete={() => {
            console.log('NewInterviewModal: Job spec upload completed');
            // The FileUpload component handles document updates internally via query invalidation
          }}
          existingFile={jobSpecDocument ? { filename: jobSpecDocument.filename, id: jobSpecDocument.id } : undefined}
        />
      </div>
    </div>
  );
}