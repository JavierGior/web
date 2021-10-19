am4core.useTheme(am4themes_animated);

var chart = am4core.create("chartdiv", am4charts.PieChart);

chart.data = [{
	"country": "Resiliencia",
	"value": 260
}, {
	"country": "Creatividad",
	"value": 250
}, {
	"country": "Pensamiento crítico",
	"value": 220
}, {
	"country": "Compromiso",
	"value": 200
}, {
	"country": "Flexibilidad",
	"value": 190
}, {
	"country": "Comunicación",
	"value": 180
}];


var series = chart.series.push(new am4charts.PieSeries());


series.dataFields.value = "value";
series.dataFields.radiusValue = "value";
series.dataFields.category = "country";

// this makes initial animation
series.hiddenState.properties.opacity = 1;
series.hiddenState.properties.endAngle = -90;
series.hiddenState.properties.startAngle = -90;

