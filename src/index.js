import "./styles.css";
import "./leaflet/leaflet.css";
import { Chart } from "frappe-charts/dist/frappe-charts.min.esm";
import L from "leaflet";
import { workingQuery } from "./workingquery.js";
import { populationQuery } from "./populationQuery.js";
import { wholePopulationQuery } from "./populationQuery.js";

const submitButton1 = document.getElementById("submit-data1");
const submitButton2 = document.getElementById("submit-data2");
const select = document.getElementById("selectProvince");
const selectEmissionClass = document.getElementById("selectEmissionClass");
const selectHeatMode = document.getElementById("selectHeatMode");
const selectUseMode = document.getElementById("selectUseMode");
const select2 = document.getElementById("selectProvince2");
const exportselect = document.getElementById("selectExport");
const exportButton = document.getElementById("export");
const selectLocations = document.getElementById("selectcity");
const showonMapButton = document.getElementById("showonMap");

let maakuntaValinta = "whole country";
let emissionclassValinta;
let provinceChoiceB = "whole country";
let heatmodeChoice = "Total";
let usemodeChoice = "Total";

let chart;
let chart2;
let chart3;

const codeMap = new Map();
const emissionClassMap = new Map();
const sourceOfHeatMap = new Map();
const intendedUseMap = new Map();
let workersMap;
let populationsMap;
let densityMap;
let populationChartData;
let count = 1;
let names = [];
let paastovalues = [];
let sourceOfHeatValues = [];
let intendedUseValues = [];
let municKeys = [];
let provKeys = [];

const areaKM2Map = new Map([
  // map contains province areas (km2) total, including land and water. Get from Maanmittauslaitos excel file
  ["SSS", 390905.39],
  ["01", 16059.33],
  ["02", 20537.6],
  ["04", 11493.01],
  ["05", 5707.63],
  ["06", 15549.58],
  ["07", 6941.68],
  ["08", 6768.51],
  ["09", 6872.13],
  ["10", 17099.03],
  ["11", 21077.95],
  ["12", 22903.19],
  ["13", 19012.02],
  ["14", 14355.62],
  ["15", 17833.97],
  ["16", 6462.89],
  ["17", 45851.98],
  ["18", 22687.88],
  ["19", 100366.89],
  ["21", 13324.5]
]);

const getDatasForMap = async () => {
  // api calls to get additional information
  const keyurl =
    "https://statfin.stat.fi:443/PxWeb/api/v1/fi/StatFin/tyokay/statfin_tyokay_pxt_115p.px";

  const res2 = await fetch(keyurl);
  const keydata = await res2.json();
  municKeys = Object.values(keydata.variables[0].values);

  const url3 =
    "https://statfin.stat.fi:443/PxWeb/api/v1/fi/StatFin/tyokay/statfin_tyokay_pxt_115p.px";

  const url4 =
    "https://statfin.stat.fi:443/PxWeb/api/v1/fi/StatFin/vaerak/statfin_vaerak_pxt_11re.px";

  const res3 = await fetch(url3, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(workingQuery)
  });
  if (!res3.ok) {
    console.log("res3 failed, please try again later");
    return;
  }
  const workingData = await res3.json();

  const res4 = await fetch(url4, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(populationQuery)
  });
  if (!res4.ok) {
    console.log("res4 failed, please try again later");
    return;
  }
  const populationData = await res4.json();

  const res5 = await fetch(url4, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(wholePopulationQuery)
  });
  if (!res5.ok) {
    console.log("res5 failed, please try again later");
    return;
  }
  const wholepopulationData = await res5.json();

  workersMap = new Map();
  const alue = Object.keys(
    workingData.dimension["Työpaikan alue"].category.label
  );
  const amount = workingData.value;
  const pairs = [alue, amount];

  for (let i = 0; i < pairs[0].length; i++) {
    workersMap.set(pairs[0][i].substring(2), pairs[1][i]);
  }

  const nm = Object.values(populationData.dimension.Alue.category.label);
  const ages = Object.values(populationData.dimension.Ikä.category.label);
  const qtyarray = populationData.value;
  ages.forEach((age, index) => {
    let agegroups = [];
    for (let i = 0; i < 19; i++) {
      agegroups.push(qtyarray[i * 4 + index]);
    }
    ages[index] = {
      name: age,
      values: agegroups
    };
  });
  let alueName = [];
  nm.forEach((element) => {
    alueName.push(element.substring(5));
  });

  populationChartData = {
    labels: alueName,
    datasets: ages
  };
  populationsMap = new Map();
  const wholealue = Object.keys(
    wholepopulationData.dimension.Alue.category.label
  );
  const populqty = wholepopulationData.value;
  const wholepairs = [wholealue, populqty];
  for (let i = 0; i < wholepairs[0].length; i++) {
    populationsMap.set(wholepairs[0][i].substring(2), wholepairs[1][i]);
  }
  densityMap = new Map();
  let density = [];
  let km2 = Array.from(areaKM2Map.values());
  km2.shift();

  for (let i = 0; i < 19; i++) {
    let itm = populqty[i] / km2[i];
    density.push(Math.round(itm));
  }
  let densitypairs = [wholealue, density];
  for (let i = 0; i < densitypairs[0].length; i++) {
    densityMap.set(densitypairs[0][i].substring(2), densitypairs[1][i]);
  }

  buildPopulationChart(populationChartData);

  fetchMapData(workersMap, populationsMap, densityMap);
};

