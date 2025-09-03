import { describe, it, expect } from 'vitest'
import { competencies } from '@/lib/competencies'

describe('Competencies Utils', () => {
  it('contains all 6 required competencies', () => {
    expect(competencies).toHaveLength(6)
    
    const competencyIds = competencies.map(c => c.id)
    expect(competencyIds).toContain('team_leadership')
    expect(competencyIds).toContain('judgement_analysis_decision_making')
    expect(competencyIds).toContain('management_delivery_results')
    expect(competencyIds).toContain('interpersonal_communication_skills')
    expect(competencyIds).toContain('specialist_knowledge_expertise_self_development')
    expect(competencyIds).toContain('drive_commitment')
  })

  it('gets correct display names for competencies', () => {
    const teamLeadership = competencies.find(c => c.id === 'team_leadership')
    expect(teamLeadership?.name).toBe('Team Leadership')
    
    const judgement = competencies.find(c => c.id === 'judgement_analysis_decision_making')
    expect(judgement?.name).toBe('Judgement, Analysis & Decision Making')
    
    const management = competencies.find(c => c.id === 'management_delivery_results')
    expect(management?.name).toBe('Management & Delivery of Results')
    
    const communication = competencies.find(c => c.id === 'interpersonal_communication_skills')
    expect(communication?.name).toBe('Interpersonal & Communication Skills')
    
    const specialist = competencies.find(c => c.id === 'specialist_knowledge_expertise_self_development')
    expect(specialist?.name).toBe('Specialist Knowledge, Expertise and Self Development')
  })

  it('has proper competency structure', () => {
    competencies.forEach(competency => {
      expect(competency).toHaveProperty('id')
      expect(competency).toHaveProperty('name')
      expect(competency).toHaveProperty('shortName')
      expect(competency).toHaveProperty('indicators')
      expect(Array.isArray(competency.indicators)).toBe(true)
      expect(competency.indicators.length).toBeGreaterThan(0)
    })
  })
})