"use strict";

jQuery(document).ready(function() {

  var data = [0];
  var button_state = '';
  /* Graph Related Variables */
  var color = d3.scale.category10();
  color.domain(['Sensor']);
  var series = color.domain().map(function(name){
    return {
      name : 'Sensor',
      values : data
    };
  });
  var MAX_DATA = 60;
  var x = null;
  var y = null;
  var line = null;
  var graph = null;
  var xAxis = null;
  var yAxis = null;
  var ld = null;
  var path = null;
  var recent_ri = 0;

  function createGraph(id) {
    color.domain('Sensor');
    var width = document.getElementById("graph").clientWidth;
    var height = document.getElementById("graph").clientHeight;
    var margin = {top: 10, right: 50, bottom: 20, left: 10};

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    // create the graph object
    graph = d3.select(id).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x = d3.scale.linear()
      .domain([0, MAX_DATA])
      .range([width, 0]);
    y = d3.scale.linear()
      .domain([
        d3.min(series, function(l) { return d3.min(l.values, function(v) { return v*0.75; }); }),
        d3.max(series, function(l) { return d3.max(l.values, function(v) { return v*1.25; }); })
      ])
      .range([height, 0]);
    //add the axes labels
    graph.append("text")
        .attr("class", "axis-label")
        .style("text-anchor", "end")
        .attr("x", 20)
        .attr("y", height)
        .text('Date');



    line = d3.svg.line()
      .x(function(d, i) { return x(i); })
      .y(function(d) { return y(d); });

    xAxis = graph.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.svg.axis().scale(x).orient("bottom"));

    yAxis = graph.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ",0)")
      .call(d3.svg.axis().scale(y).orient("right"));

    ld = graph.selectAll(".series")
      .data(series)
      .enter().append("g")
      .attr("class", "series");

    // display the line by appending an svg:path element with the data line we created above
    path = ld.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });
  }

  function updateGraph() {
    // static update without animation
    y.domain([
      d3.min(series, function(l) { return d3.min(l.values, function(v) { return v*0.75; }); }),
      d3.max(series, function(l) { return d3.max(l.values, function(v) { return v*1.25; }); })
    ]);
    yAxis.call(d3.svg.axis().scale(y).orient("right"));

    path
      .attr("d", function(d) { return line(d.values); })
  }

  function getData(container, cb) {
    var url = '/data/' + container;
    $.get(url, function(data, status){
      if(status == 'success'){
        var value = data.con;
        var ri = parseInt(data.ri.slice(2, data.ri.length));
        if(ri > recent_ri){
          recent_ri = ri;
        }
        cb(null, value);
      }
      else {
        console.log('[Error] /data API return status :'+status);
        cb({error: status}, null);
      }
    });
  }

  function getFakeData() {
    return Math.random()*1000;
  }
  function displayData() {
    $('#light_value')[0].innerText = data[0];
    $('#button_value')[0].innerText = button_state;
    $('#timestamp')[0].innerText = new Date().toLocaleString();
  }
  function insertNewData(value){
    if(data.length == MAX_DATA){
      data.pop();
    }
    data.splice(0,0,value);  
  }

  function initToastOptions(){
    toastr.options = {
      "closeButton": true,
      "debug": false,
      "newestOnTop": false,
      "progressBar": true,
      "positionClass": "toast-bottom-full-width",
      "preventDuplicates": false,
      "onclick": null,
      "showDuration": "3000",
      "hideDuration": "10000",
      "timeOut": "2000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    }
  }

  initToastOptions();
  createGraph('#graph'); 
  setInterval(function(){
    getData('button', function(err,data){
      button_state = data;
    });
    getData('light', function(err,data){
      insertNewData(data);
    });
    displayData();
    updateGraph();
  }, 1000);
  $('#ac_on_btn').on('click', function(event) {
    var cmd = {'target' : 'led_1', 'cmd' : 'on'};
    $.post('/control', cmd, function(data,status){
      toastr.success('LED On');
      console.log(data);
    });
  });
  $('#ac_off_btn').on('click', function(event) {
    var cmd = {'target' : 'led_1', 'cmd' : 'off'};
    $.post('/control', cmd, function(data,status){
      toastr.info('LED Off');
      console.log(data);
    });
  });
});
