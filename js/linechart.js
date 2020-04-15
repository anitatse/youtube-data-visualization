class Linechart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, categories, selectedTotal, dates, selectedCountry) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 450,
      containerHeight: 350,
      margin: _config.margin || { top: 30, bottom: 60, right: 10, left: 70 }
    }
    this.categories = categories;
    this.dates = dates;
    // init other stuff here
    this.selectedTotal = selectedTotal;
    this.selectedCountry = selectedCountry;
    this.colors = {};
    let colorArray = d3.schemeCategory10;
    for (let i=0; i < 10; i++) {
      this.colors[categories[i]] = colorArray[i];
    }
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
    vis.xScale = d3.scaleTime()
        .range([0, vis.width])
        .nice();

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0])
        .nice();

    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickFormat(d3.timeFormat('%b, %Y'));

    vis.yAxis = d3.axisLeft(vis.yScale)
      .tickFormat(d3.format(".3s"));

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

    // Append y-axis label
    vis.yAxisG.append('text')
        .attr('y', -50)
        .attr('x', -vis.height/2+20)
        .style('fill', '#000000')
        .style('font-size', '14px')
        .attr('transform', `rotate(-90)`)
        .text('Total');

    vis.xAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('y', 40)
        .attr('x', vis.width/2)
        .style('fill', '#000000')
        .style('font-size', '14px')
        .text('Date');
  }

  /**
   * This function contains all the code to prepare the data before we render it.
   * In some cases, you may not need this function but when you create more complex visualizations
   * you will probably want to organize your code in multiple functions.
   */
  wrangleDataAndUpdateScales() {
    let vis = this;

    vis.xValue = d => new Date(d.key);
    vis.yValue = d => d[vis.selectedTotal];

    let yMax = 0;
    for (let category of vis.data) {
      for (let date of category.values) {
        yMax = Math.max(yMax, date.value[vis.selectedTotal]);
      }
    }

    vis.lineGenerator = d3.line()
      .x(d => vis.xScale(vis.xValue(d)))
      .y(d => vis.yScale(vis.yValue(d.value)));

    vis.xScale.domain([new Date(2017, 10, 0), new Date(2018, 5, 0)]);
    vis.yScale.domain([0, yMax]);

    // Update y-axis group based on underlying y-scale
    vis.yAxisG.call(vis.yAxis);

    vis.updateVis();
  }

  /**
   * This function contains the D3 code for binding data to visual elements.
   * We call this function every time the data changes (i.e. user selects a different year).
   */
  updateVis() {
    let vis = this;
    for (let category=0; category < 10; category++) {
      let data = vis.data[category];
      let categoryElement = vis.chart.selectAll(`g#linechart-${vis.removeSpaceAmpersand(data.key)}-group`)
      .data([data]);

      if ($(`#${vis.removeSpaceAmpersand(data.key)}-checkbox`)[0].checked) {
        let line = categoryElement.selectAll('path').data([data]);
        let points = categoryElement.selectAll('circle').data(data.values);

        let newCategoryElement = categoryElement.enter()
          .append('g')
          .attr('id', `linechart-${vis.removeSpaceAmpersand(data.key)}-group`);

        let lineEnter = newCategoryElement
          .append('path')
          .attr('id', `linechart-${vis.removeSpaceAmpersand(data.key)}`)
          .attr('class', 'line')
          .attr('d', vis.lineGenerator(data.values))
          .attr('stroke', vis.colors[data.key]);

        line.merge(lineEnter)
          .transition()
          .attr('d', vis.lineGenerator(data.values));

          for (let i=0; i < vis.dates.length; i++) {
            // let currentCategory = vis.removeSpaceAmpersand(data.key);
              let currentCategory = data.key
            let pointEnter = newCategoryElement.append('circle')
              .data([data.values[i]])
              .attr('id', `linechart-${vis.removeSpaceAmpersand(currentCategory)}-${vis.dates[i]}`)
              .attr('cy', d => vis.yScale(vis.yValue(d.value)))
              .attr('cx', d => vis.xScale(vis.xValue(d)))
              .attr('fill', vis.colors[data.key])
              .attr('r', 4)
              .on("mouseover", d =>
                  window.dispatchEvent(new CustomEvent('category-mouse-over', {detail: {category: currentCategory, month: vis.dates[i]}})))
              .on("mouseout", d =>
                  window.dispatchEvent(new CustomEvent('category-mouse-out', {detail: {category: currentCategory, month: vis.dates[i]}}))
                )
              .append('title')
              .text(d => `${vis.selectedTotal.replace('_', ' ')}: ${d3.format(".2s")(vis.yValue(d.value)).replace('G', 'B')}`);

            let pointsMerge = points.merge(pointEnter)
              .transition()
              .attr('cy', d => vis.yScale(vis.yValue(d.value)))
              .attr('cx', d => vis.xScale(vis.xValue(d)))
              .attr('r', 4);

            pointsMerge
              .select('title')
              .text(d => `${vis.selectedTotal.replace('_', ' ')}: ${d3.format(".2s")(vis.yValue(d.value)).replace('G', 'B')}`);
          }
          categoryElement.exit().remove();
        } else {
          categoryElement.remove();
        }
      }

      vis.xAxisG.call(vis.xAxis);
      vis.yAxisG.call(vis.yAxis);
  }

  removeSpaceAmpersand(string) {
    // per html 5 specs, id can not have spaces or ampersand
    return string.replace(/[\s&]/g, "")
  }

  mouseOverDate(category, date) {
    let vis = this;
    $(`#linechart-${vis.removeSpaceAmpersand(category)}-${date}`)
      .attr("stroke", "#e62117")
      .attr("stroke-width", 3);
  }

  mouseOutDate(category, date) {
    let vis = this;
    $(`#linechart-${vis.removeSpaceAmpersand(category)}-${date}`)
      .removeAttr("stroke", "#e62117")
      .removeAttr("stroke-width", 3);
  }

  mouseOverMonthLine(country, date) {
    let vis = this;
    if (country == vis.selectedCountry) {
      let category;
      for (category of vis.categories) {
        $(`#linechart-${vis.removeSpaceAmpersand(category)}-${date}`)
          .attr("stroke", "#e62117")
          .attr("stroke-width", 3);
      }
    }
  }

  mouseOutMonthLine(country, date) {
    let vis = this;
    if (country == vis.selectedCountry) {
      let category;
      for (category of vis.categories) {
        $(`#linechart-${vis.removeSpaceAmpersand(category)}-${date}`)
          .removeAttr("stroke")
          .removeAttr("stroke-width");
      }
    }
  }
}
