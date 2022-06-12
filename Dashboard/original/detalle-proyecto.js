/*

    Dashboard HSBC 

*/

// Declaración de gráficos ------------------------------------------------------------

//const rowChart = dc.rowChart("#primer-chart");

const pieChart = dc.pieChart("#segundo-chart"); // Overall status

const pieChart3 = dc.pieChart("#cuarto-chart"); // Recursos

const pieChart4 = dc.pieChart("#quinto-chart"); // Roles

const pieChart2 = dc.pieChart("#sexto-chart"); //Allocation

var tabla = dc.tableview("#tabla"); // TABLA INFERIOR

// Elegimos paleta de colores en config.js

const colors = config.colores;

// -------------------------------------------------------------------------------------

// variables para recibir el nombre del proyecto, la funcion está al final abajo

var projectName = " ";

processVarDesdeURL();

//- Enviamos el bombre de variable a la etiqueta del div "projectName" en detalle-proyecto.html

var objetivo = document.getElementById("projectName");

objetivo.innerHTML = projectName;

// controlamos en consola cual es la variable que entra por url

// console.log("projectName", projectName);

// -------------------------------------------------------------------------------------

// ----------------------Gestión de las tablas, unión y preparación---------------------

// Unimos ambos datasets segun el campo Proyect_Name

// variable con el total de las tablas agregadas

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

// -------------------------------------------------------------------------------------

// --------Definimos valores estandarizados para usar en los charts---------------------

var chartHeightScale = 0.5;

var pieXscale = 1.6;

var pieRscale = chartHeightScale * 0.5;

var pieInnerRscale = pieRscale * 0.4;

// -------------------------------------------------------------------------------------

// Comienza la visualización

