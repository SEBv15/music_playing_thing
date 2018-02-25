var express = require("express");
var app = express();
const cheerio = require("cheerio");
const request = require("request");
var vars = require("./vars")
var audioPlayer = require("./audioPlayer")
var fs = require("fs")
var stations = require("./station")

//stations.search("N-Joy")

vars.player = audioPlayer

const bodyParser = require("body-parser");
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use("/static/", express.static("static/"))
app.use("/",express.static("webroot/"));

var google = require('googleapis');
var youtube = google.youtube({
   version: 'v3',
   auth: "AIzaSyC6sVNGDFxWk_SF1hOxkx6XcHY-NAmRlPc"
});
vars.youtube = youtube

vars.refreshPlaylists = function(callback = undefined) {
	var tplaylists = []
	var queue = 0,ddone = 0
	fs.readFile("static/data.json",function(err,data) {
		var playlists = JSON.parse(data).playlists
		ddone += 1
		queue += playlists.length
		//vars.playlists = vars.playlists.concat(JSON.parse(data).playlists);
		for(let list in playlists) {
			vars.youtube.playlists.list({part:'snippet,contentDetails',id:playlists[list]},(err,res) => {
				if(err) {
					console.log(err)
					queue -= 1
					return
				}
				if(res.items[0] != undefined) {
					tplaylists.push(res.items[0])
				}
				queue -= 1
				if(ddone == 2 && queue == 0) {
					vars.playlists = tplaylists
					if(callback != undefined) {
						callback(vars.playlists)
					}
				}
			})
		}
	})
	vars.youtube.playlists.list({part:'snippet,contentDetails',channelId:"UCvC5VzYux5QGHJomvfVSKag",maxResults:50},(err,res)=> {
		ddone += 1
		if(err != null) {
			return
		}
		for(let i in res.items) {
			res.items[i].nonRemovable = true
		}
		tplaylists = tplaylists.concat(res.items)
		//console.dir(vars.playlists,{depth:10});
		if(ddone == 2 && queue == 0) {
			vars.playlists = tplaylists
			if(callback != undefined) {
				callback(vars.playlists)
			}
		}
	})
}
vars.refreshPlaylists()
// refresh playlists every 10 seconds (not important. Only for number of videos in playlist)
setInterval(function() {
	vars.refreshPlaylists()
},10000)

vars.fx.getAvrData()
setInterval(function() {
	vars.fx.getAvrData()
},1000)

require("./apiv1")(app,youtube);

require("./webapp")(app);

youtube.search.list({
    part: 'snippet',
    q: 'your search query'
  }, function (err, data) {
    if (err) {
      console.error('Error: ' + err);
    }
    if (data) {
      //console.log(data.items)
    }
  });



app.listen(80)
