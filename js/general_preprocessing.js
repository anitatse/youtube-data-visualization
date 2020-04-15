let barchart;
let linechart;
let innovativeGraph;
let selectedCountry = "CA";
let selectedTotal = "total_views";


// define some colour/texture constants here:
let top10Categories = ["Entertainment", "People & Blogs", "Music",
    "News & Politics", "Comedy", "Sports", "Film & Animation", "Howto & Style",
    "Gaming", "Science & Technology"]

const categoryTexture = [
    () => textures.lines().thicker(),
    () => textures.circles().size(5),
    () => textures.paths().d("squares").size(8),
    () => textures.paths().d("crosses").size(8),
    () => textures.paths().d("hexagons").size(8),
    () => textures.paths().d("caps").size(8),
    () => textures.paths().d("woven").size(8),
    () => textures.paths().d("waves").size(8),
    () => textures.paths().d("nylon").size(8),
    () => textures.lines().orientation("3/8", "7/8")
]
const categoryColourScheme = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3", "#92d682", "#912e26"]

const textureScale = d3.scaleOrdinal()
    .domain(top10Categories)
    .range(categoryTexture)

const colourScale = d3.scaleOrdinal()
    .domain(top10Categories)
    .range(categoryColourScheme)

const colourizeTexture = (generatedTexture, colour) => {
    let texture = generatedTexture.stroke(colour)

    if (texture.fill) {
        texture.fill(colour)
    }

    return texture
}

const colourTextureScale = d3.scaleOrdinal()
    .domain(colourScale.domain())
    .range(colourScale.range().map((colour) => {
        return d3.scaleOrdinal()
            .domain(textureScale.domain())
            .range(textureScale.range().map((texture) => {
                return colourizeTexture(texture(), colour)
            }))
    }))
// Load data

let promiseArr = [d3.csv('data/truncated/videos.csv'), d3.json('data/truncated/categories.json')]
let lineChartData = {}

Promise.all(promiseArr).then(files => {
    // format video data
    let videos = formatVideoData(files[0])

    let categories = files[1]

    let countries = groupVideosByCountries(videos)

    finishLoading();

    // BAR CHART
    let barChartData = processBarChartData(categories, countries);

    barchart = new Barchart(
      {
        parentElement: "#barchart",
        yDomain: [0, 596649]
      },
      barChartData,
      categories
    );
    // Update chart
    barchart.wrangleDataAndUpdateScales();


    // LINE CHART

    // linechart data now structured as:
    // - lineChartData.organizedData
    // - lineChartData.trendingCategories
    // - LinechartData.publishDate
    lineChartData = processLineChartData(categories, countries)

    linechart = new Linechart(
      {
        parentElement: "#linechart",
      },
      lineChartData.trendingCategories,
      selectedTotal,
      lineChartData.publishDate,
      selectedCountry
    );
    linechart.data = lineChartData.organizedData[selectedCountry];
    linechart.wrangleDataAndUpdateScales();

    let formattedCountries = processInnovative(categories, countries)

    innovativeGraph = new InnovativeGraph({
        parentElement: "#innovative",
        containerWidth: 960, containerHeight: 600,
        data: {countries: formattedCountries, categories: categories}
    })

    // Add shared event listeners
    window.addEventListener('country-click', event => {
        // event.detail.country should hold country identifier e.g. 'CA'


        // does innovative need to do anything in this case?
        $('#linechart-selected-country')
            .val(event.detail.country)
            .trigger('change')
    })

    window.addEventListener('month-click', event => {
        // event.detail should hold an object e.g. {month: January, country: 'CA'}
        // clicking on a month on a country that is not currently displayed on the line series chart
        // should switch line series chart to that country
        $('#linechart-selected-country')
            .val(event.detail.country)
            .trigger('change')
        linechart.mouseOutMonthLine(event.detail.country, event.detail.month);
    })

    window.addEventListener('month-mouse-over', event => {
        innovativeGraph.mouseOverMonth(event.detail.country, event.detail.month)
        linechart.mouseOverMonthLine(event.detail.country, event.detail.month);
    })

    window.addEventListener('month-mouse-out', event => {
        innovativeGraph.mouseOutMonth(event.detail.country, event.detail.month)
        linechart.mouseOutMonthLine(event.detail.country, event.detail.month);
    })

    window.addEventListener('category-mouse-over', event => {
        innovativeGraph.mouseOverBigBubble(event.detail.category, event.detail.month)
        linechart.mouseOverDate(event.detail.category, event.detail.month);
    })

    window.addEventListener('category-mouse-out', event => {
        innovativeGraph.mouseOutBigBubble(event.detail.category, event.detail.month)
        linechart.mouseOutDate(event.detail.category, event.detail.month);
    })

    // window.addEventListener('date-mouse-over', event => {
    //     linechart.mouseOverDate(event.detail.category, event.detail.month);
    //     innovativeGraph.mouseOverBigBubble(event.detail.category, event.detail.month)
    //
    // })
    //
    // window.addEventListener('date-mouse-out', event => {
    //     linechart.mouseOutDate(event.detail.category, event.detail.month);
    //     innovativeGraph.mouseOutBigBubble(event.detail.category, event.detail.month)
    //
    // })

    for (key in categories) {
        $(`#${removeSpaceAmpersand(categories[key])}-checkbox`).on('input', function() {
            linechart.wrangleDataAndUpdateScales();
        })
    }
})

const removeSpaceAmpersand = (string) => {
    // per html 5 specs, id can not have spaces or ampersand
    return string.replace(/[\s&]/g, "")
  }


// turn the necessary fields to numbers
const formatVideoData = (file) => {
    file.forEach(d => {
        d['views'] = +d['views']
        d['likes'] = +d['likes']
        d['dislikes'] = +d['dislikes']
        d['comments'] = +d['comment_count'];
        d['publish_time'] = d['publish_time'];
        d['category_id'] = d['category_id'];
    })

    return file
}

const groupVideosByCountries = (videos) => {
    let countries = {}
    let videosByCountry = d3.nest()
        .key((d) => d.country)
        .entries(videos)

    videosByCountry.forEach((video) => {
        countries[video.key] = video.values
    })

    return countries
}



const finishLoading = () => {
   document.getElementById("loader").style.display = "none";
}

// WIDGETS

// barchart year slider
$('#barchart-date-slider').on('input', function() {
    index = $(this).val();
    barchart.time = getDate(index);
    barchart.wrangleDataAndUpdateScales();
    // Update label next to the slider
    $('#date-selection').html(barchart.time);
});

// barchart selected total
$('#selected-total').on('change', function() {
    barchart.selectedTotal = $(this).val();
    barchart.wrangleDataAndUpdateScales();

    selectedTotal = $(this).val();
    linechart.selectedTotal = selectedTotal;
    linechart.wrangleDataAndUpdateScales();

    innovativeGraph.updateSelectedIndicator(selectedTotal)
});

//linechart country droptown
$('#linechart-selected-country').on('change', function() {
    selectedCountry = $(this).val();
    changeLineChartCountry(selectedCountry)
    innovativeGraph.switchExpandedCountry(selectedCountry)

});

const changeLineChartCountry = (selectedCountry) => {
    linechart.selectedCountry = selectedCountry
    linechart.data = lineChartData.organizedData[selectedCountry]
    linechart.wrangleDataAndUpdateScales()
}

