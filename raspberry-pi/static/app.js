var playlists, playing, isPlaying, playlistsView = true, vars = {}, avrStatus

// CONTROLS

$(function() {
	// time bar
	$(document).on('input', 'div.progress input', function() {
		$('div.progress span.currentTime').text( timeToStr($(this).val()/100*playing.duration) );
		$("div.progress div.bar div").css("width",($(this).val()/100*99+1)+"%")
	});
	$("div.progress input").on("mouseup", function () {
		vars.draggingTime = false
		$.post("/api/v1/seek",{time:$('div.progress input').val()/100*playing.duration},function() {})
	});

	$("div.progress input").on("mousedown", function () {
		vars.draggingTime = true
	});
	
	// volume
	$(document).on('input', 'div.volume input', function() {
		setVolumeBar()
	});
	$("div.volume input").on("mouseup", function () {
		vars.draggingVolume = false
		$.post("/api/v1/setVolume",{volume:$('div.volume input').val()},function() {})
	});

	$("div.volume input").on("mousedown", function () {
		vars.draggingVolume = true
	});
	
	// PLAY PAUSE
	$("div.controls div.playingNow").click(function() {
		if(playing.station) {
			if(isPlaying) {
				$.post("/api/v1/stationPause");
			} else {
				$.post("/api/v1/stationUnpause");
			}			
		} else {
			if(isPlaying) {
				$.post("/api/v1/pause");
			} else {
				$.post("/api/v1/unpause");
			}
		}
	})
	
	// NEXT SONG
	$("div.controls div.playingNext").click(function() {
		if(playing.nextSongId) {
			$.post("/api/v1/next")
		}
	})
	
	getBulk()
	setInterval(function() {
		getBulk()
	},1000)
	
	// AVR
	$("div.controls div.avr").click(function() {
		$.post("/api/v1/avr")
	})
});

function setVolumeBar() {
	$("div.volume div.bar").css("width",$('div.volume input').val()/100*50+4)
	if($('div.volume input').val() == 0) {
		$("div.volume i").text("volume_off")
	} else if($('div.volume input').val() < 30) {
		$("div.volume i").text("volume_mute")
	} else if($('div.volume input').val() < 70) {
		$("div.volume i").text("volume_down")
	} else {
		$("div.volume i").text("volume_up")
	}
}

function getBulk() {
	$.post("/api/v1/getBulk",function(data) {
		console.log(data)
		playing = data.playing
		playing.time = data.time
		playing.duration = data.duration
		isPlaying = data.isPlaying
		//console.log(data.playlists.length,playlists.length)
		if(playlists.length != data.playlists.length && playlistsView) {
			playlists = data.playlists
			showPlaylists()
		}
		playlists = data.playlists
		startStop()
		if(!vars.draggingVolume) {
			$('div.volume input').val(data.volume)
			//$("div.volume div.bar").width(data.volume/100*66+4+"px")
			setVolumeBar()
		}
		avrStatus = data.avr
		if(data.avr) {
			$("div.controls div.avr").removeClass("off")
		} else {
			$("div.controls div.avr").addClass("off")
		}
		$("div.controls div.playingNow span").text(playing.songTitle)
		$("div.controls div.playingNext span").text((playing.nextSongTitle)?playing.nextSongTitle:'No "Up Next" here!')
		showActive()
	})
}

function showActive() {
	$(".active").each(function() {
		$(this).removeClass("active")
	})
	if(playlistsView) {
		$("div.playlistCont div.playlist[data-id="+playing.playlist+"]").addClass("active")
	} else {
		if(playing.playlist) {
			$("div.song[data-id="+playing.songId+"]").each(function() {
				if($(this).attr("data-index") == playing.songIndex) {
					$(this).addClass("active")
				}
			})
		}
	}
	if(!playing.playlist) {
		console.log("ID",playing.songId)
		$("div.searchCont div.song[data-id="+playing.songId+"]").addClass("active")
	} 
}

function startStop() {
	if(isPlaying) {
		$("div.controls div.playingNow i").text("pause")
		if(!vars.draggingTime) {
			$("div.controls div.progress div.bar input").val(playing.time/playing.duration*100)
			$("div.controls div.progress div.bar div").css("width",(playing.time/playing.duration*99+1)+"%")
			if(playing.time == playing.duration) {
				$("div.controls div.progress div.bar input").val(100)
				$("div.controls div.progress div.bar div").css("width","100%")
			}
			$("div.controls div.progress span.currentTime").text(timeToStr(playing.time))
			$("div.controls div.progress span.endTime").text(timeToStr(playing.duration))
		}
	} else {
		$("div.controls div.playingNow i").text("play_arrow")
	}
}

//playlists

$(function() {
	getPlaylists(function(lists) {
		playlists = lists
		showPlaylists()
	})
	
	// Add playlist
	$("div.playlistCont div.header i").click(function() {
		var id = $(this).parent().find("input").val()
		if(id != "" && id.length >= 8) {
			if(id.indexOf("list=") > 0) {
				id = id.substr(id.indexOf("list=")+5)
				var end = id.indexOf("&")
				if(end > 0) {
					id = id.substr(0,end)
				}
			}
			$(this).parent().find("input").val("")
			$.post("/api/v1/addPlaylist",{id:id},function(data) {
				playlists = data
				showPlaylists()
				console.log(playlists)
			})
		}
	});
	$("div.playlistCont div.header input").keypress(function(e) {
		if(e.which == 13) {
			$("div.playlistCont div.header i").click();
		}
	})
	
	
})

