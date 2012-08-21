$(document).ready(function($) {
  var offset = 50;

  $('#query').focus();

  // scroll spy
  $('.side-nav ul.toc li a').click(function(event) {
    event.preventDefault();
    $($(this).attr('href'))[0].scrollIntoView();
    scrollBy(0, -offset);
  });
});
