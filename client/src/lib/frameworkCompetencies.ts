// Old Framework (Traditional 6 Competencies)
export const oldFrameworkCompetencies = {
  'team_leadership': {
    name: 'Team Leadership',
    shortName: 'Team Leadership',
    indicators: [
      'Motivating and inspiring team members',
      'Delegating tasks effectively',
      'Managing team performance',
      'Building team cohesion',
      'Resolving conflicts',
      'Coaching and developing others'
    ]
  },
  'judgement_analysis_decision_making': {
    name: 'Judgement, Analysis & Decision Making',
    shortName: 'Judgement & Analysis',
    indicators: [
      'Analyzing complex information',
      'Making evidence-based decisions',
      'Evaluating risks and benefits',
      'Considering multiple perspectives',
      'Problem-solving under pressure',
      'Learning from outcomes'
    ]
  },
  'management_delivery_results': {
    name: 'Management & Delivery of Results',
    shortName: 'Management & Delivery',
    indicators: [
      'Planning and organizing work',
      'Meeting deadlines and targets',
      'Managing resources efficiently',
      'Monitoring progress and quality',
      'Implementing improvements',
      'Delivering value for money'
    ]
  },
  'interpersonal_communication_skills': {
    name: 'Interpersonal & Communication Skills',
    shortName: 'Communication',
    indicators: [
      'Communicating clearly and concisely',
      'Active listening',
      'Building relationships',
      'Presenting information effectively',
      'Writing professional documents',
      'Adapting communication style'
    ]
  },
  'specialist_knowledge_expertise_self_development': {
    name: 'Specialist Knowledge, Expertise & Self Development',
    shortName: 'Specialist Knowledge',
    indicators: [
      'Maintaining professional expertise',
      'Continuous learning and development',
      'Applying technical knowledge',
      'Sharing knowledge with others',
      'Staying current with best practices',
      'Seeking feedback and improvement'
    ]
  },
  'drive_commitment': {
    name: 'Drive & Commitment',
    shortName: 'Drive & Commitment',
    indicators: [
      'Demonstrating resilience',
      'Taking initiative',
      'Showing dedication to public service',
      'Maintaining high standards',
      'Persevering through challenges',
      'Going above and beyond'
    ]
  }
};

// New Framework (4 Areas with sub-competencies)
export const newFrameworkCompetencies = {
  'building_future_readiness': {
    name: 'Building Future Readiness',
    shortName: 'Future Readiness',
    subCompetencies: {
      'digital_innovation': 'Digital Focus, Innovation & Upskilling for the Future',
      'strategic_change': 'Strategic Awareness & Change'
    },
    indicators: [
      'Embracing digital transformation',
      'Driving innovation and improvement',
      'Adapting to change',
      'Strategic thinking and planning',
      'Continuous learning and upskilling',
      'Future-proofing services'
    ]
  },
  'leading_empowering': {
    name: 'Leading and Empowering',
    shortName: 'Leading & Empowering',
    subCompetencies: {
      'leading_developing': 'Leading, Motivating & Developing',
      'specialist_insight': 'Leading with Specialist Insight'
    },
    indicators: [
      'Inspiring and motivating others',
      'Developing team capabilities',
      'Empowering staff to succeed',
      'Leading by example',
      'Applying specialist expertise',
      'Creating inclusive environments'
    ]
  },
  'evidence_informed_delivery': {
    name: 'Evidence Informed Delivery',
    shortName: 'Evidence & Delivery',
    subCompetencies: {
      'delivering_excellence': 'Delivering Excellence',
      'analysis_decision': 'Analysis, Judgement & Decision Making'
    },
    indicators: [
      'Using data and evidence effectively',
      'Delivering high-quality outcomes',
      'Making sound decisions',
      'Managing resources efficiently',
      'Continuous improvement',
      'Risk management'
    ]
  },
  'communicating_collaborating': {
    name: 'Communicating and Collaborating',
    shortName: 'Communication & Collaboration',
    subCompetencies: {
      'communicating_influencing': 'Communicating & Influencing',
      'engaging_collaborating': 'Engaging & Collaborating'
    },
    indicators: [
      'Clear and effective communication',
      'Building strong relationships',
      'Influencing stakeholders',
      'Collaborative working',
      'Active listening and empathy',
      'Cross-functional partnerships'
    ]
  }
};

// Helper functions
export function getCompetenciesForFramework(framework: 'old' | 'new') {
  return framework === 'old' ? oldFrameworkCompetencies : newFrameworkCompetencies;
}

export function getCompetencyKeys(framework: 'old' | 'new'): string[] {
  return Object.keys(getCompetenciesForFramework(framework));
}

export function getCompetencyName(framework: 'old' | 'new', key: string): string {
  const competencies = getCompetenciesForFramework(framework);
  return (competencies as any)[key]?.name || key;
}