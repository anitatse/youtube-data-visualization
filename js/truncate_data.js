// // Load data

let countryPrefixes = ["CA", "DE", "FR", "GB", "IN", "JP", "KR", "MX", "RU", "US"]
let top10Categories = {'24': "Entertainment", '22': "People & Blogs", '10': "Music",
    '25': "News & Politics", '23': "Comedy", '17': "Sports", '1': "Film & Animation", '26': "Howto & Style",
    '20': "Gaming", '28': "Science & Technology"}

let promiseArr = []

for (let i = 0; i < 20; i++) {

    // video promises
    if (i < 10) {
        promiseArr.push(d3.csv('data/' + countryPrefixes[i] + 'videos.csv'))
    } else {
        promiseArr.push(d3.json('data/' + countryPrefixes[i - 10] + '_category_id.json'))
    }
}

Promise.all(promiseArr).then(files => {
    // format video data
    // get rid of videos that are not in the top 10 categories
    for (let i = 0; i < 10; i++) {
        files[i] = files[i].filter((video) => {
            return top10Categories[video.category_id] !== undefined
        })
    }

    let formattedVideoData = []
    for (let i = 0; i < 10; i++) {
        // index data by country like a map
        formattedVideoData = formattedVideoData.concat(removeColumns(files[i], countryPrefixes[i]))
    }

    saveFormattedVideoData(formattedVideoData)
    saveCategories(top10Categories)

})

// only keep necessary columns
const removeColumns = (file, country) => {
   return file.map(d => {
        return [d['video_id'], d['category_id'],
                d['publish_time'], d['views'], d['likes'], d['comment_count'],
                country]
    })
}

const escapePipe = (s) => {
    let escapedPipe = s.replace(/\|/gi, "\|")
    return escapedPipe.replace(/,/gi, "\,")
}

const saveFormattedVideoData = (formatVideoData) => {
    let csvContent = ""
    csvContent = csvContent + "video_id,category_id,publish_time,views,likes,comment_count,country\n"
    csvContent = csvContent + formatVideoData.map(e => e.join(",")).join("\n");

    let link = document.createElement("a");
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    let url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", 'videos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const saveCategories = (top10Categories) => {
    let link = document.createElement("a");
    let blob = new Blob([JSON.stringify(top10Categories)], { type: 'application/json;' })

    let url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", 'categories.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

}