const fetchMapData = async () => {
  // api calls for geojsons and initialize map data
  const url =
    "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:maakunta4500k&outputFormat=json&srsName=EPSG:4326";

  const url2 =
    "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";

  const res1 = await fetch(url);
  const res2 = await fetch(url2);
  const mapdata1orig = await res1.json();
  const mapdata2orig = await res2.json();
  const mapdata1 = mapdata1orig;
  const mapdata2 = mapdata2orig;

  for (let i of mapdata1.features) {
    i.properties.areakm2 = i.properties[areaKM2Map.key] = areaKM2Map.get(
      i.properties.maakunta
    );
  }
  for (let i of mapdata1.features) {
    i.properties.workers = i.properties[workersMap.key] = workersMap.get(
      i.properties.maakunta
    );
  }
  for (let i of mapdata1.features) {
    i.properties.population = i.properties[
      populationsMap.key
    ] = populationsMap.get(i.properties.maakunta);
  }
  for (let i of mapdata1.features) {
    i.properties.density = i.properties[densityMap.key] = densityMap.get(
      i.properties.maakunta
    );
  }

  initMap(mapdata1, mapdata2);
};

const initMap = (mapdata1, mapdata2) => {
  // creates map layers
  let map = L.map("map", {
    minZoom: -3
  });

  let geoJson1 = L.geoJSON(mapdata1, {
    onEachFeature: getFeature1,
    style: { color: "red" }
  }).addTo(map);
  let geoJson2 = L.geoJSON(mapdata2, {
    onEachFeature: getFeature3,
    style: { color: "blue" }
  }).addTo(map);
  let geoJson3 = L.geoJSON(mapdata1, {
    onEachFeature: getFeature2,
    style: style
  }).addTo(map);

  let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);

  let google = L.tileLayer(
    "https://{s}.google.com/vt/lyrs=s@221097413,traffic&x={x}&y={y}&z={z}",
    {
      maxZoom: 20,
      minZoom: 2,
      subdomains: ["mt0", "mt1", "mt2", "mt3"]
    }
  ).addTo(map);

  let baseMaps = {
    OpenStreetMap: osm,
    "Google Maps": google
  };

  let overlayMaps = {
    Provinces: geoJson1,
    Municipalities: geoJson2,
    "Population density map": geoJson3
  };
  let layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

  // legend reference: https://leafletjs.com/examples/choropleth/
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function (map) {
    let div = L.DomUtil.create("div", "info legend"),
      grades = [0, 1, 2, 5, 10, 20, 50, 100],
      labels = [];
    div.innerHTML = "<h6>People/km2</h6>";
    for (let i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' +
        getColor(grades[i] + 1) +
        '"></i> ' +
        grades[i] +
        (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
    }

    return div;
  };

  legend.addTo(map);

  const mapIcon = L.icon({
    iconUrl: "src/leaflet/images/marker-icon.png",
    shadowUrl: "src/leaflet/images/marker-shadow.png",
    iconSize: [41, 51],
    iconAnchor: [20, 51],
    popupAnchor: [0, -51]
  });

  let marker;
  showonMapButton.addEventListener("click", function () {
    const choose = selectLocations.value;
    if (choose == "loc1") {
      const turku = L.marker([60.4353, 22.2286], { icon: mapIcon }).addTo(map)
        .bindTooltip(`<h4>Turku Castle</h4>
        <ul><li>Build 1280 (estimate)</li>
        <li>Province: Varsinais-Suomi</li>
        <li>City: Turku</li></ul>`);
      const hame = L.marker([61.0036, 24.4597], { icon: mapIcon }).addTo(map)
        .bindTooltip(`<h4>Häme Castle</h4>
        <ul><li>Build end of 1200 century (estimate)</li>
        <li>Province: Kanta-Häme</li>
        <li>City: Hämeenlinna</li></ul>`);
      const olavi = L.marker([61.8639, 28.9008], { icon: mapIcon }).addTo(map)
        .bindTooltip(`<h4>Olavinlinna</h4>
        <ul><li>Build 1475</li>
        <li>Province: Etelä-Savo</li>
        <li>City: Savonlinna</li></ul>`);
      const suom = L.marker([60.1472, 24.9864], { icon: mapIcon }).addTo(map)
        .bindTooltip(`<h4>Suomenlinna Sea Fortress</h4>
        <ul><li>Build 1748</li>
        <li>Province: Uusimaa</li>
        <li>City: Helsinki</li></ul>`);
      const rspr = L.marker([59.9916, 23.651], { icon: mapIcon }).addTo(map)
        .bindTooltip(`<h4>Raseborg Castle</h4>
        <ul><li>Build 1378 (estimate)</li>
        <li>Province: Uusimaa</li>
        <li>City: Raasepori</li></ul>`);
    }
    if (choose == "loc2") {
      const hkiyo = L.marker([60.17269883671445, 24.951127730689652], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Helsingin yliopisto");
      const svenskayo = L.marker([60.170784275578335, 24.9244137409087], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Svenska handelshögskolan");
      const åbo = L.marker([60.451092722180206, 22.277621757792577], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Åbo Akademi");
      const trkuyo = L.marker([60.454966558221265, 22.282167514687757], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Turun yliopisto");
      const jvskyo = L.marker([62.23662165906968, 25.731590684775338], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Jyväskylän yliopisto");
      const ouyo = L.marker([65.06018631933202, 25.46663682468125], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Oulun yliopisto");
      const vsayo = L.marker([63.10517156765009, 21.593261819806216], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Vaasan yliopisto");
      const lut = L.marker([61.06499940212136, 28.094337928068523], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Lappeenrannan-Lahden teknillinen yliopisto LUT");
      const lappi = L.marker([66.48536316847914, 25.715049598868163], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Lapin yliopisto");
      const mpk = L.marker([60.154449045444515, 25.04945671254593], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Maanpuolustuskorkeakoulu");
      const ita = L.marker([62.894061178892294, 27.64036217674499], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Itä-Suomen yliopisto");
      const aalto = L.marker([60.1859940244517, 24.82699723479787], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Aalto-yliopisto");
      const taide = L.marker([60.18201736512662, 24.960566300000004], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Taideyliopisto");
      const tree = L.marker([61.49424153282634, 23.779962558523486], {
        icon: mapIcon
      })
        .addTo(map)
        .bindTooltip("Tampereen yliopisto");
    }
  });

  // L.marker(, { icon: mapIcon }).addTo(map).bindPopup

  map.fitBounds(geoJson1.getBounds());
  map.fitBounds(geoJson2.getBounds());
};
const getFeature1 = (feature, layer) => {
  if (!feature.properties.nimi) return;
  const nimi = feature.properties.nimi;
  layer.bindTooltip(nimi);
  if (!feature.properties.areakm2) return;
  const areakm2 = feature.properties.areakm2;
  if (!feature.properties.workers) return;
  const workers = feature.properties.workers;
  if (!feature.properties.population) return;
  const popul = feature.properties.population;
  layer.bindPopup(
    `<h3> ${nimi} </h3>

    <ul>
          <li>Area (including water): ${areakm2} km2</li>
          <li>Population (2021): ${popul} </li>
          <li>Amount of workers (2020): ${workers}</li>
    </ul>
    <div></div>`
  );
};
const getFeature2 = (feature, layer) => {
  const nimi = feature.properties.nimi;
  const density = feature.properties.density;
  if (!feature.properties.areakm2) return;
  const areakm2 = feature.properties.areakm2;
  if (!feature.properties.workers) return;
  const workers = feature.properties.workers;
  const popul = feature.properties.population;
  layer.bindTooltip(nimi + " " + density + " " + "people/km2");
  layer.bindPopup(
    `<h3> ${nimi} </h3>
    <ul>
          <li>Area (including water): ${areakm2} km2</li>
          <li>Population (2021): ${popul} </li>
          <li>Amount of working people (2020): ${workers}</li>
          <li>Population density (2021): ${density} people per km2</li>
    </ul>
    <div></div>`
  );
};

const getFeature3 = (feature, layer) => {
  let municdata;
  const nimi = feature.properties.nimi;
  layer.bindTooltip(nimi);
  if (nimi == "Helsinki") {
    municdata = feature.properties.area = "715.48";
    if (!municdata) {
      return;
    } else {
      layer.bindPopup(`<h3>${nimi}</h3>
    <ul>
          <li>Area (including water): ${municdata} km2</li>

    </ul>`);
    }
  }
};

function getColor(d) {
  return d > 100
    ? "#800026"
    : d > 50
    ? "#BD0026"
    : d > 20
    ? "#E31A1C"
    : d > 10
    ? "#FC4E2A"
    : d > 5
    ? "#FD8D3C"
    : d > 2
    ? "#FEB24C"
    : d > 1
    ? "#FED976"
    : "#FFEDA0";
}
function style(feature) {
  return {
    fillColor: getColor(feature.properties.density),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7
  };
}

const rawjsonQuery1 = {
  query: [
    {
      code: "Päästöluokka",
      selection: {
        filter: "item",
        values: ["0A"]
      }
    },
    {
      code: "Päästökauppaan kuuluminen",
      selection: {
        filter: "item",
        values: ["SS"]
      }
    },
    {
      code: "Maakunta",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    }
  ],
  response: {
    format: "json-stat2"
  }
};
let jsonQuery1 = rawjsonQuery1;

const rawjsonQuery2 = {
  query: [
    {
      code: "Alue",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    },
    {
      code: "Rakennuksen lämmitysaine",
      selection: {
        filter: "item",
        values: ["s"]
      }
    },
    {
      code: "Rakennuksen käyttötarkoitus",
      selection: {
        filter: "item",
        values: ["SSS"]
      }
    },
    {
      code: "Tiedot",
      selection: {
        filter: "item",
        values: ["Lkm"]
      }
    }
  ],
  response: {
    format: "json-stat2"
  }
};
let jsonQuery2 = rawjsonQuery2;

const getData = async () => {
  const url =
    "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/khki/statfin_khki_pxt_122d.px";

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(jsonQuery1)
  });
  if (!res.ok) {
    return;
  }
  const data = await res.json();

  return data;
};

const getData2 = async () => {
  const url2 =
    "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/rakke/statfin_rakke_pxt_116i.px";

  const res = await fetch(url2, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(jsonQuery2)
  });
  if (!res.ok) {
    return;
  }
  const data2 = await res.json();

  return data2;
};

async function getMaakunnat() {
  // get codes for querys and create maps for first chart
  const url =
    "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/khki/statfin_khki_pxt_122d.px";
  const promise = await fetch(url);
  const data = await promise.json();

  const paastocodes = Object.values(data.variables[1].values);
  paastovalues = Object.values(data.variables[1].valueTexts);

  const codes = Object.values(data.variables[3].values);
  const values = Object.values(data.variables[3].valueTexts);
  names = [];
  let first = true;
  values.forEach((element) => {
    if (first === true) {
      names.push(element);
      first = false;
    } else {
      names.push(element.substring(5));
    }
  });

  const codesandnames = [names, codes];

  for (let i = 0; i < codesandnames[0].length; i++) {
    codeMap.set(codesandnames[0][i].toUpperCase(), codesandnames[1][i]);
  }

  const emissionClass = [paastovalues, paastocodes];

  for (let i = 0; i < emissionClass[0].length; i++) {
    emissionClassMap.set(emissionClass[0][i], emissionClass[1][i]);
  }

  createProvinceOptions();
  createEmissionClassOptions();
}

// Creating dropdown lists. Reference: https://stackoverflow.com/questions/9895082/javascript-populate-drop-down-list-with-array
function createProvinceOptions() {
  for (let i = 0; i < names.length; i++) {
    let opt = names[i];
    let el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select.appendChild(el);
  }
}
function createEmissionClassOptions() {
  for (let i = 0; i < paastovalues.length; i++) {
    let opt = paastovalues[i];
    let el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    selectEmissionClass.appendChild(el);
  }
}

function getUserValues() {
  // get user values and add them to querys
  maakuntaValinta = select.value;
  emissionclassValinta = selectEmissionClass.value;
  let codeToQuery1;
  let codeToQuery2;
  let maakunta = maakuntaValinta;
  codeToQuery2 = codeMap.get(maakunta.toUpperCase());
  codeToQuery1 = emissionClassMap.get(emissionclassValinta);

  if (!codeToQuery1) {
    return;
  }
  if (!codeToQuery2) {
    return;
  }
  jsonQuery1.query[0].selection.values.shift();
  jsonQuery1.query[0].selection.values.push(codeToQuery1);

  jsonQuery1.query[2].selection.values.shift();
  jsonQuery1.query[2].selection.values.push(codeToQuery2);
  return jsonQuery1;
}

async function getRakennustiedot() {
  // get codes for querys and create maps for second chart
  const url2 =
    "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/rakke/statfin_rakke_pxt_116i.px";

  const promise = await fetch(url2);
  const data2 = await promise.json();

  const sourceOfHeatCodes = Object.values(data2.variables[2].values);
  sourceOfHeatValues = Object.values(data2.variables[2].valueTexts);
  const intendedUseCodes = Object.values(data2.variables[3].values);
  intendedUseValues = Object.values(data2.variables[3].valueTexts);

  const heats = [sourceOfHeatValues, sourceOfHeatCodes];
  const modes = [intendedUseValues, intendedUseCodes];

  for (let i = 0; i < heats[0].length; i++) {
    sourceOfHeatMap.set(heats[0][i], heats[1][i]);
  }
  for (let i = 0; i < modes[0].length; i++) {
    intendedUseMap.set(modes[0][i], modes[1][i]);
  }

  createProvinceOptions2();
  createHeatModeOptions();
  createUseModeOptions();
}

function getUserValuesForBuildings() {
  // get user values and add them to querys
  provinceChoiceB = select2.value;
  heatmodeChoice = selectHeatMode.value;
  usemodeChoice = selectUseMode.value;

  let codeToQuery1;
  let codeToQuery2;
  let codeToQuery3;

  codeToQuery1 = codeMap.get(provinceChoiceB.toUpperCase());
  codeToQuery2 = sourceOfHeatMap.get(heatmodeChoice);
  codeToQuery3 = intendedUseMap.get(usemodeChoice);

  if (!codeToQuery1) {
    return;
  }
  if (!codeToQuery2) {
    return;
  }
  if (!codeToQuery3) {
    return;
  }
  jsonQuery2.query[0].selection.values.shift();
  jsonQuery2.query[0].selection.values.push(codeToQuery1);

  jsonQuery2.query[1].selection.values.shift();
  jsonQuery2.query[1].selection.values.push(codeToQuery2);

  jsonQuery2.query[2].selection.values.shift();
  jsonQuery2.query[2].selection.values.push(codeToQuery3);

  return jsonQuery2;
}
// creating more options
function createProvinceOptions2() {
  for (let i = 0; i < names.length; i++) {
    let opt = names[i];
    let el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select2.appendChild(el);
  }
}
function createHeatModeOptions() {
  for (let i = 0; i < sourceOfHeatValues.length; i++) {
    let opt = sourceOfHeatValues[i];
    let el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    selectHeatMode.appendChild(el);
  }
}

function createUseModeOptions() {
  for (let i = 0; i < intendedUseValues.length; i++) {
    let opt = intendedUseValues[i];
    let el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    selectUseMode.appendChild(el);
  }
}

const buildChart = async () => {
  //builds first chart
  const data = await getData();

  const paastoluokka = Object.values(
    data.dimension.Päästöluokka.category.label
  );
  const alue = Object.values(data.dimension.Maakunta.category.label);
  const vuosi = Object.values(data.dimension.Vuosi.category.label);
  const paastot = data.value;
  const vuodet = [];

  vuosi.forEach((element) => {
    vuodet.push(element);
  });
  alue.forEach((maakunta, index) => {
    let maakuntaTiedot = [];
    for (let i = 0; i < 7; i++) {
      maakuntaTiedot.push(paastot[i * count + index]);
    }
    alue[index] = {
      name: maakunta,
      values: maakuntaTiedot
    };
  });

  const chartData = {
    labels: vuodet,
    datasets: alue
  };

  chart = new Chart("#chart", {
    title:
      "C02 Emissions in " +
      maakuntaValinta +
      ", thousand tonnes of CO2 eq. Emission category: " +
      paastoluokka,
    data: chartData,
    type: "line",
    height: 450
  });
};

submitButton1.addEventListener("click", function () {
  getUserValues();
  buildChart();
});

submitButton2.addEventListener("click", function () {
  getUserValuesForBuildings();
  buildChart2();
});

const buildChart2 = async () => {
  // builds second chart
  const data2 = await getData2();

  const alue = Object.values(data2.dimension.Alue.category.label);
  const vuosi = Object.values(data2.dimension.Vuosi.category.label);
  const lkm = data2.value;
  const vuodet = [];

  vuosi.forEach((element) => {
    vuodet.push(element);
  });

  const chartData2 = {
    labels: vuodet,
    datasets: [
      {
        name: provinceChoiceB,
        type: "line",
        values: lkm
      }
    ]
  };

  chart2 = new Chart("#chart2", {
    title:
      "Amount of buildings in " +
      provinceChoiceB +
      ", with heat mode: " +
      heatmodeChoice +
      " and mode of use: " +
      usemodeChoice +
      ".",
    data: chartData2,
    type: "line",
    height: 450,
    colors: ["#eb5146"]
  });
};

function buildPopulationChart() {
  // builds third chart
  chart3 = new Chart("#chart3", {
    title: "Population in provinces by agegroups (2021)",
    data: populationChartData,
    type: "bar",
    height: 400,
    colors: ["#f54b4b", "#ffde55", "#006288", "#349a2b"]
  });
}
exportButton.addEventListener("click", function () {
  //exports chart as svg picture
  let src;
  const choose = exportselect.value;
  if (choose === "chartone") {
    src = chart.export();
  }
  if (choose === "charttwo") {
    src = chart2.export();
  }
  if (choose === "chartthree") {
    src = chart3.export();
  }

  let image = new Image();

  image.src = "data:image/svg+xml;base64," + btoa(src);
});

getDatasForMap();

getMaakunnat();
getRakennustiedot();

buildChart();
buildChart2();
