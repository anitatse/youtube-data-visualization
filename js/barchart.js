class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, data, categories) {
    this.config = {
      parentElement: _config.parentElement,
      yDomain: _config.yDomain,
      containerWidth: _config.containerWidth || 780,
      containerHeight: _config.containerHeight || 450,
      margin: _config.margin || { top: 10, bottom: 60, right: 10, left: 60 }
    }
    this.data = data;
    this.categories = categories;
    // 0 = 2017-06 then increment for each month until 2018-06
    this.time = '2017-11';
    // either total_views, total_likes, or total_comments
    this.selectedTotal = 'total_views';
    this.initVis();
  }

  /**
   * This function contains all the code that gets excecuted only once at the beginning.
   * We initialize scales/axes and append static elements, such as axis titles.
   * If we want to implement a responsive visualization, we would move the size
   * specifications to a separate function.
   */
  initVis() {
    // We recommend avoiding simply using the this keyword within complex class code
    // involving SVG elements because the scope of this will change and it will cause
    // undesirable side-effects. Instead, we recommend creating another variable at
    // the start of each function to store the this-accessor
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    // You need to adjust the margin config depending on the types of axis tick labels
    // and the position of axis titles (margin convetion: https://bl.ocks.org/mbostock/3019563)
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales and axes
    vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .padding(0.2);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0])
        .nice();

    vis.xAxis = d3.axisBottom(vis.xScale);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .tickFormat(d => d3.format(".2s")(d).replace('G', 'B'));

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g').attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group and
    vis.yAxisG = vis.chart.append('g');

    vis.yAxisLabel = vis.yAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('y', -50)
        .attr('x', -vis.height/2+20)
        .style('fill', '#000000')
        .style('font-size', '14px')
        .attr('transform', `rotate(-90)`)
        .text('Total');

    // Append x-axis label
    vis.xAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('y', 40)
        .attr('x', vis.width/2)
        .style('fill', '#000000')
        .style('font-size', '14px')
        .text('Categories');


      vis.playStatus = "paused"
      vis.timer = 0
      vis.startTime = 0
      vis.remaining = 0
      vis.interval = 500

      $('#play-button').on("click", (event) => {
          if (vis.playStatus === "paused") {
              // resume/start playing
              vis.playStatus = "playing"
              setTimeout(() => {
                  vis.startTime = new Date()
                  if ($('#barchart-date-slider').val() == 7) {
                    $('#barchart-date-slider').val(String(0)).trigger("input")
                  }
                  vis.timer = vis.playAnimation(vis.interval)
              }, vis.remaining)

              $('#play-button').text('Pause')

          }
          else if (vis.playStatus === "playing") {
              vis.playStatus = "paused"
              // pausing the player
              vis.remaining = vis.interval - (new Date() - vis.startTime)
              window.clearInterval(vis.timer)
              $('#play-button').text('Play')
          }
      })

  }


  /**
   * This function contains all the code to prepare the data before we render it.
   * In some cases, you may not need this function but when you create more complex visualizations
   * you will probably want to organize your code in multiple functions.
   */
  wrangleDataAndUpdateScales() {
    let vis = this;

    // Specificy x-accessor function
    vis.xValue = d => d.key;

    // Use dynamic variable name instead of hard-coded year variables
    vis.yValue = d => d[this.time][this.selectedTotal];

    // Sort countries in descending order
    // Important: Don't override your original dataset (vis.data) because the data might change.
    // In our example, the 5 most populated countries change over time
    vis.filteredData = vis.data;

    // Set the x-scale input domain (country names)
    vis.xScale.domain(vis.filteredData.map(vis.xValue));

    // Find global max value for the scale
    let yMax = 0;
    for (i=0; i<10; i++) {
        yMax = Math.max(yMax, vis.filteredData[i][this.time][this.selectedTotal]);
    }

    vis.yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([vis.height, 0])
        .nice();


    // Update y-axis group based on underlying y-scale
    vis.yAxis = d3.axisLeft(vis.yScale)
        .tickFormat(d => d3.format(".2s")(d).replace('G', 'B'));

      vis.yAxisG.call(vis.yAxis);


      vis.updateVis();
  }

  /**
   * This function contains the D3 code for binding data to visual elements.
   * We call this function every time the data changes (i.e. user selects a different year).
   */
  updateVis() {
    let vis = this;

    // Bind data
    let bar = vis.chart.selectAll('rect')
        .data(vis.filteredData);

    // Append SVG rectangles for new data items
    let barEnter = bar.enter().append('rect');

    // Merge will update the attributes x, y, width, and height on both the "enter" and "update"
    // selection (i.e. define attributes for new data items and update attributes for existing items).
    // We use the chained transition() function to create smooth transitions whenever attributes change.
    bar.merge(barEnter)
      .transition()
        .attr('x', d => vis.xScale(vis.xValue(d)))
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('width', vis.xScale.bandwidth())
        .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
        .style('fill', "#8da0cb");
        // .style('fill', d => colourTextureScale(d.key)(d.key).url())

    // Remove any excess elements that are not bound to data items anymore.
    bar.exit().remove();

    // Update the x-axis because the underlying x-scale (domain with country names) might change
    vis.xAxisG.call(vis.xAxis);

  }

  playAnimation(interval) {
        return setInterval(() => {
            $('#barchart-date-slider').val(String(Number($('#barchart-date-slider').val()) + 1)).trigger("input")
        }, interval)
  }
}
