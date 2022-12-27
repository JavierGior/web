// Declaración de gráficos

const pieChart = dc.pieChart("#G_Overall_Status"); //Status general de los proyectos

const barChart = dc.barChart("#G_Proyectos_LoB"); //Proyectos por GB/GF

const pieChart3 = dc.pieChart("#G_Stage"); //Stage

const pieChart2 = dc.pieChart("#G_Category"); //Category

const rowChart = dc.rowChart("#G_Sponsors_Proyectos"); //Sponsors de Proyectos

const rowChart2 = dc.rowChart("#G_Theme"); //Temática

var tabla = dc.tableview("#tabla"); //Tabla con el detalle de los proyectos

// ----------------------Gestión de las tablas, unión y preparación---------------------

// Unimos ambos datasets segun el campo Proyect_Name

// variable con el total de las tablas pre-agregadas

const dataAll_prev = [];

// Unimos las tablas Alocaciones y Proyectos según el campo Proyect_Name

for (var i = 0; i < DashTRF_Alocaciones.length; i++) {
  dataAll_prev.push({
    ...DashTRF_Alocaciones[i],

    ...DashTRF_Proyectos.find(
      (itmInner) =>
        itmInner.Project_Name === DashTRF_Alocaciones[i].Project_Name
    ),
  });
}

//console.log("dataAll_prev", dataAll_prev);

//console.log("dataAll_prev por campo", dataAll_prev[0]);

//agregamos la tabla Recursos

var dataAll = [];

for (var i = 0; i < dataAll_prev.length; i++) {
  dataAll.push({
    ...dataAll_prev[i],

    ...DashTRF_Recursos.find(
      (itmInner) => itmInner.ID_People_Soft === dataAll_prev[i].Resource
    ),
  });
}

//console.log("dataAll", dataAll);

//console.log("dataAll por campo", dataAll[0]);

//------ gestión del año y mes en el  titulo-------------

// con esto obtenemos el mes para mostrarlo en el título del dashboard

// en index.html (la función se encuentra abajo al final de todo)

var Anio = dataAll[0].YearDT;

//--Aca enviamos el nombre del mes al div "anioActual" en index.html

var aActual = document.getElementById("anioActual");

anioActual.innerHTML = Anio;

var mesActual = obtenerMes();

//console.log("mesActual", mesActual); // control para ver si es el mes correcto en consola

//--Aca enviamos el nombre del mes al div "mesActual" en index.html

var mActual = document.getElementById("mesActual");

mActual.innerHTML = mesActual;

// --------Definimos valores estandarizados para usar en los charts---------------------

var chartHeightScale = 0.5;

var pieXscale = 1.6;

var pieRscale = chartHeightScale * 0.5;

var pieInnerRscale = pieRscale * 0.4;

// Elegimos paleta de colores en config.js

const colors = config.colores;

// Comienza la visualización

