// // Load data
const processInnovative = (categories, countries) =>
{
    return  formatCountryData(Object.entries(countries))
}


// turn the necessary fields to numbers
const formatCountryData = (countryVideosArr) => {
    let formattedCountries = {}

    countryVideosArr.forEach((countryVideos) => {
        let totalViews = 0
        let totalLikes = 0
        let totalComments = 0
        let totalDislikes = 0

        countryVideos[1].forEach((video) => {
            video['views'] = +video['views']
            video['likes'] = +video['likes']
            video['comment_count'] = +video['comment_count']
            // video['dislikes'] = +video['dislikes']
            video['publish_time'] = video['publish_time'].substring(0, 7)

            totalViews+= video['views']
            totalLikes += video['likes']
            totalComments += video['comment_count']
            // totalDislikes += video['dislikes']
        })

        formattedCountries[countryVideos[0]] = {videos: countryVideos[1],
            views: totalViews, likes: totalLikes, comment_count: totalComments}

    })

    return formattedCountries

}
