const request = require("request");
var StreamPlayer = require('stream-player');
var vars = require("./vars")


// To minimize amount of requests needed (max: 1500/month)
var lastsearched = []
var searchterms = {}


function fetch(url,method,data,callback) {
	var headers = { 
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
		'Content-Type' : 'application/x-www-form-urlencoded' 
	};
	var formdata = data

	if(method.toLowerCase() == "post") {
		request.post({ url: url, form: formdata, headers: headers }, function (e, r, body) {
			callback(e,body)
		});
	} else {
		let str = Object.entries(data).map(([key, val]) => `${key}=${val}`).join('&');
		request.get({ url: url + ((str)?"?"+str:"")}, function (e, r, body) {
			callback(e,body)
		});
	}
}

var player

var stations = {
	search: function(q,callback) {
		if(!searchterms[q.trim()]) {
			fetch("http://api.dirble.com/v2/search","POST",{token:"d999db516b25e4e8423e225e3a",query:q.trim()},function(err,data) {
				if(err != null) {
					console.log("ERROR",err)
					callback([])
					return
				}
				//lastsearched.concat(JSON.parse(data))
				//if(lastsearched.length > 100) {
				//	lastsearched.splice(0,lastsearched.length-100)
				//}
				
				searchterms[q.trim()] = JSON.parse(data)
				
				//console.dir(JSON.parse(data),{depth:null});
				callback(JSON.parse(data))
			})
		} else {
			callback(searchterms[q.trim()])
		}
	},
	play: function(id) {
		stations.stop()
		var station = lastsearched.find(x => x.id == id)
		if(!station) {
			for(let i in searchterms) {
				//console.log(searchterms[i],i)
				if(searchterms[i].find(x => x.id == id)) {
					station = searchterms[i].find(x => x.id == id)
					break
				}
			}
		}
		if(!station) {
			fetch("http://api.dirble.com/v2/station/"+id,"GET",{token:"d999db516b25e4e8423e225e3a"},function(err,data) {
				data = JSON.parse(data)
				lastsearched.push(data)
				doIt(data)
			})
		} else {
			doIt(station)
		}
		
		function doIt(station) {
			vars.player.kill()
			vars.playing.playing = true
			vars.playing.station = true
			vars.playing.songTitle = station.name
			vars.playing.songId = station.id
			
			player = new StreamPlayer();
			//console.log("playing",station.name,station.streams[0].stream)
			console.log("playing",station.name)
			player.add(station.streams[0].stream);
			try {
				player.play();
			} catch(err) {
				console.log(err)
			}
		}
	},
	stop: function() {
		if(player) {
			vars.playing.playing = false
			try {
				player.pause()
			} catch(err) {
				console.log(err)
			}
		}
	},
	resume: function() {
		if(player) {
			vars.playing.playing =true
			try {
				player.play()
			} catch(err) {
				console.log(err)
			}
		}
	}
}

module.exports = stations