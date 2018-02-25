var request = require('request');
var parseString = require('xml2js').parseString;


var playlists = []
var playing = {
	playlist: undefined,
	songId: undefined,
	songTitle: undefined,
	songIndex: undefined,
	duration: undefined,
	nextSongId: undefined,
	nextSongTitle: undefined
}

function fxPlayListItems(id,callback) {
	function getItems(items,token) {
		youtube.playlistItems.list({
			'maxResults': '10',
			'part': 'snippet,contentDetails',
			'playlistId': id,
			'pageToken': (token && token !== true)?token:undefined
		}, (err,data) => {
			if(err != null) {
				// discontinue
				return
			}
			items = items.concat(data.items)
			if(data.nextPageToken) {
				getItems(items,data.nextPageToken)
			} else {
				callback(items)
			}
		});
	}
	getItems([],true)
}

var vars = {
	playlists: playlists,
	playing: playing,
	youtube: undefined,
	player: undefined,
	fx: {
		playlistItems:function(id,youtube,callback) {
			var that = this
			function getItems(items,token) {
				youtube.playlistItems.list({
					'maxResults': '10',
					'part': 'snippet,contentDetails',
					'playlistId': id,
					'pageToken': (token && token !== true)?token:undefined
				}, (err,data) => {
					if(err != null) {
						// discontinue
						return
					}
					//console.log(data.items)
					items = items.concat(data.items)
					if(data.nextPageToken) {
						getItems(items,data.nextPageToken)
					} else {
						callback(items)
					}
				});
			}
			getItems([],true)
		},
		getAvrData:function() {
			request.get("http://192.168.1.88//goform/formMainZone_MainZoneXml.xml",function(err,xml) {
				if(err) {
					console.log(err)
					return
				}
				try {
					parseString(xml.body, function (err, res) {
						// console.log(err,res,res.item.InputFuncSelect[0].value[0],res.item.Power[0].value[0]);
						vars.avr = res.item.Power[0].value[0] == "ON" && res.item.InputFuncSelect[0].value[0] == "Media Player"
					})
				} catch(err) {
					console.log(err)
				}
			})
		}
	}
}

module.exports = vars
