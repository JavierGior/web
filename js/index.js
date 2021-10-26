/**
 * ---------------------------------------
 * This demo was created using amCharts 4.
 *
 * For more information visit:
 * https://www.amcharts.com/
 *
 * Documentation is available at:
 * https://www.amcharts.com/docs/v4/
 * ---------------------------------------
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
    color: "#004385",
    collapsed: true,

    children: [
      {
        name: "Diseño",
        value: 250,
        //"color": "#0c6fa5",
        children: [
          {
            name: "PhotoShop",
            value: 170,
          },
          {
            name: "After\nEffects",
            value: 120,
          },
        ],
      },
      {
        name: "Web",
        value: 200,
        // "color": "#0c6fa5",
        linkWith: ["Diseño", "Desarrollo", "python", "JavaScript"],
        children: [
          {
            name: "CSS",
            value: 90,
          },
          {
            name: "HTML",
            value: 90,
          },
        ],
      },
      {
        name: "Marketing",
        value: 250,
        //"color": "#0c6fa5",
        linkWith: ["Data\nVisualization", "Data\nAnalytics"],
        children: [
          {
            name: "Google\nAds",
            value: 140,
          },
          {
            name: "Facebook\nBusiness",
            value: 160,
          },
        ],
      },
      {
        name: "Desarrollo",
        value: 216,
        //"color": "#0c6fa5",
        linkWith: ["Data\nAnalytics", "Web"],
        children: [
          {
            name: "Python",
            value: 120,
          },
          {
            name: "JavaScript",
            value: 160,
          },
        ],
      },
      {
        name: "Data\nScience",
        value: 250,
        //"color": "#0c6fa5",
        linkWith: ["Phoebe"],
        children: [
          {
            name: "Data\nAnalytics",
            value: 180,
            linkWith: ["Marketing"],
          },
          {
            name: "Data\nVisualization",
            value: 200,
            linkWith: ["Marketing", "Diseño"],
            children: [
              {
                name: "Tableau",
                value: 120,
              },
              {
                name: "D3.js",
                value: 80,
              },
            ],
          },
        ],
      },
    ],
  },
];
networkSeries.dataFields.linkWith = "linkWith";
//networkSeries.dataFields.collapsed = "collapsed";
networkSeries.dataFields.value = "value";
networkSeries.dataFields.name = "name";
networkSeries.dataFields.children = "children";
networkSeries.nodes.template.tooltipText = "{name}";
networkSeries.dataFields.color = "color";
networkSeries.nodes.template.fillOpacity = 1;

//no estoy seguro de que se vaya aclarando hacia abajo
/*networkSeries.nodes.template.adapter.add("fill", function (fill, target) {
    return fill.lighten(target.dataItem.level * 0.15);
});*/

networkSeries.nodes.template.label.text = "{name}";
networkSeries.fontSize = 12;

networkSeries.links.template.strokeWidth = 1;

var hoverState = networkSeries.links.template.states.create("hover");
hoverState.properties.strokeWidth = 3;
hoverState.properties.strokeOpacity = 1;

// disable physics for dragged nodes
networkSeries.dragFixedNodes = false;
networkSeries.nodes.template.events.on("dragstop", function (event) {
  event.target.dataItem.fixed = false;
});

networkSeries.nodes.template.events.on("down", function (event) {
  event.target.dataItem.fixed = false;
});
// end of disabling physics

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