function getPlaylists(callback) {
	$.post("/api/v1/playlists",function(data) {
		callback(data)
	})
}

function showPlaylists() {
	var scrollbox = $("div.playlistCont div.scrollbox")
	playlistsView = true
	scrollbox.removeClass("smaller")
	$("div.playlistHeader").remove()
	scrollbox.empty()
	for(let i in playlists) {
		let elem = $('<div class="playlist"><div class="thumb"><span></span></div><div class="title"></div><div class="descri"></div></div>')
		if(!playlists[i].nonRemovable) {
			elem.append('<i class="material-icons">close</i>')
		}
		elem.find("div.thumb").css("background-image","url("+playlists[i].snippet.thumbnails.default.url+")");
		elem.find("div.title").text(playlists[i].snippet.title)
		elem.find("div.descri").text(playlists[i].snippet.description)
		elem.find("div.thumb span").text(playlists[i].contentDetails.itemCount + " items")
		elem.attr("data-index",i)
		elem.attr("data-id",playlists[i].id)
		let pid = playlists[i].id
		
		elem.one('click',function() {
			showPlaylistItems(pid);
		}).find("i").click(function() {
			$(this).remove()
			$.post("/api/v1/deletePlaylist",{id:pid},function(lists) {
				playlists = lists
				showPlaylists()
			})
			return false
		})

		if(playing && playing.playlist == playlists[i].id) {
			elem.addClass("active")
		}
		scrollbox.append(elem)
	}
}

function showPlaylistItems(id) {
	var playlist = playlists.find(function(x) {return x.id==id})
	playlistsView = false
	$.post("/api/v1/playlistItems",{id:id},function(data) {
		var scrollbox = $("div.playlistCont div.scrollbox")
		scrollbox.empty()
		var header = $('<div class="playlistHeader"><i class="material-icons">keyboard_arrow_left</i><span></span><img src="/static/red-angle.png"></div>')
		header.find("span").text(playlist.snippet.title);
		header.click(function() {
			showPlaylists();
		})
		header.insertBefore(scrollbox)
		scrollbox.addClass("smaller")
		for(let i in data) {
			scrollbox.append(songElem(data[i],i,playlist.id))
		}
		showActive()
	})
}



function songElem(data,i,playlist=undefined) {
	console.log(data)
	if(data.snippet.title == "Deleted video" || data.snippet.title == "Private video") {
		return
	}
	var id = (data.snippet.resourceId)?data.snippet.resourceId.videoId:data.id.videoId
	console.log(id)
	var elem = $('<div class="song"><div class="thumb"></div><div class="title"></div><div class="descri"></div></div>')
	elem.find("div.thumb").css("background-image","url("+data.snippet.thumbnails.default.url+")");
	elem.find("div.title").text(data.snippet.title)
	elem.find("div.descri").text(data.snippet.description)
	elem.attr("data-id",id)
	//elem.find("div.thumb span").text(playlists[i].contentDetails.itemCount + " items")
	elem.attr("data-index",i)
	if(playing && playing.songId == id && (!playing.songIndex || playing.songIndex == i)) {
		elem.addClass("active")
	}
	elem.click(function() {
		console.log(data.id)
		playSong(id,playlist,i)
	})
	return elem;
}

function stationElem(data) {
	var elem = $('<div class="song"><div class="thumb"></div><div class="title"></div><div class="descri"></div></div>')
	elem.find("div.thumb").css("background-color","unset")
	elem.find("div.thumb").css("background-image","url("+((data.image.url)?data.image.url:"/static/station-placeholder.png")+")");
	elem.find("div.title").text(data.name)
	elem.find("div.descri").text(data.categories.map(function(elem){return elem.title;}).join(", "))
	elem.attr("data-id",data.id)
	if(playing && playing.songId == data.id) {
		elem.addClass("active")
	}
	elem.click(function() {
		console.log(data.id)
		playStation(data.id)
	})
	return elem;
}

function playSong(id,playlist,index) {
	$.post("/api/v1/play", {id:id,playlist:playlist,index:index},function() {
		$("div.playlistCont div.song[data-id="+id+"]").addClass("active")
	})
}

// SEARCH

$(function() {
		
	// Search
	$("div.searchCont div.header i.inputSubmit").click(function() {
		$.post("/api/v1/search",{q:$("div.searchCont div.header input").val()},function(data) {
			console.log(data);
			var scrollbox = $("div.searchCont div.scrollbox")
			scrollbox.empty()
			for(let i in data) {
				scrollbox.append(songElem(data[i],i))
			}
		})
	});
	$("div.searchCont div.header input").keypress(function(e) {
		if(e.which == 13) {
			$("div.searchCont div.header i.inputSubmit").click();
		}
	})
	// Radio Search
	$("div.searchCont div.header i.radio").click(function() {
		$.post("/api/v1/stationSearch",{q:$("div.searchCont div.header input").val()},function(data) {
			console.log(data);
			var scrollbox = $("div.searchCont div.scrollbox")
			scrollbox.empty()
			for(let i in data.stations) {
				scrollbox.append(stationElem(data.stations[i]))
			}
		})
	})
})

function playStation(id) {
	$.post("/api/v1/stationPlay",{id:id})
}

// EXTRA

function timeToStr(time) {
	var minutes = parseInt(time/60)
	var seconds = parseInt(time%60)
	var hours = parseInt(minutes/60)
	minutes = minutes%60
	return ((hours)?hours+":":"") + ((minutes)?("0" + minutes).slice(-2)+":":((hours)?"00:":"0:")) + ("0" + seconds).slice(-2);
}