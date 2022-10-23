export const populationQuery = {
  query: [
    {
      code: "Alue",
      selection: {
        filter: "agg:_Maakunnat ja kunnat 2022.agg",
        values: [
          "MK21",
          "MK09",
          "MK14",
          "MK10",
          "MK18",
          "MK05",
          "MK16",
          "MK13",
          "MK08",
          "MK19",
          "MK06",
          "MK15",
          "MK12",
          "MK17",
          "MK11",
          "MK07",
          "MK04",
          "MK01",
          "MK02"
        ]
      }
    },
    {
      code: "Ikä",
      selection: {
        filter: "agg:Ikäkausi 0-14, 15-64, 65-74, 75-.agg",
        values: ["0-14", "15-64", "65-74", "75-"]
      }
    },
    {
      code: "Sukupuoli",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    },
    {
      code: "Vuosi",
      selection: {
        filter: "item",
        values: [
          /*"2000",
          "2001",
          "2002",
          "2003",
          "2004",
          "2005",
          "2006",
          "2007",
          "2008",
          "2009",
          "2010",
          "2011",
          "2012",
          "2013",
          "2014",
          "2015",
          "2016",
          "2017",
          "2018",
          "2019",
          "2020",*/
          "2021"
        ]
      }
    }
  ],
  response: {
    format: "json-stat2"
  }
};

export const wholePopulationQuery = {
  query: [
    {
      code: "Alue",
      selection: {
        filter: "agg:_Maakunnat ja kunnat 2022.agg",
        values: [
          "MK21",
          "MK09",
          "MK14",
          "MK10",
          "MK18",
          "MK05",
          "MK16",
          "MK13",
          "MK08",
          "MK19",
          "MK06",
          "MK15",
          "MK12",
          "MK17",
          "MK11",
          "MK07",
          "MK04",
          "MK01",
          "MK02"
        ]
      }
    },
    {
      code: "Ikä",
      selection: {
        filter: "agg:Ikäkausi 0-14, 15-64, 65-74, 75-.agg",
        values: ["SSS"]
      }
    },
    {
      code: "Sukupuoli",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    },
    {
      code: "Vuosi",
      selection: {
        filter: "item",
        values: [
          /*"2000",
          "2001",
          "2002",
          "2003",
          "2004",
          "2005",
          "2006",
          "2007",
          "2008",
          "2009",
          "2010",
          "2011",
          "2012",
          "2013",
          "2014",
          "2015",
          "2016",
          "2017",
          "2018",
          "2019",
          "2020",*/
          "2021"
        ]
      }
    }
  ],
  response: {
    format: "json-stat2"
  }
};