function makeViz(error) {
  if (error) {
    alert("Problema al cargar Archivo");
  } else {
    // multi-dimensional filter

    let ndx = crossfilter(dataAll);

    // Dimensiones

    let statusDimension = ndx.dimension(function (d) {
      return d.Overall_Status;
    });

    let lobDimension = ndx.dimension(function (d) {
      return d.Order_Book;
    });

    let categoryDimension = ndx.dimension(function (d) {
      return d.Category;
    });

    let stageDimension = ndx.dimension(function (d) {
      return d.Stage;
    });

    let sponsorDimension = ndx.dimension(function (d) {
      return d.Sponsor;
    });

    let projectNameDim = ndx.dimension(function (d) {
      return d["Project_Name"];
    });

    let themeDimension = ndx.dimension(function (d) {
      return d.Tematica;
    });

    // groups

    let lobGroup = lobDimension.group().reduceSum(function (d) {
      return d.total;
    });

    projectNameGroup = projectNameDim.group().reduceCount(function (d) {
      return d.total;
    });

    // Cantidad total de proyecto

    var pTotal = document.getElementById("proyectosTotal"); // elegimos la label en el html

    pTotal.innerHTML = projectNameGroup.top(Infinity).length;

    //  STAGE

    pieChart

      .height(setHeight(pieChart))

      .useViewBoxResizing(true)

      .dimension(statusDimension)

      .group(statusDimension.group())

      .colors(
        d3

          .scaleOrdinal()

          .domain(["G1", "A2", "A3", "R4", "R5", "NA", ""])

          .range([
            "#23711B",

            "#f3db00",

            "#e29701",

            "#dd0715",

            "#A8000B",

            "gray",

            "#ffffff",
          ])
      )

      .radius(pieChart.width() / pieRscale)

      .innerRadius(pieChart.width() * pieInnerRscale)

      .cx(pieChart.width() / pieXscale)

      .legend(
        dc

          .legend()

          .itemHeight(15)

          .y(Math.round(pieChart.height() * 0.2, 1))

          .gap(Math.round(pieChart.height() * 0.02, 1))

          .x(10)

          .legendText(function (d, i) {
            // return d.name + ": " + d.data;

            return (
              d.name +
              ": " +
              ((d.data / ndx.groupAll().reduceCount().value()) * 100).toFixed(
                0
              ) +
              "%"
            );
          })
      );

    // GB & GF

    var filtered_lob = remove_empty_bins(lobDimension.group());

    barChart

      .margins({ top: 10, right: 1, left: 30, bottom: 50 })

      .height(setHeight(barChart))

      .useViewBoxResizing(true)

      .elasticX(true)

      .gap(5)

      .dimension(lobDimension)

      .group(lobDimension.group())

      .elasticY(true)

      .x(d3.scaleBand().domain(filtered_lob))

      .xUnits(dc.units.ordinal)

      .colorAccessor((d) => d.key)

      .ordinalColors(colors)

      .renderHorizontalGridLines(true)

      .on("renderlet", function (chart) {
        //rotar las etiquetas del eje X

        chart

          .selectAll("g.x text")

          .style("text-anchor", "end")

          .attr("transform", "translate(-10,5) rotate(315)");

        //LES DEJO ESTE EVENTO DE MOUSEOVER POR SI LES SIRVE

        /*
      
                chart.selectAll("rect").on("click", function (d) {
      
                  console.log("click!", d);
      
                });*/
      });

    //  CATEGORY

    pieChart2

      .height(setHeight(pieChart2))

      .useViewBoxResizing(true)

      .dimension(categoryDimension)

      .group(categoryDimension.group())

      .ordinalColors(colors)

      .radius(pieChart2.width() / pieRscale)

      .innerRadius(pieChart2.width() * pieInnerRscale)

      .cx(pieChart2.width() / pieXscale)

      .legend(
        dc

          .legend()

          .itemHeight(14)

          .y(Math.round(pieChart2.height() * 0.2, 1))

          .gap(Math.round(pieChart2.height() * 0.02, 1))

          .x(10)

          .legendText(function (d, i) {
            // return d.name + ": " + d.data;

            return (
              d.name +
              ": " +
              ((d.data / ndx.groupAll().reduceCount().value()) * 100).toFixed(
                0
              ) +
              "%"
            );
          })
      );

    // -------------------------------------------------------------------------------------

    //  STAGE

    pieChart3

      .height(setHeight(pieChart3))

      .useViewBoxResizing(true)

      .dimension(stageDimension)

      .group(stageDimension.group())

      .ordinalColors(colors)

      .radius(pieChart3.width() / pieRscale)

      .innerRadius(pieChart3.width() * pieInnerRscale)

      .cx(pieChart3.width() / pieXscale)

      .legend(
        dc

          .legend()

          .itemHeight(15)

          .y(Math.round(pieChart3.height() * 0.2, 1))

          .gap(Math.round(pieChart3.height() * 0.02, 1))

          .x(10)

          .legendText(function (d, i) {
            // return d.name + ": " + d.data;

            return (
              d.name +
              ": " +
              ((d.data / ndx.groupAll().reduceCount().value()) * 100).toFixed(
                0
              ) +
              "%"
            );
          })
      );

    //  TEMATICA

    //Declaramos un filtro para el grupo asi no muestra los sponsor cuando estan en 0 (la función esta declarada al final abajo)

    var filtered_theme = remove_empty_bins(themeDimension.group());

    rowChart2

      .height(setHeight(rowChart))

      .useViewBoxResizing(true)

      .elasticX(true)

      .dimension(themeDimension)

      .group(filtered_theme)

      .ordinalColors(colors);

    //   SPONSORS DE PROYECTOS

    //Declaramos un filtro para el grupo asi no muestra los sponsor cuando estan en 0 (la función esta declarada al final abajo)

    var filtered_sponsor = remove_empty_bins(sponsorDimension.group());

    rowChart

      .height(setHeight(rowChart))

      .useViewBoxResizing(true)

      .elasticX(true)

      .dimension(sponsorDimension)

      .group(filtered_sponsor)

      .ordinalColors(colors);

    //  TABLA FINAL

    tabla

      .dimension(projectNameDim)

      .group(projectNameGroup)

      .enableAutoWidth(true)

      .enableColumnReordering(false)

      .enableSearch(true)

      .enablePaging(false)

      .responsive(true)

      .listeners({
        rowClicked: function (row, data, index) {
          window.open(
            "detalle-proyecto.html?var=" + data.Project_Name,

            "proyecto"
          );
        },
      });

    tabla.columns([
      {
        title: "Project Name",

        data: "Project_Name",
      },

      /*       {
            
                    title: "Nombre recursos",
            
                    data: "Apellido_y_Nombre",
            
                  }, */

      {
        title: "Sponsor",

        data: "Sponsor",
      },

      {
        title: "LoB",

        data: "Order_Book",
      },

      {
        title: "Category",

        data: "Category",
      },

      {
        title: "Project Manager",

        data: "Project_Manager",
      },

      {
        title: "Stage",

        data: "Stage",
      },

      /*       {
            
                    title: "Rol",
            
                    data: "Rol",
            
                  }, */

      {
        title: "Allocation",

        data: "Allocation",
      },

      {
        title: "Status",

        data: "Overall_Status",
      },

      {
        title: "Start Date",

        data: "Start_Date",
      },

      {
        title: "End Date",

        data: "End_Date",
      },
    ]);

    // Renders all charts ie line and pie charts

    dc.renderAll();

    function setHeight(chart) {
      return chart.width() * chartHeightScale;
    }
  }
}

makeViz();

function remove_empty_bins(source_group) {
  return {
    all: function () {
      return source_group.all().filter(function (d) {
        return d.value !== 0;
      });
    },
  };
}

//------ Función para obtener el nombre de mes -------

function obtenerMes() {
  //obtenemos el numero de mes de la tabla proyectos (ojo que el numero de mes viene en tipo "string" y no numero)

  var nMes = dataAll[0].MonthDT; //console.log(nMes);

  switch (nMes) {
    case "1":
      return "Enero";

      break;

    case "2":
      return "Febrero";

      break;

    case "3":
      return "Marzo";

      break;

    case "4":
      return "Abril";

      break;

    case "5":
      return "Mayo";

      break;

    case "6":
      return "Junio";

      break;

    case "7":
      return "Julio";

      break;

    case "8":
      return "Agosto";

      break;

    case "9":
      return "Septiembre";

      break;

    case "10":
      return "Octubre";

      break;

    case "11":
      return "Noviembre";

      break;

    case "12":
      return "Diciembre";

      break;

    default:
      return "Error en número de mes en el campo -MonthDT-";
  }
}
