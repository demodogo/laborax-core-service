export type CompanyType = 'OWNER' | 'CONTRACTOR' | 'SUBCONTRACTOR' | 'EST';

const allowedChildTypes: Record<CompanyType, CompanyType[]> = {
  OWNER: ['CONTRACTOR', 'EST'],
  CONTRACTOR: ['SUBCONTRACTOR', 'EST'],
  SUBCONTRACTOR: [],
  EST: [],
};

export function canCreateChildCompany(parentType: CompanyType, childType: CompanyType) {
  return allowedChildTypes[parentType].includes(childType);
}
