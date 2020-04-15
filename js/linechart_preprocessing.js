
// Load data
const processLineChartData = (categories, countries) => {
    let organizedData = {};
    let dateArray = ["2017-11","2017-12","2018-01","2018-02","2018-03", "2018-04","2018-05","2018-06",];
    let categoryArray = ["24","10","22","23","17","1","26","20","25","28"];
    let headers = ['views', 'likes', 'comments'];

    let publishDate = [];
    let trendingCategories = [];

    for (let [countryKey, countryVal] of Object.entries(countries)) {
        let videoData = [];
        // populate the data
        for (let i = 0; i < countryVal.length; i++) {
            let video = {};
            let category = categories[countryVal[i]["category_id"]]
            let dateString = countryVal[i].publish_time.substr(0, 7);

            if (categoryArray.includes(countryVal[i]["category_id"]) && dateArray.includes(dateString)) {
                if (!publishDate.includes(dateString)) {
                  publishDate.push(dateString);
                }
                if (!trendingCategories.includes(category)) {
                  trendingCategories.push(category);
                }
                video['category'] = category;
                video['date'] = new Date(dateString);
                for (header of headers) {
                  video['total_'+header] = countryVal[i][header];
                }
                videoData.push(video);
            }
        }
        // roll-up views, likes and comments under the same date for a given category
        let aggregateVideos = d3.nest()
          .key(d => d.category)
          .key(d => d.date)
          .rollup(function(v) { return {
            total_views: d3.sum(v, function(d) { return d.total_views; }),
            total_likes: d3.sum(v, function(d) { return d.total_likes; }),
            total_comments: d3.sum(v, function(d) { return d.total_comments; }),
          }; })
          .entries(videoData);

          // add any missing dates with 0 entries
          for (v of aggregateVideos) {
            let dates = [];
            for (d of v.values) {
              dates.push(d['key'])
            }
            for (date of dateArray) {
              let parsedDate = new Date(date).toString();
              if (!dates.includes(parsedDate)) {
                v.values.push({
                  key: parsedDate,
                  value: {
                    'total_views': 0,
                    'total_likes': 0,
                    'total_comments': 0,
                  }
                })
              }
            }
            v.values = v.values.sort(
              function(a, b) {
                let compare = 0;
                let dateA = new Date(a.key);
                let dateB = new Date(b.key);
                if (dateA > dateB) {
                  compare = 1;
                } else if (dateA < dateB) {
                  compare = -1;
                }
                return compare;
              })
          }
          organizedData[countryKey] = aggregateVideos;
    }

    return {
      organizedData: organizedData,
      trendingCategories: trendingCategories,
      publishDate: publishDate
    };
}
