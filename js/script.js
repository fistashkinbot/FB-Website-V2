$(document).ready(function() {

  // Scroll events — throttled через requestAnimationFrame для плавности
  var scrollTicking = false;
  $(window).scroll(function() {
    if (!scrollTicking) {
      requestAnimationFrame(function() {
        var scrollY = window.scrollY;
        if (scrollY > 20) {
          $('.navbar').addClass("sticky");
        } else {
          $('.navbar').removeClass("sticky");
        }
        if (scrollY > 500) {
          $('.scroll-up-btn').addClass("show");
        } else {
          $('.scroll-up-btn').removeClass("show");
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  $('.scroll-up-btn').click(function() {
    $('html').animate({scrollTop: 0});
  });

  $('.menu-btn').click(function() {
    $('.navbar .menu').toggleClass("active");
    $('.menu-btn i').toggleClass("active");
  });

  $('.carousel').owlCarousel({
    margin: 9.9,
    loop: true,
    autoplay: false,        // FIX: отключён autoplay — карусель не грузит CPU вхолостую
    autoplayHoverPause: true,
    responsive: {
      0:    { items: 1, nav: false },
      600:  { items: 2, nav: false },
      1000: { items: 3, nav: false }
    }
  });

});