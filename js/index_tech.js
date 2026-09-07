/**
 * Tech aesthetic — skills force-directed
 * Naranja quemado como acento (matches CV tech)
 */

am4core.useTheme(am4themes_animated);

var chart = am4core.create(
  "chartdiv",
  am4plugins_forceDirected.ForceDirectedTree
);
var networkSeries = chart.series.push(
  new am4plugins_forceDirected.ForceDirectedSeries()
);

chart.data = [
  {
    name: "Habilidades",
    value: 400,
    color: "#E85822",
    collapsed: true,

    children: [
      {
        name: "Data\n& BI",
        value: 280,
        linkWith: ["IA &\nAutomatización", "Desarrollo &\nInfraestructura", "Consultoría\n& Gestión"],
        children: [
          { name: "Power BI", value: 160 },
          { name: "Microsoft\nFabric", value: 140 },
          { name: "SQL", value: 130 },
          { name: "Tableau", value: 110 },
          { name: "D3.js", value: 90, linkWith: ["JavaScript"] },
          { name: "ETL / DAX", value: 120 },
        ],
      },
      {
        name: "IA &\nAutomatización",
        value: 280,
        linkWith: ["Data\n& BI", "Desarrollo &\nInfraestructura"],
        children: [
          { name: "LLMs", value: 160 },
          { name: "Agentes IA", value: 150 },
          { name: "n8n", value: 120 },
          { name: "Prompt\nEngineering", value: 120 },
          { name: "Machine /\nDeep Learning", value: 140 },
          { name: "OpenCV", value: 100 },
        ],
      },
      {
        name: "Desarrollo &\nInfraestructura",
        value: 250,
        linkWith: ["IA &\nAutomatización", "Data\n& BI", "Diseño &\nMultimedia"],
        children: [
          { name: "Python", value: 160 },
          { name: "JavaScript", value: 140 },
          { name: "Docker", value: 110 },
          { name: "FastAPI", value: 100 },
          { name: "AWS", value: 120 },
          { name: "Git", value: 90 },
        ],
      },
      {
        name: "Consultoría\n& Gestión",
        value: 240,
        linkWith: ["Data\n& BI", "IA &\nAutomatización"],
        children: [
          { name: "Transformación\nDigital", value: 180 },
          { name: "Gestión de\nInnovación", value: 160 },
          { name: "Liderazgo\nde Equipos", value: 150 },
          { name: "Consultoría\nOrganizacional", value: 170 },
        ],
      },
      {
        name: "Diseño &\nMultimedia",
        value: 200,
        linkWith: ["Desarrollo &\nInfraestructura"],
        children: [
          { name: "Photoshop", value: 120 },
          { name: "After\nEffects", value: 110 },
          { name: "HTML /\nCSS", value: 100 },
          { name: "Three.js", value: 90 },
        ],
      },
    ],
  },
];

networkSeries.dataFields.linkWith = "linkWith";
networkSeries.dataFields.value = "value";
networkSeries.dataFields.name = "name";
networkSeries.dataFields.children = "children";
networkSeries.nodes.template.tooltipText = "{name}";
networkSeries.dataFields.color = "color";
networkSeries.nodes.template.fillOpacity = 1;

networkSeries.nodes.template.label.text = "{name}";
networkSeries.nodes.template.label.hideOversized = false;
networkSeries.nodes.template.label.truncate = false;
networkSeries.nodes.template.label.wrap = true;
networkSeries.fontSize = 11;
networkSeries.minRadius = 25;
networkSeries.maxRadius = 60;

networkSeries.links.template.strokeWidth = 1;

var hoverState = networkSeries.links.template.states.create("hover");
hoverState.properties.strokeWidth = 3;
hoverState.properties.strokeOpacity = 1;

networkSeries.dragFixedNodes = false;
networkSeries.nodes.template.events.on("dragstop", function (event) {
  event.target.dataItem.fixed = false;
});

networkSeries.nodes.template.events.on("down", function (event) {
  event.target.dataItem.fixed = false;
});

networkSeries.nodes.template.events.on("over", function (event) {
  event.target.dataItem.childLinks.each(function (link) {
    link.isHover = true;
  });
  if (event.target.dataItem.parentLink) {
    event.target.dataItem.parentLink.isHover = true;
  }
});

networkSeries.nodes.template.events.on("out", function (event) {
  event.target.dataItem.childLinks.each(function (link) {
    link.isHover = false;
  });
  if (event.target.dataItem.parentLink) {
    event.target.dataItem.parentLink.isHover = false;
  }
});
