function documentLoad(){
	$('body').scrollspy({ target: '#navbar-example' })
}

$(window).scroll(function() {
 if ($(this).scrollTop() > 90){  
    $('#navList').addClass("sticky");
  }
  else{
    $('#navList').removeClass("sticky");
  }
});