export const getDiseaseData = async (
  diseaseId: number,
  startDate?: Date,
  endDate?: Date,
  view: 'district' | 'state' = 'district'
) => {
  const groupBy = view === 'state' ? 'stateName' : 'districtName';
  
  return prisma.$queryRaw`
    SELECT 
      ${groupBy},
      SUM(cases) as cases,
      SUM(deaths) as deaths
    FROM DiseaseData
    WHERE 
      diseaseId = ${diseaseId}
      ${startDate ? `AND date >= ${startDate}` : ''}
      ${endDate ? `AND date <= ${endDate}` : ''}
    GROUP BY ${groupBy}
  `;
}; 