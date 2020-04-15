
const processBarChartData = (categories, countries) => {
    //Ayeeta's grep order
    let countriesArr = []

    for (let country of Object.values(countries)) {
        countriesArr = countriesArr.concat(country)
    }

    let groupedCountriesByCategory = d3.nest()
        .key(d => d['category_id'])
        .entries(countriesArr)

   groupedCountriesByCategory.sort((a, b) => {
       return b['values'].length - a['values'].length
   })

    let filteredData = groupedCountriesByCategory

    let maxPop = 0;

    // aggregate the total views, likes, comments for each category, and rename the keys into category names, set max Y value
    for (i = 0; i < filteredData.length; i++) {

        // rename categories
        switch(filteredData[i].key) {
          case "24":
            filteredData[i].key = "Entertainment";
            break;
          case "10":
            filteredData[i].key = "Music";
            break;
          case "22":
            filteredData[i].key = "People & Blogs";
            break;
          case "23":
            filteredData[i].key = "Comedy";
            break;
          case "17":
            filteredData[i].key = "Sports";
            break;
          case "1":
            filteredData[i].key = "Film & Animation";
            break;
          case "26":
            filteredData[i].key = "Howto & Style";
            break;
          case "20":
            filteredData[i].key = "Gaming";
            break;
          case "25":
            filteredData[i].key = "News & Politics";
            break;
          default:
            filteredData[i].key = "Science & Technology";
            break;
        }

        // aggregate views likes comments

        let dateArray = ["2017-11","2017-12","2018-01","2018-02","2018-03", "2018-04","2018-05","2018-06",];
        for (k = 0; k < dateArray.length; k++) {
            if (!filteredData[i].hasOwnProperty(dateArray[k])) {
                filteredData[i][dateArray[k]] = {
                  total_views: 0,
                  total_likes: 0,
                  total_comments: 0
                };
            }
        }

        for (j = 0; j < filteredData[i].values.length; j++) {

              let index = 0;
              let string = filteredData[i].values[j].publish_time;
              dateString = string.substr(0, 7);

              if (dateArray.includes(dateString)) {
                  filteredData[i][dateString].total_views += filteredData[i].values[j].views;
                  filteredData[i][dateString].total_likes += filteredData[i].values[j].likes;
                  filteredData[i][dateString].total_comments += filteredData[i].values[j].comments;
              }

        }

    }
    return filteredData;
}

const getDate = (input) => {

  switch(input) {
    case "0":
      return '2017-11';
      break;
    case "1":
      return '2017-12';
      break;
    case "2":
      return '2018-01';
      break;
    case "3":
      return '2018-02';
      break;
    case "4":
      return '2018-03';
      break;
    case "5":
      return '2018-04';
      break;
    case "6":
      return '2018-05';
      break;
    default:
      return '2018-06';
      break;
    }
}
