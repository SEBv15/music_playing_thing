// Either 'click' (for first 6 moves), then 'drag', and eventually 'ended'
var mode = 'click'
// Either 'pineapple' or 'coconut'
var current = 'pineapple'
// # of moves
var moves = 0

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

$(function() {
  $("div.field").click(function() {
    if(mode == 'click') {
      if($(this).children().length == 0) {
        $(this).append(figureElem(current))
        switchCurrent()
      }
    }
  })
  $("div.field").mousedown(function() {
    console.log($(this).find("div.figure").attr("data-type"))
  })
  /*$({deg: -180}).animate({deg: 0}, {
      duration: 2000,
      easing:'linear',
      step: function(now) {
          // in the step-callback (that is fired each step of the animation),
          // you can use the `now` paramter which contains the current
          // animation-position (`0` up to `angle`)
          $("div.woodBoard").css({
              transform: 'rotate(' + now + 'deg)'
          });
      }
  });  */
  setTimeout(function() {
    $("div.woodBoard").css("transform","rotate(0deg)")
  },100)
});

function switchCurrent() {
  current = (current == 'pineapple')?"coconut":"pineapple"
  moves += 1
  if(moves == 6) {
    mode = 'drag'
  }
  if(mode == 'drag') {
    setDraggable()
  }
  checkWinner()
}

function setDraggable() {
  $("div.figure").each(function() {
    if(mode == 'drag' && current == $(this).attr("data-type")) {
      $(this).draggable("enable")
    } else {
      $(this).draggable("disable")
    }
  })
}

function checkWinner() {
  for(let i in [0,1]) {
    let points = []
    $("div.figure[data-type="+((i==0)?"pineapple":"coconut")+"]").each(function() {
      points.push({y:$(this).parent().attr("data-row"),x:$(this).parent().attr("data-column")})

      if(points.length == 3) {
        console.log(points)
        if(checkIfInLine(points)) {
          won((i==0)?"pineapple":"coconut")
        }
      }
    })
  }
}

function won(type) {
  mode = 'ended'
  setDraggable()
  setTimeout(function() {
    //alert(type)
    if(type == "pineapple") {
      $("div.brush").addClass("pineapple")
    } else {
      $("div.brush").removeClass("pineapple")
    }
    $("div.brush").text(type.capitalize() + "s won!").show()

    $("div.woodBoard").addClass("fist")
    $("div.woodBoard").one("click",function() {
      $("div.woodBoard").css("transform","rotateX(-120deg)")
      setTimeout(function() {
        $("div.brush").hide()
        $("div.figure").each(function() {
          $(this).remove()
        })
        moves = 0;
        current = "pineapple"
        mode = "click"
        $("div.woodBoard").removeClass("animating")
        setTimeout(function() {
          $("div.woodBoard").css("transform","rotateZ(-180deg)")
          $("div.woodBoard").removeClass("fist")
          setTimeout(function() {
            $("div.woodBoard").addClass("animating")
            setTimeout(function() {
              $("div.woodBoard").css("transform","rotateZ(0deg)")
            },100)
          },100)
        },100)
      },3000)
    })
  })
}

function checkIfInLine(p) {
  // Gets slope of line between points 1 & 2 and 1 & 3 as a and b
  // If the slope is the same, all 3 points are in a line
  var a = (p[1].y - p[0].y)/(p[1].x - p[0].x)
  var b = (p[2].y - p[0].y)/(p[2].x - p[0].x)

  return a == b
}

function figureElem(type='pineapple') {
  var urls = {
    pineapple: "https://png.icons8.com/color/540/000000/pineapple.png",
    coconut: "https://png.icons8.com/color/540/coconut.png"
  }
  var figure = $("<div class='figure' data-nth='"+moves+"'></div>")
  figure.css("background-image","url("+urls[type]+")")
  figure.attr("data-type",type)
  figure.draggable({
    containment:"div.board",
    stop:function(e,ui) {
      dropFigure(figure)
    },
    drag:function(e,ui) {
      dragFigure(figure)
    },
    zIndex:2
  })
  figure.draggable("disable")
  return figure
}

function getTargetField(figure) {
  var offset = {
    x:parseInt(figure.css("left")),
    y:parseInt(figure.css("top"))
  }
  var origin = {
    x:figure.parent().attr("data-column"),
    y:figure.parent().attr("data-row")
  }
  var fieldWidthAndHeight = $("div.field").height()
  offset.x += fieldWidthAndHeight/2 + 8
  offset.y += fieldWidthAndHeight/2 + 8

  offset.x = Math.floor(offset.x/fieldWidthAndHeight)
  offset.y = Math.floor(offset.y/fieldWidthAndHeight)

  var target = {
    x:(parseInt(origin.x)+parseInt(offset.x)),
    y:(parseInt(origin.y)+parseInt(offset.y))
  }
  console.log($("div.field[data-row="+target.y+"][data-column="+target.x+"]"))
  return $("div.field[data-row="+target.y+"][data-column="+target.x+"]")
}

function dropFigure(figure) {
  var target = getTargetField(figure)
  $("div.field").each(function() {
    $(this).css("background-color","unset")
  })
  if(target.children().length == 0 && target.length != 0) {
    target.append(figure)
    switchCurrent()
  }
  figure.css("top","0px").css("left","0px");
}

function dragFigure(figure) {
  var target = getTargetField(figure)
  $("div.field").each(function() {
    $(this).css("background-color","unset")
  })
  if(target.children().length == 0 && target.length != 0) {
    target.css("background-color","rgba(0,255,0,0.05)")
  } else {
    target.css("background-color","rgba(255,0,0,0.05)")
  }
}
