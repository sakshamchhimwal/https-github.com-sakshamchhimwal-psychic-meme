let c = 1;
$("#sideviewbutton").on("click", function() {
  c++;
  if (c % 2 == 0) {
    $(".sidebar").css("display", "block");
  } else {
    $(".sidebar").css("display", "none");
  }
});