function makeViz(error, json) {
  if (error) {
    alert("Problema al cargar Archivo");
  } else {
    // Data Join

    // multi-dimensional filter

    let ndx = crossfilter(dataAll);

    // dimensiones

    // Creamos una nueva dimension "valor" y la filtramos con la

    // variable que viene del Dashboard principal (projectName)

    var valor = ndx.dimension(function (d) {
      return d.Project_Name;
    });

    valor = valor.filter(projectName);

    // para ver como queda "valor"

    //console.log("valor", valor.top(Infinity));

    // -------------------------------------------------------------------------------------

    // Nuevo objeto Crossfilter a partir de la dimensión filtrada

    let filteredData = crossfilter(valor.top(Infinity));

    // Dimensiones

    let allocationDim = filteredData.dimension(function (d) {
      return d.Allocation;
    });

    let statusDimension = filteredData.dimension(function (d) {
      return d.Overall_Status;
    });

    let RecursoDimension = filteredData.dimension(function (d) {
      return d.Apellido_y_Nombre;
    });

    let RolDimension = filteredData.dimension(function (d) {
      return d.Rol;
    });

    let pmDim = filteredData.dimension(function (d) {
      return d.Project_Manager;
    });

    //console.log("RecursoDimension", RecursoDimension.top(Infinity));

    // grupos

    let allocationGroup = allocationDim.group().reduceCount(function (d) {
      return d.total;
    });

    let pmGroup = pmDim.group().reduceCount(function (d) {
      return d.total;
    });

    //console.log("pmGroup", pmGroup.top(20));

    // ------------------------------- Charts ----------------------------------------------

    // -------------------------------------------------------------------------------------

    // Primer Chart   DETALLE PROYECTO

    // --------Para el detalle en texto del proyecto ----------

    var pm = pmGroup.top(Infinity)[0].key;

    //console.log("pm", pm); controlamos que es lo que estamos enviando al div "detalleProyecto"

    var detalleProyecto = document.getElementById("datalleProyecto");

    detalleProyecto.innerHTML = "<strong>Project Manager: </strong>" + pm;

    // -------------------------------------------------------------------------------------

    // Segundo Chart    OVERALL STATUS

    pieChart

      .height(setHeight(pieChart))

      .useViewBoxResizing(true)

      .dimension(statusDimension)

      .group(statusDimension.group())

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

          .legendText(function (d) {
            // return d.name + ": " + d.data;

            return (
              d.name +
              ": " +
              (
                (d.data / filteredData.groupAll().reduceCount().value()) *
                100
              ).toFixed() +
              "%"
            );
          })
      )

      .colors(
        d3

          .scaleOrdinal()

          .domain(["A2", "R4", "A3", "G1", "NA", ""])

          .range(["#f3db00", "#A8000B", "#e29701", "#23711B", "gray", "gray"])
      );

    // -------------------------------------------------------------------------------------

    // tercer chart    RECURSOS

    pieChart3

      .height(setHeight(pieChart2))

      .useViewBoxResizing(true)

      .dimension(RecursoDimension)

      .group(RecursoDimension.group())

      .ordinalColors(colors)

      //.minAngleForLabel(50)

      .radius(pieChart.width() / pieRscale)

      .innerRadius(pieChart.width() * pieInnerRscale)

      .cx(pieChart.width() / pieXscale)

      .label(function (d) {
        //función para que en los slices del pie las labels muestren

        //el porcentaje que representa c/u

        return (
          (
            (d.value / filteredData.groupAll().reduceCount().value()) *
            100
          ).toFixed() + "%"
        );
      })

      .legend(
        dc

          .legend(function (d) {
            return " " + d.value + " ";
          })

          .itemHeight(14)

          .y(Math.round(pieChart2.height() * 0.2, 1))

          .gap(Math.round(pieChart2.height() * 0.02, 1))

          .x(10)

          .legendText(function (d) {
            return d.name; //aca mostramos solo los nombres

            // esta version muestra tambien la cantidad de registros por campo

            // return  d.name + ":" + d.data +" - " +(d.data / filteredData.groupAll().reduceCount().value() * 100).toFixed(2)+"%";
          })
      );

    // -------------------------------------------------------------------------------------

    // Cuarto Chart  ROLES

    pieChart4

      .height(setHeight(pieChart2))

      .useViewBoxResizing(true)

      .dimension(RolDimension)

      .group(RolDimension.group())

      .ordinalColors(colors)

      .radius(pieChart.width() / pieRscale)

      .innerRadius(pieChart.width() * pieInnerRscale)

      .cx(pieChart.width() / pieXscale)

      .legend(
        dc

          .legend(function (d) {
            return " " + d.value + " ";
          })

          .itemHeight(14)

          .y(Math.round(pieChart2.height() * 0.2, 1))

          .gap(Math.round(pieChart2.height() * 0.02, 1))

          .x(10)

          .legendText(function (d) {
            // esta version muestra tambien la cantidad de registros por campo

            // return  d.name + ":" + d.data +" - " +(d.data / filteredData.groupAll().reduceCount().value() * 100).toFixed(2)+"%";

            // Esta solo porcentajes

            return (
              d.name +
              ": " +
              (
                (d.data / filteredData.groupAll().reduceCount().value()) *
                100
              ).toFixed(2) +
              "%"
            );
          })
      );

    // -------------------------------------------------------------------------------------

    // Quinto Chart     ALOCACIONES

    //-----------------Obtener Total Alocación para el Título ------------

    /*

    //-- aca hacemos la conversión del nombre de cada alocación 

    (por como están los datos el nombre es el valor real) y luego sumamos el total

    para poder sacar el porcentaje de las allocation en el piechart2

    console.log("allocationGroup", allocationGroup.top(Infinity)[0].key);

    */

    //console.log("allocationGroup", allocationGroup.top(Infinity));

    var totalAllocation = 0;

    for (var i = 0; i < allocationGroup.top(Infinity).length; i++) {
      /*

       console.log(

       "AllocationGroupKeys",

       Number(allocationGroup.top(Infinity)[i].key.replace(",", ".")) *

       allocationGroup.top(Infinity)[i].value

      ),

      */

      totalAllocation += Number(
        allocationGroup.top(Infinity)[i].key.replace(",", ".") *
          allocationGroup.top(Infinity)[i].value
      );
    }

    //--- para ver el total de allocation

    //console.log("totalAllocation", totalAllocation);

    //------y lo enviamos al html en el cuadro Allocation

    var objetivo = document.getElementById("allocationTotal");

    objetivo.innerHTML = totalAllocation;

    //---------------------Final Total Alocaci´´on-------------------------

    pieChart2

      .height(setHeight(pieChart2))

      .useViewBoxResizing(true)

      .dimension(allocationDim)

      .group(allocationGroup)

      .ordinalColors(colors)

      .radius(pieChart.width() / pieRscale)

      .innerRadius(pieChart.width() * pieInnerRscale)

      .cx(pieChart.width() / pieXscale)

      .legend(
        dc

          .legend(function (d) {
            return " " + d.value + " ";
          })

          .itemHeight(14)

          .y(Math.round(pieChart2.height() * 0.2, 1))

          .gap(Math.round(pieChart2.height() * 0.02, 1))

          .x(10)

          .legendText(function (d) {
            // esta version muestra tambien la cantidad de registros por campo

            // return  d.name + ":" + d.data +" - " +(d.data / filteredData.groupAll().reduceCount().value() * 100).toFixed(2)+"%";

            // Esta solo porcentajes

            return (
              d.name +
              ":" +
              ((
                (Number(d.name.replace(",", ".")) / totalAllocation) *
                100
              ).toFixed(2) +
                "%")
            );
          })
      );

    // -------------------------------------------------------------------------------------

    // tabla

    totalAllocaciones = allocationDim.group().reduceSum(function (d) {
      return d.total;
    });
    console.log("aca: ", totalAllocaciones.top(Infinity));
    /*
    console.log(
      "aca: ",
      allocationDim.group(selectByKey(allocationGroup, "Category"))
    );

    
    var filtered_ProjectName = remove_empty_bins(allocationDim.group());

    console.log("filtered_ProjectName", filtered_ProjectName);
*/

    tabla

      //Acá es necesario agregar alguna dimensión, pero como las columnas

      .dimension(allocationDim) // se declaran "a mano" puede ser cualquiera

      .group(allocationGroup)

      .enableAutoWidth(true)

      .enableColumnReordering(false)

      .enableSearch(true)

      .enablePaging(false)

      .responsive(true);

    tabla.columns([
      {
        title: "Project Name",

        data: "Project_Name",
      },

      {
        title: "Nombre Recursos",

        data: "Apellido_y_Nombre",
      },

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

      {
        title: "Rol",

        data: "Rol",
      },

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
    ]);

    // Renders all charts ie line and pie charts

    dc.renderAll();

    function setHeight(chart) {
      return chart.width() * chartHeightScale;
    }
  }
}

