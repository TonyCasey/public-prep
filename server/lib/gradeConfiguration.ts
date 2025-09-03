// Irish Public Service Grade Configuration

export interface GradeConfig {
  id: string;
  name: string;
  fullName: string;
  level: number; // 1 = lowest (CO), 9 = highest (SG)
  passingScore: number; // Minimum percentage to pass
  questionComplexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  experienceExpectation: string;
  typicalResponsibilities: string[];
  salaryRange?: { min: number; max: number };
}

export const grades: GradeConfig[] = [
  {
    id: 'co',
    name: 'CO',
    fullName: 'Clerical Officer',
    level: 1,
    passingScore: 55,
    questionComplexity: 'basic',
    experienceExpectation: 'The starting point for many, often requiring a Leaving Certificate or equivalent',
    typicalResponsibilities: [
      'General administrative duties',
      'Processing applications and forms',
      'Maintaining records and databases',
      'Providing information to the public',
      'Supporting team operations'
    ],
    salaryRange: { min: 28000, max: 35000 }
  },
  {
    id: 'eo',
    name: 'EO',
    fullName: 'Executive Officer',
    level: 2,
    passingScore: 60,
    questionComplexity: 'intermediate',
    experienceExpectation: 'A first-level management role, requiring further qualifications and experience',
    typicalResponsibilities: [
      'Managing workflows and processes',
      'Supervising clerical staff',
      'Drafting correspondence and reports',
      'Making operational decisions',
      'Implementing policies and procedures'
    ],
    salaryRange: { min: 35000, max: 45000 }
  },
  {
    id: 'heo',
    name: 'HEO',
    fullName: 'Higher Executive Officer',
    level: 3,
    passingScore: 65,
    questionComplexity: 'advanced',
    experienceExpectation: 'A middle management role with responsibility for team management, reporting to Assistant Principal and supporting large projects, budgets and policy development',
    typicalResponsibilities: [
      'Team management and leadership',
      'Managing large projects and coordinating initiatives',
      'Budget management and oversight',
      'Developing and implementing government policy',
      'Advising and interacting with senior management',
      'Driving organizational change',
      'Supporting Assistant Principal in organizational goals'
    ],
    salaryRange: { min: 58264, max: 70000 }
  },
  {
    id: 'ao',
    name: 'AO',
    fullName: 'Administrative Officer',
    level: 4,
    passingScore: 65,
    questionComplexity: 'advanced',
    experienceExpectation: 'A management role with more responsibility than EO, often involving analysis and policy advice',
    typicalResponsibilities: [
      'Management with increased responsibility',
      'Policy analysis and advice',
      'Strategic planning',
      'Budget oversight',
      'Cross-functional collaboration',
      'Team leadership'
    ],
    salaryRange: { min: 50000, max: 68000 }
  },
  {
    id: 'ap',
    name: 'AP',
    fullName: 'Assistant Principal',
    level: 5,
    passingScore: 70,
    questionComplexity: 'expert',
    experienceExpectation: 'A senior managerial role with responsibilities in policy implementation, team leadership, and stakeholder management',
    typicalResponsibilities: [
      'Senior managerial responsibilities',
      'Policy implementation',
      'Team leadership',
      'Stakeholder management',
      'Strategic decision making',
      'Organizational change management'
    ],
    salaryRange: { min: 68000, max: 85000 }
  },
  {
    id: 'po',
    name: 'PO',
    fullName: 'Principal Officer',
    level: 6,
    passingScore: 75,
    questionComplexity: 'expert',
    experienceExpectation: 'A higher-level management role, potentially with responsibility for larger teams and more complex policy areas',
    typicalResponsibilities: [
      'Higher-level management',
      'Larger team responsibility',
      'Complex policy areas',
      'Strategic policy development',
      'Ministerial briefings',
      'Cross-departmental collaboration'
    ],
    salaryRange: { min: 85000, max: 105000 }
  },
  {
    id: 'as',
    name: 'AS',
    fullName: 'Assistant Secretary',
    level: 7,
    passingScore: 80,
    questionComplexity: 'expert',
    experienceExpectation: 'A senior leadership position with strategic responsibilities',
    typicalResponsibilities: [
      'Senior leadership position',
      'Strategic responsibilities',
      'Departmental oversight',
      'Policy development leadership',
      'Government advisory role',
      'Major reform initiatives'
    ],
    salaryRange: { min: 105000, max: 130000 }
  },
  {
    id: 'ds',
    name: 'DS',
    fullName: 'Deputy Secretary',
    level: 8,
    passingScore: 85,
    questionComplexity: 'expert',
    experienceExpectation: 'A high-ranking position within a department, overseeing multiple divisions or policy areas',
    typicalResponsibilities: [
      'High-ranking departmental position',
      'Multiple division oversight',
      'Policy area leadership',
      'Strategic departmental planning',
      'Inter-departmental coordination',
      'Executive leadership'
    ],
    salaryRange: { min: 130000, max: 160000 }
  },
  {
    id: 'sg',
    name: 'SG',
    fullName: 'Secretary General',
    level: 9,
    passingScore: 90,
    questionComplexity: 'expert',
    experienceExpectation: 'The most senior position in a government department, responsible for overall management and strategic direction',
    typicalResponsibilities: [
      'Most senior departmental position',
      'Overall management responsibility',
      'Strategic direction',
      'Government policy leadership',
      'Ministerial advisory role',
      'Departmental transformation'
    ],
    salaryRange: { min: 160000, max: 200000 }
  }
];

// Helper functions
export function getGradeById(gradeId: string): GradeConfig | undefined {
  return grades.find(g => g.id === gradeId);
}

export function getGradeNames(): string[] {
  return grades.map(g => g.name);
}

export function getDefaultGrade(): string {
  return 'eo'; // Default to EO as it's a common entry management level
}

export function getQuestionCountForGrade(gradeId: string): number {
  const grade = getGradeById(gradeId);
  if (!grade) return 12;
  
  // Lower grades get fewer questions, higher grades get more
  switch (grade.level) {
    case 1: // OA
    case 2: // CO
      return 8;
    case 3: // EO
      return 10;
    case 4: // HEO
    case 5: // AP
      return 12;
    case 6: // PO
    case 7: // APO
      return 14;
    default:
      return 12;
  }
}

export function getInterviewDurationForGrade(gradeId: string): number {
  const questionCount = getQuestionCountForGrade(gradeId);
  return questionCount * 2; // 2 minutes per question
}