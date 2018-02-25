var cheerio = require("cheerio")
var fs = require("fs")
var sass = require('node-sass');

var appCss

function getCss() {
	sass.render({
	  file: "static/app.scss"
	}, function(err, result) {
		if(err) {console.log(err)}
		if(result) {
			appCss = result.css
		} else {
			appCss = "body {background-color:red}";
		}
	});
}
getCss()

var appHtml = fs.readFileSync("static/app.html")

setInterval(function() {
	fs.readFile("static/app.html",function(err,d) {
		//console.log(d)
		appHtml = d
	})
	getCss()
},1000)

module.exports = function(app) {
	app.all("/",(req,res) => {
		var $ = cheerio.load(appHtml);
		$("style").text(appCss)
		res.send($.html());
	})
}