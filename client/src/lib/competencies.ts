// HEO Competency Framework data based on the uploaded PDF
export interface Competency {
  id: string;
  name: string;
  shortName: string;
  indicators: string[];
}

export const competencies: Competency[] = [
  {
    id: "team_leadership",
    name: "Team Leadership", 
    shortName: "Team Leadership",
    indicators: [
      "Works with the team to facilitate high performance, developing clear and realistic objectives",
      "Addresses performance issues if they arise",
      "Provides clear information and advice as to what is required of the team",
      "Strives to develop and implement new ways of working effectively to meet objectives",
      "Leads the team by example, coaching and supporting individuals as required",
      "Places high importance on staff development, training and maximising skills & capacity of team",
      "Is flexible and willing to adapt, positively contributing to the implementation of change"
    ]
  },
  {
    id: "judgement_analysis_decision_making",
    name: "Judgement, Analysis & Decision Making",
    shortName: "Judgement & Analysis", 
    indicators: [
      "Gathers and analyses information from relevant sources, whether financial, numerical or otherwise weighing up a range of critical factors",
      "Takes account of any broader issues, agendas, sensitivities and related implications when making decisions",
      "Uses previous knowledge and experience in order to guide decisions",
      "Uses judgement to make sound decisions with a well-reasoned rationale and stands by these",
      "Puts forward solutions to address problems"
    ]
  },
  {
    id: "management_delivery_results",
    name: "Management & Delivery of Results",
    shortName: "Management & Delivery",
    indicators: [
      "Takes responsibility and is accountable for the delivery of agreed objectives",
      "Successfully manages a range of different projects and work activities at the same time",
      "Structures and organises their own and others work effectively",
      "Is logical and pragmatic in approach, delivering the best possible results with the resources available",
      "Delegates work effectively, providing clear information and evidence as to what is required",
      "Proactively identifies areas for improvement and develops practical suggestions for their implementation",
      "Demonstrates enthusiasm for new developments/changing work practices and strives to implement these changes effectively",
      "Applies appropriate systems/processes to enable quality checking of all activities and outputs",
      "Practices and promotes a strong focus on delivering high quality customer service, for internal and external customers"
    ]
  },
  {
    id: "interpersonal_communication_skills",
    name: "Interpersonal & Communication Skills",
    shortName: "Communication Skills",
    indicators: [
      "Builds and maintains contact with colleagues and other stakeholders to assist in performing role",
      "Acts as an effective link between staff and senior management",
      "Encourages open and constructive discussions around work issues",
      "Projects conviction, gaining buy-in by outlining relevant information and selling the benefits",
      "Treats others with diplomacy, tact, courtesy and respect, even in challenging circumstances",
      "Presents information clearly, concisely and confidently when speaking and in writing",
      "Collaborates and supports colleagues to achieve organisational goals"
    ]
  },
  {
    id: "specialist_knowledge_expertise_self_development",
    name: "Specialist Knowledge, Expertise and Self Development",
    shortName: "Specialist Knowledge",
    indicators: [
      "Has a clear understanding of the roles, objectives and targets of self and team and how they fit into the work of the unit and Department/Organisation and effectively communicates this to others",
      "Has high levels of expertise and broad Public Sector knowledge relevant to his/her area of work",
      "Focuses on self-development, striving to improve performance"
    ]
  },
  {
    id: "drive_commitment",
    name: "Drive & Commitment",
    shortName: "Drive & Commitment",
    indicators: [
      "Strives to perform at a high level, investing significant energy to achieve agreed objectives",
      "Demonstrates resilience in the face of challenging circumstances and high demands",
      "Is personally trustworthy and can be relied upon",
      "Ensures that customers are at the heart of all services provided",
      "Upholds high standards of honesty, ethics, and integrity"
    ]
  }
];

export const getCompetencyById = (id: string): Competency | undefined => {
  return competencies.find(comp => comp.id === id);
};

export const getCompetencyNames = (): string[] => {
  return competencies.map(comp => comp.name);
};

export const getCompetencyShortNames = (): string[] => {
  return competencies.map(comp => comp.shortName);
};

// New Capability Framework (4 areas)
export const capabilityAreas: Competency[] = [
  {
    id: "building_future_readiness",
    name: "Building Future Readiness",
    shortName: "Future Readiness",
    indicators: [
      "Digital Focus, Innovation & Upskilling for the Future",
      "Strategic Awareness & Change"
    ]
  },
  {
    id: "leading_empowering",
    name: "Leading and Empowering",
    shortName: "Leading & Empowering",
    indicators: [
      "Leading, Motivating & Developing",
      "Leading with Specialist Insight"
    ]
  },
  {
    id: "evidence_informed_delivery",
    name: "Evidence Informed Delivery",
    shortName: "Evidence Delivery",
    indicators: [
      "Delivering Excellence",
      "Analysis, Judgement & Decision Making"
    ]
  },
  {
    id: "communicating_collaborating",
    name: "Communicating and Collaborating",
    shortName: "Communication",
    indicators: [
      "Communicating & Influencing",
      "Engaging & Collaborating"
    ]
  }
];

export const getCapabilityAreaById = (id: string): Competency | undefined => {
  return capabilityAreas.find(area => area.id === id);
};