makeViz();

// -------------------------------------------------------------------------------------

//------- FUNCIONES AUXILIARES -----------------------------

// Recibe la variable del nombre del proyecto para el detalle

function processVarDesdeURL() {
  var parameters = location.search.substring(1);

  var temp = parameters.split("=");

  //console.log("var", temp[1]);

  projectName = temp[1];

  // una solución poco elegante para lidiar con las tildes

  projectName = projectName.replace(/%20/g, " ");

  projectName = projectName.replace(/%C3%A1/g, "á");

  projectName = projectName.replace(/%C3%A9/g, "é");

  projectName = projectName.replace(/%C3%AD/g, "í");

  projectName = projectName.replace(/%C3%B3/g, "ó");

  projectName = projectName.replace(/%C3%BA/g, "ú");

  projectName = projectName.replace(/%C3%B1/g, "ñ");

  projectName = projectName.replace(/%C3%81/g, "Á");

  projectName = projectName.replace(/%C3%89/g, "É");

  projectName = projectName.replace(/%C3%8D/g, "Í");

  projectName = projectName.replace(/%C3%93/g, "Ó");

  projectName = projectName.replace(/%C3%9A/g, "Ú");

  projectName = projectName.replace(/%C3%91/g, "Ñ");
}

// -------------------------------------------------------------------------------------
