class InnovativeGraph {

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 750,
            containerHeight: 600,
        }
        this.config.margin = _config.margin || {top: 25, bottom: 25, right: 25, left: 25}

        this.countries = _config.data.countries
        this.categories = _config.data.categories

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        colourTextureScale.range().forEach((scale) => {
            scale.range().forEach(vis.svg.call, vis.svg);
        });

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        vis.monthCirclesChart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
        vis.circleLabelChart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)

        vis.selectedIndicator = 'views'
        vis.selectedCountry = ""
        vis.selectedMonth = ""
        vis.circleRadiusRange = [50, 150]
        vis.nodePadding = 2.5
        vis.state = "contracted"

        $('#change-view-btn')
            .on('click', () => {
                vis.state = "contracted"
                $(event.currentTarget)
                    .css("display", "none")
                vis.update()
            })

        vis.colourScale = d3.scaleOrdinal()
            .domain(Object.keys(vis.countries))
            .range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3", "#92d682", "#912e26"])

        vis.simulation = d3.forceSimulation()
            .force("forceX", d3.forceX().strength(.1).x(vis.width * .5))
            .force("forceY", d3.forceY().strength(.1).y(vis.height * .5))
            .force("center", d3.forceCenter().x(vis.width * .5).y(vis.height * .5))
            .force("charge", d3.forceManyBody().strength(-15))

        let selectedIndicatorRange = Object.values(vis.countries).map(d => d[vis.selectedIndicator])
        vis.rScale = d3.scaleLinear()
            .domain(d3.extent(selectedIndicatorRange))
            .range(vis.circleRadiusRange)

        // sort the nodes so that the bigger ones are at the back
        // vis.countries = Object.values(vis.countries).sort((a,b) => { return b[vis.selectedIndicator] - a[vis.selectedIndicator]})
        vis.countryBubbles = vis.createBigBubbles(vis.countries)

        vis.months = vis.createMonthsBubbles(Object.values(vis.countryBubbles))

        vis.rAccessor = d => d['r']
        vis.xAccessor = d => d['x']
        vis.yAccessor = d => d['y']

        vis.render()
    }

    update() {
        let vis = this;

        if (vis.state === "expanded") {
            // vis.countryBubbles = []
            vis.months = []

            vis.circleRadiusRange = [20, 120]

            let videoCategoryArr = vis.expandCategories(vis.countries)

            // re-adjust the necessary scales to display category balls
            vis.simulation = d3.forceSimulation()
                .force("forceX", d3.forceX().strength(.1).x(vis.width * .5))
                .force("forceY", d3.forceY().strength(.1).y(vis.height * .5))
                .force("center", d3.forceCenter().x(vis.width * .5).y(vis.height * .5))
                .force("charge", d3.forceManyBody().strength(-15))

            // consistent with the global category colour scheme
            vis.colourScale = colourTextureScale

            vis.rScale = d3.scaleLinear()
                .domain(d3.extent(videoCategoryArr.map(d => d[vis.selectedIndicator])))
                .range(vis.circleRadiusRange)

            // re-calculate the radius of the circle to represent each category
            // givne the selected indicator and the new scale
            for (let videoCategory of videoCategoryArr) {
                videoCategory['r'] = vis.rScale(videoCategory[vis.selectedIndicator])
            }

            // update the diagram and state
            vis.countryBubbles = videoCategoryArr
            vis.state = "expanded"

        } else {
            // vis.countryBubbles = []
            // vis.months = []

            vis.circleRadiusRange = [50, 150]

            vis.simulation = d3.forceSimulation()
                .force("forceX", d3.forceX().strength(.1).x(vis.width * .5))
                .force("forceY", d3.forceY().strength(.1).y(vis.height * .5))
                .force("center", d3.forceCenter().x(vis.width * .5).y(vis.height * .5))
                .force("charge", d3.forceManyBody().strength(-15))

            vis.colourScale = d3.scaleOrdinal()
                .domain(Object.keys(vis.countries))
                .range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3", "#92d682", "#912e26"])

            let selectedIndicatorRange = Object.values(vis.countries).map(d => d[vis.selectedIndicator])
            vis.rScale = d3.scaleLinear()
                .domain(d3.extent(selectedIndicatorRange))
                .range(vis.circleRadiusRange)

            vis.countryBubbles = vis.createBigBubbles(vis.countries)
            vis.months = vis.createMonthsBubbles(Object.values(vis.countryBubbles))

            vis.state = "contracted"

        }

        vis.render()

    }

    render() {
        let vis = this;
        //
        let circles = vis.chart
            .selectAll(".country-circle")
            .data(Object.values(vis.countryBubbles))

        vis.circlesEnter = circles.enter()
            .append("circle")
            .attr("id", d => vis.replaceAmpersand(vis.removeSpace(d.name)))
            .attr("class", "country-circle")


        let circlesTooltip = vis.circlesEnter
            .append("title")
            .text(d => `${vis.selectedIndicator}: ${d3.format(".2s")(d[vis.selectedIndicator]).replace('G', 'B')}`)

        vis.circlesMerge = vis.circlesEnter
            .merge(circles)
            .attr("id", d => vis.replaceAmpersand(vis.removeSpace(d.name)))
            .attr("r", d => vis.rAccessor(d))
            .attr("fill", d => {
                if (vis.state === "expanded") {
                    return colourTextureScale(d.name)(d.name).url()
                } else {
                    return vis.colourScale(d.name)
                }
            })
            .attr("cx", d => vis.xAccessor(d))
            .attr("cy", d => vis.yAccessor(d))
            .on("mouseover", (d) => {
                if (vis.state === "expanded") {
                    window.dispatchEvent(new CustomEvent('category-mouse-over', {
                        detail: {
                            month: vis.selectedMonth,
                            category: d.name
                        }
                    }))
                } else {
                    vis.mouseOverBigBubble(d.name)
                }
            })
            .on("mouseout", (d) => {
                // vis.mouseOutBigBubble(d.name)
                if (vis.state === "expanded") {
                    window.dispatchEvent(new CustomEvent('category-mouse-out', {
                        detail: {
                            month: vis.selectedMonth,
                            category: d.name
                        }
                    }))
                } else {
                    vis.mouseOutBigBubble(d.name)
                }
            })
            .on("click", (d) => {
                if (vis.state === "contracted") {
                    vis.selectedCountry = d.name
                    vis.selectCountry(vis.selectedCountry)
                    window.dispatchEvent(new CustomEvent('country-click', {detail: {country: vis.selectedCountry}}))
                }
            })

        vis.circlesMerge
            .select("title")
            .text(d => `${vis.selectedIndicator}: ${d3.format(".2s")(d[vis.selectedIndicator]).replace('G', 'B')}`)


        let monthCircles = vis.monthCirclesChart
            .selectAll(".months-circle")
            .data(vis.months)

        vis.monthCirclesEnter = monthCircles
            .enter()
            .append("circle")
            .attr("id", d => d.country + "-" + d.month)
            .attr("class", "months-circle")
            .attr("r", d => 7)
            .attr("fill", d => "steelblue")

        let monthCirclesTooltip = vis.monthCirclesEnter
            .append("title")
            .text(d => `${d.month}`)


        vis.monthCirclesMerge =
            vis.monthCirclesEnter
                .merge(monthCircles)
                .attr("cx", d => vis.countryBubbles[d.country].x + d.xOffset)
                .attr("cy", d => vis.countryBubbles[d.country].y + d.yOffset)
                .on("mouseover", d => {
                    window.dispatchEvent(new CustomEvent('month-mouse-over', {
                        detail: {
                            month: d.month,
                            country: d.country
                        }
                    }))
                })
                .on("mouseout", d => {
                    window.dispatchEvent(new CustomEvent('month-mouse-out', {
                        detail: {
                            month: d.month,
                            country: d.country
                        }
                    }))
                })
                .on("click", d => {
                    vis.selectedCountry = d.country
                    vis.selectedMonth = d.month
                    window.dispatchEvent(new CustomEvent('month-click', {detail: {month: d.month, country: d.country}}))
                    vis.state = "expanded"
                    $('#change-view-btn')
                        .css("display", "block")
                    vis.update()
                })


        let circlesLabel =
            vis.circleLabelChart
                .selectAll(".text-label")
                .data(vis.state === "contracted" ? Object.values(vis.countryBubbles) : [])

        vis.circlesLabelEnter =
            circlesLabel
                .enter()
                .append("text")
                .attr("class", "text-label")
                .merge(circlesLabel)
                .attr("x", d => vis.xAccessor(d))
                .attr("y", d => vis.yAccessor(d) - 20)
                .attr('text-anchor', 'middle')
                .text(d => vis.state === "contracted" ? vis.convertToFullName(d.name) : "")

        let circlesLegend =
            vis.circleLabelChart
                .selectAll(".circle-legend")
                .data(vis.state === "expanded" ? Object.values(vis.countryBubbles) : [])

        vis.circlesLegentEnter =
            circlesLegend
                .enter()
                .append("circle")
                .attr("class", "circle-legend")
                .merge(circlesLegend)
                .attr("r", 10)
                .attr("cx", 10)
                .attr("cy", (d, i) => 10 + i * 25)
                .attr("fill", d => {
                    return colourTextureScale(d.name)(d.name).url()
                })

        let circlesLegendLabel =
            vis.circleLabelChart
                .selectAll(".text-legend")
                .data(vis.state === "expanded" ? Object.values(vis.countryBubbles) : [])

        let circlesLegendLabelEnter =
            circlesLegendLabel
                .enter()
                .append("text")
                .attr("class", "text-legend")
                .merge(circlesLegendLabel)
                .attr("x", 30)
                .attr("y", (d, i) => 13 + i * 25)
                .attr('text-anchor', 'alignment-baseline')
                .text(d => d.name)

        circles.exit().remove()
        monthCircles.exit().remove()
        monthCirclesTooltip.exit().remove()
        circlesLabel.exit().remove()
        circlesTooltip.exit().remove()
        circlesLegendLabel.exit().remove()
        circlesLegend.exit().remove()


        vis.simulation
            .nodes(Object.values(vis.countryBubbles))
            .force("collide", d3.forceCollide().strength(.2).radius(d => {
                return d.r + vis.nodePadding
            }).iterations(2))
            .on("tick", d => {
                vis.circlesMerge
                    .attr("cx", d => {
                        if (d.x + d.r >= vis.width) {
                            return d.x = vis.width - d.r
                        } else if (d.x - d.r <= 0) {
                            return d.x = 0 + d.r
                        } else {
                            return d.x
                        }
                    })
                    .attr("cy", d => {
                        if (d.y + d.r >= vis.height) {
                            return d.y = vis.height - d.r
                        } else if (d.y - d.r <= 0) {
                            return d.y = 0 + d.r
                        } else {
                            return d.y
                        }
                    })

                vis.circlesLabelEnter
                    .attr("x", d => d.x)
                    .attr("y", d => d.y - 20)

                vis.monthCirclesMerge
                    .attr("cx", d => vis.countryBubbles[d.country].x + d.xOffset)
                    .attr("cy", d => vis.countryBubbles[d.country].y + d.yOffset)
            })
    }

    removeSpace(string) {
        // per html 5 specs, id can not have spaces
        return string.replace(/\s+/g, "")
    }

    replaceAmpersand(string) {
        // ampersand is giving jquery a hard time, instead of escaping it i am just going to replace it
        return string.replace(/&+/g, "-")
    }

    selectCountry(country) {
        let vis = this
        $(`#${vis.replaceAmpersand(vis.removeSpace(country))}`)
            .attr("stroke", "#D99999")
            .attr("stroke-width", 3)
    }

    mouseOverBigBubble(name, month) {
        let vis = this

        let selector = $(`#${vis.replaceAmpersand(vis.removeSpace(name))}`)
        if (vis.state === "expanded" && vis.selectedMonth === month) {
            selector
                .attr("stroke", "#e62117")
                .attr("stroke-width", 3)
        }

        if (vis.state === "contracted") {
            // we want a pointer if we are in country ball mode
            selector
                .attr("stroke", "#e62117")
                .attr("stroke-width", 3)
                .css("cursor", "pointer")
        }

    }

    mouseOutBigBubble(name, month) {
        let vis = this
        let selector = $(`#${vis.replaceAmpersand(vis.removeSpace(name))}`)
        if (vis.state === "expanded" && vis.selectedMonth === month) {
            selector
                .removeAttr("stroke", "#e62117")
                .removeAttr("stroke-width", 3)
        }

        if (vis.state === "contracted") {
            selector
                .removeAttr("stroke", "#e62117")
                .removeAttr("stroke-width", 3)
                .css("cursor", "default")
        }
    }

    mouseOverMonth(country, month) {
        $(`#${d.country}`)
            .attr("stroke", "#e62117")
            .attr("stroke-width", 3)
        $(`#${country}-${month}`)
            .attr("stroke", "#D9824D")
            .attr("stroke-width", 3)
    }

    mouseOutMonth(country, month) {
        $(`#${d.country}`)
            .removeAttr("stroke")
            .removeAttr("stroke-width")
        $(`#${country}-${month}`)
            .removeAttr("stroke")
            .removeAttr("stroke-width")
    }

    generateRandomNumber(limit) {
        return Math.random() * limit
    }

    expandCategories(countries) {
        let vis = this
        let map = {}

        let filteredVideos = countries[vis.selectedCountry].videos.filter((video) => {
            return video.publish_time === vis.selectedMonth
        })

        // given the selected country, we will group all its videos into all possible categories
        for (let i = 0; i < filteredVideos.length; i++) {
            let video = filteredVideos[i]
            if (map[video.category_id] === undefined) {
                map[video.category_id] = {}
                map[video.category_id]['name'] = vis.categories[video.category_id]
                map[video.category_id][vis.selectedIndicator] = video[vis.selectedIndicator]
                map[video.category_id]['x'] = vis.generateRandomNumber(vis.width - vis.circleRadiusRange[1])
                map[video.category_id]['y'] = vis.generateRandomNumber(vis.height - vis.circleRadiusRange[1])
            } else {
                map[video.category_id][vis.selectedIndicator] = map[video.category_id][vis.selectedIndicator] + video[vis.selectedIndicator]
            }
        }

        return Object.values(map)
    }

    createMonthsBubbles(countryBubblesValues) {
        let vis = this

        let dateArray = ["2017-11", "2017-12", "2018-01", "2018-02", "2018-03", "2018-04", "2018-05", "2018-06"];

        let months = []
        for (let i = 0; i < countryBubblesValues.length; i++) {
            let counter = 0
            for (let j = 0; j < dateArray.length; j++) {
                // if not the first month, we try to calculate offset
                // every four month starts a new row
                if (j % 4 === 0) {
                    counter = counter + 1
                }

                let xOffset = (j % 4) * 20 - 30
                let yOffset = counter * 20 - 20

                months.push({
                    country: countryBubblesValues[i].name,
                    month: dateArray[j],
                    xOffset: xOffset,
                    yOffset: yOffset
                })
            }
        }

        return months
    }

    createBigBubbles(countries) {
        let vis = this
        let bjgBubbles = {}
        for (let country of Object.entries(countries)) {
            if (bjgBubbles[country[0]] === undefined) {
                bjgBubbles[country[0]] = {
                    x: vis.generateRandomNumber(vis.width - vis.circleRadiusRange[1]),
                    y: vis.generateRandomNumber(vis.height - vis.circleRadiusRange[1]),
                    r: vis.rScale(country[1][vis.selectedIndicator]),
                    name: country[0],
                    [vis.selectedIndicator]: country[1][vis.selectedIndicator]
                }
            }
        }

        return bjgBubbles

    }

    convertToFullName(name) {
        let fullName = ""
        switch (name) {
            case "CA":
                fullName = "Canada"
                break;
            case "DE":
                fullName = "Germany"
                break;
            case "FR":
                fullName = "France"
                break;
            case "GB":
                fullName = "Great Britain"
                break;
            case "IN":
                fullName = "India"
                break;
            case "JP":
                fullName = "Japan"
                break;
            case "KR":
                fullName = "Korea"
                break;
            case "MX":
                fullName = "Mexico"
                break;
            case "RU":
                fullName = "Russia"
                break;
            case "US":
                fullName = "United States"
                break;
            default:
                fullName = "undefined"

        }

        return fullName
    }

    updateSelectedIndicator(indicator) {
        let vis = this
        let formattedIndicator = ""
        if (indicator === "total_likes") {
            formattedIndicator = "likes"
        } else if (indicator === "total_views") {
            formattedIndicator = "views"
        } else {
            formattedIndicator = "comment_count"
        }
        vis.selectedIndicator = formattedIndicator
        vis.update()
    }

    switchExpandedCountry(selectedCountry) {
        let vis = this

        if (selectedCountry !== vis.selectedCountry) {
            vis.selectedCountry = selectedCountry

            if (vis.state === "expanded") {
                vis.state = "contracted"
                $('#change-view-btn').css('display', 'none')
                vis.update()
            }
        }
    }

}
