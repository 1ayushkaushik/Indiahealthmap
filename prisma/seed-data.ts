interface DiseaseData {
  stateName: string;
  districtName: string;
  date: string;
  cases: number;
  deaths: number;
}

interface Disease {
  name: string;
  totalCases: number;
  totalDeaths: number;
  data: DiseaseData[];
}

export const diseases: Disease[] = [
  {
    name: "COVID-19",
    totalCases: 150,
    totalDeaths: 15,
    data: [
      {
        stateName: "Maharashtra",
        districtName: "Mumbai",
        date: "2024-03-26",
        cases: 100,
        deaths: 10
      },
      {
        stateName: "Kerala",
        districtName: "Thiruvananthapuram",
        date: "2024-03-26",
        cases: 50,
        deaths: 5
      }
    ]
  },
  {
    name: "Dengue",
    totalCases: 80,
    totalDeaths: 8,
    data: [
      {
        stateName: "West Bengal",
        districtName: "Kolkata",
        date: "2024-03-26",
        cases: 45,
        deaths: 5
      },
      {
        stateName: "Tamil Nadu",
        districtName: "Chennai",
        date: "2024-03-26",
        cases: 35,
        deaths: 3
      }
    ]
  },
  {
    name: "Malaria",
    totalCases: 120,
    totalDeaths: 12,
    data: [
      {
        stateName: "Madhya Pradesh",
        districtName: "Bhopal",
        date: "2024-03-26",
        cases: 70,
        deaths: 7
      },
      {
        stateName: "Odisha",
        districtName: "Bhubaneswar",
        date: "2024-03-26",
        cases: 50,
        deaths: 5
      }
    ]
  }
]; 