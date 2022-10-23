export const workingQuery = {
  query: [
    {
      code: "Työpaikan alue",
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
      code: "Pendelöinti",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    },
    {
      code: "Koulutusaste",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    },
    {
      code: "Ikä",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    },
    {
      code: "Vuosi",
      selection: {
        filter: "item",
        values: ["2020"]
      }
    }
  ],
  response: {
    format: "json-stat2"
  }
};
