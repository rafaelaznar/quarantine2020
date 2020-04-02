// Based on http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
// Based on https://gist.github.com/strategicpause/827183/2da101e92a79c0ffa40b0b986175170984f00355
// Author: Rafael Aznar (rafaaznar {at} gmail {dot} com)
// March 2020
// MIT License

var miModulo = angular.module("MiAngularApp", ["chart.js"]).config([
  "ChartJsProvider",
  function (ChartJsProvider) {
    ChartJsProvider.setOptions({
      chartColors: ["#28a745", "#FF00FF", "#dc3545", "#17a2b8", "#000000"],
      responsive: true
    });
  }
]);

var miControlador = miModulo.controller("MiControlador", [
  "$scope",
  "$interval",
  function ($scope, $interval) {
    const WIDTH = 300;
    const HEIGHT = 300;

    $scope.language = 0;

    $scope.checkInmunity = true;

    //range controls
    //
    $scope.rangeContagiousnessMin = 1;
    $scope.rangeContagiousnessMax = 5;
    $scope.rangeContagiousness = 3;
    $scope.rangeContagiousnessStep = 1;
    //
    $scope.rangeIncubationMin = 0;
    $scope.rangeIncubationMax = 20;
    $scope.rangeIncubation = 0;
    $scope.rangeIncubationStep = 1;
    //
    $scope.rangeConvalescenceMin = 1;
    $scope.rangeConvalescenceMax = 40;
    $scope.rangeConvalescence = 10;
    $scope.rangeConvalescenceStep = 1;
    //
    $scope.rangeImmunityMin = 0;
    $scope.rangeImmunityMax = 100;
    $scope.rangeImmunity = 20;
    $scope.rangeImmunityStep = 1;
    //
    $scope.rangeMortalityMin = 0;
    $scope.rangeMortalityMax = 60;
    $scope.rangeMortality = 3;
    $scope.rangeMortalityStep = 0.1;
    //
    $scope.rangeInitialMin = 1;
    $scope.rangeInitialMax = 100;
    $scope.rangeInitial = 50;
    $scope.rangeInitialStep = 1;
    //
    $scope.rangeNeighborhoodMin = 1;
    $scope.rangeNeighborhoodMax = 2;
    $scope.rangeNeighborhood = 2;
    $scope.rangeNeighborhoodStep = 1;
    //
    $scope.rangeContactsMin = 0;
    $scope.rangeContactsMax = 100;
    $scope.rangeContacts = 50;
    $scope.rangeContactsStep = 1;
    //
    $scope.rangeDispersionMin = 0;
    $scope.rangeDispersionMax = 1000;
    $scope.rangeDispersion = 0;
    $scope.rangeDispersionStep = 1;
    //
    $scope.rangeDayLengthMin = 0.4;
    $scope.rangeDayLengthMax = 2;
    $scope.rangeDayLength = 1;
    $scope.rangeDayLengthStep = 0.1;
    //

    initializeParameters();
    loadLanguages();
    setupCharts();
    initializeCharts();
    init();
    draw();
    updateCharts();
    //
    function initializeParameters() {
      state = null; //the world
      $scope.dayCounter = 0;
      $scope.info = "Ready.";
      $scope.status = "initial"; //initial, processing, paused, finished

      //accounting population
      $scope.healthy = 0;
      $scope.incubating = 0;
      $scope.sick = 0;
      $scope.inmune = 0;
      $scope.dead = 0;
      $scope.total = 0;

      //accounting parameters
      $scope.incidence = 0;
      $scope.maxIncidence = 0;
      $scope.maxIncidenceDay = 0;
      $scope.prevalence = 0;
      $scope.maxPrevalence = 0;
      $scope.maxPrevalenceDay = 0;
      $scope.R0i = 0;
      $scope.saturation = 0;
      $scope.saturationDay = 0;

      //progress values
      $scope.progressHealthy = 0;
      $scope.progressIncubating = 0;
      $scope.progressSick = 0;
      $scope.progressInmune = 0;
      $scope.progressDead = 0;
      $scope.progressHealthyTotal = 0;
      $scope.progressIncubatingTotal = 0;
      $scope.progressSickTotal = 0;
      $scope.progressInmuneTotal = 0;
      $scope.progressDeadTotal = 0;
    }
    //    
    function initializeCharts() {
      $scope.populationChartLabels = [];
      $scope.populationChartData = [];
      $scope.populationChartData.push([]); //Healthy
      $scope.populationChartData.push([]); //Incubating
      $scope.populationChartData.push([]); //Sick
      $scope.populationChartData.push([]); //Inmune
      $scope.populationChartData.push([]); //Dead
      //-- Incidence
      $scope.incidenceChartLabels = [];
      $scope.incidenceChartData = [];
      $scope.incidenceChartData.push([]);
      //-- Prevalence
      $scope.prevalenceChartLabels = [];
      $scope.prevalenceChartData = [];
      $scope.prevalenceChartData.push([]);
      //-- R0
      $scope.R0ChartLabels = [];
      $scope.R0ChartData = [];
      $scope.R0ChartData.push([]);
    };

    $scope.start = function () {
      $scope.status = "processing";
      $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000);
    };

    $scope.stop = function () {
      $scope.status = "paused";
      $interval.cancel($scope.ticTac);
    };

    $scope.reset = function () {
      $interval.cancel($scope.ticTac);
      initializeParameters();
      initializeCharts();
      init();
      draw();
      updateCharts();
    };

    function initializeWorld() {
      state = new Array(WIDTH);
      for (i = 0; i < WIDTH; i++) {
        state[i] = new Array(HEIGHT);
        for (j = 0; j < HEIGHT; j++) {
          state[i][j] = 0;
        }
      }
    }

    function infect() {
      var x = randomInt(0, WIDTH - 1);
      var y = randomInt(0, HEIGHT - 1);
      for (var i = 1; i <= $scope.rangeInitial; i++) {
        do {
          x = getRealCoord(x + randomInt(-$scope.rangeNeighborhood, $scope.rangeNeighborhood), WIDTH);
          y = getRealCoord(y + randomInt(-$scope.rangeNeighborhood, $scope.rangeNeighborhood), HEIGHT);
        } while (state[x][y] != 0);
        state[x][y] = $scope.rangeConvalescence;
      }
    }

    function init() {
      initializeWorld();
      infect();
    }

    function decrease() {
      for (i = 0; i < WIDTH; i++) {
        for (j = 0; j < HEIGHT; j++) {
          if (state[i][j] > 1) {
            if (state[i][j] == 1001) {
              //ending incubation
              state[i][j] = $scope.rangeConvalescence;
            } else {
              state[i][j]--;
            }
          } else {
            if (state[i][j] == 1) {
              if ($scope.checkInmunity) {
                state[i][j] = -1;
              } else {
                state[i][j] = -1 * $scope.rangeImmunity;
              }
            } else {
              if (state[i][j] < 0 && state[i][j] > -1000) {
                if (!$scope.checkInmunity) {
                  state[i][j]++;
                }
              }
            }
          }
        }
      }
    }

    function count() {
      var previousSick = $scope.sick;
      var previousIncubating = $scope.incubating;
      //--
      $scope.healthy = 0;
      $scope.incubating = 0;
      $scope.sick = 0;
      $scope.inmune = 0;
      $scope.dead = 0;
      $scope.total = 0;
      //--
      $scope.incidence = 0;
      $scope.prevalence = 0;
      $scope.R0i = 0;
      //--
      for (i = 0; i < WIDTH; i++) {
        for (j = 0; j < HEIGHT; j++) {
          $scope.total++;
          if (state[i][j] < 0) {
            if (state[i][j] <= -1000) {
              $scope.dead++;
            } else {
              $scope.inmune++;
            }
          } else {
            if (state[i][j] > 0) {
              if (state[i][j] > 1000) {
                $scope.incubating++;
              } else {
                $scope.sick++;
              }
            } else {
              $scope.healthy++;
            }
          }
        }
      }
      if ($scope.saturation < $scope.progressSick) {
        $scope.saturation = $scope.progressSick;
        $scope.saturationDay = $scope.dayCounter;
      }
      $scope.incidence = (($scope.sick - previousSick + $scope.incubating - previousIncubating) / $scope.healthy) * 100; //counting incubating!
      if ($scope.maxIncidence < $scope.incidence) {
        $scope.maxIncidence = $scope.incidence;
        $scope.maxIncidenceDay = $scope.dayCounter;
      }
      $scope.prevalence = (($scope.sick) / ($scope.total - $scope.dead)) * 100;
      if ($scope.maxPrevalence < $scope.prevalence) {
        $scope.maxPrevalence = $scope.prevalence;
        $scope.maxPrevalenceDay = $scope.dayCounter;
      }
      $scope.R0i = ($scope.sick + $scope.incubating) / (previousSick + previousIncubating); //= ($scope.sick + $scope.incubating) / previousSick;
    }

    function updateCharts() {
      $scope.populationChartLabels.push($scope.dayCounter.toString());
      $scope.progressHealthy = ($scope.healthy * 100) / $scope.total;
      $scope.progressIncubating = ($scope.incubating * 100) / $scope.total;
      $scope.progressSick = ($scope.sick * 100) / $scope.total;
      $scope.progressInmune = ($scope.inmune * 100) / $scope.total;
      $scope.progressDead = ($scope.dead * 100) / $scope.total;
      $scope.populationChartData[0].push($scope.progressHealthy);
      $scope.populationChartData[1].push($scope.progressIncubating);
      $scope.populationChartData[2].push($scope.progressSick);
      $scope.populationChartData[3].push($scope.progressInmune);
      $scope.populationChartData[4].push($scope.progressDead);
      //--
      $scope.incidenceChartLabels.push($scope.dayCounter.toString());
      $scope.incidenceChartData[0].push($scope.incidence);
      //--
      $scope.prevalenceChartLabels.push($scope.dayCounter.toString());
      $scope.prevalenceChartData[0].push($scope.prevalence);
      //--
      $scope.R0ChartLabels.push($scope.dayCounter.toString());
      $scope.R0ChartData[0].push($scope.R0i);
    }

    function travel() {
      for (var i = 0; i < $scope.rangeDispersion; i++) {
        var x1 = randomInt(0, WIDTH - 1);
        var y1 = randomInt(0, HEIGHT - 1);
        var x2 = randomInt(0, WIDTH - 1);
        var y2 = randomInt(0, HEIGHT - 1);
        var temp = state[x2][y2];
        state[x2][y2] = state[x1][y1];
        state[x1][y1] = temp;
      }
    }

    function game_loop() {
      function game_loop_equilibration_and_process(i, j) {
        function game_loop_process(i, j) {
          if (state[i][j] == 0) {
            explore(i, j);
          } else {
            if (state[i][j] > 0 && state[i][j] < 1000) {
              if (randomInt(1, 1000) <= $scope.rangeMortality) {
                state[i][j] = -1000;
              }
            }
          }
        }
        if ($scope.dayCounter % 4 == 0) { // this block is for equilibrate world calculation
          game_loop_process(i, j);
        } else {
          if ($scope.dayCounter % 4 == 1) {
            game_loop_process(WIDTH - i - 1, HEIGHT - j - 1);
          } else {
            if ($scope.dayCounter % 4 == 2) {
              game_loop_process(WIDTH - i - 1, j);
            } else {
              game_loop_process(i, HEIGHT - j - 1);
            }
          }
        }
      }
      //--
      if ($scope.sick == 0 && $scope.incubating == 0) {
        $interval.cancel($scope.ticTac);
        $scope.status = "finished";
      }
      $scope.dayCounter++;
      travel();
      for (var i = 0; i < WIDTH; i++) {
        for (var j = 0; j < HEIGHT; j++) {
          game_loop_equilibration_and_process(i, j);
        }
      }
      decrease();
      draw();
      updateCharts();
    }

    function getRealCoord(x, tope) {
      if (x > tope - 1) {
        return x - tope;
      } else {
        if (x < 0) {
          return tope + x;
        } else {
          return x;
        }
      }
    }

    function exploreNeigborhood(x, y, neighborhood) {
      total = 0;
      for (f = x - neighborhood; f <= x + neighborhood; f++) {
        for (g = y - neighborhood; g <= y + neighborhood; g++) {
          var realx = getRealCoord(f, WIDTH);
          var realy = getRealCoord(g, HEIGHT);
          if (realx != x && realy != y) { //cant consider myself 
            if (state[realx][realy] > 0) {
              if (state[realx][realy] > 1000) {
                total += 1 //+=$scope.rangeConvalescence;
              } else {
                total += 1 //+=state[realx][realy];
              }
            }
          }
        }
      }
      return total;
    }

    function explore(x, y) {
      if (randomInt(1, 100) <= $scope.rangeContacts) {
        var contamination = exploreNeigborhood(x, y, $scope.rangeNeighborhood);
        if (contamination > $scope.rangeContagiousness) {
          if ($scope.rangeIncubation > 0) {
            state[x][y] = 1000 + $scope.rangeIncubation;
          } else {
            state[x][y] = $scope.rangeConvalescence;
          }
        }
      }
    }

    function draw() {
      var canvas = document.getElementById("canvas");
      if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        for (i = 0; i < WIDTH; i++) {
          for (j = 0; j < HEIGHT; j++) {
            if (state[i][j] == 0) {
              ctx.fillStyle = "rgb(0,180,0)";
              ctx.fillRect(i, j, 1, 1);
            } else {
              if (state[i][j] < 0) {
                if (state[i][j] <= -1 && state[i][j] > -1000) {
                  //immune
                  if ($scope.checkInmunity) {
                    ctx.fillStyle = "rgb(0,255,255)";
                    ctx.fillRect(i, j, 1, 1);
                  } else {
                    ctx.fillStyle = "rgb(" + Math.floor(255 - (-1 * state[i][j] * 255) / $scope.rangeImmunity) + ",255,255)";
                    ctx.fillRect(i, j, 1, 1);
                  }
                } else {
                  //<= -1000 dead
                  ctx.fillStyle = "rgb(0,0,0)";
                  ctx.fillRect(i, j, 1, 1);
                }
              } else {
                if (state[i][j] > 1000) {
                  ctx.fillStyle = "rgb(255," + (255 - Math.floor((state[i][j] * 255) / $scope.rangeIncubation)) + ",255)";
                  ctx.fillRect(i, j, 1, 1);
                } else {
                  //>0 sick
                  ctx.fillStyle =
                    "rgb(200," + Math.floor((state[i][j] * 255) / $scope.rangeConvalescence) + ","
                    + Math.floor((state[i][j] * 255) / $scope.rangeConvalescence) + ")";
                  ctx.fillRect(i, j, 1, 1);
                }
              }
            }
          }
        }
      }
      count();
    }

    $scope.canShare = function () {
      if (navigator.share) {
        return true;
      } else {
        return false;
      }
    };

    $scope.share = function () {
      if (navigator.share) {
        navigator
          .share({
            title: "Quarantine2020",
            text: "Give a try to this simulator!",
            url: "https://rafaelaznar.github.io/"
          })
          .then(() => console.log("Successful share"))
          .catch(error => console.log("Error sharing", error));
      } else {
        console.log("Error sharing", error);
      }
    };

    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    $scope.runConfig = function (code) {
      switch (code) {
        case '01a':
          $scope.rangeContagiousness = 3;
          $scope.rangeIncubation = 20;
          $scope.rangeConvalescence = 20;
          $scope.checkInmunity = true;
          $scope.rangeImmunity = 20;
          $scope.rangeMortality = 3;
          $scope.rangeInitial = 100;
          $scope.rangeNeighborhood = 2;
          $scope.rangeContacts = 25;
          $scope.rangeDispersion = 0;
          $scope.status = "processing";
          $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000);
          break;
        case '01b':
          $scope.rangeContagiousness = 3;
          $scope.rangeIncubation = 20;
          $scope.rangeConvalescence = 20;
          $scope.checkInmunity = true;
          $scope.rangeImmunity = 20;
          $scope.rangeMortality = 3;
          $scope.rangeInitial = 100;
          $scope.rangeNeighborhood = 2;
          $scope.rangeContacts = 75;
          $scope.rangeDispersion = 0;
          $scope.status = "processing";
          $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000);
          break;
        case '02a':
          $scope.rangeContagiousness = 3;
          $scope.rangeIncubation = 20;
          $scope.rangeConvalescence = 20;
          $scope.checkInmunity = true;
          $scope.rangeImmunity = 20;
          $scope.rangeMortality = 3;
          $scope.rangeInitial = 50;
          $scope.rangeNeighborhood = 2;
          $scope.rangeContacts = 80;
          $scope.rangeDispersion = 0;
          $scope.status = "processing";
          $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000, 5);
          $scope.ticTac.then(function () {
            $scope.rangeContacts = 50;
            $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000, 5);
            $scope.ticTac.then(function () {
              $scope.rangeContacts = 20;
              $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000);
            })
          })
          break;
        case '02b':
          $scope.rangeContagiousness = 3;
          $scope.rangeIncubation = 20;
          $scope.rangeConvalescence = 20;
          $scope.checkInmunity = true;
          $scope.rangeImmunity = 20;
          $scope.rangeMortality = 3;
          $scope.rangeInitial = 50;
          $scope.rangeNeighborhood = 2;
          $scope.rangeContacts = 80;
          $scope.rangeDispersion = 0;
          $scope.status = "processing";
          $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000, 10);
          $scope.ticTac.then(function () {
            $scope.rangeContacts = 50;
            $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000, 10);
            $scope.ticTac.then(function () {
              $scope.rangeContacts = 20;
              $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000);
            })
          })
          break;

        case '03a':
          $scope.rangeContagiousness = 3;
          $scope.rangeIncubation = 20;
          $scope.rangeConvalescence = 20;
          $scope.checkInmunity = true;
          $scope.rangeImmunity = 20;
          $scope.rangeMortality = 3;
          $scope.rangeInitial = 50;
          $scope.rangeNeighborhood = 2;
          $scope.rangeContacts = 80;
          $scope.rangeDispersion = 0;
          $scope.status = "processing";
          $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000, 10);
          $scope.ticTac.then(function () {
            $scope.rangeContacts = 20;
            $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000, 20);
            $scope.ticTac.then(function () {
              $scope.rangeContacts = 80;
              $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000, 10);
              $scope.ticTac.then(function () {
                $scope.rangeContacts = 20;
                $scope.ticTac = $interval(game_loop, $scope.rangeDayLength * 1000);
              })
            })
          })
          break;
        default:
          console.log("ERROR in run: code not valid")
          break;
      }
    }

    //charts
    function setupCharts() {
      $scope.chartOptions = {
        options: { maintainAspectRatio: false },
        legend: { display: true },
        animation: { duration: 0 },
        scales: {
          yAxes: [{
            id: "y-axis-1",
            type: "linear",
            display: true,
            position: "left"
          }]
        }
      };
    }

    function loadLanguages() {
      $scope.txtPopulationChartSeries = [];
      $scope.txtPopulationChartSeries[0] = ["Healthy", "Incubating", "Sick", "Inmune", "Dead"];
      $scope.txtPopulationChartSeries[1] = ["Sanos", "Incubadores", "Enfermos", "Inmunes", "Fallecidos"];
      $scope.txtPopulationChartSeries[2] = ["Sans", "Incubadors", "Malalts", "Immunes", "Morts"];

      $scope.txtIncidenceChartSeries = [];
      $scope.txtIncidenceChartSeries[0] = ["Incidence"];
      $scope.txtIncidenceChartSeries[1] = ["Incidencia"];
      $scope.txtIncidenceChartSeries[2] = ["Incidència"];

      $scope.txtPrevalenceChartSeries = [];
      $scope.txtPrevalenceChartSeries[0] = ["Prevalence"];
      $scope.txtPrevalenceChartSeries[1] = ["Prevalencia"];
      $scope.txtPrevalenceChartSeries[2] = ["Prevalença"];

      $scope.txtR0ChartSeries = [];
      $scope.txtR0ChartSeries[0] = ["R0"];
      $scope.txtR0ChartSeries[1] = ["R0"];
      $scope.txtR0ChartSeries[2] = ["R0"];

      $scope.txtTitle = ["Quarantine2020", "Cuarentena2020", "Quarantena2020"];
      $scope.txtIntro = [
        "Below is an epidemics simulator. Adjust the controls and simulate the infection yourself.",
        "A continuación se muestra un simulador de epidemia. Ajuste los controles y simule la infección usted mismo.",
        "A continuació es mostra un simulador d'epidèmia. Ajusteu els controls i simuleu la infecció vosaltres mateix."
      ];
      $scope.txtReady = ["Ready", "Preparado", "Preparat"];
      $scope.txtStart = ["Start", "Iniciar", "Inici"];
      $scope.txtPause = ["Pause", "Pausar", "Pausar"];
      $scope.txtPaused = ["Paused", "Pausado", "Pausat"];
      $scope.txtFinished = ["Finished", "Finalizado", "Finalitzat"];
      $scope.txtContinue = ["Continue", "Continuar", "Continuar"];
      $scope.txtReset = ["Reset", "Restablecer", "Restablir"];
      $scope.txtDay = ["Day", "Dia", "Dia"];
      $scope.txtTotalImmunity = [
        "Total Inmunity",
        "Inmunidad total",
        "Inmunitat total"
      ];
      $scope.txtAbout = ["About", "Acerca de", "Contacta"];

      //----
      $scope.txtContagiousness = [
        "Contagiousness",
        "Contagiosidad",
        "Contagiositat"
      ];
      $scope.txtContagiousnessExp = [
        "Contagiousness is the amount of individuals in the neighborhood for infection to occur. If the level of viral load needed to get infected is low, then the result is that more infections occur.",
        "Contagiosidad es la cantidad individuos contagiados en la vecindad para que se produzca la infección. Si el nivel de carga viral necesario para contagiarse se situa a niveles bajos entonces el resultado es que se produce una mayor cantidad de contagios.",
        "Contagiositat és la quantitat de individus en el veïnat perquè es produeixca la infecció. Si el nivell de càrrega viral necessari per contagiar es troba a nivells baixos llavors el resultat és que es produeix una major quantitat de contagis.",
      ];
      $scope.txtContagiousnessUnit = [
        "Individuals",
        "Individuos",
        "Individus"
      ];

      $scope.txtIncubation = ["Incubation", "Incubación", "Incubació"];
      $scope.txtIncubationExp = [
        "Time in which infected individuals are asymptomatic but can transmit the disease.",
        "Tiempo en el que los individuos contagiados son asintomáticos pero pueden transmitir la enfermedad.",
        "Temps en què els individus contagiats són asimptomàtics però poden transmetre la malaltia."
      ];
      $scope.txtIncubationUnit = ["Days", "Dias", "Dies"];

      $scope.txtConvalescence = [
        "Convalescence",
        "Convalencencia",
        "Convalescència"
      ];
      $scope.txtConvalescenceExp = [
        "Time for sick patients to recover",
        "Tiempo que los enfermos tardan en recuperarse",
        "Temps que els malalts tarden a recuperar-se"
      ];
      $scope.txtConvalescenceUnit = ["Days", "Dias", "Dies"];

      $scope.txtImmunity = [
        "Inmunity",
        "Inmunidad",
        "Immunitat"
      ];
      $scope.txtImmunityExp = [
        "Inmunity days after illness, in which the recovered individual cannot be infected again.",
        "Dias de inmunidad después de la enfermedad, en los que el individuo recuperado no puede volver a ser infectado.",
        "Dies d'immunitat després de la malaltia, en els quals l'individu recuperat no pot tornar a ser infectat."
      ];
      $scope.txtImmunityUnit = ["Days", "Dias", "Dies"];


      $scope.txtMortality = [
        "Mortality",
        "Mortalidad",
        "Mortalitat"
      ];
      $scope.txtMortalityExp = [
        "Probability that an infected person has of dying.",
        "Probabilidad que tiene un individuo contagiado de morir.",
        "Probabilitat que té un individu contagiat de morir."
      ];
      $scope.txtMortalityUnit = [
        "‰ diary",
        "‰ diaria",
        "‰ diària"
      ];
      //--
      $scope.txtInitial = [
        "Initial infected population",
        "Población infectada inicial",
        "Població inicial infectada"
      ];
      $scope.txtInitialExp = [
        "Initial infected population is the number of individuals that are initially infected and are the seed of the epidemic. They are always grouped.",
        "Población infectada inicial es la cantidad de individuos que inicialmente están infectados y actúan como semilla de la epidemia. Se presentan siempre de forma agrupada.",
        "Població infectada inicial és la quantitat d'individus que inicialment estan infectats i actuen com a llavor de l'epidèmia. Es presenten sempre de forma agrupada."
      ];
      $scope.txtInitialUnit = ["Individuals", "Individuos", "Individus"];

      $scope.txtNeighborhood = ["Neighborhood", "Vecindario", "Veïnat"];
      $scope.txtNeighborhoodExp = [
        "Neighborhood is the number of bordering individuals that are evaluated to determine the viral load that surrounds an individual. If the viral load exceeds the minimum of the Contagiousness parameter, then the individual becomes infected. Neighborhood = 1 tests 8 neighbors; Neighborhood = 2 tests 24 neighbors.",
        "Vecindad es la cantidad de individuos limítrofes que se evalúan para determinar la carga vírica que circunda a un individuo. Si la carga vírica supera el mínimo del parámetro Contagiosidad entonces el individuo se infecta. Vecindad = 1 chequea 8 vecinos; Vecindad = 2 chequea 24 vecinos.",
        "Veïnat és la quantitat d'individus limítrofs que s'avaluen per determinar la càrrega vírica que circumda a un individu. Si la càrrega vírica supera el mínim del paràmetre Contagiositat llavors l'individu s'infecta. Veïnat = 1 comprova 8 veïns; Veïnat = 2 comprova 24 veïns."
      ];
      $scope.txtNeighborhoodUnit = ["Level", "Nivel", "Nivell"];

      $scope.txtContacts = ["Contacts", "Contactos", "Contactes"];
      $scope.txtContactsExp = [
        "Contacts is a parameter that simulates an individual's probability of maintaining contacts with other individuals in their neighborhood. The greater the probability of having contacts within the neighborhood, the greater the probability of infection.",
        "Contactos es un parámetro que simula la probabilidad de un individuo de mantener contactos con otros individuos de su vecindad. Cuanta más probabilidad de tener contactos con la vecindad, mayor probabilidad de infección.",
        "Contactes és un paràmetre que simula la probabilitat d'un individu de mantenir contactes amb altres individus del seu veïnat. Quanta més probabilitat de tenir contactes amb el veïnat, major probabilitat d'infecció."
      ];
      $scope.txtContactsUnits = ["Individuals", "Individuos", "Individus"];

      $scope.txtDispersion = ["Dispersion", "Dispersión", "Dispersió"];
      $scope.txtDispersionExp = [
        "Number of individuals that randomly swap their locations in each iteration. It is an index that simulates the ability of individuals to travel.",
        "Número de individuos que  aleatoriamente intercambian su ubicación en cada iteración. Se trata de un índice que simula la capacidad de los individuos para viajar.",
        "Nombre d'individus que aleatòriament intercanvien la seua ubicació en cada iteració. Es tracta d'un índex que simula la capacitat dels individus per a viatjar."
      ];
      $scope.txtDispersionUnit = ["Swaps", "Intercambios", "Intercanvis"];

      $scope.txtDayLength = ["Day length", "Duración del día", "Durada del dia"];
      $scope.txtDayLengthExp = [
        "It is possible to increase or decrease the speed of the simulation by changing this parameter. Do it with caution since with less powerful equipment can cause the saturation of the program.",
        "Es posible incrementar o decrementar la velocidad de la simulación cambiando este parámetro. Hágalo con precaución ya que en equipos menos potentes puede llevar a la saturación del programa.",
        "És possible incrementar o decrementar la velocitat de la simulació canviant aquest paràmetre. Feu-ho amb precaució ja que en equips menys potents pot produir a la saturació de el programa."];
      $scope.txtDayLengthUnit = ["Seconds", "Segundos", "Segons"];
      //---
      $scope.txtHealthy = ["Healthy", "Sanos", "Sans"];
      $scope.txtIncubating = ["Incubating", "Incubadores", "Incubadors"];
      $scope.txtImmune = ["Immune", "Inmunes", "Immunes"];
      $scope.txtSick = ["Sick", "Enfermos", "Malalts"];
      $scope.txtDeath = ["Death", "Fallecidos", "Morts"];
      //--

      $scope.txtDeathRate = ["Death rate", "Índice de mortalidad", "Índex de mortalitat"];
      $scope.txtFooter1 = [
        "This code does not use cookies, does not contain ads nor track or spy on you.",
        "Este código no utiliza cookies, no contiene anuncios ni te rastrea ni te espía.",
        "Aquest codi no utilitza cookies, no conté anuncis, ni vos fa cap seguiment, ni espia."
      ];
      $scope.txtFooter2 = [
        "Designed and built by Rafael Aznar (rafaaznar {at} gmail {dot} com) (@rafaelaznar)",
        "Diseñado y programado por Rafael Aznar (rafaaznar {at} gmail {dot} com) (@rafaelaznar)",
        "Disenyat y programat per Rafael Aznar (rafaaznar {at} gmail {dot} com) (@rafaelaznar)"
      ];
      $scope.txtFooter3 = ["MIT licensed project", "Proyecto con licencia MIT", "Projecte amb licència MIT"];
      $scope.txtModal1 = [
        "My name is Rafael Aznar, Web Development professor at CIPFP Ausiàs March in Valencia",
        "Mi nombre es Rafael Aznar, profesor del ciclo Desarrollo de aplicaciones web en el CIPFP Ausiàs March de Valencia. ",
        "El meu nom és Rafael Aznar, professor del cicle Desenvolupament d'aplicacions web al CIPFP Ausiàs March de València."
      ];
      $scope.txtModal2 = [
        "With no Fallas(1) and locked up at home because of the Coronavirus quarantine, I have designed and written this epidemic simulator in my spare time. I hope you to find it useful.",
        "Sin Fallas(1) y encerrado en casa a causa de la cuarentena por el Coronavirus, he diseñado y escrito este simulador de epidemias en mis ratos libres. Espero que te sea de utilidad.",
        "Sense Falles(1) i tancat a casa a causa de la quarantena del Coronavirus, he dissenyat i escrit aquest simulador d’epidèmies en les estones lliures. Espere que et siga d'utilitat."
      ];
      $scope.txtModal3 = ["Code is released under MIT license: ", "El código está liberado bajo licencia MIT: ", "El codi està alliberat sot la llicència MIT: "];
      $scope.txtModal4 = ["rafaaznar {at} gmail {dot} com (@rafaelaznar)", "rafaaznar {at} gmail {dot} com (@rafaelaznar)", "rafaaznar {at} gmail {dot} com (@rafaelaznar)"];
      $scope.txtModal5 = ["Sources at: ", "Fuentes en:", "Codi font a: "];
      $scope.txtClose = ["Close", "Cerrar", "Tancar"];
      $scope.txtShare = ["Share", "Compartir", "Compartir"];
      $scope.txtPleaseShare = [
        "If you liked this simulator, please, share it on social networks.",
        "Si te ha gustado este simulador, por favor, compártelo en redes sociales.",
        "Si t'ha agradat aquest simulador, per favor, comparteix-lo a les xarxes socials."
      ];
      $scope.txtHelp = ["Help", "Ayuda", "Ajuda"];
      $scope.txtPrebuild = ["Case studies with Prebuild Configurations", "Casos de estudio con configuraciones parametrizadas", "Casos d'estudi amb configuracions parametritzades"];
      //--
      $scope.txtIncidence = ["Incidence", "incidencia", "incidència"];
      $scope.txtIncidenceExp = [
        'Incidence is the number of infections with respect to the healthy living population during a given period of time. In this simulator the period is 1 day and those infected and incubating are not counted as healthy individuals.',
        'Incidencia es el número de contagios respecto de la población viva sana durante un período de tiempo determinado. En este simulador el período es de 1 día y los contagiados incubando no se cuentan como sanos.',
        "Incidència és el nombre de contagis respecte de la població viva sana durant un període de temps determinat. En aquest simulador el període és d'un dia i els contagiats incubant no es compten com a sans."
      ];
      $scope.txtPrevalence = ["Prevalence", "Prevalencia", "Prevalença"];
      $scope.txtPrevalenceExp = [
        'Prevalence is the proportion of individuals in the population that have the disease at a given time with respect to the total number of living individuals in the population. In the case of the simulator it is calculated for each day.',
        'La prevalencia es la proporción de individuos de la población que tiene la enfermedad en un momento determinado respecto del total de individuos vivos de la población. En el caso del simulador se calcula para cada dia.',
        "La prevalença és la proporció d'individus de la població que té la malaltia en un moment determinat respecte del total d'individus vius de la població. En el cas de l'simulador es calcula per a cada dia."
      ];
      $scope.txtR0 = ["R0", "R0", "R0"];
      $scope.txtR0Exp = [
        "The basic reproductive ratio or R0 is the average number of new infections generated by one infected person in a period of time. In this simulator the time period is 1 day. When R0 < 1 the epidemic ends up collapsing. If R0 > 1 the epidemic expands, and the larger R0 the more the epidemic grows. This simulator takes into account the incubating infected for the calculation of the factor.",
        "La ratio reproductiva básica o R0 es el número promedio de contagios nuevos que genera un contagiado en un período de tiempo. En este simulador el período de tiempo es 1 día. Cuando R0 < 1 la epidemia acaba colapsando. Si R0 > 1 la epidemia se expande, y cuanto más grande es R0 más crece la epidemia. En este simulador se tienen en cuenta los contagiados incubando para el cálculo del factor.",
        "La proporció bàsica de reproducció o R0 és el nombre mitjà de noves infeccions generades per una persona infectada en un període de temps. En aquest simulador és de 1 dia. Quan la R0 <1 l’epidèmia s’acaba ensorrant. Si R0> 1 l’epidèmia s’expandeix, i com més gran és R0, més creix. Aquest simulador té en compte els infectats en incubació per al càlcul del factor."];
      $scope.txtSaturation = ["Saturation", "Saturación", "Saturació"];
      $scope.txtDayNumber = ['At day number', 'En el día número', 'Al dia nombre '];
      $scope.txtSaturationExp = [
        'Saturation is the peak of sick individuals within the epidemic process.',
        'Saturación es el pico máximo de individuos enfermos dentro del proceso epidémico.',
        "Saturació és el màxim pic d'individus malalts dins de l'procés epidèmic."
      ];
      $scope.txtLethality = ['Lethality', 'Letalidad', 'Letalitat'];
      $scope.txtLethalityExp = [
        'Lethality is the percentage of deaths with respect to the total population at the end of the epidemic.',
        'Letalidad es el porcentaje de muertes respecto del total de la población al finalizar la epidemia.',
        "Letalitat és el percentatge de morts respecte de l'total de la població a l'finalitzar l'epidèmia."];
      $scope.txtDuration = ['Duration', 'Duración', 'Duració'];
      $scope.txtDurationExp = ['Epidemic duration in days.', 'Duración de la epidemia en días.', "Duració ded l'empidèmia en dies."];

      $scope.txtPrebuid1 = ['The importance of maintaining social distance', 'La importancia de mantener distancia social', 'La importància de mantenir distància social'];
      $scope.txtPrebuid1Exp = [
        'Social closure and social distance have a great influence on stopping the progress of epidermis. Button A starts a simulation in which measures of social distance are taken, such as reducing contacts to 25%. Button B initiates the same simulation keeping the contacts at 75%. In case A the epidemic lasts for 100 days and the saturation of patients goes up to 45%, while in case B the epidemic lasts for about 400 days and its saturation is 10%.',
        'El confinamiento y la distancia social influye mucho en frenar el avance de la epidedmia. En el botón A se inicia una simulación en la que se toman medidas de distancia social, como es reducir los contactos al 25%. El botón B inicia la misma simulación manteniendo los contactos al 75%. En el caso A la epidemia dura 100 días y la saturación de enfermos pasa del 45%, mientras que en el caso B la epidemia dura unos 400 días y su saturación es del 10%.',
        "El confinament i la distància social influeix molt en frenar l'avanç de la epidedmia. En el botó A s'inicia una simulació en la qual es prenen mesures de distància social, com és reduir els contactes a l'25%. El botó B inicia la mateixa simulació mantenint els contactes al 75%. En el cas A l'epidèmia dura 100 dies i la saturació de malalts passa del 45%, mentre que en el cas B l'epidèmia dura uns 400 dies i la seva saturació és del 10%."
      ];

      $scope.txtPrebuid2 = ['Influence of early decision making', 'Influencia de la toma temprana de decisones', 'Influència de la premura en la presa de decisions'];
      $scope.txtPrebuid2Exp = [
        'The saturation and duration of the epidemic are two very important related indicators that describe the impact of the epidemic. As it is exponential growth, the fact of taking social distance measures in the outbreak sooner or later has a great impact on these two indicators of the epidemic. Button A starts a simulation in which social distance measurements are taken early at 5 and 10 days. The epidemic lasts 387 days but does not exceed 10% saturation. In button B the same simulation but early social distance measurements are taken at 10 and 20 days. The epidemic lasts 305 days but marks 50% saturation. In button C the same simulation is started but early social distance measurements are taken at 10 and 20 days. The epidemic lasts 200 days but causes 30% saturation. Note that if the incubation period is long then it is difficult to take early social distance measurements.',
        'La saturación y la duración de la epidemia son dos indicadores relacionados muy importantes que describen el impacto de la misma. Al tratarse de crecimientos exponenciales, el hecho de tomar medidas de distancia social en el brote antes o después tiene gran impacto en estos dos indicadores de la epidemia. En el botón A se inicia una simulación en la que se toman medidas de distancia social tempranas a los 5 y 10 dias. La epidemia dura 387 dias pero no pasa del 10% de saturación. En el botón B la misma simulación pero se toman medidas de distancia social tempranas a los 10 y 20 dias. La epidemia dura 305 dias pero marca un 50% de saturación. En el botón C se inicia la misma simulación pero se toman medidas de distancia social tempranas a los 10 y 20 dias. La epidemia dura 200 dias pero provoca un 30% de saturación. Observa que si el periodo de incubación es largo entonces es dificil tomar medidas de distancia social tempranas.',
        "La saturació i la durada de l'epidèmia són dos indicadors relacionats molt importants que descriuen l'impacte de la mateixa. Al tractar-se d'creixements exponencials, el fet de prendre mesures de distància social en el brot abans o després té gran impacte en aquests dos indicadors de l'epidèmia. En el botó A s'inicia una simulació en la qual es prenen mesures de distància social primerenques als 5 i 10 dies. L'epidèmia dura 387 dies però no passa de l'10% de saturació. En el botó B la mateixa simulació però es prenen mesures de distància social primerenques als 10 i 20 dies. L'epidèmia dura 305 dies però marca un 50% de saturació. En el botó C s'inicia la mateixa simulació però es prenen mesures de distància social primerenques als 10 i 20 dies. L'epidèmia dura 200 dies però provoca un 30% de saturació. Observa que si el període d'incubació és llarg llavors és difícil prendre mesures de distància social primerenques."
      ];

      $scope.txtPrebuid3 = ['The danger of relaxing social distance', 'El peligro de relajarse en el confinamiento', "El perill de relaxarse en l'aillament"];
      $scope.txtPrebuid3Exp = [
        'This simulation begins an epidemic of 80% of social contact in which after 10 days there is a saturation of 20% of sick individuals, social distance is applied by reducing contacts to 20% for 20 days, and before the success of the measures they relax with contacts at 80% and in the next 10 days the previous saturation peak of patients is exceeded, reaching 30%. Finally let the epidemic end with contacts at 20%.',
        'En esta simulación se inicia una epidemia al 80% de contacto social en la cual a los 10 dias hay una saturación del 20% de individuos enfermos, se aplica distancia social bajando contactos al 20% durante 20 dias, y ante el exito de las medidas se relajan con contactos al 80% y en los 10 dias siguientes se rebasa el pico anterior de saturación de enfermos llegando al 30%. Finalmente deja acabar la epidemia con contactos al 20%.',
        "En aquesta simulació s’inicia una epidèmia al 80% de contacte social en la qual a deu dies hi ha una saturació del 20% d’individus malalts, s’aplica distància social baixant contactes al 20% durant 20 dies, i davant l’exit de les mesures es relaxen amb contactes al 80% i als 10 dies següents es recupera el punt anterior de saturació de malalts arribant al 30%. Finalment ja haureu acabat l’epidèmia amb contactes al 20%."
      ];

      $scope.txtFlatland = [
        'Flatland: sick appear red, those infected, pink, immune blue and the healthy ones, green.',
        'Planilandia: los enfermos aparecen rojo, los contagiados en rosa, los inmunes en azul y los sanos en verde.',
        "Planilàndia: els malalts apareixen vermell, els contagiats en rosa, els immunes en blau i els sans en verd."
      ];

      $scope.txtFlatlandRules = [
        'Flatland and game rules',
        'Planilandia y sus reglas',
        "Planilandia i les seues regles"
      ];

      $scope.txtFlatlandRulesExp = [
        "The simulator creates a flat world without borders in which the epidemic is externally represented in color codes. The sick appear red, the infected in pink, the immune in blue and the healthy in green. Flatland is made up of a large number of individuals. In order to run a simulation, the system tests the neighborhood of each individual in Flatland, which is made up of the surrounding individuals. The neighborhood parameter is configurable with two grades. Grade 2 tests 8 individuals around and grade 3 tests 24 individuals around. A parameter called contacts simulates the individual's social contacts with its neighborhood. The contacts parameter is used to simulate the application of social distance to its neighborhood. To control who become infected, you can also vary the parameter called contagiousness, which describes how many individuals have to be infected in the neighborhood for an individual to become infected.",
        'El simulador crea un mundo plano sin fronteras en el que la epidemia se representa externamente en códigos de color. Los enfermos aparecen en rojo, los infectados en rosa, los inmunes en azul y los sanos en verde. Planilandia está formado por una gran cantidad de individuos. Para ejecutar una simulación, el sistema chequea la vecindad de cada individuo en Planilandia, que se compone de los individuos circundantes. El parámetro de vecindad es configurable con dos grados. El grado 2 evalúa 8 individuos alrededor y grado 3 evalúa 24 individuos alrededor. Un parámetro llamado contactos simula los contactos sociales del individuo con su vecindario. El parámetro contactos se usa para simular la aplicación de la distancia social a su vecindario. Para controlar quién se infecta, también puede variar el parámetro llamado contagio, que describe cuántas personas deben infectarse en el vecindario para que una persona se infecte.',
        "El simulador crea un món pla sense fronteres en el qual l'epidèmia es representa externament en codis de color. Els malalts apareixen en roig, els infectats en rosa, els immunes en blau i els sans en verd. Planilàndia està format per una gran quantitat d'individus. Per a executar una simulació, el sistema comprova el veïnatge de cada individu en Planilàndia, que es compon dels individus circumdants. El paràmetre de veïnatge és configurable amb dos graus. El grau 2 avalua 8 individus al voltant i grau 3 avalua 24 individus al voltant. Un paràmetre anomenat contactes simula els contactes socials de l'individu amb el seu veïnat. El paràmetre contactes s'usa per a simular l'aplicació de la distància social al seu veïnat. Per a controlar qui s'infecta, també pot variar el paràmetre anomenat contagi, que descriu quantes persones han d'infectar-se en el veïnat perquè una persona s'infecte."
      ];

      $scope.txtEpDescription = [
        'Description of the epidemic',
        'Descripción de la epidemia',
        "Descripció de l'epidèmia"
      ];

      $scope.txtEpDescriptionExp = [
        "There are other parameters that configure the epidemic. The incubation period of the disease is a parameter that describes how long an individual infected can be without giving symptoms of the disease. Another descriptive parameter is the convalescence, or the period in which the individual is ill. During these periods of incubation and convalescence the individual can infect the neighborhood. On the other hand, the immunity parameter is the period after convalescence in which the individual cannot be re-infected. You can choose total or limited immunity for a period. Partial immunity can generate waves in epidemics or situations of endemic balance. Dispersion is a parameter to simulate travel. With this parameter, two selected individuals randomly swap their positions with the required frequency. Finally, the mortality parameter is applied to sick individuals on each day of infection, generating deaths from the effect of the infection.",
        'El período de incubación de la enfermedad es un parámetro que describe cuánto tiempo puede estar un individuo infectado sin presentar síntomas de la enfermedad. Otro parámetro descriptivo es la convalecencia, o el período en que el individuo está enfermo. Durante estos períodos de incubación y convalecencia, el individuo puede infectar el vecindario. Por otro lado, el parámetro de inmunidad es el período posterior a la convalecencia en el que el individuo no puede volver a infectarse. Se puede elegir inmunidad total o limitada por un período. La inmunidad parcial puede generar olas en epidemias o situaciones de equilibrio endémico. La dispersión es un parámetro para simular los viajes. Con este parámetro, dos individuos seleccionados intercambian aleatoriamente sus posiciones con la frecuencia requerida. Finalmente, el parámetro de mortalidad se aplica a individuos enfermos en cada día de infección, generando muertes por el efecto de la infección.',
        "El període d'incubació de la malaltia és un paràmetre que descriu quant de temps pot estar un individu infectat sense presentar símptomes de la malaltia. Un altre paràmetre descriptiu és la convalescència, o el període en què l'individu està malalt. Durant aquests períodes d'incubació i convalescència, l'individu pot infectar el veïnat. D'altra banda, el paràmetre d'immunitat és el període posterior a la convalescència en el qual l'individu no pot tornar a infectar-se. Es pot triar immunitat total o limitada per un període. La immunitat parcial pot generar ones d’epidèmies o situacions d'equilibri endèmic. La dispersió és un paràmetre per a simular els viatges. Amb aquest paràmetre, dos individus seleccionats intercanvien aleatòriament les seues posicions amb la freqüència requerida. Finalment, el paràmetre de mortalitat s'aplica a individus malalts en cada dia d'infecció, generant morts per l'efecte de la infecció."
      ];

      $scope.txtSpecificIndicators = [
        'Specific indicators',
        'Indicadores específicos',
        "Indicadors específics"
      ];

      $scope.txtSpecificIndicatorsExp = [
        'For every day of the spread, the system shows indicators on the number of healthy, incubating, immune and deceased individuals, as well as their percentages, represented numerically and graphically. Furthermore, the simulator shows the incidence, prevalence and growth factor R0. The incidence is the number of new infections with respect to the healthy alive population during a certain period of time. In this simulator, those individuals infected by incubation are not considered healthy. Prevalence is the proportion of individuals in the population who have the disease at any given time relative to the total number of alive individuals in the population. The basic reproductive ratio or R0 is the average number of new infections that an infected individual generates in a period of time. When R0 <1 the epidemic ends collapsing. If R0> 1, the epidemic expands, and the higher R0 is, the more the epidemic grows. In this simulator, those individuals infected but in incubation period are taken into account to calculate the factor.',
        'Para cada día de la propagación, el sistema muestra indicadores sobre el número de individuos sanos, en incubación, inmunes y fallecidos, así como sus porcentajes, representados numérica y gráficamente. Además, el simulador muestra la incidencia, prevalencia y factor de crecimiento R0. La incidencia es el número de nuevas infecciones con respecto a la población sana y viva durante un cierto período de tiempo. En este simulador, las personas infectadas en incubación no se consideran sanas. La prevalencia es la proporción de individuos en la población que tienen la enfermedad en un momento dado en relación al número total de individuos vivos en la población. La ratio reproductiva básica o R0 es el número promedio de nuevas infecciones que genera un individuo infectado en un período de tiempo. Cuando R0 <1 la epidemia termina colapsando. Si R0> 1, la epidemia se expande, y cuanto mayor es R0, más crece la epidemia. En este simulador, las personas infectadas en período de incubación se tienen en cuenta para calcular el factor.',
        "Per a cada dia de la propagació, el sistema mostra indicadors sobre el nombre d'individus sans, en incubació, immunes i morts, així com els seus percentatges, representats numèrica i gràficament. A més, el simulador mostra la incidència, prevalença i factor de creixement R0. La incidència és el nombre de noves infeccions respecte a la població sana i viva durant un cert període de temps. En aquest simulador, les persones infectades en incubació no es consideren sanes. La prevalença és la proporció d'individus en la població que tenen la malaltia en un moment donat en relació al nombre total d'individus vius en la població. La ràtio reproductiva bàsica o R0 és el nombre mitjà de noves infeccions que genera un individu infectat en un període de temps. Quan R0 <1 l'epidèmia acaba col·lapsant. Si R0> 1, l'epidèmia s'expandeix, i com més gran és R0, més creix l'epidèmia. En aquest simulador, les persones infectades en període d'incubació es tenen en compte per a calcular el factor."
      ];

      $scope.txtFinalIndicators = [
        'Final indicators',
        'Indicadores finales',
        "Indicadors finals"
      ];      
      $scope.txtFinalIndicatorsExp = [
        'One of the most important indicators is saturation. Saturation shows the peak of sick individuals and the time when it occurred. Saturation has strong interest because it lets you know if the healthcare system would be overflowed. Another very important indicator is the duration of the epidemic. Normally lowering the saturation lengthens the duration of the epidemic. Finally, lethality, which indicates the percentage of deaths at the end of the epidemic.',
        'Uno de los indicadores más importantes es la saturación. La saturación muestra el pico de individuos enfermos y el momento en que ocurrió. La saturación tiene un gran interés porque le permite saber si el sistema de salud se desbordaría. Otro indicador muy importante es la duración de la epidemia. Normalmente, reducir la saturación alarga la duración de la epidemia. Finalmente, la letalidad, que indica el porcentaje de muertes al final de la epidemia.',
        "Un dels indicadors més importants és la saturació. La saturació mostra el pic d'individus malalts i el moment en què va ocórrer. La saturació té un gran interés perquè li permet saber si el sistema de salut es desbordaria. Un altre indicador molt important és la duració de l'epidèmia. Normalment, reduir la saturació allarga la duració de l'epidèmia. Finalment, la letalitat, que indica el percentatge de morts al final de l'epidèmia."
      ];      

    }
  }
]);